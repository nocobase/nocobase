import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  navTitle: 'テンプレート印刷例',
  title: 'テンプレート印刷例',
  description:
    '請求書とその承認された見積データを含む固定 DOCX テンプレートを DOCX または PDF としてレンダリングします。 PDF 変換には、アプリケーション サーバーに LibreOffice が必要です。',
  invoiceList: '請求書',
  invoiceCount_one: '{{count}} 請求書',
  invoiceCount_other: '{{count}} 請求書',
  loading: '請求書を読み込み中…',
  empty: '見積アクセス範囲で使用できる請求書はありません。',
  emptyHint:
    'Examples データベース タスクを実行し、sales_manager としてサインインするか、リンクされた Sales Quote を表示できるアカウントを使用します。',
  loadFailed: '請求書を読み込めませんでした。',
  download: 'DOCXをダウンロード',
  downloading: 'レンダリング中…',
  downloadFailed: '請求書をレンダリングできませんでした。',
  invoice: '請求書',
  customer: '顧客\n【829】お客様オーダーランキング',
  issuedOn: '発行日',
  quote: '出典引用',
  amount: '合計',
  downloadActions: 'ダウンロードアクション',
  downloadPdf: 'PDFをダウンロード',
  pdfConverterUnavailable:
    'アプリケーションサーバー上にLibreOfficeが見つからなかったため、PDF変換は利用できません。 NocoBase と同じマシンまたはコンテナにインストールし、サーバー プロセスがその実行可能ファイルを見つけられることを確認し、アプリケーションを再起動します。 DOCX ダウンロードは引き続き利用可能です。',
  installLibreOffice: 'LibreOfficeをダウンロード',
  retry: '再試行',
};

export default jaJP;
