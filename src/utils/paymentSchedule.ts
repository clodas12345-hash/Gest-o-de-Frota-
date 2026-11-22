import { Vehicle, WeeklyPayment, isWeeklyPaymentPaid } from '../types';

export const WEEKDAY_OPTIONS: Array<{ value: number; label: string; short: string; dueDayText: string }> = [
  { value: 0, label: 'Domingo', short: 'Dom', dueDayText: 'todo domingo, com vencimento até às 23h59' },
  { value: 1, label: 'Segunda-feira', short: 'Seg', dueDayText: 'toda segunda-feira, com vencimento até às 23h59' },
  { value: 2, label: 'Terça-feira', short: 'Ter', dueDayText: 'toda terça-feira, com vencimento até às 23h59' },
  { value: 3, label: 'Quarta-feira', short: 'Qua', dueDayText: 'toda quarta-feira, com vencimento até às 23h59' },
  { value: 4, label: 'Quinta-feira', short: 'Qui', dueDayText: 'toda quinta-feira, com vencimento até às 23h59' },
  { value: 5, label: 'Sexta-feira', short: 'Sex', dueDayText: 'toda sexta-feira, com vencimento até às 23h59' },
  { value: 6, label: 'Sábado', short: 'Sáb', dueDayText: 'todo sábado, com vencimento até às 23h59' },
];

export function getWeekdayLabel(dayOfWeek?: number | null): string {
  if (dayOfWeek === undefined || dayOfWeek === null) return 'Não definido';
  const found = WEEKDAY_OPTIONS.find((w) => w.value === dayOfWeek);
  return found ? found.label : 'Não definido';
}

export function getDueDayTextFromWeekday(dayOfWeek?: number | null): string {
  if (dayOfWeek === undefined || dayOfWeek === null) {
    return 'toda segunda-feira, com vencimento até às 23h59';
  }
  const found = WEEKDAY_OPTIONS.find((w) => w.value === dayOfWeek);
  return found ? found.dueDayText : 'toda segunda-feira, com vencimento até às 23h59';
}

export function parseWeekdayFromDueDay(dueDay?: string): number | null {
  if (!dueDay) return null;
  const lower = dueDay.toLowerCase();
  if (lower.includes('domingo')) return 0;
  if (lower.includes('segunda')) return 1;
  if (lower.includes('terça') || lower.includes('terca')) return 2;
  if (lower.includes('quarta')) return 3;
  if (lower.includes('quinta')) return 4;
  if (lower.includes('sexta')) return 5;
  if (lower.includes('sábado') || lower.includes('sabado')) return 6;
  return null;
}

export function resolveVehiclePaymentDayOfWeek(vehicle: Partial<Vehicle>): number | null {
  if (
    typeof vehicle.paymentDayOfWeek === 'number' &&
    vehicle.paymentDayOfWeek >= 0 &&
    vehicle.paymentDayOfWeek <= 6
  ) {
    return vehicle.paymentDayOfWeek;
  }

  const parsedDue = parseWeekdayFromDueDay(vehicle.dueDay);
  if (parsedDue !== null) return parsedDue;

  if (vehicle.startDate) {
    const d = new Date(vehicle.startDate + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      return d.getDay();
    }
  }

  return null;
}

export function getWeekdayDatesInMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  startDate?: string,
  endDate?: string
): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day, 12, 0, 0);
    if (d.getDay() === dayOfWeek) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (startDate && iso < startDate) continue;
      if (endDate && iso > endDate) continue;
      result.push(iso);
    }
  }

  return result;
}

function getIsoWeekKey(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const year = d.getFullYear();
  const yearStart = new Date(year, 0, 1, 12, 0, 0);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

export interface GenerateMonthlyPaymentsOptions {
  forceSyncUnpaid?: boolean;
}

export function generateMonthlyPaymentsForVehicle(
  vehicle: Vehicle,
  month: number,
  year: number,
  options?: GenerateMonthlyPaymentsOptions
): { vehicle: Vehicle; addedCount: number; updatedCount: number; monthKey: string; changed: boolean } {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const amount = Number(vehicle.valorSemanal) || Number(vehicle.valorRecebido) || 0;
  const dayOfWeek = resolveVehiclePaymentDayOfWeek(vehicle);

  if (amount <= 0 || dayOfWeek === null) {
    return { vehicle, addedCount: 0, updatedCount: 0, monthKey, changed: false };
  }

  const forceSyncUnpaid = Boolean(options?.forceSyncUnpaid);
  const targetDates = getWeekdayDatesInMonth(year, month, dayOfWeek, vehicle.startDate, vehicle.endDate);
  const targetDateSet = new Set(targetDates);
  const existingPayments = vehicle.weeklyPayments || [];

  // Identify confirmed payments so today's payment covers its billing week and anchors retroactive cleanup
  const paidPayments = existingPayments.filter((p) => isWeeklyPaymentPaid(p));
  const paidScheduledDates = new Set(
    paidPayments.map((p) => p.scheduledDate).filter((d): d is string => Boolean(d))
  );
  const paidWeekKeys = new Set(
    paidPayments.map((p) => getIsoWeekKey(p.scheduledDate || p.date)).filter(Boolean)
  );
  const latestPaidAnchor = paidPayments
    .map((p) => p.scheduledDate || p.date)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0] || '';

  const isDateCoveredByPaid = (dateIso: string): boolean => {
    if (!dateIso) return false;
    if (paidScheduledDates.has(dateIso)) return true;
    const wk = getIsoWeekKey(dateIso);
    return Boolean(wk && paidWeekKeys.has(wk));
  };

  let changedPayments = false;
  let updatedCount = 0;

  // 1. Remove duplicate unpaid auto-generated installments already covered by a paid payment in the same week
  // 2. Remove stale unpaid auto-generated installments in this month if weekday/startDate/endDate changed
  // 3. Mark retroactive unpaid auto-generated installments prior to latest confirmed payment as paidInPreviousContract
  // 4. Sync active unpaid installment amounts to the vehicle's current weekly rate
  const syncedExisting: WeeklyPayment[] = [];
  for (const p of existingPayments) {
    const isInMonth = typeof p.date === 'string' && p.date.startsWith(monthKey);
    const isPaid = isWeeklyPaymentPaid(p);
    const isPrevContract = Boolean(p.paidInPreviousContract);
    const isAutoGenerated = Boolean(p.id?.startsWith('wp-auto-'));

    if (!isPaid && !isPrevContract && isAutoGenerated && isDateCoveredByPaid(p.date)) {
      changedPayments = true;
      continue;
    }

    if (isInMonth && !isPaid && !isPrevContract && isAutoGenerated && !targetDateSet.has(p.date)) {
      changedPayments = true;
      continue;
    }

    if (!isPaid && !isPrevContract && isAutoGenerated && latestPaidAnchor && p.date < latestPaidAnchor) {
      syncedExisting.push({
        ...p,
        isPaid: false,
        paidInPreviousContract: true,
      });
      changedPayments = true;
      continue;
    }

    if (isInMonth && !isPaid && !isPrevContract) {
      const shouldSyncAmount = forceSyncUnpaid || (isAutoGenerated && !p.isManualAmount);
      if (shouldSyncAmount && (p.amount !== amount || (forceSyncUnpaid && p.isManualAmount))) {
        const nextPayment: WeeklyPayment = { ...p, amount };
        if (forceSyncUnpaid && nextPayment.isManualAmount) {
          delete nextPayment.isManualAmount;
        }
        syncedExisting.push(nextPayment);
        changedPayments = true;
        updatedCount += 1;
        continue;
      }
    }

    syncedExisting.push(p);
  }

  const existingDateSet = new Set(syncedExisting.map((p) => p.date));
  const newPayments: WeeklyPayment[] = [];
  for (const dateIso of targetDates) {
    if (!existingDateSet.has(dateIso) && !isDateCoveredByPaid(dateIso)) {
      const isRetroactiveBeforePaid = Boolean(latestPaidAnchor && dateIso < latestPaidAnchor);
      newPayments.push({
        id: `wp-auto-${monthKey}-${dateIso}-${Math.random().toString(36).slice(2, 6)}`,
        date: dateIso,
        amount,
        isPaid: false,
        ...(isRetroactiveBeforePaid ? { paidInPreviousContract: true } : {}),
      });
    }
  }

  if (newPayments.length > 0) {
    changedPayments = true;
  }

  const prevMonths = vehicle.autoGeneratedPaymentMonths || [];
  const hasMonthKey = prevMonths.includes(monthKey);
  const updatedMonths = hasMonthKey ? prevMonths : [...prevMonths, monthKey];
  const needsAutoFlag = vehicle.autoMonthlyPayments !== true;

  if (!changedPayments && hasMonthKey && !needsAutoFlag) {
    return { vehicle, addedCount: 0, updatedCount: 0, monthKey, changed: false };
  }

  const mergedPayments = changedPayments
    ? [...syncedExisting, ...newPayments].sort((a, b) => b.date.localeCompare(a.date))
    : existingPayments;

  return {
    vehicle: {
      ...vehicle,
      autoMonthlyPayments: true,
      weeklyPayments: mergedPayments,
      autoGeneratedPaymentMonths: updatedMonths,
    },
    addedCount: newPayments.length,
    updatedCount,
    monthKey,
    changed: true,
  };
}

export function syncVehiclePaymentsOnCadastroChange(
  vehicle: Vehicle,
  selectedMonth?: number,
  selectedYear?: number
): Vehicle {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curMonthKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;

  // Normalize & sort promises chronologically by due date so nextPendingPromise is always accurate
  const sortedPromises = vehicle.promisePayments
    ? [...vehicle.promisePayments].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    : undefined;

  let currentVeh: Vehicle = {
    ...vehicle,
    autoMonthlyPayments: true,
    ...(sortedPromises !== undefined ? { promisePayments: sortedPromises } : {}),
  };

  const amount = Number(currentVeh.valorSemanal) || Number(currentVeh.valorRecebido) || 0;

  // Collect all current & future months to sync (real current month, selected month if >= current, and any future months already in payments/generatedMonths)
  const monthKeysToSync = new Set<string>([curMonthKey]);

  if (selectedMonth !== undefined && selectedYear !== undefined) {
    const selKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    if (selKey >= curMonthKey) {
      monthKeysToSync.add(selKey);
    }
  }

  for (const mk of currentVeh.autoGeneratedPaymentMonths || []) {
    if (mk >= curMonthKey) {
      monthKeysToSync.add(mk);
    }
  }

  for (const wp of currentVeh.weeklyPayments || []) {
    if (typeof wp.date === 'string' && wp.date.length >= 7) {
      const mk = wp.date.slice(0, 7);
      if (mk >= curMonthKey && !isWeeklyPaymentPaid(wp)) {
        monthKeysToSync.add(mk);
      }
    }
  }

  for (const mk of monthKeysToSync) {
    const [yStr, mStr] = mk.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
      currentVeh = generateMonthlyPaymentsForVehicle(currentVeh, m, y, { forceSyncUnpaid: true }).vehicle;
    }
  }

  // Fallback sweep: ensure any unpaid current/future weekly payment matches the updated weekly rate
  if (amount > 0 && currentVeh.weeklyPayments && currentVeh.weeklyPayments.length > 0) {
    let anyExtraChanged = false;
    const sweptPayments = currentVeh.weeklyPayments.map((p) => {
      const mk = typeof p.date === 'string' ? p.date.slice(0, 7) : '';
      if (mk >= curMonthKey && !isWeeklyPaymentPaid(p) && (p.amount !== amount || p.isManualAmount)) {
        anyExtraChanged = true;
        const cleaned: WeeklyPayment = { ...p, amount };
        delete cleaned.isManualAmount;
        return cleaned;
      }
      return p;
    });
    if (anyExtraChanged) {
      currentVeh = {
        ...currentVeh,
        weeklyPayments: sweptPayments,
      };
    }
  }

  return currentVeh;
}
