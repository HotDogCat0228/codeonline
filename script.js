class CodeClipboard {
    constructor() {
        this.init();
        this.loadSnippets();
        this.bindEvents();
    }

    init() {
        this.codeEditor = document.getElementById('codeEditor');
        this.codePreview = document.getElementById('codePreview');
        this.codeHighlight = document.getElementById('codeHighlight');
        this.languageSelect = document.getElementById('language');
        this.snippetTitle = document.getElementById('snippetTitle');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.snippetsList = document.getElementById('snippetsList');
        this.toast = document.getElementById('toast');
        
        this.snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
    }

    bindEvents() {
        // 儲存按鈕
        this.saveBtn.addEventListener('click', () => this.saveSnippet());
        
        // 清空按鈕
        this.clearBtn.addEventListener('click', () => this.clearEditor());
        
        // 複製按鈕
        this.copyBtn.addEventListener('click', () => this.copyCode());
        
        // 程式碼編輯器輸入事件
        this.codeEditor.addEventListener('input', () => this.updatePreview());
        
        // 語言選擇變更
        this.languageSelect.addEventListener('change', () => this.updatePreview());
        
        // Enter 鍵儲存
        this.snippetTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveSnippet();
            }
        });

        // Ctrl+S 儲存
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveSnippet();
            }
        });
    }

    updatePreview() {
        const code = this.codeEditor.value;
        const language = this.languageSelect.value;
        
        if (code.trim()) {
            this.codeHighlight.className = `language-${language}`;
            this.codeHighlight.textContent = code;
            
            // 使用 Prism.js 進行語法高亮
            if (window.Prism) {
                Prism.highlightElement(this.codeHighlight);
            }
        }
    }

    saveSnippet() {
        const code = this.codeEditor.value.trim();
        const title = this.snippetTitle.value.trim() || `程式碼片段 ${this.snippets.length + 1}`;
        const language = this.languageSelect.value;

        if (!code) {
            this.showToast('請輸入程式碼內容', 'error');
            return;
        }

        const snippet = {
            id: Date.now(),
            title,
            code,
            language,
            date: new Date().toLocaleString('zh-TW')
        };

        this.snippets.unshift(snippet);
        this.saveToStorage();
        this.renderSnippets();
        this.snippetTitle.value = '';
        this.showToast('程式碼片段已儲存', 'success');
    }

    clearEditor() {
        if (this.codeEditor.value.trim() && !confirm('確定要清空編輯器內容嗎？')) {
            return;
        }
        
        this.codeEditor.value = '';
        this.snippetTitle.value = '';
        this.updatePreview();
        this.showToast('編輯器已清空', 'success');
    }

    async copyCode() {
        const code = this.codeEditor.value;
        
        if (!code.trim()) {
            this.showToast('沒有程式碼可複製', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(code);
            this.showToast('程式碼已複製到剪貼簿', 'success');
        } catch (err) {
            // 降級方案
            this.fallbackCopyTextToClipboard(code);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('程式碼已複製到剪貼簿', 'success');
        } catch (err) {
            this.showToast('複製失敗，請手動複製', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    loadSnippet(id) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            this.codeEditor.value = snippet.code;
            this.snippetTitle.value = snippet.title;
            this.languageSelect.value = snippet.language;
            this.updatePreview();
            this.showToast('程式碼片段已載入', 'success');
            
            // 滾動到編輯器
            this.codeEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    deleteSnippet(id) {
        if (!confirm('確定要刪除這個程式碼片段嗎？')) {
            return;
        }
        
        this.snippets = this.snippets.filter(s => s.id !== id);
        this.saveToStorage();
        this.renderSnippets();
        this.showToast('程式碼片段已刪除', 'success');
    }

    async copySnippet(id) {
        const snippet = this.snippets.find(s => s.id === id);
        if (snippet) {
            try {
                await navigator.clipboard.writeText(snippet.code);
                this.showToast('程式碼已複製到剪貼簿', 'success');
            } catch (err) {
                this.fallbackCopyTextToClipboard(snippet.code);
            }
        }
    }

    renderSnippets() {
        if (this.snippets.length === 0) {
            this.snippetsList.innerHTML = `
                <div class="empty-state">
                    <h4>📝 還沒有儲存的程式碼片段</h4>
                    <p>開始在上方編輯器輸入程式碼，然後點擊「儲存」按鈕來建立您的第一個程式碼片段。</p>
                </div>
            `;
            return;
        }

        this.snippetsList.innerHTML = this.snippets.map(snippet => `
            <div class="snippet-item" data-id="${snippet.id}">
                <div class="snippet-header">
                    <div class="snippet-title">${this.escapeHtml(snippet.title)}</div>
                    <div class="snippet-language">${snippet.language.toUpperCase()}</div>
                </div>
                <div class="snippet-date">儲存於：${snippet.date}</div>
                <div class="snippet-preview">${this.escapeHtml(snippet.code.substring(0, 200))}${snippet.code.length > 200 ? '...' : ''}</div>
                <div class="snippet-actions">
                    <button class="load-btn" onclick="clipboard.loadSnippet(${snippet.id})">
                        📝 載入
                    </button>
                    <button class="copy-snippet-btn" onclick="clipboard.copySnippet(${snippet.id})">
                        📋 複製
                    </button>
                    <button class="delete-btn" onclick="clipboard.deleteSnippet(${snippet.id})">
                        🗑️ 刪除
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadSnippets() {
        this.renderSnippets();
    }

    saveToStorage() {
        localStorage.setItem('codeSnippets', JSON.stringify(this.snippets));
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    // 匯出功能
    exportSnippets() {
        if (this.snippets.length === 0) {
            this.showToast('沒有程式碼片段可匯出', 'error');
            return;
        }

        const dataStr = JSON.stringify(this.snippets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `code-snippets-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('程式碼片段已匯出', 'success');
    }

    // 匯入功能
    importSnippets(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSnippets = JSON.parse(e.target.result);
                if (Array.isArray(importedSnippets)) {
                    // 合併匯入的片段，避免重複 ID
                    const maxId = Math.max(...this.snippets.map(s => s.id), 0);
                    const newSnippets = importedSnippets.map((snippet, index) => ({
                        ...snippet,
                        id: maxId + index + 1
                    }));
                    
                    this.snippets = [...newSnippets, ...this.snippets];
                    this.saveToStorage();
                    this.renderSnippets();
                    this.showToast(`成功匯入 ${newSnippets.length} 個程式碼片段`, 'success');
                } else {
                    throw new Error('無效的檔案格式');
                }
            } catch (err) {
                this.showToast('匯入失敗：檔案格式錯誤', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 搜尋功能
    searchSnippets(query) {
        const filteredSnippets = this.snippets.filter(snippet => 
            snippet.title.toLowerCase().includes(query.toLowerCase()) ||
            snippet.code.toLowerCase().includes(query.toLowerCase()) ||
            snippet.language.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredSnippets.length === 0 && query.trim()) {
            this.snippetsList.innerHTML = `
                <div class="empty-state">
                    <h4>🔍 找不到符合的程式碼片段</h4>
                    <p>嘗試使用不同的關鍵字搜尋。</p>
                </div>
            `;
        } else {
            const originalSnippets = this.snippets;
            this.snippets = filteredSnippets;
            this.renderSnippets();
            this.snippets = originalSnippets;
        }
    }
}

// 初始化應用程式
const clipboard = new CodeClipboard();

// 全域功能
window.clipboard = clipboard;

// PWA 支援檢測
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C 複製程式碼
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clipboard.copyCode();
    }
    
    // Ctrl+Shift+L 清空編輯器
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        clipboard.clearEditor();
    }
    
    // ESC 清空搜尋（如果有搜尋功能）
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            clipboard.loadSnippets();
        }
    }
});

// 拖放檔案匯入（未來功能）
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/json') {
        clipboard.importSnippets(files[0]);
    }
});

// 自動儲存功能（每5分鐘自動儲存當前編輯器內容）
setInterval(() => {
    const code = clipboard.codeEditor.value.trim();
    if (code && code !== localStorage.getItem('autosave-content')) {
        localStorage.setItem('autosave-content', code);
        localStorage.setItem('autosave-language', clipboard.languageSelect.value);
        localStorage.setItem('autosave-time', new Date().toISOString());
    }
}, 5 * 60 * 1000); // 5分鐘

// 載入自動儲存的內容
window.addEventListener('load', () => {
    const autosaveContent = localStorage.getItem('autosave-content');
    const autosaveLanguage = localStorage.getItem('autosave-language');
    const autosaveTime = localStorage.getItem('autosave-time');
    
    if (autosaveContent && autosaveTime) {
        const timeDiff = (new Date() - new Date(autosaveTime)) / (1000 * 60); // 分鐘
        if (timeDiff < 60) { // 1小時內的自動儲存
            if (confirm('發現未儲存的程式碼內容，是否要載入？')) {
                clipboard.codeEditor.value = autosaveContent;
                if (autosaveLanguage) {
                    clipboard.languageSelect.value = autosaveLanguage;
                }
                clipboard.updatePreview();
            }
        }
    }
});
