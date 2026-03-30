import { cn } from "@workspace/ui/lib/utils";

const SRC = "/icons/google-calendar.svg";

/** Ícono de marca Google Calendar (apps/web/public/icons/google-calendar.svg). */
export function GoogleCalendarBrandIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <img
      src={SRC}
      alt=""
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
