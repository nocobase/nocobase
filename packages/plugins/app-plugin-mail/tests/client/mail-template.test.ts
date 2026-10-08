import { describe, expect, it } from 'vitest';

import {
  interpolateMailTemplate,
  renderMailTemplate,
  sanitizeMailHtml,
} from '../../client/lib/mail-template.js';

describe('mail template rendering', () => {
  it('preserves exact font sizes while removing other inline CSS', () => {
    expect(sanitizeMailHtml('<font size="7">Legacy</font>')).toBe(
      '<font style="font-size: 48px;">Legacy</font>',
    );
    expect(
      sanitizeMailHtml(
        '<font style="font-size:12px;color:red">Small</font><span style="font-size:14px;background-image:url(https://example.com/track)">Body</span><span style="font-size:999px">Invalid</span>',
      ),
    ).toBe(
      '<font style="font-size: 12px;">Small</font><span style="font-size: 14px;">Body</span><span>Invalid</span>',
    );
  });

  it('resolves nested record values while preserving unknown placeholders', () => {
    expect(
      interpolateMailTemplate(
        'Hello {{record.customer.name}}, order {{record.number}} / {{missing}}',
        {
          record: { customer: { name: 'Ada' }, number: 42 },
        },
      ),
    ).toBe('Hello Ada, order 42 / {{missing}}');
  });

  it('escapes bound HTML values and removes unsafe markup', () => {
    const rendered = renderMailTemplate(
      {
        subject: 'Hello {{record.name}}',
        text: 'Hello {{record.name}}',
        html: '<p onclick="steal()">Hello <strong>{{record.name}}</strong></p><script>steal()</script>',
      },
      { record: { name: '<img src=x onerror=steal()>' } },
    );

    expect(rendered.subject).toBe('Hello <img src=x onerror=steal()>');
    expect(rendered.html).toBe(
      '<p>Hello <strong>&lt;img src=x onerror=steal()&gt;</strong></p>',
    );
  });

  it('blocks prototype traversal and unsafe links', () => {
    expect(
      interpolateMailTemplate('{{record.__proto__.secret}}', {
        record: {},
      }),
    ).toBe('{{record.__proto__.secret}}');
    expect(
      sanitizeMailHtml(
        '<a href="javascript:alert(1)" target="_blank">open</a>',
      ),
    ).toBe('<a target="_blank" rel="noopener noreferrer">open</a>');
  });

  it('keeps supported rich text controls while removing unsafe attributes and images', () => {
    expect(
      sanitizeMailHtml(
        '<h2>Title</h2><font size="5">Large</font><img src="https://example.com/image.png" alt="Preview" onerror="steal()"><img src="javascript:alert(1)"><div class="nocobase-mail-signature" data-extra="removed">Sign</div>',
      ),
    ).toBe(
      '<h2>Title</h2><font size="5">Large</font><img src="https://example.com/image.png" alt="Preview"><img><div class="nocobase-mail-signature">Sign</div>',
    );
  });
});
