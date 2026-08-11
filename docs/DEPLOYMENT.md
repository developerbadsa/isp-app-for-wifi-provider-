# Deployment

How to build and ship the app for **web**, **Android**, and **iOS**.

---

## 1. Web (static export)

The project is configured for static web output (`app.json` → `web.output: "static"`), which means every route gets its own HTML file — ideal for hosting on Netlify, Vercel, GitHub Pages, or any static host.

```bash
npm run build
# → writes a static site to dist/
```

Preview locally:

```bash
npx serve dist
```

> The build also validates every route: it fails if a route referenced in `_layout.tsx` has no matching file.

---

## 2. Native builds (EAS)

Build profiles are defined in `eas.json`:

| Profile | Use case |
|---|---|
| `development` | Local dev client builds (`developmentClient: true`) |
| `preview` | Internal testing builds (installed via QR / link) |
| `production` | Store builds (`autoIncrement` versioning) |

### Prerequisites
- Expo account & login: `npx eas login`
- Project linked to EAS (`app.json` → `extra.eas.projectId` is already set)

### Commands

```bash
# Development build (emulator/simulator or device)
npx eas build --profile development --platform android
npx eas build --profile development --platform ios

# Preview (internal distribution)
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios

# Production
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

### Submitting to stores

```bash
npx eas submit --platform android
npx eas submit --platform ios
```

(Requires store credentials configured in the EAS project.)

---

## 3. Runtime & versioning

- `app.json` → `runtimeVersion.policy: "sdkVersion"` — OTA updates keyed to the Expo SDK version.
- `eas.json` → `cli.appVersionSource: "remote"` — EAS manages app version increments; `production` uses `autoIncrement`.

---

## 4. Environment variables in builds

`EXPO_PUBLIC_*` variables are inlined at **build time**. Pass them per-profile:

```bash
npx eas build --profile preview --platform android \
  --env EXPO_PUBLIC_DEMO_LOGIN=true
```

> In production, set `EXPO_PUBLIC_DEMO_LOGIN` to anything but `"true"` (or omit it) so demo credentials are **not** auto-filled. Never ship real credentials as `EXPO_PUBLIC_*` variables — they are visible in the client bundle.

---

## 5. Release checklist

1. `npx tsc --noEmit` — no type errors
2. `npm run build` — web export succeeds, all routes present
3. Confirm demo credentials are disabled for production builds
4. Bump the app version (`eas build` auto-increments for production)
5. Test the built app: login (admin + customer), browse packages, run a speed test, open a customer's details + logs
