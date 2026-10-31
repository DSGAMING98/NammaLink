# Android release signing

NammaLink's downloadable `0.1.0` APK is signed for direct installation and compiled against `https://nammalink.vercel.app`. A separate owner-signed release build is required for app-store distribution.

The app now has three explicit variants:

- `debug` permits `http://127.0.0.1:3000` for local development and USB forwarding only.
- `presentation` is the internal name of the direct-install variant; it requires a public HTTPS backend and disables cleartext traffic.
- `release` requires both a public HTTPS backend and owner-controlled release signing credentials.

## Required private values

Keep the keystore outside this repository and set these environment variables only in the trusted build environment:

```text
NAMMALINK_KEYSTORE_PATH=
NAMMALINK_KEYSTORE_PASSWORD=
NAMMALINK_KEY_ALIAS=
NAMMALINK_KEY_PASSWORD=
```

Do not put real values in Git, screenshots, build logs, issues, or chat. Keystores (`*.jks`, `*.keystore`) and `android/signing.properties` are ignored by the repository.

## Build

Set `NAMMALINK_API_BASE_URL` to the deployed HTTPS origin, with no API path suffix. From `android/`, run `gradlew assemblePresentation` for the direct-install APK, `gradlew assembleRelease` for a release APK, or `gradlew bundleRelease` for an Android App Bundle. Distributable builds reject HTTP, loopback, emulator-only, and placeholder hosts. Release builds also fail closed if any signing variable is absent, only some are supplied, or the keystore path is not readable. Debug builds do not require release credentials.

Before distributing a release, verify its certificate and checksum, retain the keystore and passwords in a durable password manager or secrets service, and test installation/upgrade on a physical device. Losing the signing key prevents publishing compatible updates under the same application identity.
