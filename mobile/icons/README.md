# App Icons & Splash Screens

This directory holds source artwork for VentPals app icons and splash screens.

## Required files

Place the following source images here before running the icon generation tool:

| File | Size | Purpose |
|------|------|---------|
| `icon-1024.png` | 1024 × 1024 px | Master app icon (no alpha, no rounded corners — the OS applies rounding) |
| `splash-2732.png` | 2732 × 2732 px | Master splash/launch image (centred logo on `#F7F4FF` background) |

## Generating assets from source images

After placing the source images above, install and run **@capacitor/assets**:

```bash
# From the mobile/ directory
npm install --save-dev @capacitor/assets

npx capacitor-assets generate \
  --assetPath icons/icon-1024.png \
  --splashPath icons/splash-2732.png
```

This generates correctly-sized icons/splashes for both iOS and Android projects.

## Branding reference

Use the VentPals brand palette when creating artwork:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#A259FF` | Icon accent / gradient start |
| Secondary | `#7ED957` | Gradient end / highlights |
| Background | `#F7F4FF` | Splash background / icon background |
| Text dark | `#2E1A47` | Logo wordmark |

The logo source is at `/assets/images/logo.png` in the repo root.

## Temporary placeholder

Until custom artwork is ready, copy `logo.png` from the repo root and resize
it to at least 1024 × 1024 px on a `#F7F4FF` background for App Store review.

```bash
# Example using ImageMagick (macOS: brew install imagemagick)
convert ../../assets/images/logo.png \
  -background "#F7F4FF" \
  -gravity center \
  -extent 1024x1024 \
  icon-1024.png
```
