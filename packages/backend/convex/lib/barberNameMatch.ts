/**
 * Compara nombres de barbero de forma tolerante (acentos, mayúsculas, espacios),
 * para alinear reservas con variaciones típicas del RAG o del cliente.
 */
export function barberNameMatchKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function barberNamesLooselyEqual(a: string, b: string): boolean {
  return barberNameMatchKey(a) === barberNameMatchKey(b);
}
