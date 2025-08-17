class GuitarTabEditor {
    constructor() {
        this.strings = ['E', 'B', 'G', 'D', 'A', 'E'];
        this.data = [[]];
        this.currentColumn = 0;
        this.currentString = 5;
        this.columnSpacing = 2;
        this.lineWidth = 72;
        
        this.display = document.getElementById('tab-display');
        this.columnSpacingInput = document.getElementById('column-spacing');
        this.lineWidthInput = document.getElementById('line-width');
        this.copyBtn = document.getElementById('copy-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.clipboardHelper = document.getElementById('clipboard-helper');
        
        this.loadState();
        this.init();
    }
    
    init() {
        this.display.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.columnSpacingInput.addEventListener('change', () => {
            this.columnSpacing = parseInt(this.columnSpacingInput.value);
            this.saveState();
            this.render();
        });
        this.lineWidthInput.addEventListener('change', () => {
            this.lineWidth = parseInt(this.lineWidthInput.value);
            this.saveState();
            this.render();
        });
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        
        this.display.focus();
        this.render();
    }
    
    loadState() {
        const saved = localStorage.getItem('guitarTabState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.data = state.data || [[]];
                this.currentColumn = state.currentColumn || 0;
                this.currentString = state.currentString || 5;
                this.columnSpacing = state.columnSpacing || 2;
                this.lineWidth = state.lineWidth || 72;
                
                this.columnSpacingInput.value = this.columnSpacing;
                this.lineWidthInput.value = this.lineWidth;
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
    }
    
    saveState() {
        const state = {
            data: this.data,
            currentColumn: this.currentColumn,
            currentString: this.currentString,
            columnSpacing: this.columnSpacing,
            lineWidth: this.lineWidth
        };
        localStorage.setItem('guitarTabState', JSON.stringify(state));
    }
    
    handleKeyDown(e) {
        // Allow CMD/CTRL combinations for copy/paste
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        
        // Only prevent default for keys we handle
        const handledKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Backspace', 
                           '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        if (!handledKeys.includes(e.key)) {
            return;
        }
        
        e.preventDefault();
        
        switch(e.key) {
            case 'ArrowRight':
                this.moveRight();
                break;
            case 'ArrowLeft':
                this.moveLeft();
                break;
            case 'ArrowUp':
                this.moveUp();
                break;
            case 'ArrowDown':
                this.moveDown();
                break;
            case ' ':
                this.handleSpace();
                break;
            case 'Backspace':
                this.deleteNote();
                break;
            default:
                if (e.key >= '0' && e.key <= '9') {
                    this.addNote(e.key);
                }
        }
        
        this.saveState();
        this.render();
    }
    
    moveRight() {
        this.currentColumn++;
        if (this.currentColumn >= this.data.length) {
            this.data.push([]);
        }
    }
    
    moveLeft() {
        if (this.currentColumn > 0) {
            this.currentColumn--;
            this.cleanupEmptyColumns();
        }
    }
    
    moveUp() {
        if (this.currentString > 0) {
            this.currentString--;
        }
    }
    
    moveDown() {
        if (this.currentString < 5) {
            this.currentString++;
        }
    }
    
    handleSpace() {
        if (this.currentString === 0) {
            this.moveRight();
            this.currentString = 5;
        } else {
            this.moveUp();
        }
    }
    
    addNote(digit) {
        if (!this.data[this.currentColumn]) {
            this.data[this.currentColumn] = [];
        }
        
        const currentNote = this.data[this.currentColumn][this.currentString] || '';
        
        if (currentNote === '0' || currentNote.length === 2) {
            this.data[this.currentColumn][this.currentString] = digit;
        } else if (currentNote.length === 1) {
            this.data[this.currentColumn][this.currentString] = currentNote + digit;
        } else {
            this.data[this.currentColumn][this.currentString] = digit;
        }
    }
    
    deleteNote() {
        if (!this.data[this.currentColumn]) {
            return;
        }
        
        const currentNote = this.data[this.currentColumn][this.currentString] || '';
        if (currentNote.length > 0) {
            this.data[this.currentColumn][this.currentString] = currentNote.slice(0, -1);
        }
    }
    
    cleanupEmptyColumns() {
        // Remove empty columns to the right of the cursor
        while (this.data.length > this.currentColumn + 1) {
            const lastCol = this.data[this.data.length - 1];
            if (this.isColumnEmpty(lastCol)) {
                this.data.pop();
            } else {
                break;
            }
        }
    }
    
    isColumnEmpty(column) {
        if (!column) return true;
        for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
            if (column[stringIdx] && column[stringIdx].length > 0) {
                return false;
            }
        }
        return true;
    }
    
    clearAll() {
        this.data = [[]];
        this.currentColumn = 0;
        this.currentString = 5;
        this.saveState();
        this.render();
    }
    
    formatTab() {
        const lines = [];
        this.cursorInfo = null; // Track cursor position info
        let currentLineStart = 0;
        let staveIndex = 0;
        
        while (currentLineStart < this.data.length || currentLineStart === 0) {
            const lineStrings = [];
            let lineEndCol = currentLineStart;
            const staveData = { startCol: currentLineStart, lines: [] };
            
            let staveWasTruncated = false; // Track if this stave broke due to width
            
            for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
                let line = this.strings[stringIdx] + '|--';
                let colPosition = 4;
                let lastProcessedCol = currentLineStart - 1;
                
                for (let col = currentLineStart; col < this.data.length; col++) {
                    const note = (this.data[col] && this.data[col][stringIdx]) || '';
                    const noteDisplay = note || '-';
                    
                    // Track cursor position if this is the current column and string
                    if (col === this.currentColumn && stringIdx === this.currentString) {
                        this.cursorInfo = {
                            staveIndex,
                            stringIndex: stringIdx,
                            charStart: colPosition,
                            charEnd: colPosition + noteDisplay.length
                        };
                    }
                    
                    const isLastColInData = col === this.data.length - 1;
                    
                    let spacingNeeded;
                    if (isLastColInData) {
                        spacingNeeded = Math.max(0, 2 - (noteDisplay.length - 1));
                    } else {
                        spacingNeeded = Math.max(0, this.columnSpacing - (noteDisplay.length - 1));
                    }
                    
                    const segment = noteDisplay + '-'.repeat(spacingNeeded);
                    
                    if (colPosition + segment.length > this.lineWidth && col > currentLineStart) {
                        if (stringIdx === 0) {
                            staveWasTruncated = true;
                        }
                        break;
                    }
                    
                    line += segment;
                    colPosition += segment.length;
                    lastProcessedCol = col;
                    
                    if (stringIdx === 0) {
                        lineEndCol = col + 1;
                    }
                }
                
                // Only pad to full width if this stave was truncated due to line width
                if (staveWasTruncated) {
                    const paddingNeeded = this.lineWidth - line.length;
                    if (paddingNeeded > 0) {
                        line += '-'.repeat(paddingNeeded);
                    }
                }
                
                lineStrings.push(line);
                staveData.lines.push(line);
            }
            
            lines.push(...lineStrings);
            
            currentLineStart = lineEndCol;
            
            if (currentLineStart < this.data.length) {
                lines.push('');
                lines.push('');
            }
            
            if (this.data.length === 0) {
                break;
            }
            
            staveIndex++;
        }
        
        return lines.join('\n');
    }
    
    render() {
        const formatted = this.formatTab();
        const lines = formatted.split('\n');
        const displayLines = [];
        
        let staveIndex = 0;
        let stringInStave = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line === '') {
                displayLines.push('<span class="tab-line"> </span>');
                continue;
            }
            
            // Check if this line should show the cursor
            const shouldShowCursor = this.cursorInfo && 
                                   staveIndex === this.cursorInfo.staveIndex && 
                                   stringInStave === this.cursorInfo.stringIndex;
            
            if (shouldShowCursor) {
                const beforeCursor = line.substring(0, this.cursorInfo.charStart);
                const cursorPart = line.substring(this.cursorInfo.charStart, this.cursorInfo.charEnd);
                const afterCursor = line.substring(this.cursorInfo.charEnd);
                
                displayLines.push('<span class="tab-line">' + 
                    beforeCursor + 
                    '<span class="column current">' + cursorPart + '</span>' + 
                    afterCursor + '</span>');
            } else {
                displayLines.push('<span class="tab-line">' + line + '</span>');
            }
            
            stringInStave++;
            if (stringInStave === 6) {
                stringInStave = 0;
                staveIndex++;
            }
        }
        
        this.display.innerHTML = displayLines.join('');
    }
    
    
    copyToClipboard() {
        const tabText = this.formatTab();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(tabText).then(() => {
                this.copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    this.copyBtn.textContent = 'Copy to Clipboard';
                }, 2000);
            });
        } else {
            this.clipboardHelper.value = tabText;
            this.clipboardHelper.style.position = 'absolute';
            this.clipboardHelper.style.left = '-9999px';
            document.body.appendChild(this.clipboardHelper);
            this.clipboardHelper.select();
            document.execCommand('copy');
            document.body.removeChild(this.clipboardHelper);
            
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GuitarTabEditor();
});