import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiErrorFromResponse, errorMessage, isApiError, offlineError, timeoutError } from '../services/api/errors.ts';

/**
 * These cover the mapping every screen's error handling depends on: an HTTP
 * status and the backend's `{ error, code, fields }` envelope becoming one
 * normalised ApiError.
 */

test('HTTP statuses map to the kinds the UI branches on', () => {
  const cases = [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [423, 'conflict'],
    [400, 'validation'],
    [422, 'validation'],
    [429, 'rateLimited'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ];
  for (const [status, kind] of cases) {
    assert.equal(apiErrorFromResponse(status, { error: 'x' }, null).kind, kind, `status ${status}`);
  }
});

test("the backend's own message is preferred over the fallback", () => {
  const error = apiErrorFromResponse(401, { error: 'Invalid email or password.', code: 'bad_creds' }, null);
  assert.equal(error.message, 'Invalid email or password.');
  assert.equal(error.code, 'bad_creds');
});

test('a response with no usable body still yields a readable message', () => {
  const error = apiErrorFromResponse(500, null, null);
  assert.ok(error.message.length > 0);
  assert.equal(error.kind, 'server');
});

test('422 field errors survive onto the error object', () => {
  const error = apiErrorFromResponse(422, { error: 'Invalid', fields: { phone: 'Already in use.' } }, null);
  assert.equal(error.kind, 'validation');
  assert.deepEqual(error.fields, { phone: 'Already in use.' });
});

test('Retry-After is parsed, and ignored when not a positive number', () => {
  assert.equal(apiErrorFromResponse(429, { error: 'Too many' }, '30').retryAfterSeconds, 30);
  assert.equal(apiErrorFromResponse(429, { error: 'Too many' }, 'soon').retryAfterSeconds, undefined);
  assert.equal(apiErrorFromResponse(429, { error: 'Too many' }, null).retryAfterSeconds, undefined);
});

test('a plan refusal is distinguishable from an ordinary 403', () => {
  assert.equal(apiErrorFromResponse(403, { error: 'No plan', code: 'not_entitled' }, null).isNotEntitled, true);
  assert.equal(apiErrorFromResponse(403, { error: 'No permission' }, null).isNotEntitled, false);
});

test('only transient failures are marked retryable', () => {
  assert.equal(offlineError().isRetryable, true);
  assert.equal(timeoutError().isRetryable, true);
  assert.equal(apiErrorFromResponse(500, {}, null).isRetryable, true);
  assert.equal(apiErrorFromResponse(429, {}, null).isRetryable, true);
  // Replaying these cannot change the answer.
  assert.equal(apiErrorFromResponse(422, {}, null).isRetryable, false);
  assert.equal(apiErrorFromResponse(403, {}, null).isRetryable, false);
  assert.equal(apiErrorFromResponse(404, {}, null).isRetryable, false);
});

test('isApiError and errorMessage handle non-API throwables', () => {
  assert.equal(isApiError(new ApiError({ kind: 'unknown', status: 0, message: 'x' })), true);
  assert.equal(isApiError(new Error('plain')), false);
  assert.equal(errorMessage(new Error('plain')), 'plain');
  assert.ok(errorMessage('not an error').length > 0);
});
