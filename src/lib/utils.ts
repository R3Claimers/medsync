import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateDMY(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  let date: Date;
  if (typeof dateInput === 'string') {
    // Try to parse as ISO or YYYY-MM-DD
    date = new Date(dateInput);
    if (isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Fallback for YYYY-MM-DD without time
      const [y, m, d] = dateInput.split('-');
      return `${d}-${m}-${y}`;
    }
  } else {
    date = dateInput;
  }
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
