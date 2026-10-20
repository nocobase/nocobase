import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  navTitle: '模板列印範例',
  title: '模板列印範例',
  description:
    '將帶有發票及其授權報價資料的固定 DOCX 範本呈現為 DOCX 或 PDF。 PDF 轉換需要應用程式伺服器上的 LibreOffice。',
  invoiceList: '發票',
  invoiceCount_one: '{{count}} 發票',
  invoiceCount_other: '{{count}} 發票',
  loading: '正在載入發票...',
  empty: '您的報價存取範圍內沒有可用的發票。',
  emptyHint:
    '執行示例資料庫任務並以 sales_manager 身份登入，或使用可以檢視連結的銷售報價的帳戶。',
  loadFailed: '無法載入發票。',
  download: '下載 DOCX',
  downloading: '渲染…',
  downloadFailed: '無法開立發票。',
  invoice: '發票',
  customer: '客戶',
  issuedOn: '釋出於',
  quote: '來源引用',
  amount: '總計',
  downloadActions: '下載操作',
  downloadPdf: '下載PDF',
  pdfConverterUnavailable:
    'PDF 轉換不可用，因為在應用程式伺服器上找不到 LibreOffice。將其安裝在與 NocoBase 相同的電腦或容器上，確保伺服器程式可以找到其執行檔，然後重新啟動應用程式。 DOCX 下載仍然可用。',
  installLibreOffice: '下載 LibreOffice',
  retry: '重試',
};

export default zhTW;
