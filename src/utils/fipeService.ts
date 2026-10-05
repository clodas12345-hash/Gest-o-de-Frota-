import { Vehicle } from '../types';

export interface FipeResult {
  fipeCode: string;
  fipeValue: number;
  refMonth: string;
  vehicleName: string;
  brand: string;
  modelYear: number;
}

/**
 * Helper to convert FIPE currency string "R$ 45.200,00" to number 45200
 */
export function parseFipeValueStr(valStr: string): number {
  if (!valStr) return 0;
  const clean = valStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch FIPE data directly by FIPE Code (e.g. "001460-5") using BrasilAPI
 */
export async function fetchFipeByCode(fipeCode: string, modelYear?: number): Promise<FipeResult | null> {
  if (!fipeCode) return null;
  const cleanCode = fipeCode.trim().replace(/[^0-9-]/g, '');
  if (!cleanCode) return null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${cleanCode}`);
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error('unavailable');
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Filter by year if specified, otherwise pick the newest/first item
    let match = data[0];
    if (modelYear) {
      const yearMatch = data.find((item: any) => item.anoModelo === modelYear);
      if (yearMatch) match = yearMatch;
    }

    const valueNum = typeof match.valor === 'number' ? match.valor : parseFipeValueStr(match.valor);
    return {
      fipeCode: match.codigoFipe || cleanCode,
      fipeValue: valueNum,
      refMonth: match.mesReferencia || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      vehicleName: match.modelo || `${match.marca} ${match.anoModelo}`,
      brand: match.marca || '',
      modelYear: match.anoModelo || modelYear || new Date().getFullYear(),
    };
  } catch (err: any) {
    console.error('Error fetching FIPE by code:', err);
    if (err?.message === 'unavailable') {
      throw err;
    }
    throw new Error('offline');
  }
}

/**
 * Search FIPE value by Brand, Model name, and Year using Parallelum FIPE API
 */
export async function fetchFipeByDetails(brand: string, model: string, year: number): Promise<FipeResult | null> {
  if (!brand || !model) return null;

  try {
    // 1. Fetch brands list
    const brandsRes = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
    if (!brandsRes.ok) return null;
    const brandsData = await brandsRes.json();
    
    const targetBrand = brand.toLowerCase().trim();
    const foundBrand = brandsData.find((b: any) => 
      b.nome.toLowerCase().includes(targetBrand) || targetBrand.includes(b.nome.toLowerCase())
    );
    if (!foundBrand) return null;

    // 2. Fetch models list
    const modelsRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos`);
    if (!modelsRes.ok) return null;
    const modelsData = await modelsRes.json();
    const modelsList = modelsData.modelos || [];

    const targetModel = model.toLowerCase().trim();
    // Fuzzy search for model
    const foundModel = modelsList.find((m: any) => {
      const mName = m.nome.toLowerCase();
      return mName.includes(targetModel) || targetModel.includes(mName.split(' ')[0]);
    });
    if (!foundModel) return null;

    // 3. Fetch years list
    const yearsRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos/${foundModel.codigo}/anos`);
    if (!yearsRes.ok) return null;
    const yearsData = await yearsRes.json();

    const targetYearStr = String(year);
    const foundYear = yearsData.find((y: any) => y.nome.includes(targetYearStr)) || yearsData[0];
    if (!foundYear) return null;

    // 4. Fetch value details
    const detailRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos/${foundModel.codigo}/anos/${foundYear.codigo}`);
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();

    const valueNum = parseFipeValueStr(detail.Valor);
    return {
      fipeCode: detail.CodigoFipe || '',
      fipeValue: valueNum,
      refMonth: detail.MesReferencia || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      vehicleName: detail.Modelo || `${foundBrand.nome} ${detail.AnoModelo}`,
      brand: detail.Marca || foundBrand.nome,
      modelYear: detail.AnoModelo || year,
    };
  } catch (err) {
    console.error('Error fetching FIPE by details:', err);
    return null;
  }
}

/**
 * Automatic Monthly FIPE Sync function
 * Compares vehicle's fipeLastUpdate with current month (YYYY-MM).
 * If outdated or missing, fetches official update and appends to history.
 */
export async function syncVehicleFipe(vehicle: Vehicle): Promise<{ updatedVehicle: Vehicle; updated: boolean }> {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check if already updated this month
  if (vehicle.fipeLastUpdate === currentMonthStr && vehicle.fipeValue) {
    return { updatedVehicle: vehicle, updated: false };
  }

  const modelYear = vehicle.yearModel || vehicle.year || now.getFullYear();
  let fipeData: FipeResult | null = null;

  // Try by code first if code exists, otherwise search by details
  try {
    if (vehicle.fipeCode) {
      fipeData = await fetchFipeByCode(vehicle.fipeCode, modelYear);
    } else {
      fipeData = await fetchFipeByDetails(vehicle.brand, vehicle.model, modelYear);
    }
  } catch (e) {
    console.error('Error in syncVehicleFipe lookup:', e);
    return { updatedVehicle: vehicle, updated: false };
  }

  if (!fipeData || !fipeData.fipeValue) {
    return { updatedVehicle: vehicle, updated: false };
  }

  // Update vehicle FIPE information
  const history = vehicle.fipeHistory || [];
  const existingHistIdx = history.findIndex(h => h.month === currentMonthStr);
  const updatedHistory = [...history];

  if (existingHistIdx >= 0) {
    updatedHistory[existingHistIdx] = { month: currentMonthStr, value: fipeData.fipeValue };
  } else {
    updatedHistory.push({ month: currentMonthStr, value: fipeData.fipeValue });
  }

  const updatedVehicle: Vehicle = {
    ...vehicle,
    fipeCode: fipeData.fipeCode || vehicle.fipeCode,
    fipeValue: fipeData.fipeValue,
    fipeRefMonth: fipeData.refMonth,
    fipeLastUpdate: currentMonthStr,
    fipeHistory: updatedHistory,
  };

  return { updatedVehicle, updated: true };
}
