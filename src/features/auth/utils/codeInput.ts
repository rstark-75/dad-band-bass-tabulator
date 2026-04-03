export const sanitizeCode = (value: string): string =>
  value.replace(/\D+/g, '').slice(0, 6);
