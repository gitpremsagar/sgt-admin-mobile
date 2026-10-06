# SGT Admin (Android)

Admin mobile app for Sri Gopal Traders, built with Expo SDK 57 and Expo Router. It talks to the production API at `https://api.srigopaltraders.com`, and only `ADMIN` and `SUPER_ADMIN` accounts can sign in.

## Setup

```bash
npm install
npm i -g eas-cli && eas login   # once per machine
```

`.env` holds the API and web URLs (`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL`). Each build profile in `eas.json` sets the same values.

## Develop

```bash
npx expo start          # scan the QR code with Expo Go, or press "a" for an emulator
npx expo lint
npx tsc --noEmit
```

Every request goes to production, so test writes against test records.

## Brand assets

The icons, splash, favicon, in-app logo and Play Store graphics are all generated from `assets/brand/logo-source.jpg`:

```bash
npm run assets
```

| Output | Used for |
| --- | --- |
| `assets/images/icon.png` | Launcher icon (legacy) |
| `assets/images/android-icon-foreground.png`, `-background.png` | Android adaptive icon layers |
| `assets/images/android-icon-monochrome.png` | Android 13+ themed icon |
| `assets/images/splash-icon.png` | Splash screen (white background in light mode, `#0B1220` in dark mode) |
| `assets/images/logo.png` | Login screen and error screen |
| `store/play-icon-512.png` | Play listing app icon |
| `store/feature-graphic-1024x500.png` | Play listing feature graphic |

## Build

```bash
eas build -p android --profile preview      # installable APK for testers
eas build -p android --profile production   # AAB for the Play Store (versionCode auto-increments)
```

The app version shown to users is `version` in `app.json`. Bump it for every store release that changes native code or dependencies.

## Release to Google Play

1. Put the Play Console service-account key at `./play-service-account.json`. The file is gitignored.
2. Upload the latest production build:
   ```bash
   eas submit -p android --profile production --latest
   ```
   This uploads to the **internal** testing track as a draft. Promote the release in Play Console when it's ready.

Google Play requires the very first upload to be done by hand. Download the AAB from the EAS build page and upload it in Play Console under **Testing > Internal testing**.

## Over-the-air updates (JavaScript only)

```bash
eas update --channel production --message "Fix order card layout"
```

Each build only receives updates from its own channel (`development`, `preview` or `production`), and only while the runtime version matches. The runtime version is tied to `version` in `app.json`. Changes to native code, dependencies or `app.json` need a new build, not an update. The More tab footer shows the running version, build number and update ID.

## Play Console checklist

- [ ] Create the app: name **SGT Admin**, default language English (India), type App, Free.
- [ ] **Privacy policy URL:** `https://www.srigopaltraders.com/privacy`. Deploy the frontend first.
- [ ] **App access:** "All or some functionality is restricted". Give the reviewer a working admin email and password.
- [ ] **Ads:** No ads.
- [ ] **Content rating:** complete the questionnaire (business or productivity app, no user-generated content).
- [ ] **Target audience:** 18 and over.
- [ ] **Data safety:**
  - Collected: name, email address and phone number (account management, app functionality).
  - Encrypted in transit: yes.
  - Shared with third parties: no.
  - Users can request deletion via the email on the privacy page.
- [ ] **Store listing:**
  - Short and full description.
  - `store/play-icon-512.png` and `store/feature-graphic-1024x500.png`.
  - At least 2 phone screenshots (take them on a device: Dashboard, Orders, Order detail, Stock).
- [ ] **App category:** Business. Add a contact email.
- [ ] Upload the first production AAB to **Internal testing**, add testers and confirm it installs. Then promote to Closed or Production.
