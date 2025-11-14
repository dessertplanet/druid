# druid web

A web-based REPL for [monome crow](https://github.com/monome/crow) using the Web Serial API.

## Overview

**druid web** provides a browser-based interface for communicating with crow devices over USB. It replicates the core functionality of the command-line druid tool in a web application that runs entirely in your browser.

## Features

- 📡 Direct USB connection to crow via Web Serial API
- 💻 Interactive REPL for live coding
- 📁 Upload and run Lua scripts
- 🎨 Clean, terminal-inspired UI
- 📜 Command history (use ↑/↓ arrows)
- 🔌 Automatic reconnection support

## Browser Requirements

**druid web requires a Chromium-based browser** that supports the Web Serial API:

- ✅ Google Chrome (version 89+)
- ✅ Microsoft Edge (version 89+)
- ✅ Opera (version 75+)
- ❌ Firefox (not yet supported)
- ❌ Safari (not yet supported)

## Getting Started

### Option 1: Open Directly in Browser

Simply open `index.html` in a supported browser:

```bash
cd web
open index.html  # macOS
# or
xdg-open index.html  # Linux
# or double-click the file in Windows
```

### Option 2: Serve with Local Server

For a better development experience, serve the files with a local HTTP server:

```bash
cd web

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Usage

### Connecting to crow

1. Click **"Connect to crow"** button
2. Select your crow device from the browser's serial port picker
3. Grant permission to access the device
4. You should see "Connected!" and the status indicator will turn green

### Basic Commands

Type commands in the input field and press Enter:

```
> print("hello crow")
hello crow

> output[1].volts = 2.5

> for i=1,4 do print(i) end
1
2
3
4
```

### Special druid Commands

- `h` - Show help menu
- `p` - Print current userscript stored on crow
- `r` - Run the last script file
- `r <filename>` - Run a Lua file (opens file picker)
- `u` - Upload 'sketch.lua' (opens file picker)
- `u <filename>` - Upload a Lua file (opens file picker)
- `clear` - Clear the output window

### Crow System Commands

Prefix these commands with `^^`:

- `^^v` - Print firmware version
- `^^p` - Print current userscript
- `^^r` - Reset/reboot crow
- `^^k` - Kill/restart Lua environment
- `^^i` - Print identity (serial number)
- `^^c` - Clear userscript
- `^^b` - Enter bootloader mode

### File Operations

**Run a script** (temporary, not saved to flash):
1. Click "Run File" button or type `r` and press Enter
2. Select a `.lua` file from the file picker
3. The script executes immediately but is not saved

**Upload a script** (saved to flash, runs on boot):
1. Click "Upload File" button or type `u` and press Enter
2. Select a `.lua` file from the file picker
3. The script is uploaded and stored in crow's flash memory

## Limitations

Compared to the command-line version, druid web has some limitations:

### Not Supported
- **Firmware updates** - DFU mode requires native USB access
- **WebSocket server** - The command-line druid can act as a WebSocket bridge
- **Auto-discovery** - You must manually select the crow device each time

### Browser Restrictions
- Must grant permission for each session (security requirement)
- HTTPS required for non-localhost deployments
- Limited to Chromium-based browsers

## Deployment

To deploy druid web to a web server:

1. Upload all files (`index.html`, `druid.js`, `style.css`) to your server
2. Ensure your site is served over **HTTPS** (required for Web Serial API)
3. Users can then access the tool directly in their browser

Example deployment platforms:
- GitHub Pages (with HTTPS)
- Netlify
- Vercel
- Any static hosting with HTTPS

## Development

The project consists of three files:

- `index.html` - HTML structure and layout
- `druid.js` - Web Serial API integration and REPL logic
- `style.css` - Styling and theme

### Architecture

**CrowConnection class:**
- Manages Web Serial API connection
- Handles reading/writing to serial port
- Provides callbacks for data and connection events

**DruidRepl class:**
- Main application controller
- Handles UI interactions
- Processes commands and manages REPL state
- Coordinates file uploads and script execution

## Troubleshooting

### "Browser Not Supported" Error
Make sure you're using Chrome, Edge, or Opera (version 89+).

### Can't Find crow Device
- Verify crow is connected via USB
- Check that crow appears in your system's device list
- Try a different USB cable or port
- On Linux, you may need udev rules (same as command-line druid)

### Connection Drops
- Check USB cable connection
- Verify crow hasn't crashed (LED should be blinking)
- Click "Disconnect" then "Connect to crow" to reconnect

### Permission Denied
The browser requires explicit user permission to access serial ports. You must click the "Connect to crow" button and select the device from the picker each time you load the page.

## Comparison with Command-Line druid

| Feature | druid (CLI) | druid web |
|---------|-------------|-----------|
| REPL | ✅ | ✅ |
| Run scripts | ✅ | ✅ |
| Upload scripts | ✅ | ✅ |
| Download scripts | ✅ | ❌ |
| Firmware updates | ✅ | ❌ |
| WebSocket server | ✅ | ❌ |
| Cross-platform | ✅ | ✅ (Chrome-based browsers) |
| Installation required | ✅ (Python) | ❌ (just open in browser) |
| Works offline | ✅ | ✅ (after loading page) |

## License

Same as druid - see LICENSE file in the repository root.

## Links

- [monome crow](https://monome.org/docs/crow/)
- [crow firmware](https://github.com/monome/crow)
- [druid (CLI)](https://github.com/monome/druid)
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
