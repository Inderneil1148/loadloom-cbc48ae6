# LoadLoom Desktop and Android Release Hardening

## Goal
Rebuild the downloadable apps with the LoadLoom logo, make the Mac app a complete desktop experience, and run a release-quality security and layout pass across the existing product. Mac will ship separately for Apple Silicon and Intel and will be prepared for future Apple signing/notarization.

## Current findings
- The download page already offers Apple Silicon Mac, Intel Mac, Windows, and Android files through a fixed download allow-list.
- The generated desktop/Android source is not currently kept in the project, so the packages cannot be reproduced or maintained from the checked-in source. This pass will add a reproducible app-shell setup.
- The latest database scan found no active findings. Its only warning is the previously reviewed public read access for plan prices/limits, which remains intentionally ignored.
- The dependency audit currently reports five advisories: high-severity issues through the MCP package, Tailwind build tooling, and TanStack Start, plus one moderate MCP development-server issue. These will be upgraded or otherwise removed from the shipped dependency path where compatible, then rescanned.

## Work plan

### 1. Brand every downloadable app
- Create proper icon sets from the existing LoadLoom logo:
  - macOS `.icns`, including required Retina sizes.
  - Windows `.ico`, including small and high-resolution sizes.
  - Android launcher icons and adaptive foreground/background icons.
- Apply the icons to app windows, files, Dock/taskbar entries, Android launcher, and package metadata.
- Keep the website/PWA icons aligned with the same source artwork.

### 2. Build a maintainable desktop app shell
- Add checked-in desktop packaging source rather than relying on temporary package files.
- Use one hardened desktop shell for Mac and Windows that opens the full LoadLoom application, preserving sign-in, all pages, live data, printing, downloads, and external links.
- Add desktop behavior expected on Mac: resizable window, sensible minimum size, native application menu, keyboard shortcuts, print support, safe external-browser handling, session persistence, and clear offline/error states.
- Keep Electron protections enabled: context isolation, no Node access in pages, sandboxing, restricted navigation/new windows, limited permissions, and no unnecessary preload bridge.
- Produce separate macOS builds for:
  - Apple Silicon: arm64, ready for M1 and newer chips.
  - Intel: x64.
- Prepare hardened-runtime, signing identity, entitlements, and notarization configuration without storing certificates or Apple credentials. Until those credentials are supplied, downloads remain unsigned and retain the first-open instructions.
- Rebuild the Windows x64 package using the same hardened shell.

### 3. Rebuild and brand Android
- Add maintainable Android wrapper source and apply the adaptive LoadLoom launcher icon.
- Preserve secure HTTPS-only loading, file upload, back navigation, authentication sessions, downloads, printing/share behavior where supported, and orientation/layout changes.
- Rebuild the APK with the existing release identity where available, so future upgrades can install over the current app. Keep signing material private and outside downloadable/public files.

### 4. Desktop-first alignment pass
- Test every public, authentication, account, operations, reporting, billing, help, settings, and admin page at representative Mac window sizes, including narrow split-screen and large desktop widths.
- Rework shared desktop presentation where needed: sidebar/header consistency, usable data tables, fixed action columns, horizontal overflow, dialogs, forms, charts, print views, loading/empty/error states, and long text/amounts.
- Preserve the existing mobile-first behavior while giving Mac users true desktop table layouts rather than stretched mobile cards.
- Verify keyboard-only navigation, visible focus, Escape handling, tab order, zoom, contrast, and reduced-motion behavior.

### 5. Security hardening and audit
- Upgrade vulnerable production dependency paths where compatible; if an upstream fix is unavailable, isolate or remove the affected runtime path rather than claiming it is fixed.
- Re-run dependency and backend security scans after changes. Do not reopen or alter the intentionally ignored public plan-settings rule.
- Audit the desktop and Android shells for navigation restrictions, permissions, remote-content isolation, credential handling, download safety, external links, and update/package integrity.
- Confirm no private key, Android signing password, Apple certificate, session token, or backend secret is bundled into downloads or exposed by the public download endpoint.
- Keep download filenames allow-listed and return safe headers/errors.

### 6. Release verification and replacement downloads
- Exercise sign-in and the full authenticated workflow in the packaged desktop app: dashboard, add/edit flows, tables, status changes, uploads, maps, billing, notifications, print, logout, and reopening with a remembered session.
- Smoke-test the Android APK flows and all four download links.
- Verify Mac arm64/x64 and Windows package architecture, icons, launch behavior, navigation, and packaged contents.
- Replace the existing hosted files with the rebuilt packages and verify `/download` serves the new versions.
- Report any remaining owner-only release blockers explicitly, especially Apple Developer credentials required for actual signing/notarization.

## Deliverables
- Branded Mac Apple Silicon ZIP.
- Branded Mac Intel ZIP.
- Branded Windows ZIP.
- Branded Android APK.
- Reproducible desktop and Android wrapper source in the project.
- Updated download page instructions if signing status or filenames change.
- Final security scan and cross-page QA result with unresolved blockers clearly listed.

## Boundaries
- No App Store or Play Store submission.
- No redesign or unrelated product features.
- iPhone remains the existing Add to Home Screen experience.
- Apple notarization cannot be completed without the owner’s Apple Developer identity and signing credentials; the project will be ready for them, but secrets will not be committed.
