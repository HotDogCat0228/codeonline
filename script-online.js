// Firebase 相關的 import 會在 HTML 中處理
class OnlineCodeClipboard {
    constructor() {
        this.init();
        this.loadSnippets();
        this.bindEvents();
        this.waitForFirebase();
    }

    waitForFirebase() {
        const checkFirebase = () => {
            if (window.db) {
                this.loadOnlineSnippets();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    init() {
        this.codeEditor = document.getElementById('codeEditor');
        this.codePreview = document.getElementById('codePreview');
        this.codeHighlight = document.getElementById('codeHighlight');
        this.languageSelect = document.getElementById('language');
        this.snippetTitle = document.getElementById('snippetTitle');
        this.saveBtn = document.getElementById('saveBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadOnlineBtn = document.getElementById('loadOnlineBtn');
        this.searchInput = document.getElementById('searchInput');
        this.languageFilter = document.getElementById('languageFilter');
        this.snippetsList = document.getElementById('snippetsList');
        this.onlineSnippetsList = document.getElementById('onlineSnippetsList');
        this.toast = document.getElementById('toast');
        
        this.localSnippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];
        this.onlineSnippets = [];
    }

    bindEvents() {
        // 本地儲存按鈕
        this.saveBtn.addEventListener('click', () => this.saveLocalSnippet());
        
        // 線上分享按鈕
        this.shareBtn.addEventListener('click', () => this.shareOnlineSnippet());
        
        // 清空按鈕
        this.clearBtn.addEventListener('click', () => this.clearEditor());
        
        // 複製按鈕
        this.copyBtn.addEventListener('click', () => this.copyCode());
        
        // 搜尋按鈕
        this.searchBtn.addEventListener('click', () => this.searchOnlineSnippets());
        
        // 載入線上最新按鈕
        this.loadOnlineBtn.addEventListener('click', () => this.loadOnlineSnippets());
        
        // 程式碼編輯器輸入事件
        this.codeEditor.addEventListener('input', () => this.updatePreview());
        
        // 語言選擇變更
        this.languageSelect.addEventListener('change', () => this.updatePreview());
        
        // 語言篩選變更
        this.languageFilter.addEventListener('change', () => this.filterOnlineSnippets());
        
        // Enter 鍵搜尋
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchOnlineSnippets();
            }
        });

        // Enter 鍵儲存
        this.snippetTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveLocalSnippet();
            }
        });

        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveLocalSnippet();
            }
        });
    }

    updatePreview() {
        const code = this.codeEditor.value;
        const language = this.languageSelect.value;
        
        if (code.trim()) {
            this.codeHighlight.className = `language-${language}`;
            this.codeHighlight.textContent = code;
            
            if (window.Prism) {
                Prism.highlightElement(this.codeHighlight);
            }
        }
    }

    // 本地儲存功能 (保持原有功能)
    saveLocalSnippet() {
        const code = this.codeEditor.value.trim();
        const title = this.snippetTitle.value.trim() || `程式碼片段 ${this.localSnippets.length + 1}`;
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

        this.localSnippets.unshift(snippet);
        this.saveToLocalStorage();
        this.renderLocalSnippets();
        this.snippetTitle.value = '';
        this.showToast('程式碼片段已儲存到本地', 'success');
    }

    // 線上分享功能 (新功能)
    async shareOnlineSnippet() {
        if (!window.db) {
            this.showToast('Firebase 尚未載入完成，請稍後再試', 'error');
            return;
        }

        const code = this.codeEditor.value.trim();
        const title = this.snippetTitle.value.trim() || `共享程式碼片段 ${Date.now()}`;
        const language = this.languageSelect.value;

        if (!code) {
            this.showToast('請輸入程式碼內容', 'error');
            return;
        }

        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const snippet = {
                title,
                code,
                language,
                createdAt: serverTimestamp(),
                likes: 0,
                views: 0
            };

            await addDoc(collection(window.db, 'codeSnippets'), snippet);
            this.showToast('程式碼片段已分享到線上！', 'success');
            this.snippetTitle.value = '';
            
            // 重新載入線上片段
            this.loadOnlineSnippets();
        } catch (error) {
            console.error('分享失敗:', error);
            this.showToast('分享失敗，請檢查網路連線', 'error');
        }
    }

    // 載入線上程式碼片段
    async loadOnlineSnippets() {
        if (!window.db) {
            this.showToast('正在連接資料庫...', 'info');
            return;
        }

        try {
            const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(window.db, 'codeSnippets'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            
            const querySnapshot = await getDocs(q);
            this.onlineSnippets = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.onlineSnippets.push({
                    id: doc.id,
                    ...data,
                    date: data.createdAt ? data.createdAt.toDate().toLocaleString('zh-TW') : '未知時間'
                });
            });

            this.renderOnlineSnippets();
            this.showToast(`載入了 ${this.onlineSnippets.length} 個線上程式碼片段`, 'success');
        } catch (error) {
            console.error('載入線上片段失敗:', error);
            this.showToast('載入線上片段失敗，請檢查網路連線', 'error');
        }
    }

    // 搜尋線上程式碼片段
    searchOnlineSnippets() {
        const query = this.searchInput.value.toLowerCase().trim();
        const language = this.languageFilter.value;
        
        let filteredSnippets = this.onlineSnippets;

        if (query) {
            filteredSnippets = filteredSnippets.filter(snippet => 
                snippet.title.toLowerCase().includes(query) ||
                snippet.code.toLowerCase().includes(query)
            );
        }

        if (language) {
            filteredSnippets = filteredSnippets.filter(snippet => 
                snippet.language === language
            );
        }

        this.renderOnlineSnippets(filteredSnippets);
        this.showToast(`找到 ${filteredSnippets.length} 個符合的片段`, 'info');
    }

    // 篩選線上程式碼片段
    filterOnlineSnippets() {
        this.searchOnlineSnippets();
    }

    // 載入線上程式碼片段到編輯器
    loadOnlineSnippet(snippet) {
        this.codeEditor.value = snippet.code;
        this.snippetTitle.value = `${snippet.title} (線上)`;
        this.languageSelect.value = snippet.language;
        this.updatePreview();
        this.showToast('線上程式碼片段已載入', 'success');
        
        // 增加檢視次數 (可選)
        this.incrementViews(snippet.id);
        
        // 滾動到編輯器
        this.codeEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 增加檢視次數
    async incrementViews(snippetId) {
        try {
            const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const snippetRef = doc(window.db, 'codeSnippets', snippetId);
            await updateDoc(snippetRef, {
                views: increment(1)
            });
        } catch (error) {
            console.error('更新檢視次數失敗:', error);
        }
    }

    // 複製線上程式碼片段
    async copyOnlineSnippet(snippet) {
        try {
            await navigator.clipboard.writeText(snippet.code);
            this.showToast('程式碼已複製到剪貼簿', 'success');
        } catch (err) {
            this.fallbackCopyTextToClipboard(snippet.code);
        }
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

    // 本地片段操作
    loadLocalSnippet(id) {
        const snippet = this.localSnippets.find(s => s.id === id);
        if (snippet) {
            this.codeEditor.value = snippet.code;
            this.snippetTitle.value = snippet.title;
            this.languageSelect.value = snippet.language;
            this.updatePreview();
            this.showToast('本地程式碼片段已載入', 'success');
            
            this.codeEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    deleteLocalSnippet(id) {
        if (!confirm('確定要刪除這個本地程式碼片段嗎？')) {
            return;
        }
        
        this.localSnippets = this.localSnippets.filter(s => s.id !== id);
        this.saveToLocalStorage();
        this.renderLocalSnippets();
        this.showToast('本地程式碼片段已刪除', 'success');
    }

    async copyLocalSnippet(id) {
        const snippet = this.localSnippets.find(s => s.id === id);
        if (snippet) {
            try {
                await navigator.clipboard.writeText(snippet.code);
                this.showToast('程式碼已複製到剪貼簿', 'success');
            } catch (err) {
                this.fallbackCopyTextToClipboard(snippet.code);
            }
        }
    }

    // 渲染函數
    renderOnlineSnippets(snippets = this.onlineSnippets) {
        if (snippets.length === 0) {
            this.onlineSnippetsList.innerHTML = `
                <div class="empty-state">
                    <h4>🌐 沒有找到線上程式碼片段</h4>
                    <p>成為第一個分享程式碼的人吧！</p>
                </div>
            `;
            return;
        }

        this.onlineSnippetsList.innerHTML = snippets.map(snippet => `
            <div class="snippet-item online-snippet" data-id="${snippet.id}">
                <div class="snippet-header">
                    <div class="snippet-title">${this.escapeHtml(snippet.title)}</div>
                    <div class="snippet-language">${snippet.language.toUpperCase()}</div>
                </div>
                <div class="snippet-date">分享於：${snippet.date}</div>
                <div class="snippet-stats">
                    👀 ${snippet.views || 0} 次檢視 | 👍 ${snippet.likes || 0} 個讚
                </div>
                <div class="snippet-preview">${this.escapeHtml(snippet.code.substring(0, 200))}${snippet.code.length > 200 ? '...' : ''}</div>
                <div class="snippet-actions">
                    <button class="load-btn" onclick="clipboard.loadOnlineSnippet(${JSON.stringify(snippet).replace(/"/g, '&quot;')})">
                        📝 載入
                    </button>
                    <button class="copy-snippet-btn" onclick="clipboard.copyOnlineSnippet(${JSON.stringify(snippet).replace(/"/g, '&quot;')})">
                        📋 複製
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderLocalSnippets() {
        if (this.localSnippets.length === 0) {
            this.snippetsList.innerHTML = `
                <div class="empty-state">
                    <h4>📝 還沒有本地儲存的程式碼片段</h4>
                    <p>開始在上方編輯器輸入程式碼，然後點擊「儲存到本地」按鈕。</p>
                </div>
            `;
            return;
        }

        this.snippetsList.innerHTML = this.localSnippets.map(snippet => `
            <div class="snippet-item local-snippet" data-id="${snippet.id}">
                <div class="snippet-header">
                    <div class="snippet-title">${this.escapeHtml(snippet.title)}</div>
                    <div class="snippet-language">${snippet.language.toUpperCase()}</div>
                </div>
                <div class="snippet-date">儲存於：${snippet.date}</div>
                <div class="snippet-preview">${this.escapeHtml(snippet.code.substring(0, 200))}${snippet.code.length > 200 ? '...' : ''}</div>
                <div class="snippet-actions">
                    <button class="load-btn" onclick="clipboard.loadLocalSnippet(${snippet.id})">
                        📝 載入
                    </button>
                    <button class="copy-snippet-btn" onclick="clipboard.copyLocalSnippet(${snippet.id})">
                        📋 複製
                    </button>
                    <button class="delete-btn" onclick="clipboard.deleteLocalSnippet(${snippet.id})">
                        🗑️ 刪除
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadSnippets() {
        this.renderLocalSnippets();
    }

    saveToLocalStorage() {
        localStorage.setItem('codeSnippets', JSON.stringify(this.localSnippets));
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
}

// 初始化應用程式
const clipboard = new OnlineCodeClipboard();

// 全域功能
window.clipboard = clipboard;

// 自動儲存功能
setInterval(() => {
    const code = clipboard.codeEditor.value.trim();
    if (code && code !== localStorage.getItem('autosave-content')) {
        localStorage.setItem('autosave-content', code);
        localStorage.setItem('autosave-language', clipboard.languageSelect.value);
        localStorage.setItem('autosave-time', new Date().toISOString());
    }
}, 5 * 60 * 1000);

// 載入自動儲存的內容
window.addEventListener('load', () => {
    const autosaveContent = localStorage.getItem('autosave-content');
    const autosaveLanguage = localStorage.getItem('autosave-language');
    const autosaveTime = localStorage.getItem('autosave-time');
    
    if (autosaveContent && autosaveTime) {
        const timeDiff = (new Date() - new Date(autosaveTime)) / (1000 * 60);
        if (timeDiff < 60) {
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
