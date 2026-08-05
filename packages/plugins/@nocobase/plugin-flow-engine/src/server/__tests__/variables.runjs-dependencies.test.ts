/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { collectPersistedRunJsVariableTemplates } from '../variables/runjs-variable-dependencies';

describe('persisted RunJS variable dependencies', () => {
  it('collects direct unshadowed ctx.getVar calls from nested RunJS values', () => {
    const templates = collectPersistedRunJsVariableTemplates({
      stepParams: {
        jsSettings: {
          runJs: {
            code: `
              const roleName = await ctx.getVar('ctx.popup.record.name');
              const userId = await ctx['getVar'](\`ctx.user.id\`);
              ctx.render(<div>{roleName}:{userId}</div>);
            `,
            version: 'v2',
          },
        },
      },
    });

    expect(templates).toEqual(['{{ ctx.popup.record.name }}', '{{ ctx.user.id }}']);
  });

  it.each([
    {
      title: 'dynamic arguments',
      value: { code: `const path = 'ctx.popup.record.name'; await ctx.getVar(path);`, version: 'v2' },
    },
    {
      title: 'shadowed ctx parameters',
      value: { code: `(ctx) => ctx.getVar('ctx.popup.record.name');`, version: 'v2' },
    },
    {
      title: 'comments and strings',
      value: {
        code: `// ctx.getVar('ctx.popup.record.name')\nconst text = "ctx.getVar('ctx.user.id')";`,
        version: 'v2',
      },
    },
    {
      title: 'non-RunJS objects',
      value: { code: `await ctx.getVar('ctx.popup.record.name');`, label: 'Documentation', version: 'v2' },
    },
    {
      title: 'invalid JavaScript',
      value: { code: `await ctx.getVar('ctx.popup.record.name'`, version: 'v2' },
    },
  ])('fails closed for $title', ({ value }) => {
    expect(collectPersistedRunJsVariableTemplates(value)).toEqual([]);
  });

  it('deduplicates static dependencies across persisted RunJS values', () => {
    const code = `await ctx.getVar('ctx.popup.record.name');`;
    expect(
      collectPersistedRunJsVariableTemplates({
        first: { code, version: 'v2' },
        second: [{ code }, { code, version: null }],
      }),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });
});
