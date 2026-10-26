import { pickLanguage } from '../../shared/languages.ts';

/**
 * The interface strings the layouts and shared components render, per language key. Page copy lives in the Markdown
 * and in the hand-built pages' JSON; this is only the chrome around it. A language without an entry falls back to the
 * default language.
 */
export interface UiText {
  /** Name of the site in breadcrumbs (JSON-LD). */
  siteName: string;
  menu: string;
  onThisPage: string;
  sidebar: string;
  imagePreview: string;
  pagination: string;
  previousPage: string;
  nextPage: string;
  backToCapabilities: string;
  footer: readonly [string, string];
  notFoundTitle: string;
  notFoundHome: string;
  changeLanguage: string;
  languages: string;
  pageActions: {
    /** Prompt handed to an assistant; `{url}` is the page's Markdown URL. */
    prompt: string;
    copy: string;
    copied: string;
    failed: string;
    more: string;
    link: string;
    chatgpt: string;
    claude: string;
  };
}

const UI_TEXT: Record<string, UiText> = {
  en: {
    siteName: 'NocoBase Documentation',
    menu: 'Menu',
    onThisPage: 'On this page',
    sidebar: 'Documentation',
    imagePreview: 'Image preview',
    pagination: 'Pagination',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    backToCapabilities: '← All capabilities',
    footer: [
      'NocoBase 3 · Documentation',
      'Open source · Self-hosted · Your choice of models and Agents',
    ],
    notFoundTitle: 'PAGE NOT FOUND',
    notFoundHome: 'Take me home',
    changeLanguage: 'Change language',
    languages: 'Languages',
    pageActions: {
      prompt: 'Read {url}, I want to ask questions about it.',
      copy: 'Copy Markdown',
      copied: 'Copied',
      failed: 'Copy failed',
      more: 'More actions',
      link: 'Copy Markdown link',
      chatgpt: 'Open in ChatGPT',
      claude: 'Open in Claude',
    },
  },
  cn: {
    siteName: 'NocoBase 文档',
    menu: '菜单',
    onThisPage: '目录',
    sidebar: '文档导航',
    imagePreview: '图片预览',
    pagination: '翻页',
    previousPage: '上一页',
    nextPage: '下一页',
    backToCapabilities: '← 全部应用能力',
    footer: ['NocoBase 3 · 开发文档', '开源 · 私有部署 · 自选模型与 Agent'],
    notFoundTitle: '页面未找到',
    notFoundHome: '返回首页',
    changeLanguage: '切换语言',
    languages: '语言',
    pageActions: {
      prompt: '阅读 {url}，我想询问关于它的问题。',
      copy: '复制 Markdown',
      copied: '已复制',
      failed: '复制失败',
      more: '更多操作',
      link: '复制 Markdown 链接',
      chatgpt: '在 ChatGPT 中打开',
      claude: '在 Claude 中打开',
    },
  },
  vi: {
    siteName: 'Tài liệu NocoBase',
    menu: 'Menu',
    onThisPage: 'Trên trang này',
    sidebar: 'Tài liệu',
    imagePreview: 'Xem trước hình ảnh',
    pagination: 'Phân trang',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    backToCapabilities: '← Tất cả năng lực',
    footer: [
      'NocoBase 3 · Tài liệu',
      'Mã nguồn mở · Tự host · Tự chọn model và Agent',
    ],
    notFoundTitle: 'KHÔNG TÌM THẤY TRANG',
    notFoundHome: 'Về trang chủ',
    changeLanguage: 'Đổi ngôn ngữ',
    languages: 'Ngôn ngữ',
    pageActions: {
      prompt: 'Hãy đọc {url}, tôi muốn hỏi một số câu hỏi về nội dung này.',
      copy: 'Sao chép Markdown',
      copied: 'Đã sao chép',
      failed: 'Sao chép thất bại',
      more: 'Thao tác khác',
      link: 'Sao chép liên kết Markdown',
      chatgpt: 'Mở trong ChatGPT',
      claude: 'Mở trong Claude',
    },
  },
};

export function uiText(language: string): UiText {
  return pickLanguage(UI_TEXT, language);
}
