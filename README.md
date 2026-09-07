# Thumbnail Lab – Full YouTube Layout Build

This build turns Thumbnail Lab into a more complete YouTube-style app.

## Major additions
- Real **YouTube-like app layout**
- **Desktop**, **iPad**, **Mobile**, and **TV** preview modes
- Multiple YouTube-style surfaces:
  - **Home**
  - **Search**
  - **Watch**
- Real competitor thumbnails loaded from the **YouTube Data API**
- Your own A / B / C thumbnail inserted into the feed
- Shuffle placement, flash test, flicker compare, visual metrics, and scorecards
- iPad Home Screen install support (PWA)

## How to use competitor loading
1. Create a YouTube Data API key in Google Cloud.
2. Restrict it as a **browser key** if possible.
3. Paste the key into the app.
4. Type one or more search phrases separated by commas.
   - Example: `Hytale, Minecraft PvP`
5. Tap **Load YouTube competitors**.

## Recommended key restriction
For GitHub Pages, restrict the browser key to your site, for example:
- `https://matthytale.github.io/*`

## Deploy on GitHub Pages
Upload the contents of this folder to your repo root, then enable:
- **Settings → Pages**
- **Deploy from a branch**
- Branch: `main`
- Folder: `/(root)`

Then open the Pages URL in Safari and choose **Share → Add to Home Screen**.
