# druid web

A web-based editor and REPL for [monome crow](https://github.com/monome/crow) using the Web Serial API. Inspired by [maiden](https://github.com/monome/maiden), the norns web editor.

## Overview

**druid web** provides a browser-based interface for writing, editing, and running Lua scripts on crow devices over USB. It features a split-screen layout with a Monaco code editor on the left and an output/input REPL on the right, similar to maiden's interface.

## Features

- 🎨 **Maiden-inspired interface** - Clean, minimal design matching maiden's aesthetic
- 📝 **Monaco code editor** - Full-featured editor with syntax highlighting for Lua
- 📡 **Direct USB connection** - Connect to crow via Web Serial API
- 💻 **Split-screen layout** - Code editor on left, REPL output/input on right
- ▶️ **Run & upload scripts** - Execute scripts immediately or save to crow's flash
- 💾 **File operations** - Open, edit, and save Lua scripts locally
- ⌨️ **Keyboard shortcuts** - ⌘P to run, ⌘S to save
- 🔄 **Resizable panes** - Adjust editor/REPL split to your preference
- 📜 **Dual REPL tabs** - Separate output view and multi-line input area

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

## Usage

### Connecting to crow

1. Click **"connect"** button in the toolbar
2. Select your crow device from the browser's serial port picker
3. Grant permission to access the device
4. The status indicator will turn teal when connected

### Code Editor

The left pane contains a full Monaco code editor:

- Write Lua scripts with syntax highlighting
- Use standard editor features (find, replace, etc.)
- Scripts start with a basic template
- Modified indicator (•) appears when unsaved

**Editor actions:**
- **New** - Create a new script (⌘N to clear)
- **Open** - Load a .lua file from your computer
- **Save** - Download current script to your computer (⌘S)
- **▶ Run** - Execute the script on crow without saving (⌘P)
- **↑ Upload** - Save script to crow's flash memory

### REPL Tabs

The right pane has two tabs:

**Output tab** - View crow's responses and print statements
- Auto-scrolls to newest output
- Shows script execution feedback
- Displays errors and messages from crow

**Input tab** - Multi-line Lua code entry
- Write and test code snippets
- Press ⌘Enter (or Ctrl+Enter) to execute
- Useful for quick commands without editing the main script

### Crow System Commands

You can send special commands to crow:

- `^^v` - Print firmware version
- `^^p` - Print current userscript
- `^^r` - Reset/reboot crow
- `^^k` - Kill/restart Lua environment
- `^^i` - Print identity (serial number)
- `^^c` - Clear userscript
- `^^b` - Enter bootloader mode

Type these in the input tab and press ⌘Enter.

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
| Code editor | External | ✅ Built-in Monaco editor |
| REPL | ✅ | ✅ Split view with tabs |
| Run scripts | ✅ | ✅ One-click execution |
| Upload scripts | ✅ | ✅ Upload & save |
| Download scripts | ✅ | ❌ (open local files instead) |
| Firmware updates | ✅ | ❌ DFU not accessible |
| WebSocket server | ✅ | ❌ |
| Installation required | ✅ (Python) | ❌ (just open in browser) |
| Works offline | ✅ | ✅ (after loading page) |
| Multi-file projects | ✅ | ❌ Single file editing |
| Split-screen view | ❌ | ✅ Editor + REPL |
| Syntax highlighting | Depends on editor | ✅ Built-in |

## License

Same as druid - see LICENSE file in the repository root.

## Links

- [monome crow](https://monome.org/docs/crow/)
- [crow firmware](https://github.com/monome/crow)
- [druid (CLI)](https://github.com/monome/druid)
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
