/**
 * Live API contract check.
 *
 * Logs into the real Muenot ERP mobile API and verifies that every response
 * carries the fields the app's mappers read. This catches field-mapping drift
 * without an Android device, an emulator or a native build.
 *
 * Usage:
 *   node scripts/verify-api.mjs --email you@shop.com --password 'secret'
 *   MUENOT_EMAIL=... MUENOT_PASSWORD=... node scripts/verify-api.mjs
 *
 * Read-only by default. Pass --write to also exercise create/update/archive
 * against the tenant (it cleans up the product it creates, but a created
 * CONTACT can only be archived, never deleted — do not use --write against a
 * production tenant you care about).
 *
 * No token is ever printed.
 */

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://erp.muenot.co.in/api/mobile/v1';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};
const EMAIL = arg('email') ?? process.env.MUENOT_EMAIL;
const PASSWORD = arg('password') ?? process.env.MUENOT_PASSWORD;
const WRITE = argv.includes('--write');

if (!EMAIL || !PASSWORD) {
  console.error('Missing credentials.\n  node scripts/verify-api.mjs --email you@shop.com --password \'secret\'');
  process.exit(2);
}

/* ------------------------------------------------------------ reporting -- */

let pass = 0;
let fail = 0;
const failures = [];

const g = (t) => `\x1b[32m${t}\x1b[0m`;
const r = (t) => `\x1b[31m${t}\x1b[0m`;
const d = (t) => `\x1b[90m${t}\x1b[0m`;

function check(label, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ${g('PASS')} ${label}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  ${r('FAIL')} ${label}${detail ? d(`  (${detail})`) : ''}`);
  }
}

/** Every key the app reads must be present — `null` is fine, missing is not. */
function hasKeys(label, object, keys) {
  if (object == null || typeof object !== 'object') {
    check(label, false, 'not an object');
    return;
  }
  const missing = keys.filter((k) => !(k in object));
  check(label, missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : '');
}

function section(title) {
  console.log(`\n${title}`);
}

/* -------------------------------------------------------------- client -- */

let accessToken = null;
let refreshToken = null;

async function call(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let response;
  let text;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    text = await response.text();
  } finally {
    clearTimeout(timer);
  }
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { error: text.slice(0, 200) };
  }
  return raw ? { status: response.status, body: parsed, headers: response.headers } : parsed;
}

/* ---------------------------------------------------------------- main -- */

async function main() {

  console.log(`\nMuenot mobile API contract check`);
  console.log(d(`  ${BASE}`));
  console.log(d(`  ${WRITE ? 'read + WRITE' : 'read-only'}\n`));

  /* ---- auth ---- */

  section('auth');
  const login = await call('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: EMAIL, password: PASSWORD, deviceName: 'contract-check', platform: 'node' },
  });

  if (!login?.accessToken) {
    console.log(`  ${r('FAIL')} POST /auth/login  ${d(login?.error ?? 'no accessToken in response')}`);
    console.log(`\n${r('Cannot continue without a session.')}\n`);
    return 1;
  }
  accessToken = login.accessToken;
  refreshToken = login.refreshToken;

  check('POST /auth/login returns a session', true);
  hasKeys('  login payload shape', login, ['accessToken', 'refreshToken', 'expiresIn', 'sessionId', 'refreshExpiresAt', 'user', 'tenant']);
  hasKeys('  login user', login.user, ['id', 'name', 'email', 'role']);
  hasKeys('  login tenant', login.tenant, ['id', 'name', 'slug', 'tenantType']);
  check('  access token lifetime is a number of seconds', Number.isFinite(login.expiresIn), `got ${login.expiresIn}`);
  check('  refreshExpiresAt parses as a date', !Number.isNaN(Date.parse(login.refreshExpiresAt)), login.refreshExpiresAt);

  const isShopTenant = login.tenant?.tenantType === 'SHOPKEEPER';
  if (!isShopTenant) {
    console.log(`  ${d(`note: tenantType is "${login.tenant?.tenantType}", not SHOPKEEPER — Home will show the non-shop notice`)}`);
  }

  /* ---- me ---- */

  section('identity');
  const me = await call('/me');
  hasKeys('GET /me', me, ['user', 'tenant', 'entitlements']);
  hasKeys('  me.user', me?.user, ['id', 'name', 'email', 'role', 'tenantRole']);
  check('  entitlements is an array', Array.isArray(me?.entitlements), typeof me?.entitlements);

  /* ---- subscription: the shopkeeper.* entitlement source ---- */

  section('subscription / entitlements');
  const sub = await call('/subscription', { raw: true });
  if (sub.status === 403) {
    console.log(`  ${d('403 not_entitled — plan flags unreadable; app falls back to showing all modules')}`);
  } else {
    hasKeys('GET /subscription', sub.body, ['subscription', 'entitlements', 'usage', 'quotas']);
    const flags = sub.body?.entitlements?.feature_flags;
    check('  entitlements.feature_flags is an array', Array.isArray(flags), typeof flags);
    if (Array.isArray(flags)) {
      const shop = flags.filter((f) => String(f).startsWith('shopkeeper.'));
      check('  plan carries shopkeeper.* flags', shop.length > 0, shop.length ? '' : 'none found — every module would be hidden');
      console.log(d(`       ${shop.join(', ') || '(none)'}`));
    }
  }

  /* ---- tenant profile ---- */

  section('shop profile');
  const tenant = await call('/tenant', { raw: true });
  if (tenant.status === 403) {
    console.log(`  ${d('403 — settings not entitled for this plan')}`);
  } else {
    hasKeys('GET /tenant', tenant.body, ['tenant', 'profile']);
    if (tenant.body?.profile) {
      hasKeys('  profile', tenant.body.profile, [
        'tenantId', 'shopName', 'ownerName', 'businessCategory', 'email', 'phone',
        'address', 'city', 'state', 'pinCode', 'country', 'businessHours',
        'notificationPreferences', 'timezone', 'currency', 'gstin', 'website',
      ]);
    } else {
      console.log(d('       profile is null — onboarding has not run for this tenant yet'));
    }
  }

  /* ---- dashboard ---- */

  section('dashboard (Home)');
  const dash = await call('/dashboard', { raw: true });
  if (dash.status === 403) {
    console.log(`  ${d('403 — mobile_app not entitled')}`);
  } else if (dash.body?.type === 'shopkeeper') {
    hasKeys('GET /dashboard', dash.body, [
      'todayMessages', 'unreadConversations', 'todayOrders', 'pendingOrders',
      'todaySales', 'customerCount', 'recentConversations', 'recentOrders', 'whatsapp',
    ]);
    hasKeys('  dashboard.whatsapp', dash.body.whatsapp, ['connected', 'phoneNumber', 'status']);
    const conv = dash.body.recentConversations?.[0];
    if (conv) hasKeys('  recentConversations[0]', conv, ['id', 'contactName', 'phone', 'lastMessageAt', 'preview', 'unreadCount']);
    else console.log(d('       recentConversations empty — Home shows "No conversations yet."'));
    const ord = dash.body.recentOrders?.[0];
    if (ord) hasKeys('  recentOrders[0]', ord, ['id', 'orderNumber', 'customerName', 'total', 'status', 'paymentStatus', 'createdAt']);
    else console.log(d('       recentOrders empty — Home shows "No orders yet."'));
  } else {
    check('GET /dashboard returns the shopkeeper shape', false, `type=${dash.body?.type ?? 'undefined'} (non-shop tenant)`);
  }

  /* ---- whatsapp ---- */

  section('whatsapp');
  const wa = await call('/whatsapp', { raw: true });
  if (wa.status === 403) {
    console.log(`  ${d('403 — whatsapp not entitled')}`);
  } else {
    hasKeys('GET /whatsapp', wa.body, ['health', 'caps', 'role']);
    hasKeys('  health', wa.body?.health, ['connected', 'overall', 'integration', 'checks', 'phone', 'webhook', 'templates', 'checkedAt']);
    hasKeys('  caps', wa.body?.caps, ['isAgent', 'canSend', 'canViewAll', 'canSendTemplates']);
    // Nothing secret must ever reach the handset.
    const serialised = JSON.stringify(wa.body ?? {});
    const leaks = ['access_token', 'accessToken', 'app_secret', 'appSecret', 'token_encrypted', 'system_user'].filter((k) =>
      serialised.includes(k),
    );
    check('  no Meta credential leaks in the payload', leaks.length === 0, leaks.join(', '));
    console.log(d(`       connected=${wa.body?.health?.connected} overall=${wa.body?.health?.overall}`));
  }

  /* ---- list endpoints ---- */

  async function verifyList(label, path, arrayKey, itemKeys, pageKeys) {
    const res = await call(path, { raw: true });
    if (res.status === 403) {
      console.log(`  ${d(`${label}: 403 not entitled`)}`);
      return null;
    }
    check(`GET ${path}`, res.status === 200, `HTTP ${res.status}`);
    const list = res.body?.[arrayKey];
    check(`  ${arrayKey} is an array`, Array.isArray(list), typeof list);
    if (pageKeys) hasKeys('  pagination', res.body?.pagination, pageKeys);
    if (Array.isArray(list) && list.length) hasKeys(`  ${arrayKey}[0]`, list[0], itemKeys);
    else console.log(d(`       ${arrayKey} empty — the screen shows its empty state`));
    return list;
  }

  section('inbox');
  const convs = await verifyList('conversations', '/conversations?limit=5', 'conversations',
    ['id', 'contactId', 'phoneNumber', 'profileName', 'status', 'priority', 'assignedAgentName', 'assignedTeam', 'unreadCount', 'lastMessagePreview', 'lastMessageAt'],
    ['limit', 'returned', 'hasMore']);

  if (convs?.length) {
    const detail = await call(`/conversations/${convs[0].id}`, { raw: true });
    check(`GET /conversations/{id}`, detail.status === 200, `HTTP ${detail.status}`);
    hasKeys('  detail', detail.body, ['conversation', 'messages']);
    const msg = detail.body?.messages?.[0];
    if (msg) {
      // This endpoint returns raw snake_case rows — the mapper depends on it.
      hasKeys('  messages[0] (snake_case)', msg, ['id', 'direction', 'message_type', 'message_body', 'status', 'created_at']);
      check('  direction is inbound/outbound', ['inbound', 'outbound'].includes(msg.direction), msg.direction);
    } else {
      console.log(d('       conversation has no messages'));
    }
  }

  section('customers');
  await verifyList('contacts', '/contacts?limit=5', 'contacts',
    ['id', 'phone', 'name', 'email', 'notes', 'tags', 'city', 'state', 'country', 'archivedAt', 'lastInteractionAt'],
    ['limit', 'offset', 'total']);

  section('products');
  await verifyList('products', '/products?limit=5', 'products',
    ['id', 'name', 'sku', 'category', 'description', 'price', 'offerPrice', 'currency', 'imageUrl', 'stockStatus', 'status'],
    ['limit', 'offset', 'total']);

  section('orders');
  const orders = await verifyList('orders', '/orders?limit=5', 'orders',
    ['id', 'orderNumber', 'contactId', 'conversationId', 'customerName', 'customerPhone', 'subtotal', 'discount', 'total', 'currency', 'status', 'paymentStatus', 'deliveryMethod', 'createdAt', 'items'],
    ['limit', 'offset', 'total']);
  if (orders?.length && orders[0].items?.length) {
    hasKeys('  orders[0].items[0]', orders[0].items[0], ['id', 'productId', 'productName', 'sku', 'quantity', 'unitPrice', 'lineTotal']);
  }

  section('templates / campaigns / automations / team');
  await verifyList('templates', '/templates', 'templates', ['id', 'name', 'language', 'category', 'status', 'bodyText']);
  await verifyList('campaigns', '/campaigns', 'campaigns', ['id', 'name', 'status', 'sentCount', 'deliveredCount', 'readCount', 'failedCount', 'totalRecipients']);
  await verifyList('automations', '/automations', 'automations', ['id', 'name', 'isActive', 'triggerType', 'actionType', 'priority']);
  await verifyList('team', '/team', 'team', ['id', 'name', 'email', 'role', 'tenantRole']);

  section('notifications');
  const notes = await call('/notifications?limit=5', { raw: true });
  if (notes.status === 403) {
    console.log(`  ${d('403 — notifications not entitled')}`);
  } else {
    hasKeys('GET /notifications', notes.body, ['notifications', 'unread', 'pagination']);
    const n = notes.body?.notifications?.[0];
    if (n) hasKeys('  notifications[0] (snake_case)', n, ['id', 'title', 'body', 'module_key', 'is_read', 'created_at']);
    else console.log(d('       no notifications'));
  }

  /* ---- error handling the app depends on ---- */

  section('error contract');
  const notFound = await call('/orders/99999999', { raw: true });
  check('unknown order id returns 404', notFound.status === 404, `HTTP ${notFound.status}`);
  check('  404 body has an error string', typeof notFound.body?.error === 'string');

  const badId = await call('/contacts/0', { raw: true });
  check('invalid contact id returns 400', badId.status === 400, `HTTP ${badId.status}`);

  const badToken = await (async () => {
    const saved = accessToken;
    accessToken = 'not.a.real.token';
    const res = await call('/me', { raw: true });
    accessToken = saved;
    return res;
  })();
  check('bad bearer token returns 401 invalid_token', badToken.status === 401 && badToken.body?.code === 'invalid_token', `HTTP ${badToken.status} code=${badToken.body?.code}`);

  /* ---- write path ---- */

  if (WRITE) {
    section('write path');
    const created = await call('/products', {
      method: 'POST',
      body: { name: `Contract check ${Date.now()}`, price: 1, sku: `CHK-${Date.now()}`, stockStatus: 'in_stock', status: 'inactive' },
      raw: true,
    });
    check('POST /products creates (201)', created.status === 201, `HTTP ${created.status} ${created.body?.error ?? ''}`);
    const id = created.body?.product?.id;
    if (id) {
      hasKeys('  created product', created.body.product, ['id', 'name', 'price', 'stockStatus', 'status', 'createdAt']);
      const patched = await call(`/products/${id}`, { method: 'PATCH', body: { name: 'Contract check (updated)' }, raw: true });
      check('PATCH /products/{id} updates', patched.status === 200 && patched.body?.product?.name === 'Contract check (updated)', `HTTP ${patched.status}`);
      const removed = await call(`/products/${id}`, { method: 'DELETE', raw: true });
      check('DELETE /products/{id} removes', removed.status === 200, `HTTP ${removed.status}`);
    }

    const invalid = await call('/products', { method: 'POST', body: {}, raw: true });
    check('POST /products with no name is rejected', invalid.status === 422 || invalid.status === 400, `HTTP ${invalid.status}`);
    if (invalid.body?.fields) console.log(d(`       fields: ${JSON.stringify(invalid.body.fields)}`));
  } else {
    console.log(d('\nwrite path skipped (pass --write to include it)'));
  }

  /* ---- refresh rotation: the riskiest part of the client ---- */

  section('token refresh');
  const first = await call('/auth/refresh', { method: 'POST', auth: false, body: { refreshToken }, raw: true });
  check('POST /auth/refresh rotates the pair', first.status === 200 && !!first.body?.accessToken, `HTTP ${first.status}`);
  if (first.body?.accessToken) {
    check('  a new refresh token is issued', first.body.refreshToken !== refreshToken);
    const replay = await call('/auth/refresh', { method: 'POST', auth: false, body: { refreshToken }, raw: true });
    // This is why the client single-flights refreshes.
    check('  the OLD refresh token is now rejected', replay.status === 401, `HTTP ${replay.status}`);
    accessToken = first.body.accessToken;
    refreshToken = first.body.refreshToken;
    const afterRefresh = await call('/me', { raw: true });
    check('  the new access token works', afterRefresh.status === 200, `HTTP ${afterRefresh.status}`);
  }

  /* ---- logout ---- */

  section('logout');
  const out = await call('/auth/logout', { method: 'POST', body: {}, raw: true });
  check('POST /auth/logout revokes the session', out.status === 200, `HTTP ${out.status}`);
  const afterLogout = await call('/me', { raw: true });
  check('  the access token is dead afterwards', afterLogout.status === 401, `HTTP ${afterLogout.status}`);

  /* ---- summary ---- */

  console.log(`\n${'-'.repeat(52)}`);
  console.log(`${pass} passed, ${fail > 0 ? r(`${fail} failed`) : '0 failed'}`);
  if (fail) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    console.log('\nA missing key means the app maps that field to undefined.');
  }
  console.log();
  return fail ? 1 : 0;

}

process.exitCode = await main();
