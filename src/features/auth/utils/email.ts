export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => {
  const normalized = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};
