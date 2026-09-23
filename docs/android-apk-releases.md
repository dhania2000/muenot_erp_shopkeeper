# Muenot Shopkeeper Android APK releases

This repository produces one Android package, `com.muenot.shopkeeper`, for both
website installation and in-app upgrades. The ERP owns published release
metadata; this repository does not manage its database or Super Admin UI.
Pushing code **does not** publish an APK to customers.

## Version and identity

- Change `versionName` in `package.json` → `version`. `app.config.ts` reads it.
- Change integer `versionCode` in `app.config.ts` → `android.versionCode`.
- `eas.json` uses `appVersionSource: local` and does not auto-increment.
- Every distributed build needs a versionCode higher than *all* previously
  distributed codes. App update policy compares only installed versionCode.
- Keep name, `com.muenot.shopkeeper`, slug `muenot-shopkeeper`, scheme `muenot`,
  and any existing EAS project/owner identity unchanged.

**Current source values:** versionName `1.0.0`, versionCode `1`. Confirm the
previously distributed APK's real package, versionCode and signer before
assigning the next production version. An APK built earlier for testing may
already establish the key and code required for seamless upgrades.

## Signing identity: required before first customer update

No production keystore, EAS project ID, or previously distributed APK is
present in this repository. The existing signing identity therefore **cannot
be determined from source**. Do not generate a replacement production key.
Find the APK already installed by testers and the exact keystore that signed
it. If it came from EAS, sign into the same Expo account, run `eas credentials`
in this project, choose Android and download the existing credentials into a
private `credentials.json`/keystore location, then back them up securely. Do
not commit either file. Compare the signing certificate SHA-256 of the old APK
and each new release APK with Android SDK `apksigner verify --print-certs`.
The certificate digest, application ID, and increasing versionCode must match
Android's update rules. If the earlier APK used a debug key or an unknown key,
decide explicitly whether it is a disposable test install or the identity to
retain; users cannot upgrade in place across a signing-key change.

The Expo config plugin `plugins/withMuenotReleaseSigning.js` makes a direct
local release use a private keystore, never the generated debug key. It fails
`assembleRelease` or `bundleRelease` when signing credentials are missing.
EAS Build injects its own managed credentials after prebuild; its existing
credential must be the same as the APK users already have. Debug builds keep
the normal debug key. `.gitignore` excludes keys and `credentials.json`.

## Local signed APK on Windows

Install Node 22+, JDK 17 and Android SDK/build tools; set `ANDROID_HOME` to
the SDK. Restore the **established** private keystore outside Git. Set these
environment variables in the build terminal, or put them in private Gradle
user properties (`$env:USERPROFILE\.gradle\gradle.properties`):

```powershell
$env:MUENOT_UPLOAD_STORE_FILE = 'C:\private\muenot-release.keystore'
$env:MUENOT_UPLOAD_KEY_ALIAS = '<existing-alias>'
$env:MUENOT_UPLOAD_STORE_PASSWORD = '<existing-store-password>'
$env:MUENOT_UPLOAD_KEY_PASSWORD = '<existing-key-password>'
$env:EXPO_PUBLIC_APP_ENV = 'production'
$env:GOOGLE_SERVICES_JSON = 'C:\private\google-services.json'
npm ci
npm test
npm run typecheck
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat :app:assembleRelease
```

The signed APK is `android\app\build\outputs\apk\release\app-release.apk`.
The present workstation has no Android SDK, so this build is prepared but has
not been run here. EAS may also create an APK with the production profile, but
verify it uses the same established signing identity. Do not publish a debug
APK, and do not clear app data during an update.

## Test and publish handoff

1. Verify package, versionName, versionCode and signer in the final APK using
   Android SDK `aapt`/`apksigner`. Compare signer against the prior installed
   APK. Preserve the existing key securely.
2. Compute the final APK's hash and size:

   ```powershell
   Get-FileHash -Algorithm SHA256 'android\app\build\outputs\apk\release\app-release.apk'
   (Get-Item 'android\app\build\outputs\apk\release\app-release.apk').Length
   ```

3. On a controlled Android device, install the *prior production-signed* APK,
   log in and create safe test state. Install the new APK with the same key and
   a higher versionCode. Check session, preferences and data remain intact.
   A wrong-key APK must be rejected by Android; do not bypass this check.
4. Upload the **same signed APK** to an immutable HTTPS `.apk` URL on a trusted
   Muenot download host, with the right MIME type, byte length and no
   credential-bearing query. Set `EXPO_PUBLIC_APK_ALLOWED_HOSTS` for every
   host the app may download from. Avoid cross-host redirects.
5. In ERP Platform → Mobile App · Releases, create a **draft** with version,
   versionCode, minimumVersionCode, forceUpdate, URL, byte size, SHA-256 and
   plain-text release notes. Check hosted bytes and internal upgrade once
   more. A human Super Admin publishes the draft. See the separate ERP
   `docs/shopkeeper-apk-releases.md` for its approval process.

The public API is `GET /api/mobile/v1/app-version` without login. It returns
`platform`, `latestVersion`, `latestVersionCode`, `minimumVersionCode`,
`forceUpdate`, `apkUrl`, `apkSize`, `apkSha256`, `releaseNotes[]`, and
`publishedAt`; 404 `release_unavailable` means no published release. The app
validates host/HTTPS/metadata, compares numeric versionCode, checks byte size
and streams SHA-256 over the cached APK before opening Android's installer.
The Expo FileSystem downloader reports progress when the server supplies a
length, supports cancellation, and stops a download after five minutes.
Android asks for user confirmation and may ask to allow this app as an
unknown-app source. The app opens the appropriate Settings page when needed.
There is no silent install. Installer return is not interpreted as success;
the newly launched APK must report its new installed versionCode.

Check on-device scenarios: current version; optional update/Later; required
update with no protected-screen bypass; corrupted APK blocks installer;
offline check; interrupted download/retry; denied unknown-app permission;
installer cancellation/retry; wrong-signature rejection; and data preservation.
The app caches successful release metadata for one hour to retain a recent
mandatory policy during transient outages, and checks again on cold launch or
after six hours foreground. An unavailable endpoint with no recent policy does
not lock out a previously supported user.

Future CI may build, test, sign with protected secrets, upload an immutable
artifact and prepare an ERP draft from a Git tag. It must never auto-publish
the customer release solely because code was pushed.
