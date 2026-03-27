# BassTab

Expo-managed React Native app for bass tab editing and performance workflows.

## Linux workflow

Most of this app can be developed and validated on Linux:

- install dependencies with `npm install`
- run the app with `npm start`
- validate the code with `npm run verify:linux`

`verify:linux` currently checks:

- TypeScript compilation with `tsc --noEmit`
- Expo web bundling with `expo export --platform web`

Those checks do not prove that native iOS compilation works, but they do prove the Expo app, routing, and JavaScript bundle are structurally valid from a Linux environment.

## iOS deployment path

Because this repo is an Expo-managed app, you do not need a local Mac just to produce an iOS build artifact. The practical path from Linux is Expo Application Services (EAS).

### 1. Keep the app managed and Linux-clean

Use Linux for normal development:

- `npm start`
- `npm run verify:linux`

Avoid adding custom native iOS code unless you are prepared to validate that code with macOS tooling.

### 2. Add production app identifiers

Before shipping to iOS, set these in `app.json`:

- `expo.ios.bundleIdentifier`
- `expo.owner` if you are publishing under an Expo account or organization
- app metadata such as app name, version, icons, splash, and privacy-related config

Example:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.example.basstab"
    }
  }
}
```

### 3. Build iOS from Linux with EAS

Install the CLI and authenticate:

```sh
npm install --global eas-cli
eas login
```

Create an iOS build in Expo's hosted macOS environment:

```sh
eas build --platform ios --profile production
```

This repo already includes a minimal `eas.json` with `preview` and `production` profiles.

### 4. Handle Apple requirements

To distribute on iOS you will still need:

- an Apple Developer account
- signing credentials
- an App Store Connect app record

EAS can help manage credentials, but the Apple account requirement does not go away.

### 5. Submit to TestFlight or the App Store

Once the build succeeds:

```sh
eas submit --platform ios --profile production
```

That submission targets App Store Connect, where you can release through TestFlight or App Store review.

## What Linux can and cannot guarantee

Linux can validate:

- TypeScript and JavaScript correctness
- Expo config parsing
- Metro bundling
- web behavior
- much of the shared React Native application logic

Linux cannot fully validate:

- Xcode project generation issues after native prebuild changes
- CocoaPods integration
- iOS signing
- App Store packaging and submission behavior
- device-only iOS runtime issues

## Recommended next steps

1. Set `expo.ios.bundleIdentifier` in `app.json`.
2. Install `eas-cli`.
3. Run `npm run verify:linux` before every hosted iOS build.
4. Run `eas build --platform ios --profile preview` for the first remote test build.
