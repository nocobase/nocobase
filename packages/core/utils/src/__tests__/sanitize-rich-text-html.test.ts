/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sanitizeRichTextHtml } from '../sanitize-rich-text-html';

describe('sanitizeRichTextHtml', () => {
  it('removes executable markup and unsafe URLs', () => {
    const sanitized = sanitizeRichTextHtml(
      [
        '<script>alert(1)</script>',
        '<img src="https://example.com/image.png" onerror="alert(1)">',
        '<a href="javascript:alert(1)" target="evil">unsafe</a>',
        '<svg><a xlink:href="javascript:alert(1)">unsafe svg</a></svg>',
      ].join(''),
    );

    expect(sanitized).toBe('<img src="https://example.com/image.png" /><a>unsafe</a><a>unsafe svg</a>');
  });

  it('preserves supported Quill formatting', () => {
    const input = [
      '<h2>Heading</h2>',
      '<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p>',
      '<p class="ql-indent-2 extra">Indented paragraph</p>',
      '<ol><li class="ql-indent-2 extra">Nested</li></ol>',
      '<span style="font-size: 24px; color: red">Large</span>',
      '<img src="data:image/png;base64,aGVsbG8=" alt="Preview" width="320" height="180" ',
      'style="width: 320px; height: 180px; cursor: nwse-resize">',
      '<a href="https://www.nocobase.com" target="_blank">NocoBase</a>',
    ].join('');

    expect(sanitizeRichTextHtml(input)).toBe(
      [
        '<h2>Heading</h2>',
        '<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p>',
        '<p class="ql-indent-2">Indented paragraph</p>',
        '<ol><li class="ql-indent-2">Nested</li></ol>',
        '<span style="font-size:24px">Large</span>',
        '<img src="data:image/png;base64,aGVsbG8=" alt="Preview" width="320" height="180" ',
        'style="width:320px;height:180px" />',
        '<a href="https://www.nocobase.com" target="_blank" rel="noopener noreferrer">NocoBase</a>',
      ].join(''),
    );
  });

  it('rejects active image data and unsafe dimensions', () => {
    expect(
      sanitizeRichTextHtml(
        '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" width="99999" height="expression(alert(1))">',
      ),
    ).toBe('<img />');
  });

  it('is idempotent and does not decode escaped markup', () => {
    const input = '&lt;img src=x onerror=alert(1)&gt;';
    const sanitized = sanitizeRichTextHtml(input);

    expect(sanitized).toBe(input);
    expect(sanitizeRichTextHtml(sanitized)).toBe(sanitized);
  });
});
