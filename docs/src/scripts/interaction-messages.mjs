/**
 * Strings the hand-built pages' scripts create in the browser. The Chinese text is the key and is used as written on
 * Chinese pages; other languages look it up here and fall back to English, then to the key.
 */
const MESSAGES = {
  en: {
    复制: 'Copy',
    复制提示词: 'Copy prompt',
    提示词: ' prompt',
    ' 项已检查': ' checked',
    '提示词已复制，可发送给应用项目中的 Agent':
      'Prompt copied. Send it to the Agent in your application project.',
    '复制未成功，请选中文字手动复制':
      'Copy failed. Select the text and copy it manually.',
    已复制: 'Copied',
    '已复制，可以粘贴到 Agent 中': 'Copied. Paste it into your Agent.',
    使用文档: 'Documentation',
    '：查看 {n} 个提示词': ': View {n} prompts',
    '查看提示词（{n}）': 'View prompts ({n})',
  },
  vi: {
    复制: 'Sao chép',
    复制提示词: 'Sao chép prompt',
    提示词: ' prompt',
    ' 项已检查': ' mục đã kiểm tra',
    '提示词已复制，可发送给应用项目中的 Agent':
      'Đã sao chép prompt. Hãy gửi cho Agent trong dự án ứng dụng của bạn.',
    '复制未成功，请选中文字手动复制':
      'Sao chép thất bại. Hãy chọn văn bản và sao chép thủ công.',
    已复制: 'Đã sao chép',
    '已复制，可以粘贴到 Agent 中': 'Đã sao chép. Hãy dán vào Agent của bạn.',
    使用文档: 'Tài liệu',
    '：查看 {n} 个提示词': ': Xem {n} prompt',
    '查看提示词（{n}）': 'Xem prompt ({n})',
  },
};

/** A `t(text, values)` for the page language; `{name}` placeholders are replaced from `values`. */
export function translator(lang) {
  const messages = lang === 'cn' ? {} : (MESSAGES[lang] ?? MESSAGES.en);
  return (text, values = {}) =>
    (messages[text] ?? MESSAGES.en[text] ?? text).replace(
      /\{(\w+)\}/g,
      (match, name) => (name in values ? String(values[name]) : match),
    );
}
