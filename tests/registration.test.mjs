import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRegistrationForm, registrationPayload, validateRegistration } from '../features/registration.ts';
import { canOpenBusiness, launchDestination } from '../features/account-routing.ts';

const valid = () => ({ ...initialRegistrationForm, businessName: 'Mubarik Bangles', businessCategory: 'Jewellery',
  ownerName: 'Mubarik Ali', mobile: '+91 98765 43210', email: 'mubarik@example.com', country: 'IN',
  state: 'Uttar Pradesh', city: 'Lucknow', postalCode: '226001', password: 'Shop12345', confirmPassword: 'Shop12345',
  termsAccepted: true, privacyAccepted: true });

test('registration requires every backend-required field and both consents', () => {
  const errors = validateRegistration(initialRegistrationForm);
  for (const key of ['businessName', 'businessCategory', 'ownerName', 'mobile', 'email', 'state', 'city', 'password', 'termsAccepted', 'privacyAccepted']) assert.ok(errors[key], key);
});
test('valid ERP-compatible registration passes', () => assert.deepEqual(validateRegistration(valid()), {}));
test('invalid email, phone, country and postal code are rejected', () => {
  const errors = validateRegistration({ ...valid(), email: 'invalid', mobile: '123', country: 'India', postalCode: '12' });
  for (const key of ['email', 'mobile', 'country']) assert.ok(errors[key], key);
  assert.ok(validateRegistration({ ...valid(), postalCode: '12' }).postalCode);
});
test('password uses backend minimum, letter and number policy', () => {
  for (const password of ['short1', '12345678', 'abcdefgh']) assert.ok(validateRegistration({ ...valid(), password, confirmPassword: password }).password);
});
test('password mismatch is blocked', () => assert.ok(validateRegistration({ ...valid(), confirmPassword: 'Other12345' }).confirmPassword));
test('terms and privacy are independently required', () => {
  assert.ok(validateRegistration({ ...valid(), termsAccepted: false }).termsAccepted);
  assert.ok(validateRegistration({ ...valid(), privacyAccepted: false }).privacyAccepted);
});
test('payload maps real ERP field names and excludes confirmation', () => {
  const payload = registrationPayload(valid());
  assert.equal(payload.email, 'mubarik@example.com');
  assert.equal(payload.mobile, '+919876543210');
  assert.equal(payload.country, 'IN');
  assert.equal(payload.termsAccepted, true);
  assert.equal('confirmPassword' in payload, false);
  assert.equal('tenantId' in payload, false);
});
test('pending, rejected and suspended applicants cannot open business routes', () => {
  for (const status of ['PENDING_APPROVAL', 'REJECTED', 'SUSPENDED']) {
    assert.equal(canOpenBusiness(true, status), false);
    assert.equal(launchDestination(true, status), '/registration/status');
  }
});
test('approved applicant requires a separate login before dashboard', () => {
  assert.equal(launchDestination(false, 'APPROVED'), '/registration/status');
  assert.equal(launchDestination(true, 'APPROVED'), '/home');
  assert.equal(canOpenBusiness(false, 'APPROVED'), false);
});
