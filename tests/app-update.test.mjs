import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { parseRelease, updatePolicy } from '../features/update-policy.ts';

const release = (overrides = {}) => ({
  platform: 'android', latestVersion: '1.0.1', latestVersionCode: 2,
  minimumVersionCode: 1, forceUpdate: false,
  apkUrl: 'https://downloads.muenot.co.in/muenot-shopkeeper-1.0.1.apk',
  apkSize: 123, apkSha256: 'a'.repeat(64), releaseNotes: ['Improved inbox'],
  publishedAt: '2026-09-23T10:00:00.000Z', ...overrides,
});
const hosts = ['downloads.muenot.co.in'];

test('current or newer installed version never prompts, including force flag', () => {
  assert.equal(updatePolicy(2, release({ forceUpdate: true })), 'none');
  assert.equal(updatePolicy(3, release({ forceUpdate: true })), 'none');
});
test('optional, minimum-version and force-update policies follow ERP order', () => {
  assert.equal(updatePolicy(1, release()), 'optional');
  assert.equal(updatePolicy(1, release({ latestVersionCode: 3, minimumVersionCode: 2 })), 'mandatory');
  assert.equal(updatePolicy(1, release({ forceUpdate: true })), 'mandatory');
});
test('versionName cannot control update ordering', () => {
  assert.equal(updatePolicy(3, release({ latestVersion: '99.0.0' })), 'none');
});
test('only complete Android release metadata and approved HTTPS APK hosts pass', () => {
  assert.equal(parseRelease(release(), hosts).apkSha256, 'a'.repeat(64));
  for (const apkUrl of ['http://downloads.muenot.co.in/a.apk', 'javascript:alert(1)',
    'https://evil.example/a.apk', 'https://downloads.muenot.co.in/a.apk?token=secret',
    'https://downloads.muenot.co.in/a.zip']) {
    assert.throws(() => parseRelease(release({ apkUrl }), hosts));
  }
  assert.throws(() => parseRelease(release({ apkSha256: 'bad' }), hosts));
  assert.throws(() => parseRelease(release({ latestVersionCode: 1, minimumVersionCode: 2 }), hosts));
});
test('chunked SHA-256 changes when APK bytes are corrupted', () => {
  const hash = sha256.create();
  hash.update(new Uint8Array([0x50, 0x4b]));
  hash.update(new Uint8Array([0x03, 0x04, 0x01]));
  const expected = bytesToHex(hash.digest());
  assert.equal(expected, bytesToHex(sha256(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01]))));
  assert.notEqual(expected, bytesToHex(sha256(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x02]))));
});
