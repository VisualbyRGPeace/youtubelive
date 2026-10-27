# Gọn — YouTube and TikTok mini player

A compact Vietnamese-language player. Paste a YouTube link, YouTube embed code, or a full TikTok video link to open it in a floating window.

## Use

1. Open GitHub Pages in Chrome or Edge on desktop.
2. Paste a YouTube link/embed or a TikTok video link such as `https://www.tiktok.com/@creator/video/1234567890`.
3. The app opens TikTok clips in a portrait floating window and YouTube clips in a landscape window.
4. Use the controls on the main page to play/pause, seek, adjust sound, lock the video, or move through a YouTube playlist.
5. TikTok related videos may appear when a clip ends; the official embedded player does not provide a full For You feed or a next-video API.
6. Use the transparency slider to make the video translucent.

## Notes

- TikTok playback uses TikTok's official Embed Player. No API key is required.
- TikTok's player supports play/pause, seek, mute/unmute, and related-video recommendations. The embed API only exposes mute/unmute, so the app volume slider toggles sound rather than setting an exact volume level for TikTok.
- Short TikTok redirect links may not contain a video ID. Use the full `@creator/video/ID` URL or TikTok's embed link.
- The floating window displays only the player; controls are on the main page.
- Locking blocks interaction with the embedded video. The browser's own PiP window controls remain available.
- The website cannot make the floating window click-through to another application.
- The app streams directly from the original platform and does not download videos.
