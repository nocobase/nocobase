import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed':
    'この Office Open XML ファイルをレンダリングできません。',
  'files.ooxmlLoadTimedOut':
    'プレビューのロードが {{minutes}} 分以内に完了しませんでした。',
  'files.previewRequestFailed':
    'プレビューリクエストが失敗しました（{{status}}）。',
  uploadFailed: 'ファイルのアップロードに失敗しました。',
  fileLimitReached: 'ファイル数が上限に達しました。',
  fileTooLarge: 'ファイルが最大サイズを超えています。',
  fileTypeNotAllowed: 'ファイルタイプは許可されていません。',
  removalFailed: 'ファイルの削除に失敗しました。',
  urlNotAllowed: 'ファイル URL は許可されません。',
  downloadFailed: 'ファイルのダウンロードに失敗しました。',
  invalidUrl: 'ファイル URL が見つからないか、許可されていません。',
  pdfPreviewFailed: 'PDF プレビューを読み込めません。',
  pdfPreviewMarkup:
    'ファイル URL は PDF ではなく HTML または XML を返しました。',
  previewFailed: 'ファイルプレビューを読み込めません。',
  'files.empty': 'ファイルがありません。',
  'files.preview': 'プレビュー',
  'files.download': 'ダウンロード',
  'files.remove': '削除',
  'files.chooseMany': 'ファイルを選択してください',
  'files.chooseOne': 'ファイルを選択してください',
  'files.retry': '再試行',
  'files.done': '完了',
  'files.uploading': 'アップロード中',
  'files.failed': '失敗しました',
  'files.pending': '保留中',
  'files.previous': '前のファイル',
  'files.next': '次のファイル',
  'files.loadingPreview': 'プレビューを読み込んでいます...',
  'files.downloadFile': 'ダウンロードファイル',
  'files.previewUnavailable':
    'このファイル形式ではプレビューを利用できません。',
  'files.imageFailed':
    'この画像は表示できませんでした。破損しているか、サポートされていない形式である可能性があります。',
  'files.officeFailed':
    'Office Online はこのファイルを読み込むことができませんでした。',
  'files.officeUrl':
    'Office Online には、インターネットからアクセスできる絶対ファイル URL が必要です。',
  'files.cancelFile': 'キャンセル {{filename}}',
  'files.status.uploading': 'アップロード中',
  'files.status.pending': '保留中',
  'files.status.error': '失敗しました',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
