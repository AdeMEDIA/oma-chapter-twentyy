# Chapter Twenty soundtrack

The site uses Ade's supplied MP3 at `public/audio/orente.mp3`. The original file is unchanged; its URL and credits remain in `src/data/birthday.js`. There are no YouTube embeds or external music requests.

On a fresh browsing session, the welcome dialog offers **Enter with music** and **Continue quietly**. Only an explicit music control calls `audio.play()`. Choosing quiet, scrolling, opening a photograph, or pressing an unrelated key does not start music. The session choice prevents the introduction from repeating during internal navigation. Reloading does not attempt audible autoplay, even when the welcome choice is remembered.

`SoundtrackProvider` owns one persistent, looping `<audio preload="none">` above the hash routes. The soundtrack keeps its position when navigating. Closing the player with X or Escape only dismisses the controls; it never pauses, reloads or seeks the track. The compact launcher and the header's music button reopen the controls without restarting playback. There are no recurring player popups.

The header and player transport reflect audio playback events, including loading, pause, buffering and errors. Pause/resume preserves the current position. Failed requests have a retry control. Playback requests are guarded so rapid toggles do not create competing audio instances.

Volume starts at 35%, can be adjusted or muted, and is remembered for the current browsing session when storage is available. The page remains usable when browser storage is unavailable. Reduced motion removes decorative playback and welcome animations.

The birthday film retains its complete original audio and native video controls. Its audio and the background soundtrack remain independently controlled, following Ade's earlier preference. Visitors can pause either track if both are playing.

Local regression results are recorded in `review-artifacts/music-welcome-report.json`. Browser automation is not a substitute for checking audio output and hardware volume behavior on a physical phone. See `RELEASE-CHECKLIST.md` for the release verification record.
