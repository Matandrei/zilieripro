import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Empty value passes; non-empty must match a simplified RFC 5322 pattern.
 */
export function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').toString().trim();
  if (!v) return null;
  const re = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  return re.test(v) ? null : { email: true };
}

/**
 * Empty value passes. Non-empty must match Moldova format: +373 followed by 8 digits.
 */
export function optionalPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value ?? '').toString().trim();
  if (!v) return null;
  return /^\+373\d{8}$/.test(v) ? null : { phoneFormat: true };
}
