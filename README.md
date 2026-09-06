# Thumbnail Lab — YouTube-style iPad build

This version keeps the tester local-first but redesigns the interface around a YouTube-style viewing surface:

- YouTube-like top bar, search area, topic chips and navigation rail
- Feed-first layout instead of a dashboard-first layout
- Test controls collapse into one setup drawer
- 4-column desktop / 3-column iPad landscape / 2-column portrait feed behavior
- A/B/C uploads, visual metrics, scorecard, flash test and flicker comparison are preserved
- PWA / Add to Home Screen support remains enabled

## GitHub Pages
Upload the **contents** of this folder to the repository root, then use **Settings → Pages → Deploy from a branch → main → /(root)**.

Because this build bumps the service-worker cache, the updated UI should replace the prior one after GitHub Pages deploys. If the Home Screen app still shows the old design, fully close it and reopen it once.
