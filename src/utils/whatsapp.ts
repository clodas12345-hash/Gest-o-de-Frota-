export function formatWhatsAppPhone(phoneStr?: string): string {
  if (!phoneStr) return '';
  const digits = phoneStr.replace(/\D/g, '');
  if (!digits) return '';

  // Fix duplicated country code (e.g. 555511999998888)
  if (digits.startsWith('5555') && digits.length >= 14) {
    return digits.substring(2);
  }

  // If already starts with 55 and has 12 or 13 digits (e.g. 5511999998888)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // If 10 or 11 digits (e.g. 11999998888), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function openWhatsAppUrl(phone?: string, text?: string) {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = text ? encodeURIComponent(text) : '';
  
  const waUrl = formattedPhone 
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const newTab = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = waUrl;
    }
  } catch (err) {
    window.location.href = waUrl;
  }
}
