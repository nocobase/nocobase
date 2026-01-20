/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import * as jsxTransform from '../../utils/jsxTransform';
import { prepareRunJsCode, preprocessRunJsTemplates } from '../runjsTemplateCompat';

describe('runjsTemplateCompat', () => {
  describe('preprocessRunJsTemplates', () => {
    it('hoists bare {{ }} placeholders into top-level resolved vars', () => {
      const src = `const a = {{ctx.user.id}};`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");`);
      expect(out).toContain(`const a = __runjs_ctx_tpl_0;`);
    });

    it('replaces string literals containing {{ }} via split/join, without injecting await into nested functions', () => {
      const src = `const s = '{{ctx.user.id}}';`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");`);
      expect(out).toContain(`__runjs_templateValueToString(__runjs_ctx_tpl_0, "{{ctx.user.id}}")`);
      expect(out).toContain(`.split("{{ctx.user.id}}").join(`);
    });

    it('does not transform arguments inside explicit ctx.resolveJsonTemplate(...) call', () => {
      const src = `const v = await ctx.resolveJsonTemplate('{{ctx.user.id}}');\nconst s = '{{ctx.user.id}}';`;
      const out = preprocessRunJsTemplates(src);
      // inside call: keep raw
      expect(out).toContain(`await ctx.resolveJsonTemplate('{{ctx.user.id}}')`);
      // outside call: transform
      expect(out).toContain(`__runjs_templateValueToString(__runjs_ctx_tpl_0, "{{ctx.user.id}}")`);
    });

    it('keeps template markers in comments unchanged', () => {
      const src = `// {{ctx.user.id}}\nconst a = 1;`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toBe(src);
    });

    it('supports template literals containing {{ }}', () => {
      const src = 'const s = `hi {{ctx.user.name}}`;';
      const out = preprocessRunJsTemplates(src);
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.name}}");`);
      expect(out).toContain(`\`hi {{ctx.user.name}}\``);
      expect(out).toContain(`.split("{{ctx.user.name}}").join(`);
    });

    it('does not rewrite non-ctx {{ }} patterns (e.g. JSX style object) while still rewriting ctx placeholders', () => {
      const src = `const id = {{ctx.user.id}};\nctx.render(<div style={{ width: '100%' }} />);`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");`);
      expect(out).toContain(`style={{ width: '100%' }}`);
      expect(out).not.toContain(`resolveJsonTemplate("{{ width: '100%' }}")`);
    });

    it('avoids injecting await into non-async nested function bodies', () => {
      const src = `
function f() {
  return {{ctx.user.id}};
}
return f();
`.trim();
      const out = preprocessRunJsTemplates(src);
      // The only await should be in the top-level preamble
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");`);
      expect(out).toContain(`return __runjs_ctx_tpl_0;`);
      expect(out).not.toContain(`return (await ctx.resolveJsonTemplate`);
    });

    it('is tolerant to already-preprocessed code (idempotent heuristic)', () => {
      const src =
        `const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");\n` +
        `const s = ("{{ctx.user.id}}").split("{{ctx.user.id}}").join(__runjs_templateValueToString(__runjs_ctx_tpl_0, "{{ctx.user.id}}"));`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toBe(src);
    });

    it('rewrites object literal string keys via computed property to keep syntax valid', () => {
      const src = `const o = { '{{ctx.user.id}}': 1 };`;
      const out = preprocessRunJsTemplates(src);
      expect(out).toContain(`const __runjs_ctx_tpl_0 = await ctx.resolveJsonTemplate("{{ctx.user.id}}");`);
      expect(out).toContain(`{ [`);
      expect(out).toContain(`]: 1 }`);
      expect(out).toContain(`.split("{{ctx.user.id}}").join(`);
    });
  });

  describe('prepareRunJsCode', () => {
    it('preprocesses templates and compiles JSX', async () => {
      const src = `
const name = '{{ctx.user.name}}';
ctx.render(<div className="x">{name}</div>);
`.trim();
      const out = await prepareRunJsCode(src, { preprocessTemplates: true });
      expect(out).toMatch(/ctx\.React\.createElement/);
      expect(out).toMatch(/ctx\.resolveJsonTemplate/);
    });

    it('injects ctx.libs ensure preamble for member access', async () => {
      const src = `return ctx.libs.lodash;`;
      const out = await prepareRunJsCode(src, { preprocessTemplates: false });
      expect(out).toContain(`/* __runjs_ensure_libs */`);
      expect(out).toContain(`await ctx.__ensureLibs(["lodash"]);`);
    });

    it('injects ctx.libs ensure preamble for bracket access with string literal', async () => {
      const src = `return ctx.libs['lodash'];`;
      const out = await prepareRunJsCode(src, { preprocessTemplates: false });
      expect(out).toContain(`await ctx.__ensureLibs(["lodash"]);`);
    });

    it('injects ctx.libs ensure preamble for object destructuring', async () => {
      const src = `const { lodash } = ctx.libs;\nreturn lodash;`;
      const out = await prepareRunJsCode(src, { preprocessTemplates: false });
      expect(out).toContain(`await ctx.__ensureLibs(["lodash"]);`);
    });

    it('does not inject ctx.libs preamble when ctx.libs only appears in string/comment', async () => {
      const src = `// ctx.libs.lodash\nconst s = "ctx.libs.lodash";\nreturn s;`;
      const out = await prepareRunJsCode(src, { preprocessTemplates: false });
      expect(out).not.toContain(`__runjs_ensure_libs`);
    });

    it('is idempotent for already-prepared code', async () => {
      const src = `return ctx.libs['lodash'];`;
      const out1 = await prepareRunJsCode(src, { preprocessTemplates: false });
      const out2 = await prepareRunJsCode(out1, { preprocessTemplates: false });
      expect(out2).toBe(out1);
      expect(out2.match(/__runjs_ensure_libs/g)?.length ?? 0).toBe(1);
    });

    it('does not break JSX attribute string values when preprocessing templates', async () => {
      const src = `ctx.render(<Input title="{{ctx.user.name}}" />);`;
      const out = await prepareRunJsCode(src, { preprocessTemplates: true });
      expect(out).toMatch(/ctx\.React\.createElement/);
      expect(out).toMatch(/title:\s*\(/);
      expect(out).toContain(`.split("{{ctx.user.name}}").join(`);
    });

    it('caches prepared code by source and preprocessTemplates option', async () => {
      const spy = vi.spyOn(jsxTransform, 'compileRunJs');
      const src = `/* cache-test */\nconst a = 1;\nreturn a;`;

      await prepareRunJsCode(src, { preprocessTemplates: false });
      await prepareRunJsCode(src, { preprocessTemplates: false });
      await prepareRunJsCode(src, { preprocessTemplates: true });
      await prepareRunJsCode(src, { preprocessTemplates: true });

      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });
  });
});
