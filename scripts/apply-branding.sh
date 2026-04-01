#!/usr/bin/env bash
# ==============================================================================
# apply-branding.sh — Apply ASKIA Light branding to the LibreChat repository
#
# This script patches files in the client/ directory BEFORE the Docker image is built.
# It is idempotent — safe to run multiple times.
#
# What it does:
#   1. Copies favicon, logo, and apple-touch-icon assets
#   2. Merges i18n translation overrides into the English locale JSON file
#   3. CSS overrides (reserved for future use — currently skipped)
#   4. Patches hardcoded external links and source references
#   5. Adds Privacy & Terms links to the account settings menu
#
# Usage:
#   bash scripts/apply-branding.sh
#
# Run from the librechat repo root.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BRANDING_DIR="${ROOT_DIR}/config/branding"
ASSETS_DIR="${ROOT_DIR}/client/public/assets"
LOCALES_DIR="${ROOT_DIR}/client/src/locales"
INDEX_HTML="${ROOT_DIR}/client/index.html"

echo "==========================================="
echo "Applying ASKIA Light branding"
echo "==========================================="
echo "  Branding dir: ${BRANDING_DIR}"
echo "  LibreChat dir: ${ROOT_DIR}"
echo ""

# --------------------------------------------------------------------------
# 1. Copy image assets (favicon, logo, apple-touch-icon)
# --------------------------------------------------------------------------
echo "[1/5] Copying image assets..."
ASSET_COUNT=0

# Direct name-match assets (same filename in branding/ and assets/)
for file in favicon-16x16.png favicon-32x32.png favicon.ico android-chrome-192x192.png android-chrome-512x512.png; do
  if [ -f "${BRANDING_DIR}/${file}" ]; then
    cp "${BRANDING_DIR}/${file}" "${ASSETS_DIR}/${file}"
    echo "  ✓ ${file}"
    ASSET_COUNT=$((ASSET_COUNT + 1))
  fi
done

# Apple touch icon — accept either naming convention
if [ -f "${BRANDING_DIR}/apple-touch-icon-180x180.png" ]; then
  cp "${BRANDING_DIR}/apple-touch-icon-180x180.png" "${ASSETS_DIR}/apple-touch-icon-180x180.png"
  echo "  ✓ apple-touch-icon-180x180.png"
  ASSET_COUNT=$((ASSET_COUNT + 1))
elif [ -f "${BRANDING_DIR}/apple-touch-icon.png" ]; then
  cp "${BRANDING_DIR}/apple-touch-icon.png" "${ASSETS_DIR}/apple-touch-icon-180x180.png"
  echo "  ✓ apple-touch-icon.png → apple-touch-icon-180x180.png"
  ASSET_COUNT=$((ASSET_COUNT + 1))
fi

# Logo — accept SVG or PNG (PNG requires patching AuthLayout.tsx)
LOGO_FORMAT=""
if [ -f "${BRANDING_DIR}/logo.svg" ]; then
  cp "${BRANDING_DIR}/logo.svg" "${ASSETS_DIR}/logo.svg"
  echo "  ✓ logo.svg"
  LOGO_FORMAT="svg"
  ASSET_COUNT=$((ASSET_COUNT + 1))
elif [ -f "${BRANDING_DIR}/logo.png" ]; then
  cp "${BRANDING_DIR}/logo.png" "${ASSETS_DIR}/logo.png"
  echo "  ✓ logo.png"
  LOGO_FORMAT="png"
  ASSET_COUNT=$((ASSET_COUNT + 1))
fi

if [ "${ASSET_COUNT}" -eq 0 ]; then
  echo "  (no image assets found — add PNG/SVG files to config/branding/)"
fi

# --------------------------------------------------------------------------
# 2. Merge i18n translation overrides
# --------------------------------------------------------------------------
echo ""
echo "[2/5] Merging i18n overrides (en locale only)..."
I18N_OVERRIDES="${BRANDING_DIR}/i18n-overrides.json"
if [ -f "${I18N_OVERRIDES}" ]; then
  # Check for jq (preferred) or fall back to Node.js
  if command -v jq >/dev/null 2>&1; then
    MERGE_CMD="jq"
  elif command -v node >/dev/null 2>&1; then
    MERGE_CMD="node"
  else
    echo "  ERROR: Neither jq nor node found. Cannot merge i18n overrides."
    echo "  Install jq: brew install jq"
    exit 1
  fi

  # Merge into the English locale only (overrides contain English strings)
  EN_LOCALE_FILE="${LOCALES_DIR}/en/translation.json"
  if [ -f "${EN_LOCALE_FILE}" ]; then
    if [ "${MERGE_CMD}" = "jq" ]; then
      # jq: merge overrides on top of existing (overrides win)
      jq -s '.[0] * .[1]' "${EN_LOCALE_FILE}" "${I18N_OVERRIDES}" > "${EN_LOCALE_FILE}.tmp"
      mv "${EN_LOCALE_FILE}.tmp" "${EN_LOCALE_FILE}"
    else
      # Node.js fallback
      node -e "
        const fs = require('fs');
        const base = JSON.parse(fs.readFileSync('${EN_LOCALE_FILE}', 'utf8'));
        const overrides = JSON.parse(fs.readFileSync('${I18N_OVERRIDES}', 'utf8'));
        Object.assign(base, overrides);
        fs.writeFileSync('${EN_LOCALE_FILE}', JSON.stringify(base, null, 2) + '\n');
      "
    fi
    echo "  ✓ Merged overrides into en locale"
  else
    echo "  WARNING: ${EN_LOCALE_FILE} not found — skipping i18n merge"
  fi
else
  echo "  (no i18n-overrides.json found — skipping)"
fi

# --------------------------------------------------------------------------
# 3. CSS overrides (currently disabled — reserved for future use)
# --------------------------------------------------------------------------
echo ""
echo "[3/5] CSS overrides: skipped (reserved for future use)"

# --------------------------------------------------------------------------
# 4. Patch hardcoded external links and source references
# --------------------------------------------------------------------------
echo ""
echo "[4/5] Patching hardcoded links and source references..."
PATCHES_APPLIED=0

# Remove link to code.librechat.ai/pricing in ApiKeyDialog
API_KEY_DIALOG="${ROOT_DIR}/client/src/components/SidePanel/Agents/Code/ApiKeyDialog.tsx"
if [ -f "${API_KEY_DIALOG}" ]; then
  if grep -q "code.librechat.ai" "${API_KEY_DIALOG}"; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' 's|https://code.librechat.ai/pricing|#|g' "${API_KEY_DIALOG}"
    else
      sed -i 's|https://code.librechat.ai/pricing|#|g' "${API_KEY_DIALOG}"
    fi
    echo "  ✓ Removed code.librechat.ai link from ApiKeyDialog"
    PATCHES_APPLIED=$((PATCHES_APPLIED + 1))
  else
    echo "  ✓ ApiKeyDialog already patched"
  fi
fi

# If logo is PNG, patch AuthLayout.tsx to reference logo.png instead of logo.svg
if [ "${LOGO_FORMAT}" = "png" ]; then
  AUTH_LAYOUT="${ROOT_DIR}/client/src/components/Auth/AuthLayout.tsx"
  if [ -f "${AUTH_LAYOUT}" ]; then
    if grep -q 'assets/logo\.svg' "${AUTH_LAYOUT}"; then
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' 's|assets/logo\.svg|assets/logo.png|g' "${AUTH_LAYOUT}"
      else
        sed -i 's|assets/logo\.svg|assets/logo.png|g' "${AUTH_LAYOUT}"
      fi
      echo "  ✓ Patched AuthLayout.tsx: logo.svg → logo.png"
      PATCHES_APPLIED=$((PATCHES_APPLIED + 1))
    else
      echo "  ✓ AuthLayout.tsx already uses logo.png"
    fi
  fi
fi

if [ "${PATCHES_APPLIED}" -eq 0 ]; then
  echo "  (no link patches needed)"
fi

# --------------------------------------------------------------------------
# 5. Add Privacy & Terms links to AccountSettings menu
# --------------------------------------------------------------------------
echo ""
echo "[5/5] Adding Privacy & Terms links to user menu..."
ACCOUNT_SETTINGS="${ROOT_DIR}/client/src/components/Nav/AccountSettings.tsx"
if [ -f "${ACCOUNT_SETTINGS}" ]; then
  if ! grep -q "privacy_policy" "${ACCOUNT_SETTINGS}"; then
    echo "  Patching AccountSettings.tsx..."

    if ! command -v node >/dev/null 2>&1; then
      echo "  ERROR: node not found. Cannot patch AccountSettings.tsx."
      echo "  Install Node.js to enable this step."
      exit 1
    fi

    node -e "
      const fs = require('fs');
      let code = fs.readFileSync('${ACCOUNT_SETTINGS}', 'utf8');
      
      // 1. Add Shield and FileText icons to the import (FileText already imported)
      code = code.replace(
        \"import { FileText, LogOut } from 'lucide-react';\",
        \"import { FileText, LogOut, ShieldCheck, ScrollText } from 'lucide-react';\"
      );
      
      // 2. Add Privacy Policy and Terms of Service menu items before Settings
      // Find the Settings menu item and insert before it
      const settingsItem = \`<Select.SelectItem
          value=\"\"
          onClick={() => setShowSettings(true)}
          className=\"select-item text-sm\"
        >
          <GearIcon className=\"icon-md\" aria-hidden=\"true\" />
          {localize('com_nav_settings')}
        </Select.SelectItem>\`;
      
      const linksWithSettings = \`{startupConfig?.interface?.privacyPolicy?.externalUrl && (
          <Select.SelectItem
            value=\"\"
            onClick={() =>
              window.open(
                startupConfig.interface.privacyPolicy.externalUrl,
                startupConfig.interface.privacyPolicy.openNewTab ? '_blank' : '_self',
              )
            }
            className=\"select-item text-sm\"
          >
            <ShieldCheck className=\"icon-md\" aria-hidden=\"true\" />
            {localize('com_ui_privacy_policy')}
          </Select.SelectItem>
        )}
        {startupConfig?.interface?.termsOfService?.externalUrl && (
          <Select.SelectItem
            value=\"\"
            onClick={() =>
              window.open(
                startupConfig.interface.termsOfService.externalUrl,
                startupConfig.interface.termsOfService.openNewTab ? '_blank' : '_self',
              )
            }
            className=\"select-item text-sm\"
          >
            <ScrollText className=\"icon-md\" aria-hidden=\"true\" />
            {localize('com_ui_terms_of_service')}
          </Select.SelectItem>
        )}
        <Select.SelectItem
          value=\"\"
          onClick={() => setShowSettings(true)}
          className=\"select-item text-sm\"
        >
          <GearIcon className=\"icon-md\" aria-hidden=\"true\" />
          {localize('com_nav_settings')}
        </Select.SelectItem>\`;
      
      code = code.replace(settingsItem, linksWithSettings);
      
      fs.writeFileSync('${ACCOUNT_SETTINGS}', code);
      console.log('  ✓ Added Privacy Policy and Terms of Service links');
    "
    
    PATCHES_APPLIED=$((PATCHES_APPLIED + 1))
  else
    echo "  ✓ AccountSettings.tsx already patched"
  fi
fi

echo ""
echo "==========================================="
echo "Branding applied successfully!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "  • For ACA: run 'azd up' (hook runs this script automatically)"
echo "  • For local dev: cd librechat && npm run frontend"
echo ""
