/**
 * druid web - Web-based editor and REPL for monome crow
 * Maiden-inspired interface with Monaco editor
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
            this.port = await navigator.serial.requestPort({
                filters: [{ usbVendorId: 0x0483, usbProductId: 0x5740 }]
            });

            await this.port.open({ 
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            this.isConnected = true;
            
            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            const textEncoder = new TextEncoderStream();
            this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

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
                if (done) break;
                if (value && this.onDataReceived) {
                    this.onDataReceived(value);
                }
            }
        } catch (error) {
            console.error('Read error:', error);
            if (this.isConnected) {
                // Close streams but keep port reference
                this.isConnected = false;
                this.shouldReconnect = false;
                
                if (this.reader) {
                    await this.reader.cancel().catch(() => {});
                }
                if (this.writer) {
                    await this.writer.close().catch(() => {});
                }
                
                this.reader = null;
                this.writer = null;
                
                if (this.port) {
                    await this.port.close().catch(() => {});
                    this.port = null;
                }
                
                if (this.onConnectionChange) {
                    this.onConnectionChange(false, 'device disconnected - click connect at the top to reconnect');
                }
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
            await this.reader.cancel().catch(() => {});
            await this.readableStreamClosed.catch(() => {});
        }

        if (this.writer) {
            await this.writer.close().catch(() => {});
            await this.writableStreamClosed.catch(() => {});
        }

        if (this.port) {
            await this.port.close().catch(() => {});
        }

        this.port = null;
        this.reader = null;
        this.writer = null;

        if (this.onConnectionChange) {
            this.onConnectionChange(false);
        }
    }
}

class DruidApp {
    constructor() {
        this.crow = new CrowConnection();
        this.editor = null;
        this.scriptName = 'untitled.lua';
        this.scriptModified = false;
        this.currentFile = null;
        
        this.initializeUI();
        this.checkBrowserSupport();
        this.setupEventListeners();
        this.initializeEditor();
        this.setupSplitPane();
    }

    initializeUI() {
        this.elements = {
            // Header
            toggleEditorBtn: document.getElementById('toggleEditorBtn'),
            scriptName: document.getElementById('scriptName'),
            
            // Toolbar
            runBtn: document.getElementById('runBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            newBtn: document.getElementById('newBtn'),
            openBtn: document.getElementById('openBtn'),
            saveBtn: document.getElementById('saveBtn'),
            renameBtn: document.getElementById('renameBtn'),
            
            // REPL controls
            connectionBtn: document.getElementById('replConnectionBtn'),
            replStatusIndicator: document.getElementById('replStatusIndicator'),
            replStatusText: document.getElementById('replStatusText'),
            
            // Editor/REPL
            editorContainer: document.getElementById('editor'),
            output: document.getElementById('output'),
            replInput: document.getElementById('replInput'),
            helpBtn: document.getElementById('helpBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // Split pane
            toolbar: document.getElementById('toolbar'),
            splitContainer: document.getElementById('splitContainer'),
            editorPane: document.getElementById('editorPane'),
            splitHandle: document.getElementById('splitHandle'),
            replPane: document.getElementById('replPane'),
            
            // File input
            fileInput: document.getElementById('fileInput'),
            
            // Modal
            browserWarning: document.getElementById('browserWarning'),
            closeWarning: document.getElementById('closeWarning')
        };

        this.outputLine('//// welcome. connect to crow or blackbird to begin.');
    }

    checkBrowserSupport() {
        if (!('serial' in navigator)) {
            this.elements.browserWarning.style.display = 'flex';
            this.elements.connectionBtn.disabled = true;
            this.outputLine('ERROR: Web Serial API not supported in this browser.');
            this.outputLine('Please use Chrome, Edge, or Opera.');
        }
    }

    setupEventListeners() {
        // Editor toggle
        this.elements.toggleEditorBtn.addEventListener('change', (e) => this.toggleEditor(e.target.checked));

        // Connection
        this.elements.connectionBtn.addEventListener('click', () => this.toggleConnection());

        // Script actions
        this.elements.runBtn.addEventListener('click', () => this.runScript());
        this.elements.uploadBtn.addEventListener('click', () => this.uploadScript());
        this.elements.newBtn.addEventListener('click', () => this.newScript());
        this.elements.openBtn.addEventListener('click', () => this.openScript());
        this.elements.saveBtn.addEventListener('click', () => this.saveScript());
        this.elements.renameBtn.addEventListener('click', () => this.renameScript());

        // File input
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // REPL input
        this.elements.replInput.addEventListener('keydown', (e) => this.handleReplInput(e));

        // REPL actions
        this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        this.elements.clearBtn.addEventListener('click', () => this.clearOutput());

        // Modal
        this.elements.closeWarning.addEventListener('click', () => {
            this.elements.browserWarning.style.display = 'none';
        });

        // Crow callbacks
        this.crow.onDataReceived = (data) => this.handleCrowOutput(data);
        this.crow.onConnectionChange = (connected, error) => this.handleConnectionChange(connected, error);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));

        // Drag and drop
        this.setupDragAndDrop();
    }

    initializeEditor() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(this.elements.editorContainer, {
                value: '-- crow script\n\nfunction init()\n  print("hello crow")\nend\n',
                language: 'lua',
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                folding: true,
                renderWhitespace: 'selection',
                tabSize: 2
            });

            // Track modifications
            this.editor.onDidChangeModelContent(() => {
                this.setModified(true);
            });
        });
    }

    setupSplitPane() {
        let isResizing = false;
        const container = this.elements.splitContainer;
        const handle = this.elements.splitHandle;
        const replPane = this.elements.replPane;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerRect = container.getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;
            
            if (newWidth >= 200 && newWidth <= containerRect.width - 200) {
                replPane.style.flex = `0 0 ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    async handleReplInput(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const code = this.elements.replInput.value.trim();
            if (code && this.crow.isConnected) {
                try {
                    const lines = code.split('\n');
                    for (const line of lines) {
                        await this.crow.writeLine(line);
                        await this.delay(1);
                    }
                    this.outputLine(`>> ${code}`);
                    this.elements.replInput.value = '';
                } catch (error) {
                    this.outputLine(`Error: ${error.message}`);
                }
            }
        }
    }

    handleKeyboardShortcut(e) {
        const isMeta = e.metaKey || e.ctrlKey;
        
        if (isMeta && e.key === 'p') {
            e.preventDefault();
            this.runScript();
        } else if (isMeta && e.key === 's') {
            e.preventDefault();
            this.saveScript();
        }
    }

    async toggleConnection() {
        if (this.crow.isConnected) {
            await this.disconnect();
        } else {
            await this.connect();
        }
    }

    async connect() {
        this.outputLine('Connecting to crow...');
        const success = await this.crow.connect();
        if (success) {
            this.outputLine('Connected! Ready to code.\n');
        }
    }

    async disconnect() {
        await this.crow.disconnect();
        this.outputLine('\nDisconnected from crow.\n');
    }

    handleConnectionChange(connected, error) {
        this.elements.runBtn.disabled = !connected;
        this.elements.uploadBtn.disabled = !connected;
        this.elements.replInput.disabled = !connected;

        if (connected) {
            this.elements.connectionBtn.textContent = 'disconnect';
            this.elements.replStatusIndicator.classList.add('connected');
            this.elements.replStatusText.textContent = 'connected';
        } else {
            this.elements.connectionBtn.textContent = 'connect';
            this.elements.replStatusIndicator.classList.remove('connected');
            const statusMsg = error || 'not connected';
            this.elements.replStatusText.textContent = statusMsg;
            
            // Show disconnection message in REPL
            if (error && error.includes('disconnected')) {
                this.outputLine(`\n${error}`);
            }
        }
    }

    handleCrowOutput(data) {
        const cleaned = data.replace(/\r/g, '');
        this.outputText(cleaned);
    }

    async runScript() {
        if (!this.crow.isConnected || !this.editor) return;
        
        this.outputLine(`Running ${this.scriptName}...`);
        const code = this.editor.getValue();
        
        try {
            await this.crow.writeLine('^^s'); // start script upload
            await this.delay(200);
            
            const lines = code.split('\n');
            for (const line of lines) {
                await this.crow.writeLine(line);
                await this.delay(1);
            }
            
            await this.crow.writeLine('^^e'); // execute script
            await this.delay(100);
            this.outputLine(`Ran ${this.scriptName}\n`);
        } catch (error) {
            this.outputLine(`Run error: ${error.message}\n`);
        }
    }

    async uploadScript() {
        if (!this.crow.isConnected || !this.editor) return;
        
        this.outputLine(`Uploading ${this.scriptName}...`);
        const code = this.editor.getValue();
        
        try {
            await this.crow.writeLine('^^s'); // start script upload
            await this.delay(200);
            
            const lines = code.split('\n');
            for (const line of lines) {
                await this.crow.writeLine(line);
                await this.delay(1);
            }
            
            await this.crow.writeLine('^^w'); // write to flash
            await this.delay(100);
            this.outputLine(`Uploaded ${this.scriptName}\n`);
            this.setModified(false);
        } catch (error) {
            this.outputLine(`Upload error: ${error.message}\n`);
        }
    }

    newScript() {
        if (this.scriptModified) {
            if (!confirm('You have unsaved changes. Create new script anyway?')) {
                return;
            }
        }
        
        this.scriptName = 'untitled.lua';
        this.currentFile = null;
        this.editor.setValue('-- crow script\n\nfunction init()\n  print("hello crow")\nend\n');
        this.setModified(false);
        this.updateScriptName();
    }

    openScript() {
        this.elements.fileInput.click();
    }

    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const content = await file.text();
        this.scriptName = file.name;
        this.currentFile = file;
        this.editor.setValue(content);
        this.setModified(false);
        this.updateScriptName();
        
        this.elements.fileInput.value = '';
    }

    saveScript() {
        if (!this.editor) return;
        
        const content = this.editor.getValue();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.scriptName;
        a.click();
        URL.revokeObjectURL(url);
        
        this.setModified(false);
    }

    renameScript() {
        const currentName = this.scriptName.replace(' •', '');
        const newName = prompt('Rename script:', currentName);
        
        if (newName && newName.trim() && newName !== currentName) {
            this.scriptName = newName.trim();
            if (!this.scriptName.endsWith('.lua')) {
                this.scriptName += '.lua';
            }
            this.updateScriptName();
        }
    }

    setModified(modified) {
        this.scriptModified = modified;
        this.updateScriptName();
    }

    updateScriptName() {
        const displayName = this.scriptModified ? `${this.scriptName} •` : this.scriptName;
        this.elements.scriptName.textContent = displayName;
    }

    toggleEditor(show) {
        if (show) {
            // Show editor
            this.elements.toolbar.classList.remove('hidden');
            this.elements.editorPane.classList.remove('hidden');
            this.elements.splitHandle.classList.remove('hidden');
            this.elements.replPane.classList.remove('full-width');
            
            // Re-layout Monaco editor
            if (this.editor) {
                this.editor.layout();
            }
        } else {
            // Hide editor
            this.elements.toolbar.classList.add('hidden');
            this.elements.editorPane.classList.add('hidden');
            this.elements.splitHandle.classList.add('hidden');
            this.elements.replPane.classList.add('full-width');
        }
    }

    outputLine(text) {
        this.outputText(text + '\n');
    }

    outputText(text) {
        this.elements.output.textContent += text;
        this.elements.output.scrollTop = this.elements.output.scrollHeight;
    }

    clearOutput() {
        this.elements.output.textContent = '';
    }

    showHelp() {
        this.outputLine('');
        this.outputLine('crow commands:');
        this.outputLine('  ^^version     - get firmware version');
        this.outputLine('  ^^identity    - get device identity');
        this.outputLine('  ^^print(n)    - get script n from crow');
        this.outputLine('  ^^kill        - stop running script');
        this.outputLine('  ^^restart     - restart crow');
        this.outputLine('  ^^bootloader  - enter bootloader mode');
        this.outputLine('  ^^c 1-4       - calibrate input/output');
        this.outputLine('');
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors on the whole document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Editor pane drop
        this.elements.editorPane.addEventListener('drop', async (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.lua')) {
                    await this.loadFileFromDrop(file);
                } else {
                    this.outputLine('Error: Only .lua files are supported');
                }
            }
        });

        // REPL pane drop
        this.elements.replPane.addEventListener('drop', async (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.lua')) {
                    await this.uploadFileFromDrop(file);
                } else {
                    this.outputLine('Error: Only .lua files are supported');
                }
            }
        });

        // Visual feedback on dragover
        this.elements.editorPane.addEventListener('dragover', (e) => {
            this.elements.editorPane.style.opacity = '0.7';
        });

        this.elements.editorPane.addEventListener('dragleave', (e) => {
            this.elements.editorPane.style.opacity = '1';
        });

        this.elements.editorPane.addEventListener('drop', (e) => {
            this.elements.editorPane.style.opacity = '1';
        });

        this.elements.replPane.addEventListener('dragover', (e) => {
            this.elements.replPane.style.opacity = '0.7';
        });

        this.elements.replPane.addEventListener('dragleave', (e) => {
            this.elements.replPane.style.opacity = '1';
        });

        this.elements.replPane.addEventListener('drop', (e) => {
            this.elements.replPane.style.opacity = '1';
        });
    }

    async loadFileFromDrop(file) {
        try {
            const text = await file.text();
            this.scriptName = file.name;
            this.currentFile = null; // Reset file handle since this is drag-drop
            if (this.editor) {
                this.editor.setValue(text);
            }
            this.setModified(false);
            this.updateScriptName();
            this.outputLine(`Loaded ${file.name} into editor`);
        } catch (error) {
            this.outputLine(`Error loading file: ${error.message}`);
        }
    }

    async uploadFileFromDrop(file) {
        if (!this.crow.isConnected) {
            this.outputLine('Error: Not connected to crow');
            return;
        }

        try {
            const text = await file.text();
            this.outputLine(`Uploading ${file.name}...`);
            
            await this.crow.writeLine('^^s');
            await this.delay(200);
            
            const lines = text.split('\\n');
            for (const line of lines) {
                await this.crow.writeLine(line);
                await this.delay(1);
            }
            
            await this.crow.writeLine('^^w');
            await this.delay(100);
            this.outputLine(`Uploaded ${file.name}\\n`);
        } catch (error) {
            this.outputLine(`Upload error: ${error.message}\\n`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when page loads
let druid;
window.addEventListener('DOMContentLoaded', () => {
    druid = new DruidApp();
});
