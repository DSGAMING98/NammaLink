# Android release signing

NammaLink's downloadable `0.1.0-dev` APK is intentionally debug-signed. It is suitable for prototype testing, not an app-store or production release.

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

From `android/`, run `gradlew assembleRelease` for an APK or `gradlew bundleRelease` for an Android App Bundle after all four variables are present. The build fails closed if any variable is absent, only some are supplied, or the keystore path is not a readable file. Debug builds do not require release credentials.

Before distributing a release, verify its certificate and checksum, retain the keystore and passwords in a durable password manager or secrets service, and test installation/upgrade on a physical device. Losing the signing key prevents publishing compatible updates under the same application identity.
