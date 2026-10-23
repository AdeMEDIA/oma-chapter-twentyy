# Chapter Twenty soundtrack

The site uses Ade's supplied MP3 at `public/audio/orente.mp3`. The original file is unchanged; its URL and credits remain in `src/data/birthday.js`. There are no YouTube embeds or external music requests.

On a fresh browsing session, the welcome dialog offers **Enter with music** and **Continue quietly**. Only an explicit music control calls `audio.play()`. Choosing quiet, scrolling, opening a photograph, or pressing an unrelated key does not start music. The session choice prevents the introduction from repeating during internal navigation. Reloading does not attempt audible autoplay, even when the welcome choice is remembered.

`SoundtrackProvider` owns one persistent, looping `<audio preload="none">` above the hash routes. The soundtrack keeps its position when navigating. Closing the player with X or Escape only dismisses the controls; it never pauses, reloads or seeks the track. The compact launcher and the header's music button reopen the controls without restarting playback. There are no recurring player popups.

The player transport reflects audio playback events, including loading, pause, buffering and errors. Pause/resume preserves the current position. Failed requests have a retry control. Playback requests are guarded so rapid toggles do not create competing audio instances. Starting or pausing the track does not open the panel. The room's Orente label opens the same player without changing playback.

The welcome uses two perspective doors with finite lighting, particles and room reveals. Both entrance choices use the same 2.6-second sequence; reduced motion uses a 220ms fade. Music starts directly within the click handler, before the entrance completes. The dialog is removed after completion and never replays on ordinary route changes.

At widths up to 1000px, a 72px dock plus the bottom safe area reserves room for one circular control. The page scrolls above it, so controls are never underneath the music button. Desktop retains document scrolling and one header Orente trigger. The expanded player is a native dialog with keyboard focus wrapping, Escape dismissal and trigger-focus restoration. Its instruction reads: “Tap × to hide this player. Your music will keep playing.”

Volume starts at 35%, can be adjusted or muted, and is remembered for the current browsing session when storage is available. If a browser delegates volume to the device, the player shows a hardware-volume instruction instead of a nonfunctional slider. The page remains usable when browser storage is unavailable. Reduced motion removes decorative playback and welcome animations.

The birthday film retains its complete original audio and native video controls. Its audio and the background soundtrack remain independently controlled, following Ade's earlier preference. Visitors can pause either track if both are playing.

Latest local regression results and the reproducible harness are in `review-artifacts/final-entrance/`. Chromium and Windows WebKit passed all 880 checks, plus 27 focused integration checks. Browser automation is not a substitute for checking audio output and hardware volume behavior on a physical phone. Recovery commands are documented in README.md.
