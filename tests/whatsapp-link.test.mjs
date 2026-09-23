import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackOutcome, isSafeOnboardingUrl, systemPathForCallback } from '../services/whatsapp-link.ts';

const base = 'https://erp.muenot.co.in/api/mobile/v1';
const token = 'a'.repeat(43);
test('only the Muenot-hosted HTTPS signup link with opaque fragment is accepted', () => {
  assert.equal(isSafeOnboardingUrl(`https://erp.muenot.co.in/mobile/whatsapp/connect#session=${token}`, base), true);
  for (const url of [
    `http://erp.muenot.co.in/mobile/whatsapp/connect#session=${token}`,
    `https://evil.example/mobile/whatsapp/connect#session=${token}`,
    `https://erp.muenot.co.in/mobile/whatsapp/connect?code=secret#session=${token}`,
    'https://erp.muenot.co.in/mobile/whatsapp/connect#session=short',
  ]) assert.equal(isSafeOnboardingUrl(url, base), false, url);
});
test('deep-link outcomes contain no untrusted query or code', () => {
  assert.equal(callbackOutcome('muenot://whatsapp/connected'), 'connected');
  assert.equal(callbackOutcome('muenot://whatsapp/error'), 'error');
  assert.equal(callbackOutcome('muenot://whatsapp/connected?code=secret'), null);
  assert.equal(callbackOutcome('muenot://other/connected'), null);
  assert.equal(callbackOutcome('https://erp.muenot.co.in/mobile/whatsapp/connect'), null);
  assert.equal(systemPathForCallback('muenot://whatsapp/connected'), '/whatsapp/return?result=connected');
  assert.equal(systemPathForCallback('muenot://whatsapp/error'), '/whatsapp/return?result=error');
  assert.equal(systemPathForCallback('/whatsapp/connected'), '/whatsapp/return?result=connected');
  assert.equal(systemPathForCallback('muenot://whatsapp/connected?code=secret'), 'muenot://whatsapp/connected?code=secret');
});
