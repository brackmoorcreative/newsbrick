// Dates are passed around as "YYYY-MM-DD" strings, in the phone's local time.

export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`); // noon avoids daylight-saving edge cases
}

export function formatDate(key: string, withYear = false): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}
