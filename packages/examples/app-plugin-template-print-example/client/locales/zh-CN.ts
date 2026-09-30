import type { TemplatePrintExampleResource } from './en-US.js';

const zhCN: TemplatePrintExampleResource = {
  navTitle: '模板打印示例',
  title: '模板打印示例',
  description:
    '使用固定 DOCX 模板生成发票 DOCX 或 PDF，并按当前授权范围读取关联报价。PDF 转换需要在应用服务器安装 LibreOffice。',
  invoiceList: '发票列表',
  invoiceCount_one: '{{count}} 张发票',
  invoiceCount_other: '{{count}} 张发票',
  loading: '正在加载发票…',
  empty: '当前报价权限范围内没有可打印的发票。',
  emptyHint:
    '请先运行 Examples 数据库任务，并使用 sales_manager 或具有对应 Sales Quotes 查看权限的账号登录。',
  loadFailed: '加载发票失败。',
  download: '下载 DOCX',
  downloading: '正在生成…',
  downloadFailed: '发票生成失败。',
  invoice: '发票',
  customer: '客户',
  issuedOn: '开票日期',
  quote: '来源报价',
  amount: '总额',
  downloadActions: '下载操作',
  downloadPdf: '下载 PDF',
  pdfConverterUnavailable:
    '应用服务器未找到 LibreOffice，暂时无法转换 PDF。请在运行 NocoBase 的同一台电脑或容器中安装 LibreOffice，确保服务进程能够找到其可执行文件，然后重启应用。DOCX 仍可下载。',
  installLibreOffice: '下载 LibreOffice',
  retry: '重试',
};

export default zhCN;
