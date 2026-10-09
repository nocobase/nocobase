import type { MailRichTextEditorLabels } from '../components/mail-rich-text-editor.js';

export function mailEditorLabels(
  t: (key: string, options?: Record<string, unknown>) => string,
): Required<MailRichTextEditorLabels> {
  return {
    toolbar: t('workspace.editor.toolbar', { defaultValue: 'Formatting' }),
    bold: t('workspace.editor.bold', { defaultValue: 'Bold' }),
    italic: t('workspace.editor.italic', { defaultValue: 'Italic' }),
    underline: t('workspace.editor.underline', { defaultValue: 'Underline' }),
    bulletList: t('workspace.editor.bulletList', {
      defaultValue: 'Bulleted list',
    }),
    numberedList: t('workspace.editor.numberedList', {
      defaultValue: 'Numbered list',
    }),
    undo: t('workspace.editor.undo', { defaultValue: 'Undo' }),
    redo: t('workspace.editor.redo', { defaultValue: 'Redo' }),
    clearFormatting: t('workspace.editor.clearFormatting', {
      defaultValue: 'Clear formatting',
    }),
    fontSize: t('workspace.editor.fontSize', { defaultValue: 'Font size' }),
    heading: t('workspace.editor.heading', { defaultValue: 'Heading level' }),
    link: t('workspace.editor.link', { defaultValue: 'Insert link' }),
    deleteImage: t('workspace.deleteImage'),
    resizeImage: t('workspace.resizeImage'),
    uploadImage: t('workspace.uploadImage'),
    image: t('workspace.editor.image', { defaultValue: 'Insert image' }),
    normal: t('workspace.editor.normal', { defaultValue: 'Normal' }),
    heading1: t('workspace.editor.heading1', { defaultValue: 'Heading 1' }),
    heading2: t('workspace.editor.heading2', { defaultValue: 'Heading 2' }),
    heading3: t('workspace.editor.heading3', { defaultValue: 'Heading 3' }),
    heading4: t('workspace.editor.heading4', { defaultValue: 'Heading 4' }),
    heading5: t('workspace.editor.heading5', { defaultValue: 'Heading 5' }),
    heading6: t('workspace.editor.heading6', { defaultValue: 'Heading 6' }),
    fontSizeSmall: t('workspace.editor.fontSizeSmall', {
      defaultValue: 'Small',
    }),
    fontSizeNormal: t('workspace.editor.fontSizeNormal', {
      defaultValue: 'Normal',
    }),
    fontSizeLarge: t('workspace.editor.fontSizeLarge', {
      defaultValue: 'Large',
    }),
  };
}
