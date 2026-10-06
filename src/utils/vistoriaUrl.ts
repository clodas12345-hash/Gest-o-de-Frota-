export const encodeVistoriaParams = (params: Record<string, string | string[]>) => {
  const jsonString = JSON.stringify(params);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
};

export const decodeVistoriaParams = (encoded: string) => {
  try {
    const binString = atob(encoded);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const jsonString = new TextDecoder().decode(bytes);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error decoding vistoria params:', e);
    return null;
  }
};
