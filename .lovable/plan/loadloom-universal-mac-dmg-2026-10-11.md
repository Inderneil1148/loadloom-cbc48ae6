# LoadLoom Universal Mac DMG

## Goal
Deliver one real `LoadLoom.dmg` with the LoadLoom logo that installs and runs on both Intel Macs and Apple Silicon Macs (M1 and newer), without using the Mac App Store.

## Confirmed starting point
- The current Mac downloads are two ZIP files: one Intel build and one Apple Silicon build.
- The Download page and protected download endpoint currently allow those two ZIP filenames, not a DMG.
- A native LoadLoom `.icns` icon is already present in the project.
- The current environment is Linux and does not include Apple's `hdiutil`, `codesign`, or notarization tools, so a genuine DMG must be assembled and tested on macOS rather than simulated here.
- The first release will be unsigned, as selected. macOS will therefore require right-click → Open on first launch.

## Implementation

1. **Create the maintainable Mac desktop source**
   - Add a checked-in Electron entry point and package configuration instead of relying on temporary packaging files.
   - Load the live LoadLoom application so sign-in, data, plans, uploads, printing, and future web updates remain shared with `loadloom.online`.
   - Use the LoadLoom icon for the app, Dock, Finder, and DMG presentation.
   - Set a practical desktop window size and minimum size, preserve session storage, support print shortcuts, open external links in the default browser, and show a clear offline/retry screen.

2. **Harden the desktop shell**
   - Keep renderer isolation, sandboxing, and Node access disabled.
   - Restrict in-app navigation to LoadLoom and the required sign-in return flow; open unrelated destinations externally.
   - Deny unexpected permission requests and new windows.
   - Ensure no backend secret, signing key, session, or private credential is packaged.

3. **Build one universal application**
   - Package separate `darwin-x64` and `darwin-arm64` `.app` bundles with the same bundle identifier and version.
   - Merge them into one universal macOS application containing both architectures.
   - Verify the main executable and required native helpers report both `x86_64` and `arm64` slices.

4. **Create a genuine DMG on macOS**
   - Add a macOS release workflow that uses Apple’s native disk-image tooling to create `LoadLoom.dmg`.
   - Present the LoadLoom app and an Applications-folder shortcut in the DMG for drag-and-drop installation.
   - Use a branded volume name and icon, and produce a checksum for integrity verification.
   - Keep signing/notarization configuration ready but disabled until Apple Developer credentials are supplied securely.

5. **Confirm both chip families**
   - Run installation and launch smoke tests on an Intel macOS runner and an Apple Silicon macOS runner.
   - On each architecture, verify launch, LoadLoom page loading, sign-in screen, window resizing, external links, print command, quit/reopen, and session persistence.
   - Treat architecture inspection alone as insufficient; report compatibility only after both launch checks pass.

6. **Replace the public Mac download**
   - Upload the verified universal DMG to the existing private app-download storage.
   - Add only `LoadLoom.dmg` to the download endpoint allow-list and remove the two old Mac ZIP options from the Download page.
   - Update instructions to drag LoadLoom into Applications, then right-click → Open for the unsigned first launch.
   - Verify the public Download button returns the DMG with a safe, temporary download link.

## Release criteria
- Finder and Dock display the LoadLoom logo.
- The DMG opens with a working drag-to-Applications layout.
- The application binary contains Intel and Apple Silicon slices.
- The installed app launches successfully on both Intel and M-chip macOS test environments.
- Security settings remain hardened and no private material is bundled.
- The Download page serves the universal DMG instead of the two Mac ZIPs.

## Known limitation
Because this first release is unsigned, Gatekeeper will show a first-launch warning. A warning-free double-click installation requires an Apple Developer ID certificate and Apple notarization in a later release.
