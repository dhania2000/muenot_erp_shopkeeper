# Muenot Shopkeeper

Native Android/iOS app built with React Native, Expo and Expo Router. The current build uses isolated, visual test data in `features/demo/data.ts`; it does not call Muenot ERP, MySQL, Meta, or any other backend.

## Run locally

1. Install Node 22+ and the Android Studio SDK.
2. Copy `.env.example` to `.env` and set only the public ERP origin when it is supplied.
3. Run `npm install`.
4. Start the Metro server with `npm start`.
5. For an Android development build, run `npm run android`. You can also scan the Expo development QR code with a compatible Android Expo Go installation.

## Validation

Run `npm run typecheck` and `npm run check:native`. For a production-like Android JavaScript bundle, run `npm run export:android`.

## Architecture

- `app/` — Expo Router routes, including bottom tabs and nested stacks.
- `components/` — native reusable UI, forms, details and flows.
- `features/demo/` — temporary display-only mock data.
- `types/domain.ts` — domain models ready to replace with API contracts.
- `services/api-client.ts` — intentionally endpoint-free API foundation.
- `constants/config.ts` — public environment configuration.
