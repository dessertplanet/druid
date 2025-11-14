/**
 * druid web - Web-based REPL for monome crow
 * Uses Web Serial API to communicate with crow over USB
 */

class CrowConnection {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.readableStreamClosed = null;
        this.writableStreamClosed = null;
        this.onDataReceived = null;
        this.onConnectionChange = null;
    }

    async connect() {
        try {
            // Request a port from the user
            // Filter for crow's USB VID:PID (0483:5740 - STM32 CDC Device)
            this.port = await navigator.serial.requestPort({
                filters: [{ usbVendorId: 0x0483, usbProductId: 0x5740 }]
            });

            // Open the port with crow's settings
            await this.port.open({ 
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            this.isConnected = true;
            
            // Set up the text encoder/decoder for the streams
            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            const textEncoder = new TextEncoderStream();
            this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

            // Start reading
            this.startReading();

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }

            return true;
        } catch (error) {
            console.error('Connection error:', error);
            if (this.onConnectionChange) {
                this.onConnectionChange(false, error.message);
            }
            return false;
        }
    }

    async startReading() {
        try {
            while (this.isConnected) {
                const { value, done } = await this.reader.read();
                if (done) {
                    break;
                }
                if (value && this.onDataReceived) {
                    this.onDataReceived(value);
                }
            }
        } catch (error) {
            console.error('Read error:', error);
            if (this.isConnected) {
                await this.disconnect();
            }
        }
    }

    async write(data) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Not connected');
        }
        
        try {
            await this.writer.write(data);
        } catch (error) {
            console.error('Write error:', error);
            throw error;
        }
    }

    async writeLine(line) {
        await this.write(line + '\r\n');
    }

    async disconnect() {
        this.isConnected = false;

        if (this.reader) {
            await this.reader.cancel();
            await this.readableStreamClosed.catch(() => {});
        }

        if (this.writer) {
            await this.writer.close();
            await this.writableStreamClosed.catch(() => {});
        }

        if (this.port) {
            await this.port.close();
        }

        this.port = null;
        this.reader = null;
        this.writer = null;

        if (this.onConnectionChange) {
            this.onConnectionChange(false);
        }
    }
}

class DruidRepl {
    constructor() {
        this.crow = new CrowConnection();
        this.commandHistory = [];
        this.historyIndex = -1;
        this.lastScript = '';
        
        this.initializeUI();
        this.checkBrowserSupport();
        this.setupEventListeners();
    }

    initializeUI() {
        this.elements = {
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            input: document.getElementById('input'),
            output: document.getElementById('output'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            helpBtn: document.getElementById('helpBtn'),
            helpSection: document.getElementById('helpSection'),
            closeHelp: document.getElementById('closeHelp'),
            clearBtn: document.getElementById('clearBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            runBtn: document.getElementById('runBtn'),
            fileInput: document.getElementById('fileInput'),
            browserWarning: document.getElementById('browserWarning'),
            closeWarning: document.getElementById('closeWarning')
        };

        this.outputIntro();
    }

    checkBrowserSupport() {
        if (!('serial' in navigator)) {
            this.elements.browserWarning.style.display = 'flex';
            this.elements.connectBtn.disabled = true;
            this.outputLine('ERROR: Web Serial API not supported in this browser.');
            this.outputLine('Please use Chrome, Edge, or Opera.\n');
        }
    }

    setupEventListeners() {
        // Connection buttons
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());

        // Input handling
        this.elements.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Help
        this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        this.elements.closeHelp.addEventListener('click', () => this.hideHelp());

        // Clear output
        this.elements.clearBtn.addEventListener('click', () => this.clearOutput());

        // File operations
        this.elements.uploadBtn.addEventListener('click', () => this.uploadFile());
        this.elements.runBtn.addEventListener('click', () => this.runFile());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Browser warning
        this.elements.closeWarning.addEventListener('click', () => {
            this.elements.browserWarning.style.display = 'none';
        });

        // Crow connection callbacks
        this.crow.onDataReceived = (data) => this.handleCrowOutput(data);
        this.crow.onConnectionChange = (connected, error) => this.handleConnectionChange(connected, error);
    }

    async connect() {
        this.outputLine('Connecting to crow...\n');
        const success = await this.crow.connect();
        if (success) {
            this.outputLine('Connected! Type "h" for help.\n');
        }
    }

    async disconnect() {
        await this.crow.disconnect();
        this.outputLine('\nDisconnected from crow.\n');
    }

    handleConnectionChange(connected, error) {
        this.elements.connectBtn.disabled = connected;
        this.elements.disconnectBtn.disabled = !connected;
        this.elements.input.disabled = !connected;
        this.elements.uploadBtn.disabled = !connected;
        this.elements.runBtn.disabled = !connected;

        if (connected) {
            this.elements.statusIndicator.className = 'status-indicator connected';
            this.elements.statusText.textContent = 'Connected';
            this.elements.input.focus();
        } else {
            this.elements.statusIndicator.className = 'status-indicator';
            this.elements.statusText.textContent = error ? `Error: ${error}` : 'Not connected';
        }
    }

    handleCrowOutput(data) {
        // Remove carriage returns and output
        const cleaned = data.replace(/\r/g, '');
        this.outputText(cleaned);
    }

    async handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = this.elements.input.value.trim();
            if (command) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
                await this.executeCommand(command);
                this.elements.input.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.elements.input.value = this.commandHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.elements.input.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                this.elements.input.value = '';
            }
        }
    }

    async executeCommand(command) {
        this.outputLine(`> ${command}`);

        // Special druid commands
        if (command === 'h') {
            this.showHelp();
            return;
        }

        if (command === 'q') {
            this.outputLine('Use the Disconnect button to close the connection.\n');
            return;
        }

        if (command === 'clear') {
            this.clearOutput();
            return;
        }

        if (command === 'p') {
            await this.crow.writeLine('^^p');
            return;
        }

        if (command === 'r' && this.lastScript) {
            this.outputLine(`Running ${this.lastScript}...\n`);
            this.elements.fileInput.setAttribute('data-action', 'run');
            this.elements.fileInput.click();
            return;
        }

        if (command === 'u') {
            this.elements.fileInput.setAttribute('data-action', 'upload');
            this.elements.fileInput.click();
            return;
        }

        if (command.startsWith('r ')) {
            const filename = command.substring(2).trim();
            this.outputLine(`Select file to run: ${filename}\n`);
            this.elements.fileInput.setAttribute('data-action', 'run');
            this.elements.fileInput.click();
            return;
        }

        if (command.startsWith('u ')) {
            const filename = command.substring(2).trim();
            this.outputLine(`Select file to upload: ${filename}\n`);
            this.elements.fileInput.setAttribute('data-action', 'upload');
            this.elements.fileInput.click();
            return;
        }

        // Send to crow
        try {
            await this.crow.writeLine(command);
        } catch (error) {
            this.outputLine(`Error: ${error.message}\n`);
        }
    }

    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const action = this.elements.fileInput.getAttribute('data-action');
        const content = await file.text();
        
        this.lastScript = file.name;

        if (action === 'upload') {
            await this.uploadScript(content, file.name);
        } else if (action === 'run') {
            await this.runScript(content, file.name);
        }

        // Reset file input
        this.elements.fileInput.value = '';
    }

    async uploadScript(content, filename) {
        this.outputLine(`Uploading ${filename}...\n`);
        
        try {
            // Clear existing script and upload new one
            await this.crow.writeLine('^^c'); // clear
            await this.delay(100);
            
            // Send the script line by line
            const lines = content.split('\n');
            for (const line of lines) {
                await this.crow.writeLine(line.trimEnd());
                await this.delay(1); // Small delay between lines
            }
            
            await this.delay(100);
            this.outputLine(`Uploaded ${filename}\n`);
        } catch (error) {
            this.outputLine(`Upload error: ${error.message}\n`);
        }
    }

    async runScript(content, filename) {
        this.outputLine(`Running ${filename}...\n`);
        
        try {
            // Send the script line by line (runs immediately, not stored)
            const lines = content.split('\n');
            for (const line of lines) {
                await this.crow.writeLine(line.trimEnd());
                await this.delay(1); // Small delay between lines
            }
            
            await this.delay(100);
            this.outputLine(`Ran ${filename}\n`);
        } catch (error) {
            this.outputLine(`Run error: ${error.message}\n`);
        }
    }

    uploadFile() {
        this.elements.fileInput.setAttribute('data-action', 'upload');
        this.elements.fileInput.click();
    }

    runFile() {
        this.elements.fileInput.setAttribute('data-action', 'run');
        this.elements.fileInput.click();
    }

    showHelp() {
        this.elements.helpSection.style.display = 'block';
    }

    hideHelp() {
        this.elements.helpSection.style.display = 'none';
    }

    clearOutput() {
        this.elements.output.textContent = '';
        this.outputIntro();
    }

    outputIntro() {
        this.outputLine('//// druid web. connect to crow to begin.\n');
    }

    outputLine(text) {
        this.outputText(text + '\n');
    }

    outputText(text) {
        this.elements.output.textContent += text;
        this.elements.output.scrollTop = this.elements.output.scrollHeight;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the REPL when the page loads
let druid;
document.addEventListener('DOMContentLoaded', () => {
    druid = new DruidRepl();
});
