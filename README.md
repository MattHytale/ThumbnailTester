# Thumbnail Lab — iPad / PWA build

A private, local-first YouTube thumbnail tester. No thumbnails are uploaded by the app.

## Fastest way to use on iPad

For installation to the iPad Home Screen, the app must be served over HTTPS. GitHub Pages is an easy option:

1. Create a GitHub repository and upload the contents of this folder (not the outer ZIP).
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select your main branch and the root `/` folder, then save.
4. Open the generated Pages site in **Safari** on your iPad.
5. Tap **Share → Add to Home Screen → Add**.

After the first successful visit, the service worker caches the app shell so it can open offline. Thumbnail images themselves remain in browser memory for the current session; scores, notes, and text settings are saved locally.

## Desktop

Open `index.html` directly, or double-click `OPEN_APP_WINDOWS.bat` on Windows. PWA/offline installation requires HTTPS or localhost.

## Included

- A/B/C thumbnail upload
- YouTube-style desktop/mobile/suggested/tiny previews
- Blur, grayscale, and dim tests
- Brightness/contrast/saturation/detail measurements
- Manual scorecard
- A/B flicker comparison
- Blind flash-memory test
- iPad safe-area and touch optimizations
- PWA manifest, Home Screen icons, and offline app-shell caching
