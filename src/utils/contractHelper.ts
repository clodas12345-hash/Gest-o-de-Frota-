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
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const allContractNumbers: string[] = [];

  vehicles.forEach(v => {
    if (v.contractNumber) allContractNumbers.push(v.contractNumber);
  });

  try {
    const savedFinalized = localStorage.getItem('fleet_finalized_contracts');
    if (savedFinalized) {
      const finalized = JSON.parse(savedFinalized);
      if (Array.isArray(finalized)) {
        finalized.forEach((c: any) => {
          if (c.contractNumber) allContractNumbers.push(c.contractNumber);
        });
      }
    }
  } catch (e) {
    // ignore
  }

  let maxSeq = 0;
  allContractNumbers.forEach(num => {
    const match = num.match(/-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(2, '0');

  return `CT-GKD-${carIdentifier}-${month}-${year}-${seqStr}`;
}

