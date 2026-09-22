# Muenot Shopkeeper

Native Android/iOS app built with React Native, Expo and Expo Router. It talks
to the Muenot ERP mobile API over HTTPS and holds no data of its own — there is
no local database, no demo fixture and no direct connection to MySQL, Meta or
any other service.

## Run locally

1. Install Node 22+ and the Android Studio SDK.
2. Copy `.env.example` to `.env`. The default API base URL is production.
3. Run `npm install`.
4. Start the Metro server with `npm start`.
5. For an Android development build, run `npm run android`.

Expo Go will not work: the app uses `expo-secure-store`, a native module, so it
needs a development build.

## Environment

    EXPO_PUBLIC_APP_ENV        development | staging | production
    EXPO_PUBLIC_API_BASE_URL   https://erp.muenot.co.in/api/mobile/v1
    EXPO_PUBLIC_API_TIMEOUT_MS 20000 (optional)

Everything prefixed `EXPO_PUBLIC_` is embedded in the shipped bundle and is
readable by anyone with the APK. No secret belongs in `.env`. The app holds no
Meta credentials of any kind — WhatsApp sending goes through the backend.

## Validation

    npm run typecheck      tsc --noEmit, strict mode
    npm run check:native   bans next/*, react-dom, @shadcn and DOM tags
    npm test               node --test over tests/*.test.mjs
    npm run export:android production-like Hermes bundle into dist/

## Testing locally

Three levels, cheapest first.

**1. Offline checks** — the four commands above. No device, no account.

**2. Live API contract check** — needs a shopkeeper login, nothing else:

    npm run verify:api -- --email you@shop.com --password 'secret'

Logs in and asserts that every field the screens read is present in the real
responses, that the error envelope matches, and that refresh-token rotation
behaves (it replays a spent refresh token to confirm the backend rejects it).
Add `--write` to also exercise product create/update/delete and a 422. Exits
0/1 for CI and never prints a token. Do not use `--write` against a tenant
whose data matters.

**3. The app in a browser** — the whole UI against the live API, no Android
SDK required:

    npx expo start --web

Web is a development-only convenience, not a shipped platform. `app.config.ts`
declares android and ios only, and because a browser has no keystore, the
session falls back to `localStorage` there. `services/api/session-store.ts`
refuses to run at all if a web build is made with
`EXPO_PUBLIC_APP_ENV=production`. Anything touching native modules — the image
picker, real keystore behaviour — must still be checked on a device.

**4. On a device** — `npm run android`, which needs JDK 17 and the Android SDK
(`ANDROID_HOME` set, `platform-tools` on PATH). Expo Go cannot run this app:
`expo-secure-store` is a native module. `npx eas build --profile development
--platform android` builds in the cloud instead and needs neither locally.

## Architecture

- `app/` — Expo Router routes: bottom tabs and nested stacks.
- `components/` — native reusable UI, forms, details and flows.
- `services/api/` — the API layer. `client.ts` is the only module that calls
  `fetch`; `endpoints.ts` is the only one that knows a URL path.
- `features/session.ts` — the auth/session store (user, tenant, entitlements).
- `features/queries.ts` — TanStack Query hooks, keys and cache invalidation.
- `features/mappers.ts` — wire types to UI types, in one place.
- `types/api.ts` — the API contract. `types/domain.ts` — the UI models.

### Data flow

Screens never call `fetch`, never see a token and never send a tenant id. They
use a hook from `features/queries.ts`, which calls a typed function in
`services/api/endpoints.ts`, which goes through `services/api/client.ts`.

The client attaches the bearer token, refreshes it when it expires (single
flight, because the backend rotates the refresh token on every use), applies a
timeout, retries only what is safe to repeat, and turns every failure into an
`ApiError` with a `kind` the UI branches on.

Tokens live in the OS keystore via `expo-secure-store`, never in AsyncStorage.

### Tenancy and entitlements

The tenant comes from the authenticated bearer token. The app never sends a
tenant id, and the backend ignores one if it were sent.

Navigation entries are hidden for modules the plan does not include, read from
`shopkeeper.*` flags on `GET /subscription`. This is UX only — the backend
authorises every request and answers 403 regardless of what is on screen.
