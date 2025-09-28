// DiffChecker Application
(function() {
    'use strict';
    
    const DiffChecker = {
        state: {
            text1: '',
            text2: '',
            savedLeft: null,
            savedRight: null,
            WORD_DIFF_THRESHOLD: 5000,
            LINE_DIFF_THRESHOLD: 500
        },
        
        dom: {
            text1: null,
            text2: null,
            compareBtn: null,
            clearBtn: null,
            swapBtn: null,
            linesLeft: null,
            linesRight: null,
            diffSummary: null,
            diffCountEl: null,
            lineCountEl: null,
            saveSelLeftBtn: null,
            saveSelRightBtn: null,
            applySwapBtn: null,
            swapDirectionEl: null,
            selectionInfo: null,
            uploadBtn1: null,
            uploadBtn2: null,
            fileInput1: null,
            fileInput2: null
        },
        
        init: function() {
            this.initDOMReferences();
            this.setupEventListeners();
            this.setupScrollSync();
            console.log('DiffChecker initialized successfully');
        },
        
        initDOMReferences: function() {
            this.dom.text1 = document.getElementById('diffText1');
            this.dom.text2 = document.getElementById('diffText2');
            this.dom.compareBtn = document.getElementById('compareBtn');
            this.dom.clearBtn = document.getElementById('clearBtn');
            this.dom.swapBtn = document.getElementById('swapBtn');
            this.dom.linesLeft = document.getElementById('linesLeft');
            this.dom.linesRight = document.getElementById('linesRight');
            this.dom.diffSummary = document.getElementById('diffSummary');
            this.dom.diffCountEl = document.getElementById('diffCount');
            this.dom.lineCountEl = document.getElementById('lineCount');
            this.dom.saveSelLeftBtn = document.getElementById('saveSelLeft');
            this.dom.saveSelRightBtn = document.getElementById('saveSelRight');
            this.dom.applySwapBtn = document.getElementById('applySwap');
            this.dom.swapDirectionEl = document.getElementById('swapDirection');
            this.dom.selectionInfo = document.getElementById('selectionInfo');
            this.dom.uploadBtn1 = document.getElementById('uploadBtn1');
            this.dom.uploadBtn2 = document.getElementById('uploadBtn2');
            this.dom.fileInput1 = document.getElementById('fileInput1');
            this.dom.fileInput2 = document.getElementById('fileInput2');
        },
        
        setupEventListeners: function() {
            this.safeAddListener(this.dom.compareBtn, 'click', () => this.compareTexts());
            this.safeAddListener(this.dom.clearBtn, 'click', () => this.clearAll());
            this.safeAddListener(this.dom.swapBtn, 'click', () => this.swapTexts());
            this.safeAddListener(this.dom.saveSelLeftBtn, 'click', () => this.saveSelection('left'));
            this.safeAddListener(this.dom.saveSelRightBtn, 'click', () => this.saveSelection('right'));
            this.safeAddListener(this.dom.applySwapBtn, 'click', () => this.applySwap());
            this.safeAddListener(this.dom.uploadBtn1, 'click', () => this.dom.fileInput1?.click());
            this.safeAddListener(this.dom.uploadBtn2, 'click', () => this.dom.fileInput2?.click());
            this.safeAddListener(this.dom.fileInput1, 'change', (e) => this.handleFileUpload(e, 'text1'));
            this.safeAddListener(this.dom.fileInput2, 'change', (e) => this.handleFileUpload(e, 'text2'));
        },
        
        safeAddListener: function(element, event, handler) {
            if (element) {
                element.addEventListener(event, handler);
            }
        },
        
        // Core diff functionality
        compareTexts: function() {
            if (!this.dom.text1 || !this.dom.text2) return;
            
            const text1 = this.dom.text1.value || '';
            const text2 = this.dom.text2.value || '';
            
            if (text1.length + text2.length > this.state.WORD_DIFF_THRESHOLD) {
                this.fastLineDiff(text1, text2);
            } else {
                this.detailedDiff(text1, text2);
            }
        },
        
        clearAll: function() {
            if (this.dom.text1) this.dom.text1.value = '';
            if (this.dom.text2) this.dom.text2.value = '';
            if (this.dom.linesLeft) this.dom.linesLeft.innerHTML = 'Original text will appear here after comparison';
            if (this.dom.linesRight) this.dom.linesRight.innerHTML = 'Changed text will appear here after comparison';
            if (this.dom.diffSummary) this.dom.diffSummary.textContent = 'Ready to compare';
            if (this.dom.diffCountEl) this.dom.diffCountEl.textContent = '0';
            if (this.dom.lineCountEl) this.dom.lineCountEl.textContent = '0';
            this.state.savedLeft = null;
            this.state.savedRight = null;
            if (this.dom.selectionInfo) this.dom.selectionInfo.textContent = 'None';
        },
        
        swapTexts: function() {
            if (!this.dom.text1 || !this.dom.text2) return;
            const temp = this.dom.text1.value;
            this.dom.text1.value = this.dom.text2.value;
            this.dom.text2.value = temp;
            this.compareTexts();
        },
        
        // ... (Include the rest of your diff functionality)
        
        setupScrollSync: function() {
            // Scroll synchronization logic
        },
        
        handleFileUpload: function(event, target) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (target === 'text1' && this.dom.text1) {
                    this.dom.text1.value = e.target.result;
                } else if (target === 'text2' && this.dom.text2) {
                    this.dom.text2.value = e.target.result;
                }
                this.compareTexts();
            };
            reader.readAsText(file);
        }
    };
    
    // Export to global scope
    window.DiffChecker = DiffChecker;
    
})();
