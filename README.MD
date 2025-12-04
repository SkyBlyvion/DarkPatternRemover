# Anti Dark Pattern Remover

Remove common dark patterns on the web: cookie walls, GDPR nags, blocking overlays, newsletter popups, and other intrusive overlays.

This extension is **privacy-friendly**, contains **no tracking**, and works fully **offline**.

## Features

- Removes cookie banners and consent overlays  
- Removes full-screen blocking modals and overlays  
- Removes newsletter / subscription popups  
- Restores page scrolling when a dark-pattern overlay blocked it  
- Works on dynamically loaded content (MutationObserver)  
- No external servers, no analytics, no data collection  

## How It Works

A content script runs on each page and:

1. Scans the DOM for elements that look like:
   - Cookie banners  
   - GDPR consent dialogs  
   - Privacy popups  
   - Newsletter / subscription overlays  
   - Full-screen overlays with typical text patterns  

2. Uses heuristics:
   - Text content (multi-language phrases: "we use cookies", "nous utilisons des cookies", etc.)  
   - ID / class names (`cookie-banner`, `consent`, `overlay`, `gdpr`, etc.)  
   - Layout: full-screen overlays, fixed/sticky, high `z-index`  

3. Removes or hides those elements and restores `overflow` on `<body>` / `<html>` when needed.

No data leaves your machine.

## Installation (Developer Mode)

1. Clone or download this repository.

2. Open Chrome and go to:

   ```text
   chrome://extensions
    ```
3. Enable "Developer mode" (top right).

4. Click "Load unpacked" and select the folder where you downloaded this repository.

5. The extension should now be installed and active.
