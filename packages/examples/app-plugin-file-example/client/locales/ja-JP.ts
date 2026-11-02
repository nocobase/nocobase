import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  retrySubmission: '元の操作を再試行',

  officePreviewTitle: 'ローカル オフィスのプレビュー',
  officePreviewDescription:
    '以下の DOCX、XLSX、または PPTX ファイルをアップロードし、[プレビュー] を選択します。 Office Online や外部プレビュー サービスを使用せずに、ドキュメントをブラウザーで表示します。注文の添付ファイルは同じプレビューを使用します。',
  officePreviewLimits:
    'アプリとファイル サービスがローカル ネットワーク上でアクセスできる場合、インターネット接続は必要ありません。これは完全に切断されたモードではありません。この例では、従来の DOC、XLS、PPT、および OpenDocument ファイルはダウンロード専用のままです。',
  title: 'アタッチメント',
  description:
    '1 つまたは複数のファイルをアップロードし、その場でプレビューします。レコードはファイル リポジトリ API を通じて保存されます。',
  apiHint:
    'このページには、生のリポジトリ フローが保持されます。アップロード コントロールは、単一ファイルに対しては UploadOne を呼び出し、バッチに対しては UploadMany を呼び出します。',
  retention:
    'レコードを削除すると、そのメタデータのみが削除されます。保存されたオブジェクトはディスク上に残ります。',
  choose: 'ファイルを選択してください',
  uploading: 'アップロード中…',
  dropHint: 'またはここにファイルをドロップします',
  tooLarge: 'ファイルが最大サイズを超えています',
  rejected: 'ファイルタイプは許可されていません',
  uploadFailed: 'アップロードに失敗しました',
  preview: 'プレビュー',
  download: 'ダウンロード',
  remove: '削除',
  unlink: '注文から削除',
  empty: 'まだファイルがありません。',
  close: '閉じる',
  previous: '前へ',
  next: '次へ',
  loading: '読み込み中…',
  previewUnsupported:
    'このファイル形式にはインライン プレビューがありません。代わりにダウンロードしてください。',
  previewFailed: 'ファイルをロードできませんでした。',
  navGroup: 'ファイル例',
  navAttachments: 'アタッチメント',
  navProfiles: 'プロフィールアバター',
  navOrders: '注文添付ファイル',
  profilesTitle: 'プロフィールアバター（1対1）',
  profilesDescription:
    'プロフィールには最大 1 つのアバターが含まれます。新しいアバターをアップロードすると、以前のファイルが置き換えられます。',
  profilesRelationHint:
    '関係: fileExampleProfiles.avatar は、fileExampleProfileAvatars に対する hasOne 関係であり、一意の profileId を保持します。',
  noAvatar: 'アバターなし',
  profilesNoFile: 'アバター ファイルが接続されていません',
  profilesEmpty:
    'プロフィールが見つかりませんでした。サンプル シードを実行してデモ レコードを作成します。',
  uploadAvatar: 'アバターをアップロードする',
  replaceAvatar: 'アバターを置き換える',
  removeAvatar: 'アバターを削除する',
  avatarHint:
    'アップロードではファイルが保存され、プロファイル関係を通じてファイルが接続されます。削除すると関係がクリアされるだけです。',
  ordersTitle: '注文の添付ファイル（1 対多）',
  ordersDescription:
    'オーダーは任意の数の添付ファイルを所有します。複数のファイルを一度に選択して、バッチとしてアップロードします。',
  ordersRelationHint:
    '関係: fileExampleOrders.attachments は、orderId を介した fileExampleOrderAttachments に対する hasMany 関係です。',
  ordersNoFiles: 'この注文には添付ファイルがありません。',
  ordersEmpty:
    '注文が見つかりませんでした。サンプル シードを実行してデモ レコードを作成します。',
  ordersHint:
    '添付ファイルを削除すると、順序関係がクリアされます。ファイル レコードはファイル リポジトリで利用可能なままになります。',
  'status.draft': '下書き',
  'status.submitted': '送信済み',
  'status.archived': 'アーカイブ済み',
};

export default jaJP;
