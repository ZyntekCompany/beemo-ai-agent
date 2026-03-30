"use client";

import { useMemo, useState, useEffect, useRef, type MouseEvent } from "react";
import { Calendar } from "@workspace/ui/components/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Phone,
  Scissors,
  Ban,
  MessageCircle,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { Id } from "@workspace/backend/_generated/dataModel";
import { barberNameMatchKey } from "@workspace/backend/lib/barberNameMatch";
import { GoogleCalendarBrandIcon } from "@/components/google-calendar-brand-icon";

/** Entre variantes del mismo barbero (acentos, etc.), mostrar una etiqueta estable. */
function canonicalBarberLabel(variants: string[]): string {
  const uniq = [...new Set(variants)];
  return uniq.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.localeCompare(b, "es");
  })[0]!;
}

/** Día completo visible: 00:00–23:59 (24 filas). */
const HOUR_START = 0;
const HOUR_END = 24;
const HOUR_HEIGHT = 52; // px por hora (24 h = ~1248 px, con scroll)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/15 border-blue-400 text-blue-900",
  pending: "bg-amber-400/15 border-amber-400 text-amber-900",
  cancelled: "bg-red-400/10 border-red-300 text-red-700 opacity-60",
};

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-blue-500",
  pending: "bg-amber-400",
  cancelled: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

/** Mismo audio que envía el backend por YCloud 10 min antes (también en Convex: lib/reservationReminder). */
const RESERVATION_REMINDER_AUDIO_URL =
  "https://devops-back.s3.us-east-1.amazonaws.com/beemo/ElevenLabs_2026-03-30T03_01_10_Valentina+-+Conversational+Medellin_pvc_sp100_s50_sb75_se0_b_m2.mp3";

const MS_24H = 24 * 60 * 60 * 1000;

function waMePhoneDigits(phone: string): string | null {
  const cleaned = phone.trim().replace(/\s/g, "").replace(/^whatsapp:/i, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("+")) {
    const rest = cleaned.slice(1).replace(/\D/g, "");
    return rest.length >= 8 ? rest : null;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length >= 10) return digits;
  return null;
}

function buildManualReminderMessage(r: Reservation): string {
  const start = new Date(r.startTime);
  const end = new Date(r.endTime);
  const fecha = start.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaFin = end.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return (
    `Hola ${r.customerName}, te recordamos tu cita con ${r.barberName} el ${fecha} hasta ${horaFin}. ` +
    `Mensaje de voz: ${RESERVATION_REMINDER_AUDIO_URL}`
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

type Reservation = {
  _id: Id<"reservations">;
  barberName: string;
  customerName: string;
  customerPhone: string;
  startTime: number;
  endTime: number;
  status: "confirmed" | "pending" | "cancelled";
  googleEventId?: string;
  notes?: string;
};

function ReservationBlock({
  reservation,
  dayStartMs,
  onClick,
}: {
  reservation: Reservation;
  dayStartMs: number;
  onClick: (r: Reservation) => void;
}) {
  const minutesFromDayStart = (reservation.startTime - dayStartMs) / 60000;
  const durationMinutes = (reservation.endTime - reservation.startTime) / 60000;

  const rawTopPx = (minutesFromDayStart / 60) * HOUR_HEIGHT;
  let rawHeightPx = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 26);
  const dayHeightPx = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  let clippedTop = rawTopPx;
  let clippedHeight = rawHeightPx;
  if (clippedTop < 0) {
    clippedHeight += clippedTop;
    clippedTop = 0;
  }
  if (clippedTop + clippedHeight > dayHeightPx) {
    clippedHeight = dayHeightPx - clippedTop;
  }
  if (clippedHeight < 18) return null;

  const timeLabel = `${new Date(reservation.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(reservation.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const isShort = clippedHeight < 44;

  return (
    <button
      type="button"
      onClick={() => onClick(reservation)}
      title={`${reservation.customerName} — Toca para ver detalle`}
      className={cn(
        "absolute left-1 right-1 z-10 rounded-lg border-l-4 px-2 py-1 text-left shadow-sm transition-all hover:shadow-md hover:brightness-95 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        STATUS_COLORS[reservation.status],
      )}
      style={{ top: clippedTop, height: clippedHeight }}
    >
      {isShort ? (
        <p className="truncate text-[11px] font-semibold leading-tight">
          {reservation.barberName} · {timeLabel}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-semibold truncate">{reservation.barberName}</span>
            {reservation.googleEventId && (
              <span title="Sincronizado con Google Calendar">
                <GoogleCalendarBrandIcon className="h-3 w-3 shrink-0" />
              </span>
            )}
          </div>
          <p className="truncate text-[11px] opacity-80">{reservation.customerName}</p>
          {clippedHeight >= 56 && (
            <p className="truncate text-[10px] opacity-60 mt-0.5">{timeLabel}</p>
          )}
        </>
      )}
    </button>
  );
}

function CurrentTimeLine({
  selectedDate,
  dayStartMs,
}: {
  selectedDate: Date;
  dayStartMs: number;
}) {
  const [now, setNow] = useState(new Date());
  const isToday = useMemo(() => {
    const t = new Date();
    const s = new Date(selectedDate);
    return (
      t.getFullYear() === s.getFullYear() &&
      t.getMonth() === s.getMonth() &&
      t.getDate() === s.getDate()
    );
  }, [selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday) return null;

  const totalMinutes = (now.getTime() - dayStartMs) / 60000;
  if (totalMinutes < 0 || totalMinutes > 24 * 60) return null;

  const topPx = (totalMinutes / 60) * HOUR_HEIGHT;

  return (
    <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: topPx }}>
      <div className="flex items-center gap-1">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 -ml-1.5" />
        <div className="flex-1 border-t-2 border-red-500" />
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [barberName, setBarberName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [time, setTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const googleConnection = useQuery(api.private.googleCalendar.getConnection, {});

  const dayRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { dayStart: start.getTime(), dayEnd: end.getTime() };
  }, [selectedDate]);

  const reservations = useQuery(api.public.reservations.listByDayForOrganization, dayRange);
  const createReservation = useMutation(api.public.reservations.createManual);
  const cancelReservation = useMutation(api.public.reservations.cancelById);

  const sortedReservations = useMemo(() => {
    if (!reservations) return [];
    return [...reservations].sort((a, b) => a.startTime - b.startTime) as Reservation[];
  }, [reservations]);

  /** Barberos distintos del día (misma persona = misma clave aunque varíe acentos) para columnas. */
  const barberGroups = useMemo(() => {
    if (!sortedReservations.length) return [];
    const keyToVariants = new Map<string, string[]>();
    for (const r of sortedReservations) {
      const k = barberNameMatchKey(r.barberName);
      const list = keyToVariants.get(k) ?? [];
      if (!list.includes(r.barberName)) list.push(r.barberName);
      keyToVariants.set(k, list);
    }
    return [...keyToVariants.entries()]
      .map(([key, variants]) => ({
        key,
        label: canonicalBarberLabel(variants),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [sortedReservations]);

  const detailReminderUi = useMemo(() => {
    if (!selectedReservation) {
      return {
        showManualWaReminder: false,
        showYcloudAutoNote: false,
        waDigits: null as string | null,
      };
    }
    const r = selectedReservation;
    const msUntilStart = r.startTime - Date.now();
    const waDigits = r.customerPhone ? waMePhoneDigits(r.customerPhone) : null;
    return {
      showManualWaReminder:
        r.status === "confirmed" && !!waDigits && msUntilStart > MS_24H,
      showYcloudAutoNote:
        r.status === "confirmed" && msUntilStart > 0 && msUntilStart <= MS_24H,
      waDigits,
    };
  }, [selectedReservation]);

  const dayStartMs = dayRange.dayStart;

  // Al abrir el día, centrar scroll cerca de la mañana (8:00); el día completo sigue siendo scrolleable
  useEffect(() => {
    if (timelineRef.current) {
      const offset = 8 * HOUR_HEIGHT - 24;
      timelineRef.current.scrollTop = Math.max(0, offset);
    }
  }, [selectedDate]);

  function goToPrevDay() {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goToNextDay() {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  const isToday = useMemo(() => {
    const t = new Date();
    return (
      selectedDate.getFullYear() === t.getFullYear() &&
      selectedDate.getMonth() === t.getMonth() &&
      selectedDate.getDate() === t.getDate()
    );
  }, [selectedDate]);

  const formattedDate = selectedDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const confirmedCount = sortedReservations.filter((r) => r.status === "confirmed").length;
  const syncedCount = sortedReservations.filter((r) => r.googleEventId).length;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    await createReservation({
      barberName,
      customerName,
      customerPhone,
      startTime: start.getTime(),
      endTime: end.getTime(),
      notes: notes || undefined,
    });

    setBarberName("");
    setCustomerName("");
    setCustomerPhone("");
    setTime("09:00");
    setDurationMinutes(60);
    setNotes("");
    setIsDialogOpen(false);
  }

  async function handleConfirmCancel() {
    if (!selectedReservation) return;
    setIsCancelling(true);
    try {
      await cancelReservation({ reservationId: selectedReservation._id });
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    } catch {
      // ConvexError se muestra en consola; el usuario puede reintentar
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-muted overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-background px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Scissors className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-base font-semibold">Reservas</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center rounded-lg border bg-background shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={goToPrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-none px-3 text-sm font-medium min-w-[180px] text-center"
              onClick={goToToday}
            >
              {isToday ? (
                <span className="text-blue-600 font-semibold">Hoy</span>
              ) : (
                <span className="capitalize">{formattedDate}</span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday && (
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
              Hoy
            </Button>
          )}

          <Button size="sm" className="h-8 gap-1.5" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva reserva
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-background p-4">
          {/* Mini calendar */}
          <Card className="shadow-none">
            <CardContent className="p-2">
              <Calendar
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                mode="single"
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="shadow-none">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumen del día
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {reservations === undefined ? (
                <p className="text-xs text-muted-foreground">Cargando…</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{sortedReservations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confirmadas</span>
                    <span className="font-medium text-blue-600">{confirmedCount}</span>
                  </div>
                  {syncedCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <GoogleCalendarBrandIcon className="h-3 w-3" />
                        En Google Calendar
                      </span>
                      <span className="font-medium">{syncedCount}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Leyenda */}
          <p className="px-1 text-[11px] text-muted-foreground leading-snug">
            Vista de 24 horas (00:00–23:59). Usa la hora de tu navegador. Desplázate para ver madrugada y noche.
          </p>

          <Card className="shadow-none">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", STATUS_DOT[key])} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Google Calendar status */}
          {googleConnection !== undefined && (
            <Card className="shadow-none">
              <CardContent className="px-4 py-3">
                {googleConnection ? (
                  <div className="flex items-center gap-2 text-sm">
                    <GoogleCalendarBrandIcon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs">Google Calendar</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {googleConnection.accountEmail ?? "Conectado"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/plugins/google-calendar"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <GoogleCalendarBrandIcon className="h-4 w-4 shrink-0 opacity-80" />
                    Conectar Google Calendar
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {/* Day header */}
          <div className="flex items-center border-b px-6 py-2 shrink-0">
            <div className="w-14 shrink-0" />
            <div className="flex-1 text-center">
              <p className={cn("text-sm font-semibold capitalize", isToday && "text-blue-600")}>
                {selectedDate.toLocaleDateString("es-ES", { weekday: "long" })}
              </p>
              <div
                className={cn(
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-base font-bold",
                  isToday ? "bg-blue-600 text-white" : "text-foreground",
                )}
              >
                {selectedDate.getDate()}
              </div>
            </div>
          </div>

          {/* Cabecera por barbero cuando hay más de uno (misma hora en paralelo, sin amontonar) */}
          {barberGroups.length > 1 && sortedReservations.length > 0 && (
            <div className="flex items-stretch border-b bg-muted/40 px-6 py-2 shrink-0">
              <div className="w-14 shrink-0" />
              <div className="flex flex-1 min-w-0">
                {barberGroups.map(({ key, label }, i) => (
                  <div
                    key={key}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col justify-center px-2 text-center",
                      i > 0 && "border-l border-border/60",
                    )}
                  >
                    <p className="truncate text-xs font-semibold text-foreground" title={label}>
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Barbero</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable timeline */}
          <div ref={timelineRef} className="flex-1 overflow-y-auto">
            <div
              className="relative flex"
              style={{ height: (HOUR_END - HOUR_START) * HOUR_HEIGHT }}
            >
              {/* Hour labels */}
              <div className="relative w-14 shrink-0">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute right-3 text-[11px] text-muted-foreground"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT - 8 }}
                  >
                    {formatHour(h)}
                  </div>
                ))}
              </div>

              {/* Grid + reservations */}
              <div className="relative flex-1 border-l">
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Half-hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-border/25"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Current time */}
                <CurrentTimeLine selectedDate={selectedDate} dayStartMs={dayStartMs} />

                {/* Reservation blocks: una columna por barbero si hay varios, para no superponer la misma franja horaria */}
                {reservations === undefined ? (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ top: 100 }}
                  >
                    <p className="text-sm text-muted-foreground">Cargando reservas…</p>
                  </div>
                ) : sortedReservations.length === 0 ? (
                  <div
                    className="absolute left-0 right-0 flex flex-col items-center gap-1"
                    style={{ top: 3 * HOUR_HEIGHT }}
                  >
                    <p className="text-sm text-muted-foreground">Sin reservas este día</p>
                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Crear primera reserva
                    </button>
                  </div>
                ) : barberGroups.length > 1 ? (
                  <div className="absolute inset-0 flex">
                    {barberGroups.map(({ key }, colIdx) => (
                      <div
                        key={key}
                        className={cn(
                          "relative min-w-[72px] flex-1",
                          colIdx > 0 && "border-l border-border/50",
                        )}
                      >
                        {sortedReservations
                          .filter((r) => barberNameMatchKey(r.barberName) === key)
                          .map((r) => (
                            <ReservationBlock
                              key={r._id}
                              reservation={r as Reservation}
                              dayStartMs={dayStartMs}
                              onClick={setSelectedReservation}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  sortedReservations.map((r) => (
                    <ReservationBlock
                      key={r._id}
                      reservation={r as Reservation}
                      dayStartMs={dayStartMs}
                      onClick={setSelectedReservation}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: nueva reserva */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Input
                readOnly
                value={selectedDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                className="bg-muted capitalize"
              />
            </div>
            <div className="grid gap-2">
              <Label>Barbero</Label>
              <Input
                value={barberName}
                onChange={(e) => setBarberName(e.target.value)}
                placeholder="Nombre del barbero"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Nombre del cliente</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono / WhatsApp</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Número de contacto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min={60}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tipo de corte, barba, etc."
              />
            </div>
            <Button type="submit" className="mt-1 w-full">
              Guardar reserva
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: detalle de reserva */}
      <Dialog
        open={!!selectedReservation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReservation(null);
            setCancelDialogOpen(false);
          }
        }}
      >
        {selectedReservation && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalle de reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                    STATUS_COLORS[selectedReservation.status],
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[selectedReservation.status])} />
                  {STATUS_LABEL[selectedReservation.status]}
                </span>
                {selectedReservation.googleEventId && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <GoogleCalendarBrandIcon className="h-3 w-3" />
                    Google Calendar
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="rounded-lg border divide-y">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Barbero</p>
                    <p className="text-sm font-medium">{selectedReservation.barberName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium">{selectedReservation.customerName}</p>
                  </div>
                </div>
                {selectedReservation.customerPhone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-sm font-medium">{selectedReservation.customerPhone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Horario</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedReservation.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(selectedReservation.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {selectedReservation.notes && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedReservation.notes}</p>
                  </div>
                )}
              </div>

              {/* Cliente (resumen) */}
              <div className="flex items-center gap-3 pt-1 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-xs font-bold border">
                  {getInitials(selectedReservation.customerName)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-semibold truncate">{selectedReservation.customerName}</p>
                  {selectedReservation.customerPhone ? (
                    <a
                      href={`tel:${selectedReservation.customerPhone.replace(/\s/g, "")}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {selectedReservation.customerPhone}
                    </a>
                  ) : null}
                </div>
              </div>

              {detailReminderUi.showYcloudAutoNote && (
                <p className="text-xs text-muted-foreground leading-relaxed px-0.5">
                  Se enviará un recordatorio con audio por WhatsApp (YCloud) unos 10 minutos antes de la
                  cita, si tienes YCloud configurado y el número es válido.
                </p>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {detailReminderUi.showManualWaReminder && detailReminderUi.waDigits && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  asChild
                >
                  <a
                    href={`https://wa.me/${detailReminderUi.waDigits}?text=${encodeURIComponent(buildManualReminderMessage(selectedReservation))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Recordar (WhatsApp)
                  </a>
                </Button>
              )}
              {selectedReservation.status !== "cancelled" && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <Ban className="h-4 w-4" />
                  Cancelar reserva
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSelectedReservation(null)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              La cita con {selectedReservation?.customerName} quedará marcada como cancelada. Podrás seguir viéndola en el
              calendario con ese estado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>No, volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                void handleConfirmCancel();
              }}
            >
              {isCancelling ? "Cancelando…" : "Sí, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
