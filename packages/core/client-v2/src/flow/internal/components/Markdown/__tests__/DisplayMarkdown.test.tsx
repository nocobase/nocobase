/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import { sanitizeRichTextHtml } from '@nocobase/utils/client';
import React from 'react';
import { DisplayMarkdown } from '../DisplayMarkdown';

vi.mock('../util', () => ({
  useParseMarkdown: (value: string) => ({ html: value }),
  convertToText: (value: string) => {
    const element = document.createElement('div');
    element.innerHTML = value;
    return element.textContent || '';
  },
}));

describe('DisplayMarkdown', () => {
  it('sanitizes HTML mode', () => {
    const { container } = render(
      <DisplayMarkdown
        value={'<p>safe</p><img src="https://example.com/image.png" onerror="alert(1)"><script>alert(1)</script>'}
        sanitizeHtml={sanitizeRichTextHtml}
        textOnly={false}
      />,
    );

    expect(container.querySelector('p')).toHaveTextContent('safe');
    expect(container.querySelector('img')).not.toHaveAttribute('onerror');
    expect(container.querySelector('script')).toBeNull();
  });

  it('renders decoded text as a text node', () => {
    const payload = '&lt;img src=x onerror=alert(document.domain)&gt;';
    const { container } = render(<DisplayMarkdown value={payload} sanitizeHtml={sanitizeRichTextHtml} textOnly />);

    expect(container).toHaveTextContent('<img src=x onerror=alert(document.domain)>');
    expect(container.querySelector('img')).toBeNull();
  });
});
