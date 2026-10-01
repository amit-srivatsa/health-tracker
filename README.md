# Health Tracker

A private, installable tracker for calories, macros, water, workouts, sleep, weight and meal photos.

**Public code, private data.** This repo holds code only. Your log lives on your phone and in your own Google Drive. There is no server and no database, and nothing you log ever reaches GitHub.

[Try the demo](https://amit-srivatsa.github.io/health-tracker/?demo) with invented data.

## How it works

- **Installable web app (PWA).** Open the site on your phone, then Share > Add to Home Screen (iPhone) or Install app (Android). It opens full screen and works offline.
- **Device first.** Everything is saved on the phone (IndexedDB) the moment you tap. No connection needed.
- **Your Google Drive.** Connect Drive and the app keeps a copy in one folder:

  ```
  Health Tracker/
    data/days-2026-10.json   one file per month
    data/foods.json
    data/settings.json
    photos/2026-10-01-lunch-<id>.jpg
  ```

  Two devices can share the same Drive: each record carries a timestamp and the newer copy wins.
- **Photos** are shrunk on the phone (max 1600 px) and re-encoded, which also strips EXIF data such as GPS location.
- **Backup.** Settings > Export all saves one JSON file. Import brings it back.

## Privacy and security

| What | How |
| --- | --- |
| Drive access | `drive.file` scope only: the app sees files it created, nothing else in your Drive |
| Secrets | None exist. Browser apps have no client secret. The OAuth client ID is public by design and only works from the origins set in Google Cloud |
| Sign-in token | Kept on your device for about an hour, never sent anywhere except Google |
| Third parties | No analytics or trackers. Fonts are self-hosted. A Content Security Policy blocks every network call except Google's Drive and sign-in APIs |
| Sharing | The app never changes sharing on your Drive files |
| Repo | Secret scanning on every push (gitleaks), and a `.gitignore` that blocks exports and photos |

Revoke access any time at [myaccount.google.com/permissions](https://myaccount.google.com/permissions). Your files stay in your Drive.

## Run your own copy

The hosted app only lets its owner sign in. To use it yourself, fork it and add your own Google client ID (free, about 10 minutes).

1. Fork this repo and turn on GitHub Pages (Settings > Pages > Deploy from branch > `main` / root).
2. In [Google Cloud console](https://console.cloud.google.com/), create a project.
3. APIs & Services > Library: enable **Google Drive API**.
4. OAuth consent screen: External, add the scope `https://www.googleapis.com/auth/drive.file`, add yourself as a test user.
5. Credentials > Create credentials > OAuth client ID > **Web application**:
   - Authorized JavaScript origins: `https://<you>.github.io` and `http://localhost:8080`
   - Authorized redirect URIs: `https://<you>.github.io/health-tracker/` and `http://localhost:8080/`
6. Put the client ID in `src/config.js`. There is no secret to add.

Run locally with any static server, for example `python3 -m http.server 8080`.

Without a client ID the app still works, it just keeps everything on the device.

## Project layout

```
index.html              page shell and security policy
manifest.webmanifest    install metadata
sw.js                   offline cache
src/app.js              UI
src/store.js            device storage (IndexedDB)
src/drive.js            Google sign-in and Drive sync
src/config.js           public OAuth client ID
demo/sample-data.json   invented data for the demo
```

## Licence

MIT. Fonts (Manrope, Figtree) are under the SIL Open Font License 1.1.

Built by [Amit Srivatsa](https://github.com/amit-srivatsa) with Claude.
