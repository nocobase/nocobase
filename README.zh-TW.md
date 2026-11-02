# NocoBase 3

> 目前分支為 NocoBase 3。如果你正在尋找 NocoBase 2 無程式碼開發平台，請造訪 [NocoBase 2](https://nocode.nocobase.com/)。

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | 繁體中文 | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**打造可靠的業務系統**

NocoBase 是以 AI 持續開發與運行業務系統的開源平台。Agent 寫程式、做執行，NocoBase 提供基礎平台與治理能力，人來做決策。

[▶ 觀看展示](https://static-docs.nocobase.com/nocobase-3-zh-TW.mp4)

[官網](https://www.nocobase.com/zh-TW/) · [文件](https://docs.nocobase.com/) · [快速開始](#quick-start) · [社群](https://forum.nocobase.com/)

## 為什麼需要 NocoBase

**AI 寫程式很快，但打造可靠的業務系統依然不簡單。**

你的企業已經在用 AI 開發或 Vibe Coding，程式寫得很快，但新的問題也隨之而來。

- **底層能力得從零打造**

  即使交給 AI，權限、工作流程引擎、簽核等底層模組從零開發，設計難度依然很高，邊界情況多，維護工作量大。

- **架構隨機漂移，逐漸失控**

  換人、換模型甚至換對話，AI 都可能隨意發揮，系統越來越難維護。

- **並行任務太多，人確認不過來**

  同時處理多個專案和任務，在多個終端機和對話之間切換，Agent 交回的變更越來越多，人看不過來，又不敢放手。

- **知識和經驗難以累積與分享**

  需求背景、業務資料、專案經驗散落在不同電腦的不同對話裡，換人、換 Agent 就很難找到。

<a id="quick-start"></a>

## 快速開始

需要 Node.js 24+ 和 pnpm 11，Windows 使用者請使用 WSL。以下範例使用 SQLite，無需另外安裝資料庫服務。

### 使用 Coding Agent

在空目錄中開啟支援 Skills 的 Coding Agent，安裝建立應用程式的 Skill：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

安裝時選擇目前使用的 Agent；若未辨識到新 Skill，請重新開啟工作階段。然後傳送：

```text
請按照 nocobase-create-app Skill，在目前的空目錄中建立並啟動 NocoBase 3 應用程式，使用預設範本和 SQLite。
```

### 使用終端機

在用於存放專案的父目錄中執行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

更多建立步驟和開發指引，請參閱[文件](https://docs.nocobase.com/)。

## NocoBase 生態系

- **[NocoBase Core](https://www.nocobase.com/zh-TW/core/)**

  **讓 Agent 專心寫業務，地基已經打好。**

  NocoBase Core 是以 AI 開發與運行業務系統的開源應用基礎平台。權限、流程、檔案等基礎能力現成可用，Agent 在統一架構上只開發企業自己的業務。

- **[NocoBase Studio](https://www.nocobase.com/zh-TW/studio/)**

  **Agent 自主推進，團隊掌控全局。**

  NocoBase Studio 是人與 Agent 協同開發的治理平台。把 Claude Code、Codex、OpenCode 組成一支 Agent 團隊自主推進任務，進度一目了然，關鍵處由人做決策。

- **[NocoBase Solution](https://www.nocobase.com/zh-TW/solutions/)**

  **開源業務應用，AI 驅動，開箱即用。**

  NocoBase Solution 是由 Agent 驅動、以 Core 打造的一系列企業業務應用，Agent 做大部分執行工作，人只做關鍵決策。

## 社群與貢獻

- 在[社群論壇](https://forum.nocobase.com/)提問、交流經驗和分享實務。
- 透過 [GitHub Issues](https://github.com/nocobase/nocobase/issues) 回報可重現的問題或提出改善建議。
- 閱讀[文件](https://docs.nocobase.com/)，了解框架和外掛的使用方式。

歡迎參與貢獻。修改本儲存庫前，請先閱讀 [AGENTS.md](./AGENTS.md) 以及與變更相關的開發指引。
