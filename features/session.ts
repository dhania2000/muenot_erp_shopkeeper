import { Platform } from 'react-native';
import { create } from 'zustand';
import { api } from '@/services/api/endpoints';
import { adoptTokens, clearSession, forceRefresh, loadSession, onSessionExpired, peekSession } from '@/services/api/client';
import { ApiError, isApiError } from '@/services/api/errors';
import { clearLocalNotificationState, resetAfterLogout, revokeCurrentDevice } from '@/services/notifications';
import { clearRegistrationReceipt, loadRegistrationReceipt, saveRegistrationReceipt } from '@/services/api/session-store';
import type { ApiTenant, ApiUser, FeatureResolution } from '@/types/api';
import type { RegistrationStatusResponse, ShopkeeperRegistrationRequest } from '@/types/api';

/**
 * The one source of session truth. Nothing else reads tokens, and no screen
 * ever supplies a tenant id — the backend derives the tenant from the bearer
 * token and ignores anything a client sends.
 */

/** The Shopkeeper modules the backend gates, as `shopkeeper.<key>` flags. */
export const SHOPKEEPER_FEATURES = [
  'mobile_app',
  'whatsapp',
  'inbox',
  'contacts',
  'templates',
  'campaigns',
  'automations',
  'products',
  'orders',
  'team',
  'notifications',
  'subscription',
  'settings',
] as const;
export type ShopkeeperFeature = (typeof SHOPKEEPER_FEATURES)[number];

export interface SessionState {
  user: ApiUser | null;
  tenant: ApiTenant | null;
  /** ERP feature catalogue resolved for this tenant, from /me. */
  entitlements: FeatureResolution[];
  /**
   * `shopkeeper.*` flags from /subscription. Null means "not yet known" —
   * /subscription is itself gated, so a tenant can be entitled to a module
   * while being unable to read the entitlement list.
   */
  featureFlags: string[] | null;
  /** Modules the backend has actually answered 403/not_entitled for. */
  deniedFeatures: ShopkeeperFeature[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** Set when a login attempt fails, cleared on the next attempt. */
  loginError: ApiError | null;
  isLoggingIn: boolean;
  registrationStatus: RegistrationStatusResponse | null;
  registrationError: ApiError | null;
  isCheckingRegistration: boolean;
  isRegistering: boolean;

  initialize: () => Promise<void>;
  register: (input: ShopkeeperRegistrationRequest) => Promise<boolean>;
  refreshRegistrationStatus: () => Promise<void>;
  clearRegistration: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  reloadIdentity: () => Promise<void>;
  noteFeatureDenied: (feature: ShopkeeperFeature) => void;
}

const deviceName = `${Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : 'Device'} · Muenot Shopkeeper`;

/** Role names the backend treats as tenant administrators. */
const ADMIN_ROLES = ['tenant_owner', 'tenant_admin'];

export const useSession = create<SessionState>()((set, get) => ({
  user: null,
  tenant: null,
  entitlements: [],
  featureFlags: null,
  deniedFeatures: [],
  isAuthenticated: false,
  isInitializing: true,
  loginError: null,
  isLoggingIn: false,
  registrationStatus: null,
  registrationError: null,
  isCheckingRegistration: false,
  isRegistering: false,

  register: async (input) => {
    if (get().isRegistering) return false;
    set({ isRegistering: true, registrationError: null });
    try {
      const result = await api.auth.register(input);
      const initialStatus: RegistrationStatusResponse = { status: result.status, businessName: input.businessName,
        ownerName: input.ownerName, submittedAt: new Date().toISOString(), rejectionReason: null };
      await saveRegistrationReceipt({ token: result.registrationToken, email: input.email, lastStatus: initialStatus });
      // The 201 response itself is server-authoritative pending state. Fetch
      // customer-facing details separately; a network hiccup must not lose it.
      set({ registrationStatus: initialStatus });
      await get().refreshRegistrationStatus();
      return true;
    } catch (error) {
      set({ registrationError: isApiError(error)
        ? error.kind === 'offline' ? new ApiError({ kind: 'offline', status: 0, message: 'Internet connection required to create your account.' }) : error
        : new ApiError({ kind: 'unknown', status: 0, message: 'Could not create account.' }) });
      return false;
    } finally { set({ isRegistering: false }); }
  },

  refreshRegistrationStatus: async () => {
    if (get().isCheckingRegistration) return;
    const receipt = await loadRegistrationReceipt();
    if (!receipt) return;
    set({ isCheckingRegistration: true, registrationError: null });
    try {
      const status = await api.auth.registrationStatus(receipt.token);
      await saveRegistrationReceipt({ ...receipt, lastStatus: status });
      set({ registrationStatus: status });
      const storedSession = status.status === 'APPROVED' ? null : (peekSession() ?? await loadSession());
      if (storedSession) {
        await clearSession();
        await clearLocalNotificationState();
        set({ isAuthenticated: false, user: null, tenant: null, entitlements: [], featureFlags: null });
      }
    } catch (error) {
      if (isApiError(error) && (error.kind === 'unauthorized' || error.kind === 'notFound')) {
        await clearRegistrationReceipt();
        set({ registrationStatus: null });
      }
      set({ registrationError: isApiError(error) ? error : new ApiError({ kind: 'unknown', status: 0, message: 'Could not refresh account status.' }) });
    } finally { set({ isCheckingRegistration: false }); }
  },

  clearRegistration: async () => {
    await clearRegistrationReceipt();
    set({ registrationStatus: null, registrationError: null });
  },

  /**
   * Launch path: restore the stored session, validate it against /me
   * (refreshing the access token first if it has aged out), then load the
   * entitlement flags. Any terminal auth failure clears the session so the
   * router lands on Login.
   */
  initialize: async () => {
    set({ isInitializing: true });
    try {
      const receipt = await loadRegistrationReceipt();
      if (receipt) {
        set({ registrationStatus: receipt.lastStatus });
        await get().refreshRegistrationStatus();
        const status = get().registrationStatus?.status;
        if (status && status !== 'APPROVED') return;
        // Do not expose a protected screen if a receipt exists but the
        // authoritative status could not be checked (for example, offline).
        if (!status && get().registrationError) return;
      }
      const stored = await loadSession();
      if (!stored) {
        set({ isAuthenticated: false, isInitializing: false });
        return;
      }
      await get().reloadIdentity();
    } catch (error) {
      if (isApiError(error) && error.kind === 'unauthorized') {
        await clearSession();
        await clearLocalNotificationState();
        set({ user: null, tenant: null, entitlements: [], featureFlags: null, isAuthenticated: false });
      }
      // A network failure does not erase saved credentials. Keep business
      // screens closed until the server can validate this session again.
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true, loginError: null });
    try {
      const result = await api.auth.login({
        email: email.trim(),
        password,
        deviceName,
        platform: Platform.OS,
      });
      await adoptTokens(result);
      const receipt = await loadRegistrationReceipt();
      if (receipt) {
        // An approved owner's receipt remains available for future suspension
        // checks. A different account must never inherit that applicant state.
        if (receipt.email && receipt.email !== email.trim().toLowerCase()) await get().clearRegistration();
        else {
          try {
            const status = await api.auth.registrationStatus(receipt.token);
            await saveRegistrationReceipt({ ...receipt, lastStatus: status });
            set({ registrationStatus: status });
            if (status.status !== 'APPROVED') {
              await clearSession();
              set({ loginError: null, isAuthenticated: false });
              return false;
            }
          } catch (error) {
            if (isApiError(error) && (error.kind === 'unauthorized' || error.kind === 'notFound')) await get().clearRegistration();
          }
        }
      }
      // /me validates the new bearer session before the notification
      // coordinator treats this account as authenticated.
      await get().reloadIdentity();
      return true;
    } catch (error) {
      const apiError = isApiError(error)
        ? error
        : new ApiError({ kind: 'unknown', status: 0, message: 'Login failed. Try again.' });
      if (peekSession()) await clearSession();
      set({ loginError: apiError, isAuthenticated: false, user: null, tenant: null, entitlements: [], featureFlags: null });
      if (get().registrationStatus) await get().refreshRegistrationStatus();
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    // The device DELETE is scoped by this bearer session; perform it before
    // revoking that session. A failed network call never blocks local logout.
    try {
      await revokeCurrentDevice();
      if (peekSession()) await api.auth.logout();
    } catch {
      /* offline or already revoked */
    }
    await clearSession();
    await get().clearRegistration();
    resetAfterLogout();
    set({
      user: null,
      tenant: null,
      entitlements: [],
      featureFlags: null,
      deniedFeatures: [],
      isAuthenticated: false,
      loginError: null,
    });
  },

  refreshSession: async () => {
    const renewed = await forceRefresh();
    if (!renewed) {
      set({ isAuthenticated: false, user: null, tenant: null, entitlements: [], featureFlags: null });
      return false;
    }
    return true;
  },

  reloadIdentity: async () => {
    const me = await api.auth.me();
    set({
      user: me.user,
      tenant: me.tenant,
      entitlements: me.entitlements ?? [],
      isAuthenticated: true,
    });

    // The shopkeeper.* gates live on the plan, which is exposed through
    // /subscription. That endpoint is itself gated, so a 403 here means
    // "cannot read the list", not "no features" — flags stay null and the UI
    // falls back to letting the backend refuse individual calls.
    try {
      const subscription = await api.subscription.get();
      set({ featureFlags: subscription.entitlements?.feature_flags ?? [] });
    } catch (error) {
      if (isApiError(error) && error.isNotEntitled) {
        set({ featureFlags: null, deniedFeatures: addDenied(get().deniedFeatures, 'subscription') });
      } else {
        set({ featureFlags: null });
      }
    }
  },

  noteFeatureDenied: (feature) => set((state) => ({ deniedFeatures: addDenied(state.deniedFeatures, feature) })),
}));

function addDenied(current: ShopkeeperFeature[], feature: ShopkeeperFeature): ShopkeeperFeature[] {
  return current.includes(feature) ? current : [...current, feature];
}

/* ---------------------------------------------------------- selectors --- */

/**
 * Whether to show a module's navigation entry.
 *
 * Optimistic by design: hidden only when the plan flags say so, or when the
 * backend has already refused the module. Frontend hiding is UX; the backend
 * remains the authority and still returns 403 either way.
 */
export function isEntitled(state: SessionState, feature: ShopkeeperFeature): boolean {
  if (state.deniedFeatures.includes(feature)) return false;
  if (state.featureFlags === null) return true;
  if (!state.featureFlags.includes('shopkeeper.mobile_app')) return false;
  return state.featureFlags.includes(`shopkeeper.${feature}`);
}

export const useEntitled = (feature: ShopkeeperFeature) => useSession((state) => isEntitled(state, feature));

/** Tenant owner/admin, matching the check `PATCH /tenant` performs server-side. */
export function isTenantAdmin(state: SessionState): boolean {
  const role = state.user?.tenantRole;
  return state.user?.role === 'admin' || (!!role && ADMIN_ROLES.includes(role));
}

export const useIsTenantAdmin = () => useSession(isTenantAdmin);

/**
 * Wires the client's terminal-session signal into the store. Called once from
 * the root layout so an expired refresh token routes straight to Login.
 */
export function bindSessionExpiry() {
  return onSessionExpired(() => {
    void clearLocalNotificationState();
    useSession.setState({
      user: null,
      tenant: null,
      entitlements: [],
      featureFlags: null,
      isAuthenticated: false,
    });
  });
}
