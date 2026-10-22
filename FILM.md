# Oma, on Film

Source: Ade’s `oma_on_film_with_orente.mp4`, copied unchanged to `public/videos/oma-on-film.mp4`. SHA-256: `aba27dba2e7ad85719c94cd73876093c5cc63305483801bb251ac9745da5c0f0`.

The 8.46 MB file is 960×540 (16:9), 77.75 seconds, with H.264 video and AAC audio. Its metadata is already at the beginning of the file for progressive playback. No audio, image framing or compression was changed.

`src/data/birthday.js` holds the film URL, poster URL and original dimensions. Update those fields together when replacing the film. The approximately 21 KB WebP poster was extracted from an uncropped frame of this film.

The player uses native play/pause, seek, volume and fullscreen controls with inline mobile playback. Mobile control appearance and hardware volume depend on the browser/OS. It uses metadata preloading, explicit dimensions and a reserved aspect ratio. The homepage loads neither the film nor its poster. A static blurred poster backdrop handles player space without decoding a second video. The film itself already contains blurred side backgrounds in some scenes.

`object-fit: contain` preserves the complete frame. Black bars embedded in the MP4 are part of the footage; CSS cannot remove them independently. No zoom or face cropping is applied. Native OS fullscreen may supply its own dark surround.

The opening title card says “Chapter Nineteen.” It is embedded in the supplied MP4. A corrected export is needed to change that wording; no title overlay was added to conceal it.

Verified in Edge/Chromium at six desktop, tablet, phone and landscape sizes: playback with original unmuted audio, volume changes, fullscreen, fixed player height, no page overflow, stopping when navigating away and error/retry. Physical Safari/iPhone playback has not been tested. Results are in `review-artifacts/film-report.json`.

Ade’s updated music preference removes the original automatic switching between film and background music. Neither player stops the other now; visitors control them independently. This behaviour was checked at phone, desktop and landscape sizes in `review-artifacts/music-preference-report.json`.
