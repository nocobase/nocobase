import { Editor } from '@tiptap/core';
import { expect, it } from 'vitest';
import {
  npRichTextExtensions,
  editorMarkdown,
} from '../../client/components/pm-rich-text-extensions.js';

it('preserves description images through editing and reopening', () => {
  const markdown =
    'Before ![screenshot](/main/api/projects/attachments/123/content) after';
  const editor = new Editor({
    extensions: npRichTextExtensions({ images: true }),
    content: markdown,
    contentType: 'markdown',
  });
  try {
    expect(editor.getHTML()).toContain(
      'src="/main/api/projects/attachments/123/content"',
    );
    expect(editorMarkdown(editor)).toBe(markdown);
    editor.commands.insertContentAt(1, 'Edited ');
    expect(editorMarkdown(editor)).toContain(
      '![screenshot](/main/api/projects/attachments/123/content)',
    );
    editor.commands.setContent(editorMarkdown(editor), {
      contentType: 'markdown',
    });
    expect(editor.getHTML()).toContain('<img');
  } finally {
    editor.destroy();
  }
});

it('never fetches external or data image URLs', () => {
  const editor = new Editor({
    extensions: npRichTextExtensions({ images: true }),
    content:
      '![outside](https://example.com/a.png) ![data](data:image/png;base64,abc)',
    contentType: 'markdown',
  });
  try {
    expect(editor.getHTML()).not.toContain('<img');
  } finally {
    editor.destroy();
  }
});
