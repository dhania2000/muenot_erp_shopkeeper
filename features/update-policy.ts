export interface AppRelease {
  platform: 'android';
  latestVersion: string;
  latestVersionCode: number;
  minimumVersionCode: number;
  forceUpdate: boolean;
  apkUrl: string;
  apkSize: number;
  apkSha256: string;
  releaseNotes: string[];
  publishedAt: string;
}

export type UpdatePolicy = 'none' | 'optional' | 'mandatory';

export function updatePolicy(installedCode: number, release: AppRelease): UpdatePolicy {
  if (installedCode >= release.latestVersionCode) return 'none';
  if (installedCode < release.minimumVersionCode || release.forceUpdate) return 'mandatory';
  return 'optional';
}

export function parseRelease(value: unknown, allowedHosts: string[]): AppRelease {
  if (!value || typeof value !== 'object') throw new Error('Invalid update response.');
  const item = value as Record<string, unknown>;
  const integer = (x: unknown) => typeof x === 'number' && Number.isSafeInteger(x) && x > 0;
  if (item.platform !== 'android' || typeof item.latestVersion !== 'string' || !item.latestVersion.trim()
    || !integer(item.latestVersionCode) || !integer(item.minimumVersionCode)
    || (item.minimumVersionCode as number) > (item.latestVersionCode as number)
    || typeof item.forceUpdate !== 'boolean' || !integer(item.apkSize)
    || typeof item.apkSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(item.apkSha256)
    || !Array.isArray(item.releaseNotes) || !item.releaseNotes.every((n) => typeof n === 'string')
    || typeof item.publishedAt !== 'string' || !Number.isFinite(Date.parse(item.publishedAt))) {
    throw new Error('Invalid update response.');
  }
  if (typeof item.apkUrl !== 'string') throw new Error('Invalid APK URL.');
  let url: URL;
  try { url = new URL(item.apkUrl); } catch { throw new Error('Invalid APK URL.'); }
  if (url.protocol !== 'https:' || !!url.username || !!url.password || !!url.hash || !!url.search
    || !allowedHosts.includes(url.hostname.toLowerCase()) || !url.pathname.toLowerCase().endsWith('.apk')) {
    throw new Error('Untrusted APK URL.');
  }
  return { platform: 'android', latestVersion: item.latestVersion.trim(),
    latestVersionCode: item.latestVersionCode as number, minimumVersionCode: item.minimumVersionCode as number,
    forceUpdate: item.forceUpdate, apkUrl: url.toString(), apkSize: item.apkSize as number,
    apkSha256: item.apkSha256.toLowerCase(), releaseNotes: item.releaseNotes as string[], publishedAt: item.publishedAt };
}
