/**
 * Normaliza teléfonos de clientes a E.164 para YCloud / WhatsApp.
 */
export function normalizeCustomerPhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let s = trimmed.replace(/\s/g, "");
  if (s.startsWith("whatsapp:")) {
    s = s.slice("whatsapp:".length);
  }

  if (s.startsWith("+")) {
    const rest = s.slice(1).replace(/\D/g, "");
    return rest.length >= 8 ? `+${rest}` : null;
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Colombia: 10 dígitos móvil típico
  if (digits.length === 10 && digits.startsWith("3")) {
    return `+57${digits}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}
