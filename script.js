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
    
    clearAll() {
        this.data = [[]];
        this.currentColumn = 0;
        this.currentString = 5;
        this.saveState();
        this.render();
    }
    
    formatTab() {
        const lines = [];
        let currentLineStart = 0;
        
        while (currentLineStart < this.data.length || currentLineStart === 0) {
            const lineStrings = [];
            let lineEndCol = currentLineStart;
            
            for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
                let line = this.strings[stringIdx] + '|--';
                let colPosition = 4;
                
                for (let col = currentLineStart; col < this.data.length; col++) {
                    const note = (this.data[col] && this.data[col][stringIdx]) || '';
                    const noteDisplay = note || '-';
                    
                    const isLastCol = col === this.data.length - 1;
                    const nextColHasData = col + 1 < this.data.length;
                    
                    let spacingNeeded;
                    if (isLastCol) {
                        spacingNeeded = Math.max(0, 2 - (noteDisplay.length - 1));
                    } else if (nextColHasData) {
                        spacingNeeded = Math.max(0, this.columnSpacing - (noteDisplay.length - 1));
                    } else {
                        spacingNeeded = 2;
                    }
                    
                    const segment = noteDisplay + '-'.repeat(spacingNeeded);
                    
                    if (colPosition + noteDisplay.length > this.lineWidth && col > currentLineStart) {
                        break;
                    }
                    
                    line += segment;
                    colPosition += this.columnSpacing + 1;
                    
                    if (stringIdx === 0) {
                        lineEndCol = col + 1;
                    }
                }
                
                lineStrings.push(line);
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
        }
        
        return lines.join('\n');
    }
    
    render() {
        const formatted = this.formatTab();
        const lines = formatted.split('\n');
        const displayLines = [];
        
        let staveIndex = 0;
        let staveStartCol = 0;
        let stringInStave = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line === '') {
                displayLines.push('<span class="tab-line"></span>');
                stringInStave = 0;
                staveIndex++;
                continue;
            }
            
            if (stringInStave === 0) {
                staveStartCol = this.getStaveStartColumn(staveIndex);
            }
            
            const isCurrentString = stringInStave === this.currentString;
            const isCurrentStave = this.isColumnInStave(this.currentColumn, staveIndex);
            
            if (isCurrentString && isCurrentStave) {
                const relativeCol = this.currentColumn - staveStartCol;
                let charPos = 4;
                
                for (let col = 0; col < relativeCol; col++) {
                    const actualCol = staveStartCol + col;
                    const note = (this.data[actualCol] && this.data[actualCol][stringInStave]) || '-';
                    const noteWidth = note.length === 2 ? 2 : 1;
                    
                    charPos += 1;
                    if (noteWidth === 2) {
                        charPos += 1;
                    }
                    charPos += Math.max(0, this.columnSpacing - (noteWidth - 1));
                }
                
                const noteContent = (this.data[this.currentColumn] && 
                    this.data[this.currentColumn][stringInStave]) || '';
                const noteLength = noteContent.length || 1;
                
                const beforeCursor = line.substring(0, charPos);
                const cursorPart = line.substring(charPos, charPos + noteLength);
                const afterCursor = line.substring(charPos + noteLength);
                
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
            }
        }
        
        this.display.innerHTML = displayLines.join('');
    }
    
    getColumnsPerLine() {
        return Math.floor((this.lineWidth - 4) / (this.columnSpacing + 1));
    }
    
    getStaveStartColumn(staveIndex) {
        let col = 0;
        for (let i = 0; i < staveIndex; i++) {
            const columnsInStave = this.getColumnsForStave(i);
            col += columnsInStave;
        }
        return col;
    }
    
    getColumnsForStave(staveIndex) {
        const startCol = this.getStaveStartColumn(staveIndex);
        let count = 0;
        let width = 4;
        
        for (let col = startCol; col < this.data.length; col++) {
            const maxNoteWidth = this.getMaxNoteWidth(col);
            const neededWidth = maxNoteWidth + (count > 0 ? this.columnSpacing : 0);
            
            if (width + neededWidth > this.lineWidth && count > 0) {
                break;
            }
            
            width += neededWidth;
            count++;
        }
        
        return count || 1;
    }
    
    getMaxNoteWidth(col) {
        let max = 1;
        for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
            const note = (this.data[col] && this.data[col][stringIdx]) || '';
            max = Math.max(max, note.length || 1);
        }
        return max;
    }
    
    isColumnInStave(col, staveIndex) {
        const startCol = this.getStaveStartColumn(staveIndex);
        const columnsInStave = this.getColumnsForStave(staveIndex);
        return col >= startCol && col < startCol + columnsInStave;
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