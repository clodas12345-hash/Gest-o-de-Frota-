import { Vehicle } from '../types';

export interface FipeResult {
  fipeCode: string;
  fipeValue: number;
  refMonth: string;
  vehicleName: string;
  brand: string;
  modelYear: number;
}

export interface FipeOption {
  codigo: string;
  nome: string;
}

export type FipeVehicleTypeV1 = 'carros' | 'motos' | 'caminhoes';

const V1_TO_V2_TYPE: Record<FipeVehicleTypeV1, 'cars' | 'motorcycles' | 'trucks'> = {
  carros: 'cars',
  motos: 'motorcycles',
  caminhoes: 'trucks',
};

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
 * Fetch FIPE brands list with automatic multi-provider fallback:
 * Parallelum v1 -> Parallelum v2 -> BrasilAPI
 */
export async function fetchFipeBrands(vehicleType: FipeVehicleTypeV1): Promise<FipeOption[]> {
  // 1. Parallelum v1
  try {
    const res = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('FIPE v1 marcas falhou, tentando fallback v2:', err);
  }

  // 2. Parallelum v2 fallback
  const v2Type = V1_TO_V2_TYPE[vehicleType];
  try {
    const res = await fetchWithTimeout(`https://fipe.parallelum.com.br/api/v2/${v2Type}/brands`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((b: any) => ({ codigo: String(b.code), nome: b.name }));
      }
    }
  } catch (err) {
    console.warn('FIPE v2 brands falhou, tentando fallback BrasilAPI:', err);
  }

  // 3. BrasilAPI fallback
  const res = await fetchWithTimeout(`https://brasilapi.com.br/api/fipe/marcas/v1/${vehicleType}`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((b: any) => ({ codigo: String(b.valor), nome: b.nome }));
    }
  }

  throw new Error('unavailable');
}

/**
 * Fetch FIPE models list with automatic fallback (Parallelum v1 -> v2)
 */
export async function fetchFipeModels(vehicleType: FipeVehicleTypeV1, brandId: string): Promise<FipeOption[]> {
  try {
    const res = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${brandId}/modelos`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.modelos)) return data.modelos;
    }
  } catch (err) {
    console.warn('FIPE v1 modelos falhou, tentando fallback v2:', err);
  }

  const v2Type = V1_TO_V2_TYPE[vehicleType];
  const res = await fetchWithTimeout(`https://fipe.parallelum.com.br/api/v2/${v2Type}/brands/${brandId}/models`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((m: any) => ({ codigo: String(m.code), nome: m.name }));
    }
  }

  throw new Error('unavailable');
}

/**
 * Fetch FIPE years list with automatic fallback (Parallelum v1 -> v2)
 */
export async function fetchFipeYears(vehicleType: FipeVehicleTypeV1, brandId: string, modelId: string): Promise<FipeOption[]> {
  try {
    const res = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${brandId}/modelos/${modelId}/anos`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('FIPE v1 anos falhou, tentando fallback v2:', err);
  }

  const v2Type = V1_TO_V2_TYPE[vehicleType];
  const res = await fetchWithTimeout(`https://fipe.parallelum.com.br/api/v2/${v2Type}/brands/${brandId}/models/${modelId}/years`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((y: any) => ({ codigo: String(y.code), nome: y.name }));
    }
  }

  throw new Error('unavailable');
}

/**
 * Fetch final FIPE details by selection IDs with automatic fallback (Parallelum v1 -> v2)
 */
export async function fetchFipeDetailBySelection(
  vehicleType: FipeVehicleTypeV1,
  brandId: string,
  modelId: string,
  yearId: string
): Promise<FipeResult> {
  try {
    const res = await fetchWithTimeout(
      `https://parallelum.com.br/fipe/api/v1/${vehicleType}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`
    );
    if (res.ok) {
      const detail = await res.json();
      return {
        fipeCode: detail.CodigoFipe || '',
        fipeValue: parseFipeValueStr(detail.Valor),
        refMonth: detail.MesReferencia || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        vehicleName: detail.Modelo || '',
        brand: detail.Marca || '',
        modelYear: detail.AnoModelo || new Date().getFullYear(),
      };
    }
  } catch (err) {
    console.warn('FIPE v1 detalhe falhou, tentando fallback v2:', err);
  }

  const v2Type = V1_TO_V2_TYPE[vehicleType];
  const res = await fetchWithTimeout(
    `https://fipe.parallelum.com.br/api/v2/${v2Type}/brands/${brandId}/models/${modelId}/years/${encodeURIComponent(yearId)}`
  );
  if (!res.ok) {
    throw new Error('unavailable');
  }
  const detail = await res.json();
  return {
    fipeCode: detail.codeFipe || '',
    fipeValue: typeof detail.price === 'number' ? detail.price : parseFipeValueStr(detail.price),
    refMonth: detail.referenceMonth || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    vehicleName: detail.model || '',
    brand: detail.brand || '',
    modelYear: detail.modelYear || new Date().getFullYear(),
  };
}

/**
 * Fetch FIPE data directly by FIPE Code (e.g. "001460-5")
 * Uses Parallelum FIPE API v2 as primary source (with BrasilAPI fallback)
 */
export async function fetchFipeByCode(fipeCode: string, modelYear?: number): Promise<FipeResult | null> {
  if (!fipeCode) return null;
  let cleanCode = fipeCode.trim().replace(/[^0-9-]/g, '');
  if (!cleanCode.includes('-') && cleanCode.length === 7) {
    cleanCode = `${cleanCode.substring(0, 6)}-${cleanCode.substring(6)}`;
  }
  if (!cleanCode) return null;

  let sawUnavailable = false;
  let sawNetworkError = false;

  // 1. Primary: Parallelum FIPE API v2
  const vehicleTypes: Array<'cars' | 'motorcycles' | 'trucks'> = ['cars', 'motorcycles', 'trucks'];
  for (const vType of vehicleTypes) {
    try {
      const yearsRes = await fetchWithTimeout(`https://fipe.parallelum.com.br/api/v2/${vType}/${cleanCode}/years`);
      if (yearsRes.status === 404) {
        continue;
      }
      if (!yearsRes.ok) {
        sawUnavailable = true;
        break;
      }
      const yearsData = await yearsRes.json();
      if (!Array.isArray(yearsData) || yearsData.length === 0) {
        continue;
      }

      let targetYear = yearsData.find((y: any) => !String(y.code || '').startsWith('32000')) || yearsData[0];
      if (modelYear) {
        const yearStr = String(modelYear);
        const exactMatch = yearsData.find(
          (y: any) => String(y.code || '').startsWith(`${yearStr}-`) || String(y.name || '').startsWith(yearStr)
        );
        if (exactMatch) targetYear = exactMatch;
      }

      const detailRes = await fetchWithTimeout(
        `https://fipe.parallelum.com.br/api/v2/${vType}/${cleanCode}/years/${encodeURIComponent(targetYear.code)}`
      );
      if (!detailRes.ok) {
        if (detailRes.status !== 404) sawUnavailable = true;
        break;
      }
      const detail = await detailRes.json();
      const valueNum = typeof detail.price === 'number' ? detail.price : parseFipeValueStr(detail.price);

      return {
        fipeCode: detail.codeFipe || cleanCode,
        fipeValue: valueNum,
        refMonth: detail.referenceMonth || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        vehicleName: detail.model || `${detail.brand || ''} ${detail.modelYear || ''}`.trim(),
        brand: detail.brand || '',
        modelYear: detail.modelYear || modelYear || new Date().getFullYear(),
      };
    } catch (err) {
      console.error(`Error fetching FIPE v2 (${vType}) by code:`, err);
      sawNetworkError = true;
      break;
    }
  }

  // 2. Fallback: BrasilAPI
  try {
    const res = await fetchWithTimeout(`https://brasilapi.com.br/api/fipe/preco/v1/${cleanCode}`);
    if (res.status === 404) {
      if (!sawUnavailable && !sawNetworkError) return null;
      throw new Error(sawUnavailable ? 'unavailable' : 'offline');
    }
    if (!res.ok) {
      throw new Error('unavailable');
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

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
    console.error('Error fetching FIPE fallback by code:', err);
    if (err?.message === 'unavailable' || sawUnavailable) {
      throw new Error('unavailable');
    }
    if (!sawUnavailable && !sawNetworkError && err?.message !== 'offline') {
      return null;
    }
    throw new Error('offline');
  }
}

/**
 * Search FIPE value by Brand, Model name, and Year using Parallelum FIPE API (v1 with v2 fallback)
 */
export async function fetchFipeByDetails(brand: string, model: string, year: number): Promise<FipeResult | null> {
  if (!brand || !model) return null;

  try {
    // 1. Fetch brands list (uses v1 -> v2 -> BrasilAPI fallback)
    const brandsData = await fetchFipeBrands('carros');
    const targetBrand = brand.toLowerCase().trim();
    const foundBrand = brandsData.find((b) =>
      b.nome.toLowerCase().includes(targetBrand) || targetBrand.includes(b.nome.toLowerCase())
    );
    if (!foundBrand) return null;

    // 2. Fetch models list (uses v1 -> v2 fallback)
    const modelsList = await fetchFipeModels('carros', foundBrand.codigo);
    const targetModel = model.toLowerCase().trim();
    const foundModel = modelsList.find((m) => {
      const mName = m.nome.toLowerCase();
      return mName.includes(targetModel) || targetModel.includes(mName.split(' ')[0]);
    });
    if (!foundModel) return null;

    // 3. Fetch years list (uses v1 -> v2 fallback)
    const yearsData = await fetchFipeYears('carros', foundBrand.codigo, foundModel.codigo);
    const targetYearStr = String(year);
    const foundYear = yearsData.find((y) => y.nome.includes(targetYearStr)) || yearsData[0];
    if (!foundYear) return null;

    // 4. Fetch value details (uses v1 -> v2 fallback)
    const detail = await fetchFipeDetailBySelection('carros', foundBrand.codigo, foundModel.codigo, foundYear.codigo);
    return {
      ...detail,
      vehicleName: detail.vehicleName || `${foundBrand.nome} ${detail.modelYear}`,
      brand: detail.brand || foundBrand.nome,
      modelYear: detail.modelYear || year,
    };
  } catch (err) {
    console.error('Error fetching FIPE by details:', err);
    return null;
  }
}

/**
 * Apply a manual FIPE value override to a vehicle and record it in fipeHistory
 */
export function applyManualFipeOverride(vehicle: Vehicle, manualValue: number, manualCode?: string): Vehicle {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const refMonthLabel = `${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} (Manual)`;

  const history = vehicle.fipeHistory || [];
  const existingHistIdx = history.findIndex(h => h.month === currentMonthStr);
  const updatedHistory = [...history];

  if (existingHistIdx >= 0) {
    updatedHistory[existingHistIdx] = { month: currentMonthStr, value: manualValue };
  } else {
    updatedHistory.push({ month: currentMonthStr, value: manualValue });
  }

  return {
    ...vehicle,
    fipeCode: manualCode !== undefined ? manualCode : vehicle.fipeCode,
    fipeValue: manualValue,
    fipeRefMonth: refMonthLabel,
    fipeLastUpdate: currentMonthStr,
    fipeHistory: updatedHistory,
  };
}

/**
 * Automatic Monthly FIPE Sync function
 * Compares vehicle's fipeLastUpdate with current month (YYYY-MM).
 * If outdated or missing (or force = true), fetches official update and appends to history.
 */
export async function syncVehicleFipe(
  vehicle: Vehicle,
  force = false
): Promise<{ updatedVehicle: Vehicle; updated: boolean; error?: string }> {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check if already updated this month (skip unless forced by manual button click)
  if (!force && vehicle.fipeLastUpdate === currentMonthStr && vehicle.fipeValue) {
    return { updatedVehicle: vehicle, updated: false };
  }

  const modelYear = vehicle.yearModel || vehicle.year || now.getFullYear();
  let fipeData: FipeResult | null = null;
  let lastErr: string | undefined;

  // Try by code first if code exists, then fallback to Brand/Model/Year details
  if (vehicle.fipeCode) {
    try {
      fipeData = await fetchFipeByCode(vehicle.fipeCode, modelYear);
    } catch (e: any) {
      lastErr = e?.message;
    }
  }

  if (!fipeData && vehicle.brand && vehicle.model) {
    try {
      fipeData = await fetchFipeByDetails(vehicle.brand, vehicle.model, modelYear);
    } catch (e: any) {
      lastErr = e?.message;
    }
  }

  if (!fipeData || !fipeData.fipeValue) {
    return {
      updatedVehicle: vehicle,
      updated: false,
      error: lastErr || 'Não foi possível consultar a Tabela FIPE automaticamente.'
    };
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
