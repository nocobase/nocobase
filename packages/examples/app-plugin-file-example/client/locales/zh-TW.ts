import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  officePreviewTitle: '本地辦公室預覽',
  officePreviewDescription:
    '上傳下面的 DOCX、XLSX 或 PPTX 檔案，然後選擇「預覽」。檔案以瀏覽器呈現，無需 Office Online 或外部預覽服務。訂單附件使用相同的預覽。',
  officePreviewLimits:
    '當應用程式和檔案服務可在您的本地網路上存取時，不需要網路連線。這不是完全斷開連線的模式。在此範例中，舊版 DOC、XLS、PPT 和 OpenDocument 檔案仍僅供下載。',
  title: '附件',
  description: '上傳一個或多個檔案並就地預覽。記錄透過檔案儲存庫 API 儲存。',
  apiHint:
    '此頁面保留原始儲存庫流程：上傳控制元件針對單個檔案呼叫 uploadOne，針對批次呼叫 uploadMany。',
  retention: '刪除記錄僅刪除其元資料；儲存的物件保留在磁碟上。',
  choose: '選擇檔案',
  uploading: '正在上傳...',
  dropHint: '或將檔案拖曳到此處',
  tooLarge: '檔案超出最大大小',
  rejected: '不允許的檔案型別',
  uploadFailed: '上傳失敗',
  preview: '預覽',
  download: '下載',
  remove: '刪除',
  unlink: '從訂單中刪除',
  empty: '還沒有檔案。',
  close: '關閉',
  previous: '上一步',
  next: '下一步',
  loading: '載入中…',
  previewUnsupported: '此檔案型別沒有內嵌預覽。下載它。',
  previewFailed: '檔案無法載入。',
  navGroup: '檔案範例',
  navAttachments: '附件',
  navProfiles: '個人資料頭像',
  navOrders: '訂購附件',
  profilesTitle: '個人資料頭像（一對一）',
  profilesDescription:
    '一個個人資料最多有一個頭像。上傳新頭像會取代先前的檔案。',
  profilesRelationHint:
    '關係：fileExampleProfiles.avatar 是與 fileExampleProfileAvatars 的 hasOne 關係，它保留唯一的 profileId。',
  noAvatar: '無頭像',
  profilesNoFile: '未連線頭像檔案',
  profilesEmpty: '未找到設定檔。執行範例種子以建立演示記錄。',
  uploadAvatar: '上傳頭像',
  replaceAvatar: '更換頭像',
  removeAvatar: '刪除頭像',
  avatarHint: '上傳儲存檔案，然後透過profile關係連線；刪除只會清除關係。',
  ordersTitle: '訂購附件（一對多）',
  ordersDescription:
    '一個訂單可以擁有任意數量的附件。一次選擇多個檔案以批次上傳。',
  ordersRelationHint:
    '關係：fileExampleOrders.attachments 是透過 orderId 與 fileExampleOrderAttachments 的 hasMany 關係。',
  ordersNoFiles: '此訂單上沒有附件。',
  ordersEmpty: '未找到訂單。執行範例種子以建立演示記錄。',
  ordersHint: '刪除附件會清除訂單關係。檔案記錄在檔案儲存庫中保持可用。',
  'status.draft': '草稿',
  'status.submitted': '已提交',
  'status.archived': '已封存',
};

export default zhTW;
