# LoadLoom as an app for Mac, iPhone and Android, with no app stores

## What's possible on each device

| Device | Without an app store | What people will see |
|---|---|---|
| MacBook | A downloadable LoadLoom app | It opens in its own window with the LoadLoom icon. The first time, macOS warns that it comes from an unidentified developer, so the user right-clicks it and picks Open once. |
| Android | A downloadable APK file plus the home-screen install | Installing the APK means allowing "install unknown apps" once. The home-screen install already works from Chrome. |
| iPhone | The home-screen app only | Apple doesn't allow installing app files from outside the App Store (TestFlight still goes through Apple). Safari's Share → Add to Home Screen gives a full-screen app with the LoadLoom icon, and that already works today. |

Every version opens the live site, loadloom.online. Data, sign-in and plans therefore stay the same everywhere, and every update you publish reaches all versions automatically, with nothing to reinstall.

## What I'll build
1. **Mac app**: a LoadLoom desktop app for both Apple Silicon and Intel Macs, delivered as a .zip you can download. A true .dmg installer has to be made on a Mac, so I'll package the app as a .zip and give you the single command to turn it into a .dmg on your MacBook if you want one.
2. **Android app (.apk)**: a LoadLoom APK that opens the live site full-screen. If the Android build tools can't run in my workspace, I'll tell you and point you to PWABuilder, a free Microsoft tool that turns loadloom.online into a ready-to-install APK in a few clicks.
3. **"Get the app" page** at /download. It has Mac and Android download buttons and step-by-step iPhone instructions (Share → Add to Home Screen). It will be linked in the site footer.
4. I'll leave the current home-screen install (including the small one-time pop-up) as it is.

## Limits to know
- Without paid Apple ($99/year) and Google developer accounts, both the Mac app and the APK show a one-time "unknown developer" warning. I'll write the bypass steps on the download page.
- None of these work offline. They need internet, just like the website.

## Technical details
- Mac: Electron wrapper (`electron/main.cjs`) that loads `https://loadloom.online` in a BrowserWindow with contextIsolation on and external links opened in the browser. Packaged with `@electron/packager` for darwin x64 and arm64, zipped. The `hdiutil create` command for making a .dmg goes on the download page.
- Android: Capacitor or a TWA-style wrapper pointing at the live URL, built with the Android SDK through nix, producing a debug-signed APK. If the SDK or Gradle won't run, fall back to PWABuilder using the existing manifest.
- Binaries are served from `public/downloads/` so the /download buttons work. Copies also go to Files.
- New route `src/routes/download.tsx` with its own head metadata, plus a footer link in SiteShell.
