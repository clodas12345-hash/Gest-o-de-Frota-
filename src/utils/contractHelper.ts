import { Vehicle } from '../types';

export function generateNextContractNumber(
  plate: string,
  vehicles: Vehicle[],
  carName?: string
): string {
  const cleanPlate = plate ? plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
  const cleanCar = carName ? carName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
  const carIdentifier = cleanPlate || cleanCar || 'CARRO';

  const now = new Date();
  const year = now.getFullYear();

  const usedNumbers = new Set<string>();

  vehicles.forEach(v => {
    if (v.contractNumber && v.contractNumber !== 'MINUTA / EM BRANCO') {
      usedNumbers.add(v.contractNumber.trim());
    }
  });

  try {
    const savedFinalized = localStorage.getItem('fleet_finalized_contracts');
    if (savedFinalized) {
      const finalized = JSON.parse(savedFinalized);
      if (Array.isArray(finalized)) {
        finalized.forEach((c: any) => {
          if (c.contractNumber && c.contractNumber !== 'MINUTA / EM BRANCO') {
            usedNumbers.add(c.contractNumber.trim());
          }
        });
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    const savedUsed = localStorage.getItem('fleet_used_contract_numbers');
    if (savedUsed) {
      const parsed = JSON.parse(savedUsed);
      if (Array.isArray(parsed)) {
        parsed.forEach(n => usedNumbers.add(String(n).trim()));
      }
    }
  } catch (e) {
    // ignore
  }

  let maxSeq = 0;
  usedNumbers.forEach(num => {
    const match = num.match(/-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let candidate = '';

  do {
    const seqStr = String(nextSeq).padStart(3, '0');
    candidate = `CT-${carIdentifier}-${year}-${seqStr}`;
    if (usedNumbers.has(candidate)) {
      nextSeq++;
    } else {
      break;
    }
  } while (nextSeq < 100000);

  usedNumbers.add(candidate);
  try {
    localStorage.setItem('fleet_used_contract_numbers', JSON.stringify(Array.from(usedNumbers)));
  } catch (e) {
    // ignore
  }

  return candidate;
}
