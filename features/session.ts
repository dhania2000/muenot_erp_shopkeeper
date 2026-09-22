import { Platform } from 'react-native';
import { create } from 'zustand';
import { api } from '@/services/api/endpoints';
import { adoptTokens, clearSession, forceRefresh, loadSession, onSessionExpired, peekSession } from '@/services/api/client';
import { ApiError, isApiError } from '@/services/api/errors';
import type { ApiTenant, ApiUser, FeatureResolution } from '@/types/api';

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

  initialize: () => Promise<void>;
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

  /**
   * Launch path: restore the stored session, validate it against /me
   * (refreshing the access token first if it has aged out), then load the
   * entitlement flags. Any terminal auth failure clears the session so the
   * router lands on Login.
   */
  initialize: async () => {
    set({ isInitializing: true });
    try {
      const stored = await loadSession();
      if (!stored) {
        set({ isAuthenticated: false, isInitializing: false });
        return;
      }
      await get().reloadIdentity();
    } catch (error) {
      if (isApiError(error) && error.kind === 'unauthorized') {
        await clearSession();
        set({ user: null, tenant: null, entitlements: [], featureFlags: null, isAuthenticated: false });
      }
      // A network failure at launch must not wipe a valid session; the user
      // stays signed in and individual screens show their own offline state.
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
      set({ user: result.user, tenant: result.tenant, isAuthenticated: true });
      // Identity and entitlements are loaded after the tokens land so the
      // first authenticated screen already has them.
      await get().reloadIdentity();
      return true;
    } catch (error) {
      const apiError = isApiError(error)
        ? error
        : new ApiError({ kind: 'unknown', status: 0, message: 'Login failed. Try again.' });
      set({ loginError: apiError, isAuthenticated: false });
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    // Revoke server-side first, but never let a failure strand the user in a
    // session they asked to leave.
    try {
      if (peekSession()) await api.auth.logout();
    } catch {
      /* offline or already revoked */
    }
    await clearSession();
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
    useSession.setState({
      user: null,
      tenant: null,
      entitlements: [],
      featureFlags: null,
      isAuthenticated: false,
    });
  });
}
