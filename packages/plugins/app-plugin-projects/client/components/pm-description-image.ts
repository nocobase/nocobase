import { Node, mergeAttributes } from '@tiptap/core';

/** Only the protected attachment endpoint supplies description image bytes. */
function attachmentUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\/(?:[^/?#\\]+\/)*api\/projects\/attachments\/[^/?#]+\/content$/u.test(
      value,
    )
  );
}

/** Markdown images in task descriptions; shared with the application's detail editor. */
export const PmDescriptionImage: Node = Node.create({
  name: 'image',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      title: { default: null },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) =>
          attachmentUrl(element.getAttribute('src')) ? null : false,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    if (!attachmentUrl(HTMLAttributes.src))
      return ['span', {}, String(HTMLAttributes.alt ?? '')];
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        class:
          'my-2 inline-block h-auto max-h-96 max-w-full rounded-md object-contain',
        loading: 'lazy',
      }),
    ];
  },
  markdownTokenName: 'image',
  parseMarkdown: (token) => ({
    type: 'image',
    attrs: {
      src: typeof token.href === 'string' ? token.href : '',
      alt: token.text ?? '',
      title: typeof token.title === 'string' ? token.title : null,
    },
  }),
  renderMarkdown: (node) => {
    const alt = String(node.attrs?.alt ?? '').replace(/[[\]\\]/gu, '\\$&');
    const src = String(node.attrs?.src ?? '')
      .replace(/\s/gu, '%20')
      .replace(/\(/gu, '%28')
      .replace(/\)/gu, '%29');
    const title = node.attrs?.title
      ? ` "${String(node.attrs.title).replace(/"/gu, '\\"')}"`
      : '';
    return `![${alt}](${src}${title})`;
  },
});
