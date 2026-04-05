export const normalizeUserId = (value: string): string => value.trim().toLowerCase();

export const isValidUserId = (value: string): boolean => {
  const normalized = normalizeUserId(value);

  if (normalized.length < 3 || normalized.length > 24) {
    return false;
  }

  return /^[a-z0-9_]+$/.test(normalized);
};
