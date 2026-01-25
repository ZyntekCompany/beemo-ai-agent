export function formatMessageTime(
  timestamp: number | undefined | null,
  locale: string = 'es'
): string | null {
  if (!timestamp) return null;
  
  const timestampInt = Math.floor(timestamp);
  
  return new Date(timestampInt).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
