# ASKIA Light Branding

All UI customization for LibreChat lives here. The `scripts/apply-branding.sh`
script copies these files into the LibreChat submodule before the Docker image
build — no permanent submodule modifications needed.

## Files

| File | Purpose | Target in LibreChat |
|------|---------|---------------------|
| `i18n-overrides.json` | Translation key overrides (removes "by LibreChat" etc.) | `client/src/locales/en/translation.json` (merged) |
| `style-overrides.css` | CSS custom property overrides (colors, theming) — reserved for future use | _(not currently applied)_ |
| `favicon-16x16.png` | Browser tab icon (16×16) | `client/public/assets/favicon-16x16.png` |
| `favicon-32x32.png` | Browser tab icon (32×32) | `client/public/assets/favicon-32x32.png` |
| `favicon.ico` | Browser tab icon (ICO fallback) | `client/public/assets/favicon.ico` |
| `apple-touch-icon.png` | iOS home screen icon (renamed to -180x180) | `client/public/assets/apple-touch-icon-180x180.png` |
| `android-chrome-192x192.png` | Android home screen icon | `client/public/assets/android-chrome-192x192.png` |
| `android-chrome-512x512.png` | Android splash screen icon | `client/public/assets/android-chrome-512x512.png` |
| `logo.svg` or `logo.png` | Login page logo (PNG auto-patches source ref) | `client/public/assets/logo.*` |

## How it works

### Azure (production)

The `postprovision` hook in `azure.yaml` runs `scripts/apply-branding.sh`
**before** the `az acr build` step. The patched submodule is then built into the
Docker image.

### Local development

For favicon and logo, Docker volume mounts in `docker-compose.override.yml`
overlay the files at runtime (no rebuild needed).

For i18n overrides, run `scripts/apply-branding.sh` then rebuild the
frontend: `cd librechat && npm run frontend`. Note: CSS overrides in
`style-overrides.css` are reserved for future use and not applied by
the script yet.

## Adding your own assets

1. Replace the placeholder PNG/SVG files in this folder with your brand assets
2. Edit `i18n-overrides.json` to change any UI text
3. Edit `style-overrides.css` to change colors
4. Run `scripts/apply-branding.sh` to apply
5. Deploy with `azd up` (production) or rebuild locally
