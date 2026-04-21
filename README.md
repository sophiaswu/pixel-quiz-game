# 像素風闖關問答遊戲 (Pixel Quiz Game)

這是一個以經典 2000 年代 8-bit 像素風格設計的網頁問答遊戲。前端採用 **React + Vite** 實作，後端與資料庫則依賴 **Google Sheets + Google Apps Script**，輕量且不需要額外的伺服器花費。

## 安裝與執行前端 (React Vite)

請確保你的電腦已安裝 [Node.js](https://nodejs.org/)。

1. 開啟命令提示字元 (CMD) 或 PowerShell。
2. 進入專案資料夾：
   ```bash
   cd c:\Users\shiny\OneDrive\桌面\Projects\pixel-quiz-game
   ```
3. 安裝相依套件：
   ```bash
   npm install
   ```
4. 啟動本機開發伺服器：
   ```bash
   npm run dev
   ```
5. 終端機會顯示一個本地網址（通常是 `http://localhost:5173`），在瀏覽器開啟即可看到遊戲畫面。

---

## 建立資料庫 (Google Sheets)

這會成為遊戲的題庫與記錄結算的資料庫。

1. 登入 Google 帳號並創建一個全新的 **Google 試算表**。
2. 建立兩個工作表（請注意名稱要一模一樣）：
   - 第一個工作表命名為：`題目`
     - 第一列 (A~G) 必須填寫標題：`題號`、`題目`、`A`、`B`、`C`、`D`、`解答`
   - 第二個工作表命名為：`回答`
     - 第一列 (A~G) 必須填寫標題：`ID`、`闖關次數`、`總分`、`最高分`、`第一次通關分數`、`花了幾次通關`、`最近遊玩時間`
3. 將你想測試的考題放進「題目」工作表中（可參考下方提供的測試題庫）。

---

## 部署後端 API (Google Apps Script)

這段程式碼將做為後端計算成績與吐題目的伺服器。

1. 在剛剛創建的 Google 試算表中，點選上方的選單：**「擴充功能」 -> 「Apps Script」**。
2. 這會打開一個新的視窗，請將此專案目錄下 `Code.gs` 的所有內容，直接複製並覆蓋到網頁編輯器內的程式碼。
3. 點選儲存 (Ctrl + S)。
4. 點擊右上角藍色按鈕的 **「部署」** -> **「新增部署作業」**。
5. 在「選取類型」的齒輪圖示點擊，選擇 **「網頁應用程式」**。
6. 設定存取權限：**「所有人 (Anyone)」** （這非常重要，這決定了前端的 API 能不能打通）。
7. 點擊「部署」。第一次授權時會跳出警告畫面，請點選「進階」並選擇前往執行。
8. 部署成功後，會得到一串 **「網頁應用程式網址」** (例如: `https://script.google.com/macros/s/你的專屬碼/exec`)，請把它複製下來。

---

## 環境變數配置 (.env)

回到你的本地端電腦，在專案的根目錄找到 `.env` 檔案（如果沒有請自行建立）。

將你剛才複製的網址放進去：
```env
VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/你的網址/exec
VITE_PASS_THRESHOLD=3
VITE_QUESTION_COUNT=5
```
- `VITE_PASS_THRESHOLD`: 答對幾題及格通關。
- `VITE_QUESTION_COUNT`: 遊戲一次會隨機抽出的題目數量。

設定完成後，再次執行 `npm run dev` 即可順利遊玩！

---

## 網頁自動部署 (GitHub Pages)

本專案包含自動編譯並部署到 GitHub Pages 的 Action 腳本 (`.github/workflows/deploy.yml`)。因為遊戲中依賴環境變數來判斷 API 網址與設定，請務必按照下方步驟將變數加入到 GitHub 中：

### 部署步驟

1. 將整個專案上傳（Push）到你的 GitHub Repository，並確保分支為 `main`。
2. 開啟 GitHub 專案頁面，點選上方的 **Settings** -> 左側選單的 **Pages**。
3. 在 `Build and deployment` 區塊下，將 Source 下拉選單改為 **GitHub Actions**。
4. 繼續在左側選單找到 **Secrets and variables** -> 點開後選擇 **Actions**。
5. 點擊綠色的 **New repository secret** 按鈕，逐一新增下列環境變數（參考 `.env.example`）：
   - `VITE_GOOGLE_APP_SCRIPT_URL`：請填入你的 GAS 應用程式網址。
   - `VITE_PASS_THRESHOLD`：請填入過關門檻（例如 `3`）。
   - `VITE_QUESTION_COUNT`：請填入總題數（例如 `5`）。
6. 新增完畢後，任何推送 (Push) 到 `main` 分支的操作都會自動觸發 Action 進行編譯。
7. 部署完成後，可回到 **Pages** 頁面查看專屬的 GitHub Pages 網址。
