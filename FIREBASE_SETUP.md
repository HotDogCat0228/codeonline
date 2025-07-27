# Firebase 設定指南

要啟用線上共享功能，您需要設定 Firebase 專案。以下是詳細步驟：

## 步驟 1: 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱（例如：`code-clipboard`）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「建立專案」

## 步驟 2: 啟用 Firestore 資料庫

1. 在 Firebase 控制台中，點擊左側選單的「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」（開發階段）
4. 選擇資料庫位置（建議選擇 asia-east1 或 asia-southeast1）
5. 點擊「完成」

## 步驟 3: 設定 Web 應用程式

1. 在 Firebase 控制台首頁，點擊「</>」圖示來新增 Web 應用程式
2. 輸入應用程式暱稱（例如：`Code Clipboard Web`）
3. 勾選「設定 Firebase Hosting」（可選）
4. 點擊「註冊應用程式」
5. 複製設定代碼

## 步驟 4: 更新專案設定

將步驟 3 中取得的設定代碼替換到 `index.html` 中的 Firebase 設定：

```javascript
const firebaseConfig = {
    apiKey: "您的 API 金鑰",
    authDomain: "您的專案.firebaseapp.com",
    projectId: "您的專案 ID",
    storageBucket: "您的專案.appspot.com",
    messagingSenderId: "您的寄件者 ID",
    appId: "您的應用程式 ID"
};
```

## 步驟 5: 設定 Firestore 安全性規則

在 Firestore Database 的「規則」頁面中，更新安全性規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許讀取和寫入程式碼片段
    match /codeSnippets/{document} {
      allow read, write: if true;
    }
  }
}
```

**注意**: 這些規則僅適用於開發階段，在正式部署時請設定更嚴格的安全性規則。

## 步驟 6: 測試功能

1. 開啟您的網頁
2. 輸入一些程式碼
3. 點擊「🌐 分享到線上」按鈕
4. 點擊「📥 載入最新」按鈕查看線上片段

## 進階設定

### 生產環境安全性規則範例

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /codeSnippets/{document} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.resource.data.keys().hasAll(['title', 'code', 'language', 'createdAt'])
        && request.resource.data.title is string
        && request.resource.data.code is string
        && request.resource.data.language is string;
      allow update: if request.auth != null 
        && resource.data.createdBy == request.auth.uid;
      allow delete: if request.auth != null 
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### 啟用身份驗證（可選）

如果您想要用戶身份驗證：

1. 在 Firebase 控制台中點擊「Authentication」
2. 點擊「開始使用」
3. 選擇登入方式（Google、GitHub、電子郵件等）
4. 在程式碼中加入身份驗證邏輯

## 部署到 Firebase Hosting

1. 安裝 Firebase CLI：
```bash
npm install -g firebase-tools
```

2. 登入 Firebase：
```bash
firebase login
```

3. 初始化專案：
```bash
firebase init hosting
```

4. 部署：
```bash
firebase deploy
```

## 故障排除

### 常見問題

1. **Firebase 沒有載入**
   - 檢查網路連線
   - 確認 Firebase 設定正確
   - 檢查瀏覽器控制台的錯誤訊息

2. **無法分享程式碼**
   - 確認 Firestore 規則允許寫入
   - 檢查 Firebase 配額是否用盡

3. **無法載入線上程式碼**
   - 確認 Firestore 規則允許讀取
   - 檢查網路連線

### 支援

如有問題，請檢查：
- [Firebase 文件](https://firebase.google.com/docs)
- [Firestore 文件](https://firebase.google.com/docs/firestore)
- 瀏覽器控制台的錯誤訊息
