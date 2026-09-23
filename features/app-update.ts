import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { File, FileMode, Paths } from 'expo-file-system';
import { createDownloadResumable, type DownloadResumable } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { create } from 'zustand';
import { appConfig, isProductionBuild } from '@/constants/config';
import { api } from '@/services/api/endpoints';
import { isApiError } from '@/services/api/errors';
import { parseRelease, updatePolicy, type AppRelease, type UpdatePolicy } from './update-policy';

const CACHE_KEY = 'muenot-app-release-v1';
const DISMISSED_KEY = 'muenot-dismissed-release-code';
const FOREGROUND_CHECK_MS = 6 * 60 * 60 * 1000;
const CACHE_POLICY_MS = 60 * 60 * 1000;

export const installedVersionName = Application.nativeApplicationVersion ?? 'Unknown';
export const installedVersionCode = Number(Application.nativeBuildVersion);

interface CachedRelease { release: AppRelease; checkedAt: number }
interface UpdateState {
  isChecking: boolean;
  hasChecked: boolean;
  lastCheckedAt: number;
  release: AppRelease | null;
  policy: UpdatePolicy;
  dismissedCode: number | null;
  phase: 'idle' | 'downloading' | 'verifying' | 'installing';
  progress: number | null;
  error: string | null;
  permissionHelp: boolean;
  check: (force?: boolean) => Promise<void>;
  dismiss: () => Promise<void>;
  install: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  openPermissionSettings: () => Promise<void>;
}

let checkInFlight: Promise<void> | null = null;
let verifiedFile: File | null = null;
let verifiedCode: number | null = null;
let verifiedHash: string | null = null;
let activeDownload: DownloadResumable | null = null;

async function readCached(): Promise<CachedRelease | null> {
  try {
    const raw = await SecureStore.getItemAsync(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as CachedRelease;
    if (!Number.isFinite(value.checkedAt) || value.checkedAt > Date.now() || Date.now() - value.checkedAt > CACHE_POLICY_MS) return null;
    return { checkedAt: value.checkedAt, release: parseRelease(value.release, appConfig.apkAllowedHosts) };
  } catch { return null; }
}

async function downloadVerified(release: AppRelease): Promise<File> {
  const file = new File(Paths.cache, `muenot-shopkeeper-${release.latestVersionCode}.apk`);
  if (file.exists) file.delete();
  if (Paths.availableDiskSpace < release.apkSize * 1.2) throw new Error('Not enough free storage for the update.');
  try {
    let timedOut = false;
    const download = createDownloadResumable(release.apkUrl, file.uri, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) useAppUpdate.setState({ progress: Math.min(100, Math.round(totalBytesWritten / totalBytesExpectedToWrite * 100)) });
    });
    activeDownload = download;
    const timer = setTimeout(() => { timedOut = true; void download.cancelAsync().catch(() => undefined); }, 5 * 60 * 1000);
    let result;
    try { result = await download.downloadAsync(); }
    finally { clearTimeout(timer); activeDownload = null; }
    if (timedOut) throw new Error('Download timed out. Please try again.');
    if (!result) throw new Error('Download cancelled. You can retry.');
    if (result.status < 200 || result.status >= 300) throw new Error('APK download failed. Please try again.');
    if (!file.exists || file.size !== release.apkSize) throw new Error('Downloaded file is incomplete. Please try again.');
    useAppUpdate.setState({ phase: 'verifying' });
    const hash = sha256.create();
    const handle = file.open(FileMode.ReadOnly);
    try {
      let chunks = 0;
      while (true) {
        const chunk = handle.readBytes(256 * 1024);
        if (!chunk.length) break;
        hash.update(chunk);
        if (++chunks % 8 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    } finally { handle.close(); }
    if (bytesToHex(hash.digest()) !== release.apkSha256) throw new Error('Update file verification failed. Please try again.');
    return file;
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
}

export const useAppUpdate = create<UpdateState>()((set, get) => ({
  isChecking: false, hasChecked: false, lastCheckedAt: 0, release: null, policy: 'none',
  dismissedCode: null, phase: 'idle', progress: null, error: null, permissionHelp: false,

  check: async (force = false) => {
    if (Platform.OS !== 'android' || !isProductionBuild || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      set({ hasChecked: true }); return;
    }
    if (checkInFlight) return checkInFlight;
    if (!force && get().hasChecked && Date.now() - get().lastCheckedAt
      < (get().error ? 5 * 60 * 1000 : FOREGROUND_CHECK_MS)) return;
    checkInFlight = (async () => {
      set({ isChecking: true, error: null });
      try {
        if (!Number.isSafeInteger(installedVersionCode) || installedVersionCode < 1) {
          throw new Error('Installed Android version code is unavailable.');
        }
        const [dismissedRaw, cached] = await Promise.all([SecureStore.getItemAsync(DISMISSED_KEY).catch(() => null), readCached()]);
        const dismissedCode = dismissedRaw ? Number(dismissedRaw) : null;
        try {
          const release = parseRelease(await api.appVersion.get(), appConfig.apkAllowedHosts);
          const policy = updatePolicy(installedVersionCode, release);
          try { await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify({ release, checkedAt: Date.now() })); }
          catch { /* A full local key store must not hide a valid server update. */ }
          set({ release, policy, dismissedCode, lastCheckedAt: Date.now() });
          if (verifiedCode !== release.latestVersionCode || verifiedHash !== release.apkSha256) verifiedFile = null;
        } catch (error) {
          if (isApiError(error) && error.kind === 'notFound' && error.code === 'release_unavailable') {
            try { await SecureStore.deleteItemAsync(CACHE_KEY); } catch { /* no cached policy remains in memory */ }
            set({ release: null, policy: 'none', dismissedCode, lastCheckedAt: Date.now() });
          } else if (cached) {
            set({ release: cached.release, policy: updatePolicy(installedVersionCode, cached.release),
              dismissedCode, lastCheckedAt: Date.now(), error: 'Could not reach the update service. Showing recent release information.' });
          } else {
            set({ release: null, policy: 'none', dismissedCode, lastCheckedAt: Date.now(),
              error: error instanceof Error ? error.message : 'Could not check for updates.' });
          }
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Could not check for updates.', lastCheckedAt: Date.now() });
      } finally { set({ isChecking: false, hasChecked: true }); }
    })().finally(() => { checkInFlight = null; });
    return checkInFlight;
  },

  dismiss: async () => {
    const code = get().release?.latestVersionCode;
    if (get().policy !== 'optional' || !code) return;
    set({ dismissedCode: code });
    try { await SecureStore.setItemAsync(DISMISSED_KEY, String(code)); } catch { /* session dismissal still works */ }
  },

  install: async () => {
    const release = get().release;
    if (!release || get().policy === 'none' || get().phase !== 'idle' || Platform.OS !== 'android') return;
    set({ phase: 'downloading', progress: null, error: null, permissionHelp: false });
    try {
      // A re-opened installer reuses only a file already SHA-256 verified in this process.
      if (!verifiedFile || verifiedCode !== release.latestVersionCode || verifiedHash !== release.apkSha256
        || !verifiedFile.exists || verifiedFile.size !== release.apkSize) {
        verifiedFile = await downloadVerified(release);
        verifiedCode = release.latestVersionCode;
        verifiedHash = release.apkSha256;
      }
      set({ phase: 'installing' });
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: verifiedFile.contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION for expo-file-system's FileProvider.
      });
      // Returning from Android does not prove the APK was installed.
      set({ phase: 'idle' });
    } catch (error) {
      set({ phase: 'idle', permissionHelp: get().phase === 'installing',
        error: error instanceof Error ? error.message : 'Unable to open Android installer. Please try again.' });
    }
  },

  cancelDownload: async () => {
    if (activeDownload) {
      try { await activeDownload.cancelAsync(); } catch { /* downloadAsync will surface failure */ }
    }
  },

  openPermissionSettings: async () => {
    try {
      await IntentLauncher.startActivityAsync('android.settings.MANAGE_UNKNOWN_APP_SOURCES', {
        data: `package:${Application.applicationId ?? 'com.muenot.shopkeeper'}`,
      });
      set({ permissionHelp: false, error: null });
    } catch {
      set({ error: 'Open Android Settings and allow Muenot Shopkeeper to install unknown apps, then retry.' });
    }
  },
}));
