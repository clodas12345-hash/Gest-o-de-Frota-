export const encodeVistoriaParams = (params: Record<string, string | string[]>) => {
  const jsonString = JSON.stringify(params);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

export const decodeVistoriaParams = (encoded: string) => {
  try {
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error decoding vistoria params:', e);
    return null;
  }
};
