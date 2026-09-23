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
    GOOGLE_SERVICES_JSON       path to the private Android Firebase config file (native build only)

Production builds always use `https://erp.muenot.co.in/api/mobile/v1`.
Set `EXPO_PUBLIC_API_BASE_URL` for a development backend. Staging requires
this variable explicitly so a staging build cannot silently use production;
the staging EAS profile reads the `preview` environment.

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

### Android push notifications

The app follows the ERP [mobile push contract](https://github.com/dhania2000/muenot_erp/blob/main/docs/shopkeeper-mobile-push.md).
After a valid login or session restore it requests Android notification
permission once, obtains the **native FCM token** on a physical Android device,
and sends `deviceId`, `pushToken`, `pushProvider: "fcm"`, `platform: "android"`,
`appVersion`, and `deviceName` to `POST /devices`. A stable random `deviceId`
is stored in SecureStore. Token rotation uses `PATCH /devices` with that same
ID. Logout calls `DELETE /devices` with that ID before `POST /auth/logout`.
An unavailable push service never blocks using the app.

To build for Android push, create a Firebase Android app for
`com.muenot.shopkeeper`, enable FCM, and supply its `google-services.json` as
the EAS **file** variable `GOOGLE_SERVICES_JSON` in the build environment.
For a local native build, set `GOOGLE_SERVICES_JSON` to a private file path.
This repository does not contain a Firebase service-account key. The ERP
server separately needs its FCM credentials, migration, and delivery worker.

Backend FCM messages include `notification.title/body` and `data.type` plus
optional `data.conversationId`. Android displays the backend notification in
the background. In the foreground, the app shows it and invalidates the
conversation, dashboard, and notification queries; it never inserts a local
chat message. A WhatsApp notification tap waits for session restoration and
opens the existing `/inbox/[id]` screen. That screen fetches the conversation
through the authorized API. The Notification Center remains backed by
`GET/PATCH /notifications`, and the app badge is set from its server unread
count.

Physical-device verification still needs a configured Firebase build and an
authenticated Shopkeeper account: check fresh login, restore, token rotation,
foreground/background/terminated WhatsApp push, exact chat routing, unread
count, logout, and switching users on the same phone. Offline logout cannot
revoke a server registration until the backend is reachable; a later login
may receive HTTP 409 if the old user's token is still active.

### Tenancy and entitlements

The tenant comes from the authenticated bearer token. The app never sends a
tenant id, and the backend ignores one if it were sent.

Navigation entries are hidden for modules the plan does not include, read from
`shopkeeper.*` flags on `GET /subscription`. This is UX only — the backend
authorises every request and answers 403 regardless of what is on screen.

### Self-registration and WhatsApp onboarding

The self-registration flow follows the ERP's
[Shopkeeper handoff](https://github.com/dhania2000/muenot_erp/blob/main/docs/shopkeeper-self-registration.md).
`POST /auth/register` submits business/owner details and consent. It returns a
one-time registration receipt, not a login session. The app keeps that receipt
in SecureStore and calls `GET /auth/registration-status` with
`Authorization: Registration <receipt>` at launch and on manual refresh.
Pending, rejected and suspended applicants cannot open business screens.
Approval leads to the existing email/password login; only that login creates
the mobile bearer/refresh session. Logging out clears both session and receipt.

For an approved Shopkeeper owner/admin, `POST /whatsapp/onboarding-session`
returns a short-lived Muenot-hosted HTTPS link. The app opens it through
`expo-web-browser`; Meta code exchange and credentials remain on the ERP.
The `muenot://whatsapp/connected` and `/error` callbacks contain no code or
token. The app verifies either return against `GET /whatsapp/status` before
showing Connected and refreshes the dashboard and Inbox. The dashboard never
uses the shop's contact phone as a WhatsApp number. Inbox, Templates,
Campaigns and Automations show a connection action when disconnected and empty.

Before release, configure the **published** legal URLs as
`EXPO_PUBLIC_TERMS_URL` and `EXPO_PUBLIC_PRIVACY_URL`. These are public URLs in
the APK, not secrets. The in-app registration form does not invent legal URLs.
Complete production ERP deployment, migrations, Meta configuration and real
Android device testing of registration, approval, browser return and FCM.
The EAS `production` Android profile builds an APK for direct distribution.

### Self-hosted APK updates

The app checks the public ERP `/app-version` endpoint on startup and compares
the installed Android `versionCode`. A verified APK is handed to the normal
Android installer; there is no Play Store or EAS Update dependency. See
[the Shopkeeper release guide](docs/android-apk-releases.md) for signing,
local Windows builds, publishing handoff, and device upgrade checks.
