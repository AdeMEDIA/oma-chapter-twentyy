# Chapter Twenty soundtrack

The soundtrack uses Ade’s supplied `ORENTE.mp3`, copied unchanged into `public/audio/orente.mp3`. Its URL is set in `birthday.song` in `src/data/birthday.js`. Title and artist are in `birthday.soundtrack`.

Orente starts at 35% volume on the visitor’s first tap or key press, as required for audible playback by mobile browsers. It loops and continues between pages and during the film until the visitor turns it off. The record-player hotspot and header sound buttons also start or pause it directly. Pause/resume preserves the position. Closing the card stops the song and returns it to the beginning.

The visitor’s explicit on/off choice is stored as `oma-music-preference-v1` in local storage. An off choice survives navigation and reload; only explicitly turning music back on enables it again. Playback still works if browser storage is unavailable.

The film keeps its own original audio and independent controls. Playing it no longer pauses background music, and starting background music no longer pauses the film, following Ade’s updated preference. Both tracks can therefore be audible until the visitor pauses one.

The burgundy music card is now 290 pixels wide and approximately 208 pixels high, with 44-pixel touch controls and the same gold details and dedication.

The card appears when music starts, hides after 4 seconds, and reappears for 4 seconds every 30 seconds while the song plays. Hiding the card does not pause, reset or reload the audio. The header and record-player controls stay available. Pointer activity extends the viewing time; keyboard focus keeps the controls visible until focus leaves. Pausing music shows brief feedback and stops periodic reminders. The explicit close/stop button still stops the song. Errors remain available for retry rather than starting periodic reminders.

Timer, uninterrupted playback, remembered off, keyboard focus and scrapbook checks passed on phone and desktop. Results are in `review-artifacts/music-card-timer-report.json`.

The audio uses `preload="none"`, so the MP3 is not downloaded during the initial room load. Errors show a retry button. Pending play requests are cancelled safely when paused or closed.

The YouTube embed, SDK, links and fallback have been removed. Playback uses only the MP3 hosted with the site. Nothing has been published.
