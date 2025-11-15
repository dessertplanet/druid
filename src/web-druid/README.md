# druid web

A web-based editor and REPL for [monome crow](https://github.com/monome/crow) and compatible devices like [blackbird](https://github.com/TomWhitwell/Workshop_Computer) using the Web Serial API. Inspired by [maiden](https://github.com/monome/maiden), the norns web editor.

## Overview

**druid web** provides a browser-based interface for writing, editing, and running Lua scripts on crow devices over USB. It features a split-screen layout with a Monaco code editor on the left and an output/input REPL on the right, similar to maiden's interface.

## Features

- 🎨 **Maiden-inspired interface** - Clean, minimal macOS dark mode aesthetic
- 📝 **Monaco code editor** - Full-featured editor with Lua syntax highlighting
- 🔍 **IntelliSense** - Autocomplete for crow and blackbird APIs with signature help
- ✅ **Syntax validation** - Real-time Lua syntax checking with error markers
- 🎯 **Bracket matching** - Auto-closing pairs and colorized bracket pairs
- 📡 **Direct USB connection** - Connect to crow/blackbird via Web Serial API
- 💻 **Split-screen layout** - Code editor on left, REPL output/input on right
- 🔀 **Toggle editor** - Hide editor for REPL-only mode
- ▶️ **Run & upload scripts** - Execute scripts immediately or save to flash
- 📤 **Send selection to crow** - Right-click or ⌘Enter to execute selected code
- 💾 **File operations** - Open, edit, save, and rename Lua scripts
- 🗂️ **Drag & drop** - Drop .lua files on editor to open, or on REPL to upload
- ⌨️ **Keyboard shortcuts** - ⌘P to run, ⌘S to save, ⌘Enter to send selection
- 🔄 **Resizable panes** - Adjust editor/REPL split to your preference
- 🌓 **macOS dark theme** - Carefully crafted dark mode color scheme

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
cd src/web-druid
open index.html  # macOS
# or
xdg-open index.html  # Linux
# or double-click the file in Windows
```

### Option 2: Serve with Local Server

For a better development experience, serve the files with a local HTTP server:

```bash
cd src/web-druid

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

### Connecting to crow or blackbird

1. Click **"connect"** button in the top-right header
2. Select your crow/blackbird device from the browser's serial port picker
3. Grant permission to access the device
4. The status pill will turn teal and show "connected"

### Code Editor

The left pane contains a full Monaco code editor with advanced features:

**Editor features:**
- Lua syntax highlighting and validation
- Real-time error checking with red squiggly underlines
- Autocomplete for crow and blackbird APIs (Ctrl+Space)
- Signature help showing function parameters as you type
- Bracket matching and auto-closing pairs
- Colorized bracket pairs for easier nesting
- Modified indicator (•) appears in title when unsaved

**Editor actions:**
- **New** - Create a new script
- **Open** - Load a .lua file from your computer
- **Save** - Download current script to your computer (⌘S)
- **Rename** - Change the script filename
- **▶ Run** - Execute the script on crow without saving to flash (⌘P)
- **↑ Upload** - Save script to crow's flash memory

**Send selection to crow:**
- Select code in the editor and press **⌘Enter** (or **Ctrl+Enter**)
- Or right-click selected code and choose "Send Selection to Crow"
- If nothing is selected, sends the current line
- Perfect for testing individual functions or code snippets

**Toggle editor:**
- Use the switch in the top-right to hide/show the editor pane
- Useful for REPL-only workflows

### REPL

The right pane provides interactive command execution:

- View crow's responses and print statements
- Auto-scrolls to newest output
- Shows script execution feedback
- Multi-line input with **Shift+Enter** for newlines
- Press **Enter** to execute code
- **Help** button shows druid command reference
- **Clear** button clears output history

### Drag & Drop

**Drop files to auto-load or auto-upload:**
- Drop a `.lua` file on the **editor pane** → Opens the file in the editor
- Drop a `.lua` file on the **REPL pane** → Uploads directly to crow's flash

### Autocomplete & IntelliSense

The editor includes comprehensive API documentation:

**Crow APIs:**
- `input[n]` - Input queries, modes, and event handlers
- `output[n]` - Output voltages, slew, shapes, scales, actions
- `lfo()`, `pulse()`, `ar()`, `adsr()` - Output actions
- `metro[n]` - Timers and event scheduling
- `clock` - Tempo-based timing and coroutines
- `sequins` - Step sequencers
- `to()`, `loop{}` - ASL (a slope language)
- `ii.jf` - Just Friends i2c control
- And more...

**Blackbird APIs (Workshop Computer):**
- `bb.knob.main`, `bb.knob.x`, `bb.knob.y` - Read knob values
- `bb.switch` - Read 3-position switch
- `bb.pulsein[n]` - Pulse input detection with callbacks
- `bb.pulseout[n]` - Pulse output control with clock sync
- `bb.audioin[n]` - Audio input voltage reading
- `bb.noise()` - Audio-rate noise generation
- `bb.asap` - Fast-running control loop
- `bb.priority()` - Processing priority modes

**How to use:**
- Start typing and autocomplete suggestions appear automatically
- Press **Ctrl+Space** to manually trigger autocomplete
- When typing function calls, signature help shows parameter info
- Hover over suggestions to see detailed documentation

### Crow/Blackbird System Commands

You can send special commands to crow or blackbird in the REPL:

- `^^v` or `^^version` - Print firmware version
- `^^i` or `^^identity` - Print device identity/serial number
- `^^p` - Print current userscript from flash
- `^^k` or `^^kill` - Kill/restart Lua environment
- `^^r` or `^^restart` - Restart crow
- `^^b` or `^^bootloader` - Enter bootloader mode
- `^^c 1-4` - Calibrate input/output

Type these commands in the REPL input and press Enter.

## Keyboard Shortcuts

- **⌘P** / **Ctrl+P** - Run script (execute without saving to flash)
- **⌘S** / **Ctrl+S** - Save script to local file
- **⌘Enter** / **Ctrl+Enter** - Send selected code (or current line) to crow
- **Enter** - Execute REPL input
- **Shift+Enter** - New line in REPL input (without executing)

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
| Syntax highlighting | Depends on editor | ✅ Built-in Lua |
| Syntax validation | ❌ | ✅ Real-time error checking |
| Autocomplete | ❌ | ✅ Crow & Blackbird APIs |
| Signature help | ❌ | ✅ Parameter tooltips |
| REPL | ✅ | ✅ Integrated view |
| Run scripts | ✅ | ✅ One-click execution |
| Upload scripts | ✅ | ✅ Upload & save |
| Send selection | ❌ | ✅ Right-click or ⌘Enter |
| Drag & drop files | ❌ | ✅ Auto-open or upload |
| Download scripts | ✅ | ❌ (open local files instead) |
| Firmware updates | ✅ | ❌ DFU not accessible |
| WebSocket server | ✅ | ❌ |
| Installation required | ✅ (Python) | ❌ (just open in browser) |
| Works offline | ✅ | ✅ (after loading page) |
| Multi-file projects | ✅ | ❌ Single file editing |
| Split-screen view | ❌ | ✅ Editor + REPL |

## License

Same as druid - see LICENSE file in the repository root.

## Links

- [monome crow](https://monome.org/docs/crow/)
- [crow firmware](https://github.com/monome/crow)
- [blackbird for Workshop Computer](https://github.com/TomWhitwell/Workshop_Computer)
- [druid (CLI)](https://github.com/monome/druid)
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
