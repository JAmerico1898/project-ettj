/**
 * Date utilities for Brazilian format handling and business day calculations
 */

/**
 * Format a Date object to Brazilian format DD/MM/YYYY
 */
export function formatDateBR(date: Date | null): string {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object to ISO format YYYY-MM-DD for API calls
 */
export function formatDateISO(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a Brazilian format date string (DD/MM/YYYY) to Date object
 * Returns null if parsing fails
 */
export function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Handle both formats: DD/MM/YYYY and DD-MM-YYYY
  const cleanedStr = dateStr.trim().replace(/-/g, '/');
  const parts = cleanedStr.split('/');

  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);

  // Validate ranges
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 0 || month > 11) return null;
  if (year < 1900 || year > 2100) return null;

  // Create date at noon to avoid timezone issues
  const date = new Date(year, month, day, 12, 0, 0);

  // Verify the date is valid (e.g., Feb 30 would become Mar 2)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a business day (Monday-Friday)
 * Note: This does not account for Brazilian holidays
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Get the previous business day from a given date
 * If the given date is a Monday, returns the previous Friday
 */
export function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);

  // If weekend, move to Friday
  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }

  return result;
}

/**
 * Get today's date (at noon to avoid timezone issues)
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

/**
 * Get yesterday's date
 */
export function getYesterday(): Date {
  const today = getToday();
  today.setDate(today.getDate() - 1);
  return today;
}

/**
 * Get a date one week ago from today
 */
export function getLastWeek(): Date {
  const today = getToday();
  today.setDate(today.getDate() - 7);
  return today;
}

/**
 * Get today if it's a business day, otherwise get the previous business day
 * Useful for default date selection
 */
export function getTodayOrLastBusinessDay(): Date {
  const today = getToday();

  if (isBusinessDay(today)) {
    return today;
  }

  return getPreviousBusinessDay(today);
}

/**
 * Get the last business day on or before the given date
 */
export function getLastBusinessDayOnOrBefore(date: Date): Date {
  const result = new Date(date);

  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }

  return result;
}

/**
 * Validation error messages in Portuguese
 */
export interface DateValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate a date for DI1 data fetching
 * Rules:
 * - Cannot be in the future
 * - Cannot be more than 10 years in the past
 * - Cannot be a weekend
 * Returns error message in Portuguese or null if valid
 */
export function validateDateRange(date: Date | null): DateValidationResult {
  if (!date) {
    return { isValid: true, error: null }; // null is allowed (uses server default)
  }

  const today = getToday();
  const tenYearsAgo = new Date(today);
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  // Cannot be in the future
  if (date > today) {
    return {
      isValid: false,
      error: 'A data não pode estar no futuro.',
    };
  }

  // Cannot be more than 10 years in the past
  if (date < tenYearsAgo) {
    return {
      isValid: false,
      error: 'A data não pode ter mais de 10 anos.',
    };
  }

  // Cannot be a weekend
  if (isWeekend(date)) {
    const dayName = date.getDay() === 0 ? 'domingo' : 'sábado';
    return {
      isValid: false,
      error: `A data selecionada é ${dayName}. Por favor, selecione um dia útil.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get the day name in Portuguese
 */
export function getDayNamePT(date: Date): string {
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return days[date.getDay()];
}

/**
 * Get the month name in Portuguese
 */
export function getMonthNamePT(date: Date): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[date.getMonth()];
}

/**
 * Format a date as a friendly string in Portuguese
 * e.g., "Segunda-feira, 15 de Janeiro de 2024"
 */
export function formatDateLongPT(date: Date): string {
  const dayName = getDayNamePT(date);
  const day = date.getDate();
  const monthName = getMonthNamePT(date);
  const year = date.getFullYear();
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}
