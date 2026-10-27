const messages: Record<string, string> = {
  retrySubmission: '重试原操作',
  officePreviewTitle: 'Office 本地预览',
  officePreviewDescription:
    '在下方上传 DOCX、XLSX 或 PPTX 文件，然后点击预览。文档在浏览器内渲染，无需 Office Online 或外部预览服务；订单附件也支持相同预览。',
  officePreviewLimits:
    '内网可访问应用和文件服务时无需连接外网；不支持完全断网使用。此示例中的旧版 DOC、XLS、PPT 和 OpenDocument 文件仍需下载查看。',

  title: '附件',
  description:
    '上传单个或多个文件，并直接在页面内预览。文件记录通过 File Repository API 保存。',
  apiHint:
    '本页保留最原始的 Repository 流程：上传控件在单文件时调用 uploadOne，批量时调用 uploadMany。',
  retention: '删除记录只删除元数据，存储盘中的文件仍会保留。',

  choose: '选择文件',
  uploading: '上传中…',
  dropHint: '或将文件拖拽到这里',
  tooLarge: '文件超过大小限制',
  rejected: '不支持的文件类型',
  uploadFailed: '上传失败',

  preview: '预览',
  download: '下载',
  remove: '删除记录',
  unlink: '从订单移除',
  empty: '暂无文件。',
  close: '关闭',
  previous: '上一个',
  next: '下一个',
  loading: '加载中…',
  previewUnsupported: '该文件类型不支持内嵌预览，请下载查看。',
  previewFailed: '文件加载失败。',

  navGroup: 'File example',
  navAttachments: '附件',
  navProfiles: '员工头像',
  navOrders: '订单附件',

  profilesTitle: '员工头像（一对一）',
  profilesDescription: '每个员工最多有一个头像，上传新头像会替换旧头像。',
  profilesRelationHint:
    '关系：fileExampleProfiles.avatar 是指向 fileExampleProfileAvatars 的 hasOne 关系，头像表中的 profileId 带唯一约束。',
  noAvatar: '暂无头像',
  profilesNoFile: '尚未关联头像文件',
  profilesEmpty: '暂无员工记录，请先运行示例 seed 生成演示数据。',
  uploadAvatar: '上传头像',
  replaceAvatar: '更换头像',
  removeAvatar: '移除头像',
  avatarHint:
    '上传会先保存文件，再通过员工关系关联；移除只清除关联，不删除文件记录。',

  ordersTitle: '订单附件（一对多）',
  ordersDescription:
    '每个订单可以拥有任意数量的附件，支持一次选择多个文件批量上传。',
  ordersRelationHint:
    '关系：fileExampleOrders.attachments 是通过 orderId 关联 fileExampleOrderAttachments 的 hasMany 关系。',
  ordersNoFiles: '该订单暂无附件。',
  ordersEmpty: '暂无订单记录，请先运行示例 seed 生成演示数据。',
  ordersHint: '移除附件会清除订单关联，文件记录仍保留在文件仓库中。',
  'status.draft': '草稿',
  'status.submitted': '已提交',
  'status.archived': '已归档',
};
export default messages;
