import type { RegistrationStatus } from '@/types/api';

export function canOpenBusiness(isAuthenticated: boolean, status: RegistrationStatus | null): boolean {
  return isAuthenticated && (!status || status === 'APPROVED');
}

export function launchDestination(isAuthenticated: boolean, status: RegistrationStatus | null): '/home' | '/registration/status' | '/welcome' {
  if (status && status !== 'APPROVED') return '/registration/status';
  if (isAuthenticated) return '/home';
  return status === 'APPROVED' ? '/registration/status' : '/welcome';
}
