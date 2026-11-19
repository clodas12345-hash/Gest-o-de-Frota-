import { DriverRentalPeriod, FinalizedContract, Vehicle, WeeklyPayment, isWeeklyPaymentPaid } from '../types';

export const DRIVER_SCOPED_FIELDS: ReadonlyArray<keyof Vehicle> = [
  'driver',
  'driverPhone',
  'startDate',
  'endDate',
  'contractNumber',
  'initialKm',
  'valorSemanal',
  'valorRecebido',
  'weeklyPayments',
  'caucaoValor',
  'caucaoData',
  'caucaoObservacoes',
  'promisePayments',
  'paymentDayOfWeek',
  'dueDay',
  'tenantCpfCnpj',
  'tenantRg',
  'tenantCnh',
  'tenantEmail',
  'tenantAddress',
  'driverCnhExpiration',
];

export const getTodayIsoLocal = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function normalizeToIsoDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed || trimmed.toLowerCase() === 'prazo indeterminado') return '';

  // Already YYYY-MM-DD (or YYYY-MM-DDTHH:mm...)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return '';
}

export function isDateInMonth(dateStr: string | undefined | null, month: number, year: number): boolean {
  const iso = normalizeToIsoDate(dateStr);
  if (!iso) return false;
  const parts = iso.split('-');
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  return y === year && m === month;
}

export function createDriverHistorySnapshot(
  vehicle: Vehicle,
  source: 'finalized' | 'replaced',
  terminationIso?: string
): DriverRentalPeriod {
  const termIso = normalizeToIsoDate(terminationIso) || getTodayIsoLocal();
  const normalizedEnd = normalizeToIsoDate(vehicle.endDate);

  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    driver: vehicle.driver?.trim() || 'Não informado',
    driverPhone: vehicle.driverPhone || '',
    startDate: normalizeToIsoDate(vehicle.startDate) || undefined,
    endDate: normalizedEnd || termIso,
    terminationDate: termIso,
    contractNumber: vehicle.contractNumber || '',
    initialKm: vehicle.initialKm,
    valorSemanal: vehicle.valorSemanal,
    valorRecebido: vehicle.valorRecebido || 0,
    weeklyPayments: vehicle.weeklyPayments ? vehicle.weeklyPayments.map((p) => ({ ...p })) : [],
    caucaoValor: vehicle.caucaoValor || 0,
    caucaoData: vehicle.caucaoData || '',
    caucaoObservacoes: vehicle.caucaoObservacoes || '',
    promisePayments: vehicle.promisePayments ? vehicle.promisePayments.map((p) => ({ ...p })) : [],
    paymentDayOfWeek: vehicle.paymentDayOfWeek,
    dueDay: vehicle.dueDay,
    tenantCpfCnpj: vehicle.tenantCpfCnpj || '',
    tenantRg: vehicle.tenantRg || '',
    tenantCnh: vehicle.tenantCnh || '',
    tenantEmail: vehicle.tenantEmail || '',
    tenantAddress: vehicle.tenantAddress || '',
    driverCnhExpiration: vehicle.driverCnhExpiration || '',
    source,
  };
}

export function archivePreviousDriverIfChanged(prev: Vehicle, next: Vehicle): Vehicle {
  const prevName = (prev.driver || '').trim();
  if (!prevName) return next;

  const nextName = (next.driver || '').trim();
  if (prevName.toLowerCase() === nextName.toLowerCase()) {
    return next;
  }

  const prevPhoneClean = (prev.driverPhone || '').replace(/\D/g, '');
  const nextPhoneClean = (next.driverPhone || '').replace(/\D/g, '');
  const samePhone = Boolean(prevPhoneClean && nextPhoneClean && prevPhoneClean === nextPhoneClean);
  const sameStart = (prev.startDate || '') === (next.startDate || '');

  // If user is simply completing/fixing a spelling typo on the same rental, do not create a separate historical period
  const isMinorNameEdit =
    nextName.length > 0 &&
    sameStart &&
    (samePhone || (!prevPhoneClean && !nextPhoneClean)) &&
    (nextName.toLowerCase().includes(prevName.toLowerCase()) ||
      prevName.toLowerCase().includes(nextName.toLowerCase()));

  if (isMinorNameEdit) {
    return next;
  }

  const existingHist = next.driverHistory || prev.driverHistory || [];
  const todayIso = getTodayIsoLocal();
  const alreadyArchivedToday = existingHist.some(
    (h) =>
      (h.driver || '').trim().toLowerCase() === prevName.toLowerCase() &&
      normalizeToIsoDate(h.startDate) === normalizeToIsoDate(prev.startDate) &&
      normalizeToIsoDate(h.terminationDate) === todayIso
  );

  if (alreadyArchivedToday) {
    return next;
  }

  const snapshot = createDriverHistorySnapshot(prev, 'replaced', todayIso);
  return {
    ...next,
    driverHistory: [snapshot, ...existingHist],
  };
}

export interface ResolvedMonthPeriod {
  kind: 'active' | 'history' | 'finalized-fallback';
  periodId: string;
  snapshot: DriverRentalPeriod;
  periodLabel: string;
}

export interface VehicleMonthResolution {
  isPastMonth: boolean;
  periods: ResolvedMonthPeriod[];
}

function formatShortBr(iso?: string): string {
  const norm = normalizeToIsoDate(iso);
  if (!norm) return '';
  const [, m, d] = norm.split('-');
  return `${d}/${m}`;
}

function formatPeriodLabel(start?: string, end?: string, term?: string): string {
  const s = formatShortBr(start);
  const e = formatShortBr(end || term);
  if (s && e) return `${s} – ${e}`;
  if (s) return `Desde ${s}`;
  if (e) return `Até ${e}`;
  return '';
}

export function resolveVehiclePeriodsForMonth(
  vehicle: Vehicle,
  month: number,
  year: number,
  finalizedContracts: FinalizedContract[] = []
): VehicleMonthResolution {
  const now = new Date();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();
  const isPastMonth = year < todayYear || (year === todayYear && month < todayMonth);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  if (!isPastMonth) {
    const activeSnapshot: DriverRentalPeriod = {
      id: `active-${vehicle.id}`,
      driver: vehicle.driver || '',
      driverPhone: vehicle.driverPhone,
      startDate: vehicle.startDate,
      endDate: vehicle.endDate,
      contractNumber: vehicle.contractNumber,
      initialKm: vehicle.initialKm,
      valorSemanal: vehicle.valorSemanal,
      valorRecebido: vehicle.valorRecebido,
      weeklyPayments: vehicle.weeklyPayments || [],
      caucaoValor: vehicle.caucaoValor,
      caucaoData: vehicle.caucaoData,
      caucaoObservacoes: vehicle.caucaoObservacoes,
      promisePayments: vehicle.promisePayments || [],
      paymentDayOfWeek: vehicle.paymentDayOfWeek,
      dueDay: vehicle.dueDay,
      tenantCpfCnpj: vehicle.tenantCpfCnpj,
      tenantRg: vehicle.tenantRg,
      tenantCnh: vehicle.tenantCnh,
      tenantEmail: vehicle.tenantEmail,
      tenantAddress: vehicle.tenantAddress,
      driverCnhExpiration: vehicle.driverCnhExpiration,
    };
    return {
      isPastMonth: false,
      periods: [
        {
          kind: 'active',
          periodId: activeSnapshot.id,
          snapshot: activeSnapshot,
          periodLabel: formatPeriodLabel(vehicle.startDate, vehicle.endDate),
        },
      ],
    };
  }

  const periods: ResolvedMonthPeriod[] = [];
  const historyList = vehicle.driverHistory || [];
  const archivedPaymentIds = new Set<string>();

  for (const h of historyList) {
    for (const wp of h.weeklyPayments || []) {
      if (wp.id) archivedPaymentIds.add(wp.id);
    }

    const hasPaymentInMonth = (h.weeklyPayments || []).some((wp) => isDateInMonth(wp.date, month, year));
    const hStart = normalizeToIsoDate(h.startDate);
    const hEnd = normalizeToIsoDate(h.terminationDate || h.endDate);

    let overlaps = false;
    if (hasPaymentInMonth) {
      overlaps = true;
    } else if (hStart && hEnd) {
      overlaps = hStart <= monthEndStr && hEnd >= monthStartStr;
    } else if (hEnd) {
      overlaps = isDateInMonth(hEnd, month, year);
    } else if (hStart) {
      overlaps = isDateInMonth(hStart, month, year);
    }

    if (overlaps) {
      periods.push({
        kind: 'history',
        periodId: h.id,
        snapshot: h,
        periodLabel: formatPeriodLabel(h.startDate, h.endDate, h.terminationDate),
      });
    }
  }

  // Fallback for contracts finalized before driverHistory tracking existed
  const normPlate = (vehicle.plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const vehicleFinalized = finalizedContracts.filter((fc) => {
    if (fc.vehicleId === vehicle.id) return true;
    if (normPlate && fc.plate) {
      return fc.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === normPlate;
    }
    return false;
  });

  for (const fc of vehicleFinalized) {
    const fcName = (fc.driver || '').trim().toLowerCase();
    const fcTerm = normalizeToIsoDate(fc.terminationDate);
    const fcStart = normalizeToIsoDate(fc.startDate);
    const fcEnd = normalizeToIsoDate(fc.endDate || fc.terminationDate);

    const alreadyInHistory = historyList.some((h) => {
      const hName = (h.driver || '').trim().toLowerCase();
      const hTerm = normalizeToIsoDate(h.terminationDate || h.endDate);
      return hName === fcName && (!fcTerm || !hTerm || hTerm === fcTerm);
    });

    if (alreadyInHistory) continue;

    let overlaps = false;
    if (fcStart && fcEnd) {
      overlaps = fcStart <= monthEndStr && fcEnd >= monthStartStr;
    } else if (fcTerm) {
      overlaps = isDateInMonth(fcTerm, month, year);
    }

    if (overlaps) {
      periods.push({
        kind: 'finalized-fallback',
        periodId: fc.id,
        snapshot: {
          id: fc.id,
          driver: fc.driver || 'Não informado',
          driverPhone: fc.driverPhone || '',
          startDate: fcStart || undefined,
          endDate: fcEnd || undefined,
          terminationDate: fcTerm || undefined,
          valorRecebido: fc.totalPaid || 0,
          weeklyPayments: [],
          source: 'finalized',
        },
        periodLabel: formatPeriodLabel(fcStart, fcEnd, fcTerm),
      });
    }
  }

  // Check if current active driver was using the car in the selected past month
  const activeStart = normalizeToIsoDate(vehicle.startDate);
  const activeEnd = normalizeToIsoDate(vehicle.endDate);
  const activePaymentsUnarchivedInMonth = (vehicle.weeklyPayments || []).some(
    (wp) => !archivedPaymentIds.has(wp.id) && isDateInMonth(wp.date, month, year)
  );

  let activeMatchesMonth = false;
  if (activePaymentsUnarchivedInMonth) {
    activeMatchesMonth = true;
  } else if (activeStart) {
    activeMatchesMonth = activeStart <= monthEndStr && (!activeEnd || activeEnd >= monthStartStr);
  } else if (vehicle.driver?.trim()) {
    // Active driver has no startDate and no payments in this past month:
    // Only treat as active in this past month if NO historical record covers this month or terminated after monthStartStr
    const hasHistoryEndingAfterMonthStart = historyList.some((h) => {
      const hTerm = normalizeToIsoDate(h.terminationDate || h.endDate);
      return hTerm >= monthStartStr;
    });
    if (periods.length === 0 && !hasHistoryEndingAfterMonthStart) {
      activeMatchesMonth = true;
    }
  }

  if (activeMatchesMonth) {
    const activeSnapshot: DriverRentalPeriod = {
      id: `active-${vehicle.id}`,
      driver: vehicle.driver || '',
      driverPhone: vehicle.driverPhone,
      startDate: vehicle.startDate,
      endDate: vehicle.endDate,
      contractNumber: vehicle.contractNumber,
      initialKm: vehicle.initialKm,
      valorSemanal: vehicle.valorSemanal,
      valorRecebido: vehicle.valorRecebido,
      weeklyPayments: vehicle.weeklyPayments || [],
      caucaoValor: vehicle.caucaoValor,
      caucaoData: vehicle.caucaoData,
      caucaoObservacoes: vehicle.caucaoObservacoes,
      promisePayments: vehicle.promisePayments || [],
      paymentDayOfWeek: vehicle.paymentDayOfWeek,
      dueDay: vehicle.dueDay,
      tenantCpfCnpj: vehicle.tenantCpfCnpj,
      tenantRg: vehicle.tenantRg,
      tenantCnh: vehicle.tenantCnh,
      tenantEmail: vehicle.tenantEmail,
      tenantAddress: vehicle.tenantAddress,
      driverCnhExpiration: vehicle.driverCnhExpiration,
    };

    periods.push({
      kind: 'active',
      periodId: activeSnapshot.id,
      snapshot: activeSnapshot,
      periodLabel: formatPeriodLabel(vehicle.startDate, vehicle.endDate),
    });
  }

  // Sort chronological order within the month: earlier startDate/terminationDate first
  periods.sort((a, b) => {
    const aKey = normalizeToIsoDate(a.snapshot.startDate || a.snapshot.terminationDate) || '9999-12-31';
    const bKey = normalizeToIsoDate(b.snapshot.startDate || b.snapshot.terminationDate) || '9999-12-31';
    return aKey.localeCompare(bKey);
  });

  return {
    isPastMonth: true,
    periods,
  };
}

export function buildDisplayVehicleForPeriod(
  liveVehicle: Vehicle,
  period: ResolvedMonthPeriod | null,
  isPastMonth: boolean
): Vehicle {
  if (!period) {
    if (!isPastMonth) return liveVehicle;
    // Empty past month (car was not rented to any recorded driver in that month)
    return {
      ...liveVehicle,
      driver: '',
      driverPhone: '',
      contractNumber: '',
      startDate: '',
      endDate: '',
      valorRecebido: 0,
      weeklyPayments: [],
      caucaoValor: 0,
      caucaoData: '',
      caucaoObservacoes: '',
      promisePayments: [],
      tenantCpfCnpj: '',
      tenantRg: '',
      tenantCnh: '',
      tenantEmail: '',
      tenantAddress: '',
      driverCnhExpiration: '',
    };
  }

  if (period.kind === 'active') {
    return liveVehicle;
  }

  const s = period.snapshot;
  return {
    ...liveVehicle,
    driver: s.driver || '',
    driverPhone: s.driverPhone || '',
    startDate: s.startDate || '',
    endDate: s.endDate || s.terminationDate || '',
    contractNumber: s.contractNumber || '',
    initialKm: s.initialKm ?? liveVehicle.initialKm,
    valorSemanal: s.valorSemanal ?? liveVehicle.valorSemanal,
    valorRecebido: s.valorRecebido || 0,
    weeklyPayments: s.weeklyPayments ? [...s.weeklyPayments] : [],
    caucaoValor: s.caucaoValor || 0,
    caucaoData: s.caucaoData || '',
    caucaoObservacoes: s.caucaoObservacoes || '',
    promisePayments: s.promisePayments ? [...s.promisePayments] : [],
    paymentDayOfWeek: s.paymentDayOfWeek ?? liveVehicle.paymentDayOfWeek,
    dueDay: s.dueDay ?? liveVehicle.dueDay,
    tenantCpfCnpj: s.tenantCpfCnpj || '',
    tenantRg: s.tenantRg || '',
    tenantCnh: s.tenantCnh || '',
    tenantEmail: s.tenantEmail || '',
    tenantAddress: s.tenantAddress || '',
    driverCnhExpiration: s.driverCnhExpiration || '',
  };
}

export function applyScopedVehicleUpdate(
  liveVehicle: Vehicle,
  updatedDisplayVehicle: Vehicle,
  period: ResolvedMonthPeriod | null,
  isPastMonth: boolean,
  month: number,
  year: number
): Vehicle {
  // Active / current period: apply update directly to liveVehicle while keeping driverHistory
  if ((!isPastMonth && !period) || period?.kind === 'active') {
    return {
      ...updatedDisplayVehicle,
      driverHistory: updatedDisplayVehicle.driverHistory ?? liveVehicle.driverHistory,
    };
  }

  // Merge non-driver-scoped fields onto liveVehicle without overwriting active driver fields
  const driverScopedSet = new Set<keyof Vehicle>(DRIVER_SCOPED_FIELDS);
  const nextLive: Vehicle = { ...liveVehicle };
  const nextLiveRecord = nextLive as unknown as Record<string, unknown>;
  (Object.keys(updatedDisplayVehicle) as Array<keyof Vehicle>).forEach((key) => {
    if (!driverScopedSet.has(key) && key !== 'driverHistory') {
      nextLiveRecord[key as string] = updatedDisplayVehicle[key];
    }
  });

  if (period?.kind === 'history') {
    const updatedHistory = (liveVehicle.driverHistory || []).map((h) => {
      if (h.id !== period.periodId) return h;
      return {
        ...h,
        driver: updatedDisplayVehicle.driver || h.driver,
        driverPhone: updatedDisplayVehicle.driverPhone,
        startDate: updatedDisplayVehicle.startDate,
        endDate: updatedDisplayVehicle.endDate,
        contractNumber: updatedDisplayVehicle.contractNumber,
        initialKm: updatedDisplayVehicle.initialKm,
        valorSemanal: updatedDisplayVehicle.valorSemanal,
        valorRecebido: updatedDisplayVehicle.valorRecebido,
        weeklyPayments: updatedDisplayVehicle.weeklyPayments,
        caucaoValor: updatedDisplayVehicle.caucaoValor,
        caucaoData: updatedDisplayVehicle.caucaoData,
        caucaoObservacoes: updatedDisplayVehicle.caucaoObservacoes,
        promisePayments: updatedDisplayVehicle.promisePayments,
        paymentDayOfWeek: updatedDisplayVehicle.paymentDayOfWeek,
        dueDay: updatedDisplayVehicle.dueDay,
        tenantCpfCnpj: updatedDisplayVehicle.tenantCpfCnpj,
        tenantRg: updatedDisplayVehicle.tenantRg,
        tenantCnh: updatedDisplayVehicle.tenantCnh,
        tenantEmail: updatedDisplayVehicle.tenantEmail,
        tenantAddress: updatedDisplayVehicle.tenantAddress,
        driverCnhExpiration: updatedDisplayVehicle.driverCnhExpiration,
      };
    });
    return {
      ...nextLive,
      driverHistory: updatedHistory,
    };
  }

  // Fallback finalized contract or empty past month -> promote/create a historical period instead of overwriting active driver
  const monthDefaultStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const promotedEntry: DriverRentalPeriod = {
    id: period?.kind === 'finalized-fallback' ? period.periodId : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    driver: updatedDisplayVehicle.driver || period?.snapshot.driver || 'Não informado',
    driverPhone: updatedDisplayVehicle.driverPhone || '',
    startDate: updatedDisplayVehicle.startDate || period?.snapshot.startDate || monthDefaultStart,
    endDate: updatedDisplayVehicle.endDate || period?.snapshot.endDate || monthDefaultStart,
    terminationDate: period?.snapshot.terminationDate || monthDefaultStart,
    contractNumber: updatedDisplayVehicle.contractNumber || '',
    initialKm: updatedDisplayVehicle.initialKm,
    valorSemanal: updatedDisplayVehicle.valorSemanal,
    valorRecebido: updatedDisplayVehicle.valorRecebido || 0,
    weeklyPayments: updatedDisplayVehicle.weeklyPayments || [],
    caucaoValor: updatedDisplayVehicle.caucaoValor || 0,
    caucaoData: updatedDisplayVehicle.caucaoData || '',
    caucaoObservacoes: updatedDisplayVehicle.caucaoObservacoes || '',
    promisePayments: updatedDisplayVehicle.promisePayments || [],
    paymentDayOfWeek: updatedDisplayVehicle.paymentDayOfWeek,
    dueDay: updatedDisplayVehicle.dueDay,
    tenantCpfCnpj: updatedDisplayVehicle.tenantCpfCnpj || '',
    tenantRg: updatedDisplayVehicle.tenantRg || '',
    tenantCnh: updatedDisplayVehicle.tenantCnh || '',
    tenantEmail: updatedDisplayVehicle.tenantEmail || '',
    tenantAddress: updatedDisplayVehicle.tenantAddress || '',
    driverCnhExpiration: updatedDisplayVehicle.driverCnhExpiration || '',
    source: 'finalized',
  };

  return {
    ...nextLive,
    driverHistory: [promotedEntry, ...(liveVehicle.driverHistory || [])],
  };
}

export function getVehicleMonthlyPaymentsAllDrivers(
  vehicle: Vehicle,
  month: number,
  year: number
): WeeklyPayment[] {
  const seenIds = new Set<string>();
  const collected: WeeklyPayment[] = [];

  const pushUnique = (list?: WeeklyPayment[]) => {
    for (const wp of list || []) {
      const key = wp.id || `${wp.date}_${wp.amount}`;
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      if (isDateInMonth(wp.date, month, year)) {
        collected.push(wp);
      }
    }
  };

  pushUnique(vehicle.weeklyPayments);
  for (const h of vehicle.driverHistory || []) {
    pushUnique(h.weeklyPayments);
  }

  return collected;
}

export function getVehicleRevenueForMonth(
  vehicle: Vehicle,
  month: number,
  year: number,
  finalizedContracts: FinalizedContract[] = []
): number {
  const monthPayments = getVehicleMonthlyPaymentsAllDrivers(vehicle, month, year);
  const paidMonthPayments = monthPayments.filter((wp) => isWeeklyPaymentPaid(wp));
  if (paidMonthPayments.length > 0) {
    return paidMonthPayments.reduce((sum, wp) => sum + (wp.amount || 0), 0);
  }

  const resolution = resolveVehiclePeriodsForMonth(vehicle, month, year, finalizedContracts);
  if (!resolution.isPastMonth) {
    const hasAnyWeekly = (vehicle.weeklyPayments || []).length > 0;
    return hasAnyWeekly ? 0 : (vehicle.valorRecebido || 0);
  }

  // Past month with no weekly payments in this month: check if a matching period has fallback valorRecebido without weekly payments
  for (const p of resolution.periods) {
    const hasAnyWeeklyOnPeriod = (p.snapshot.weeklyPayments || []).length > 0;
    if (!hasAnyWeeklyOnPeriod && (p.snapshot.valorRecebido || 0) > 0) {
      if (p.kind === 'finalized-fallback') {
        if (isDateInMonth(p.snapshot.terminationDate, month, year)) {
          return p.snapshot.valorRecebido || 0;
        }
      } else if (p.kind === 'history') {
        if (isDateInMonth(p.snapshot.terminationDate || p.snapshot.startDate, month, year)) {
          return p.snapshot.valorRecebido || 0;
        }
      }
    }
  }

  return 0;
}
