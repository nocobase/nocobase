import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound: '會話中不存在具有此標識的訊息。',
    promptStarted: '訊息已開始處理，無法撤回。',
    withdrawalUnsupported:
      '此舊訊息無法安全撤回。更新命令列並重新啟動電腦連線。',
    bridgeReplaced: '另一個網橋已註冊此電腦。重新啟動此連線。',
    submissionConflict: '此提交 ID 已用於其他請求。',
    authenticationRequired: '登入以使用代理會話。',
    computerNotFound: '沒有具有此 ID 的電腦連線到您的帳戶。',
    sessionNotFound: '此 ID 的會話不屬於您。',
    computerOffline: '計算機離線。在其上啟動橋，然後重試。',
    agentUnavailable: '計算機無法執行此代理程式。',
    directoryNotAllowed: '此計算機上的會話僅在其橋允許的目錄下工作。',
    sessionArchived: '會話已存檔。先恢復一下吧',
    permissionRequestNotFound: '此許可權請求已得到答覆或不再等待。',
    choiceNotFound: '代理不提供此選擇或價值。',
    linkNotFound: '具有此 id 的此類內容與會話無關，或其工作無法從這裡開始。',
    invalidPageToken: '頁面令牌不是由該清單頒發的。',
    upgradeRequired: '橋接器使用另一個協定版本。更新此計算機上的命令列。',
    computerNotAnswering:
      '電腦沒有及時應答。檢查其連線是否正在執行，然後重試。',
    folderUnavailable: '無法在電腦上開啟該資料夾。',
    discoveryFailed: '無法載入代理設定。檢查此計算機上的代理並重試。',
    projectNotFound: '沒有這個專案，或者你看不到它。',
    referenceNotFound: '提到的東西不存在，或者你看不到它。',
    imageNotFound: '會話中未傳送具有此名稱的影像。',
    computerKeyInvalid:
      '此電腦不再連線：它已被刪除，或從其他地方重新連線。執行 `acp start` 來重新連線。',
  },
};

export default zhTW;
