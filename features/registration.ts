import type { ShopkeeperRegistrationRequest } from '@/types/api';

export type RegistrationForm = Omit<ShopkeeperRegistrationRequest, 'termsAccepted' | 'privacyAccepted'> & {
  confirmPassword: string; termsAccepted: boolean; privacyAccepted: boolean;
};

export const initialRegistrationForm: RegistrationForm = {
  businessName: '', businessCategory: '', ownerName: '', mobile: '', email: '',
  country: 'IN', state: '', city: '', postalCode: '', password: '', confirmPassword: '',
  termsAccepted: false, privacyAccepted: false,
};

/** Mirrors the current ERP public-registration policy for immediate UX. */
export function validateRegistration(form: RegistrationForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.businessName.trim().length < 2 || form.businessName.trim().length > 150) errors.businessName = 'Enter a business name (2–150 characters).';
  if (!form.businessCategory.trim() || form.businessCategory.trim().length > 120) errors.businessCategory = 'Choose a business category.';
  if (form.ownerName.trim().length < 2 || form.ownerName.trim().length > 150) errors.ownerName = 'Enter the owner’s full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.length > 190) errors.email = 'Enter a valid email address.';
  const mobile = form.mobile.replace(/[\s()\-.]/g, '');
  if (!/^\+?[0-9]{7,20}$/.test(mobile)) errors.mobile = 'Enter a valid mobile number with country code.';
  if (!/^[A-Za-z]{2}$/.test(form.country.trim())) errors.country = 'Enter a two-letter country code.';
  if (form.country.trim().toUpperCase() === 'IN' && !form.state.trim()) errors.state = 'State is required.';
  if (form.state.length > 120) errors.state = 'State name is too long.';
  if (form.city.trim().length < 2 || form.city.length > 120) errors.city = 'Enter a valid city.';
  if (form.postalCode.length > 20 || (form.country.trim().toUpperCase() === 'IN' && form.postalCode && !/^[0-9]{6}$/.test(form.postalCode))) errors.postalCode = 'Enter a valid postal code.';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Za-z]/.test(form.password)) errors.password = 'Password must include at least one letter.';
  else if (!/[0-9]/.test(form.password)) errors.password = 'Password must include at least one number.';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  if (!form.termsAccepted) errors.termsAccepted = 'Accept the Terms & Conditions.';
  if (!form.privacyAccepted) errors.privacyAccepted = 'Accept the Privacy Policy.';
  return errors;
}

export function registrationPayload(form: RegistrationForm): ShopkeeperRegistrationRequest {
  return {
    businessName: form.businessName.trim(), businessCategory: form.businessCategory.trim(), ownerName: form.ownerName.trim(),
    mobile: form.mobile.replace(/[\s()\-.]/g, ''), email: form.email.trim().toLowerCase(),
    country: form.country.trim().toUpperCase(), state: form.state.trim(), city: form.city.trim(),
    postalCode: form.postalCode.trim(), password: form.password, termsAccepted: true, privacyAccepted: true,
  };
}
