/** America/Bogotá (UTC-5 fijo, sin DST). */

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Inicio y fin del día civil en Bogotá (para consultas por día). */
export function bogotaDayBoundsFromYmd(localDateYmd: string): {
  dayStart: number;
  dayEnd: number;
} {
  if (!YMD_RE.test(localDateYmd)) {
    throw new Error("localDate debe ser YYYY-MM-DD");
  }
  const dayStart = Date.parse(`${localDateYmd}T00:00:00-05:00`);
  const dayEnd = Date.parse(`${localDateYmd}T23:59:59.999-05:00`);
  if (Number.isNaN(dayStart) || Number.isNaN(dayEnd)) {
    throw new Error("Fecha inválida");
  }
  return { dayStart, dayEnd };
}

/** Una cita a las HH:mm en calendario Bogotá ese día → epoch UTC ms. */
export function bogotaLocalDateTimeToUtcMs(
  localDateYmd: string,
  hour24: number,
  minute: number,
): number {
  if (!YMD_RE.test(localDateYmd)) {
    throw new Error("localDate debe ser YYYY-MM-DD");
  }
  if (
    hour24 < 0 ||
    hour24 > 23 ||
    minute < 0 ||
    minute > 59 ||
    !Number.isInteger(hour24) ||
    !Number.isInteger(minute)
  ) {
    throw new Error("Hora o minuto inválido");
  }
  const hh = String(hour24).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const ms = Date.parse(`${localDateYmd}T${hh}:${mm}:00-05:00`);
  if (Number.isNaN(ms)) {
    throw new Error("Fecha u hora inválida");
  }
  return ms;
}

export function formatBogota(ms: number): string {
  return new Date(ms).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBogotaTimeOnly(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  });
}
