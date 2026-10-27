const messages: Record<string, string> = {
  retrySubmission: 'Retry original operation',
  officePreviewTitle: 'Local Office preview',
  officePreviewDescription:
    'Upload a DOCX, XLSX or PPTX file below, then select Preview. Documents render in your browser without Office Online or an external preview service. Order attachments use the same preview.',
  officePreviewLimits:
    'No internet connection is required when the app and file service are reachable on your local network. This is not a fully disconnected mode. Legacy DOC, XLS, PPT and OpenDocument files remain download-only in this example.',

  title: 'Attachments',
  description:
    'Upload one or several files and preview them in place. Records are stored through the File Repository API.',
  apiHint:
    'This page keeps the raw repository flow: the upload control calls uploadOne for a single file and uploadMany for a batch.',
  retention:
    'Deleting a record removes its metadata only; the stored object stays on the disk.',

  choose: 'Choose files',
  uploading: 'Uploading…',
  dropHint: 'or drop files here',
  tooLarge: 'File exceeds the maximum size',
  rejected: 'File type is not allowed',
  uploadFailed: 'Upload failed',

  preview: 'Preview',
  download: 'Download',
  remove: 'Delete',
  unlink: 'Remove from order',
  empty: 'No files yet.',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  loading: 'Loading…',
  previewUnsupported:
    'This file type has no inline preview. Download it instead.',
  previewFailed: 'The file could not be loaded.',

  navGroup: 'File example',
  navAttachments: 'Attachments',
  navProfiles: 'Profile avatars',
  navOrders: 'Order attachments',

  profilesTitle: 'Profile avatars (one-to-one)',
  profilesDescription:
    'A profile has at most one avatar. Uploading a new avatar replaces the previous file.',
  profilesRelationHint:
    'Relation: fileExampleProfiles.avatar is a hasOne relation to fileExampleProfileAvatars, which keeps a unique profileId.',
  noAvatar: 'No avatar',
  profilesNoFile: 'No avatar file connected',
  profilesEmpty:
    'No profiles found. Run the example seed to create demo records.',
  uploadAvatar: 'Upload avatar',
  replaceAvatar: 'Replace avatar',
  removeAvatar: 'Remove avatar',
  avatarHint:
    'Uploading stores the file and then connects it through the profile relation; removing only clears the relation.',

  ordersTitle: 'Order attachments (one-to-many)',
  ordersDescription:
    'An order owns any number of attachments. Select several files at once to upload them as a batch.',
  ordersRelationHint:
    'Relation: fileExampleOrders.attachments is a hasMany relation to fileExampleOrderAttachments through orderId.',
  ordersNoFiles: 'No attachments on this order.',
  ordersEmpty: 'No orders found. Run the example seed to create demo records.',
  ordersHint:
    'Removing an attachment clears the order relation. The file record stays available in the File Repository.',
  'status.draft': 'Draft',
  'status.submitted': 'Submitted',
  'status.archived': 'Archived',
};
export default messages;
