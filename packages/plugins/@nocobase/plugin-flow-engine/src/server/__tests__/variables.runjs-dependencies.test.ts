/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  MAX_RUNJS_SOURCES_PER_REQUEST,
  MAX_RUNJS_SOURCE_LENGTH,
  MAX_RUNJS_TOTAL_SOURCE_LENGTH,
} from '../flow-surfaces/runjs-authoring/runtime/constants';
import { analyzeVariableTemplate } from '../template/variable-expression';
import {
  collectPersistedRunJsVariableTemplates,
  MAX_FLOW_MODEL_VARIABLE_SOURCE_DEPTH,
  MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES,
  MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH,
  MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH,
  prepareFlowModelVariableSource,
} from '../variables/runjs-variable-dependencies';

function createRunJsOptions(code: string, version: string | null = 'v2', settings = 'jsSettings') {
  return {
    stepParams: {
      [settings]: {
        runJs: { code, version },
      },
    },
  };
}

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

  it('collects static JSON templates from direct unshadowed ctx.resolveJsonTemplate calls', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions(`
          const data = await ctx.resolveJsonTemplate({
            role: '{{ ctx.record.roles[0].name }}',
            nested: ['Role: {{ ctx.popup.record.name }}'],
          });
          const userId = await ctx['resolveJsonTemplate'](\`{{ ctx.user.id }}\`);
          ctx.render(data.role + userId);
        `),
      ),
    ).toEqual(['{{ ctx.record.roles[0].name }}', 'Role: {{ ctx.popup.record.name }}', '{{ ctx.user.id }}']);
  });

  it.each([
    ['mutable identifier', `let template = '{{ ctx.user.id }}'; await ctx.resolveJsonTemplate(template);`],
    ['dynamic identifier', `const template = getTemplate(); await ctx.resolveJsonTemplate(template);`],
    ['shadowed identifier', `const template = '{{ ctx.user.id }}'; (template) => ctx.resolveJsonTemplate(template);`],
    ['out-of-scope identifier', `{ const template = '{{ ctx.user.id }}'; } ctx.resolveJsonTemplate(template);`],
    ['uninitialized identifier', `ctx.resolveJsonTemplate(template); const template = '{{ ctx.user.id }}';`],
    ['changed contract', `ctx.resolveJsonTemplate('{{ ctx.user.id }}', { contractModelUid: 'other' });`],
    ['dynamic options', `ctx.resolveJsonTemplate('{{ ctx.user.id }}', options);`],
    ['spread options', `ctx.resolveJsonTemplate('{{ ctx.user.id }}', { ...options });`],
    ['shadowed object', `const t = { id: '{{ ctx.user.id }}' }; (t) => ctx.resolveJsonTemplate(t);`],
    ['mutated object', `const t = { id: '{{ ctx.user.id }}' }; t.id = value; ctx.resolveJsonTemplate(t);`],
    ['mutated array', `const t = ['{{ ctx.user.id }}']; t[0] = value; ctx.resolveJsonTemplate(t);`],
    ['call result', `await ctx.resolveJsonTemplate(createTemplate('{{ ctx.user.id }}'));`],
    ['shadowed ctx', `(ctx) => ctx.resolveJsonTemplate('{{ ctx.user.id }}');`],
    ['comment', `// ctx.resolveJsonTemplate('{{ ctx.user.id }}')`],
    ['plain code string', `const code = "ctx.resolveJsonTemplate('{{ ctx.user.id }}')";`],
    ['object spread', `await ctx.resolveJsonTemplate({ ...value, id: '{{ ctx.user.id }}' });`],
    ['computed key', `await ctx.resolveJsonTemplate({ ['id']: '{{ ctx.user.id }}' });`],
    ['dynamic value', `await ctx.resolveJsonTemplate({ id: value, role: '{{ ctx.user.id }}' });`],
    ['function value', `await ctx.resolveJsonTemplate({ id() { return '{{ ctx.user.id }}'; } });`],
    ['template interpolation', 'await ctx.resolveJsonTemplate(`{{ ctx.user.${field} }}`);'],
    ['array hole', `await ctx.resolveJsonTemplate(['{{ ctx.user.id }}', ,]);`],
  ])('does not collect ctx.resolveJsonTemplate dependencies from a %s', (_title, code) => {
    expect(collectPersistedRunJsVariableTemplates(createRunJsOptions(code))).toEqual([]);
  });

  it.each([
    `const template = '{{ ctx.user.id }}'; return ctx.resolveJsonTemplate(template);`,
    `return ctx.resolveJsonTemplate('{{ ctx.user.id }}', {});`,
    `const template = '{{ ctx.user.id }}'; return ctx.resolveJsonTemplate(template, {});`,
    `const template = { id: '{{ ctx.user.id }}' }; return ctx.resolveJsonTemplate(template);`,
    `const template = ['{{ ctx.user.id }}']; return ctx.resolveJsonTemplate(template);`,
  ])('collects explicit template dependencies with static bindings or empty options: %s', (code) => {
    expect(collectPersistedRunJsVariableTemplates(createRunJsOptions(code))).toEqual(['{{ ctx.user.id }}']);
  });

  it.each([
    {
      title: 'dynamic arguments',
      value: createRunJsOptions(`const path = 'ctx.popup.record.name'; await ctx.getVar(path);`),
    },
    {
      title: 'shadowed ctx parameters',
      value: createRunJsOptions(`(ctx) => ctx.getVar('ctx.popup.record.name');`),
    },
    {
      title: 'comments and strings',
      value: createRunJsOptions(`// ctx.getVar('ctx.popup.record.name')\nconst text = "ctx.getVar('ctx.user.id')";`),
    },
    {
      title: 'non-RunJS objects',
      value: { metadata: { code: `await ctx.getVar('ctx.popup.record.name');`, version: 'v2' } },
    },
    {
      title: 'invalid JavaScript',
      value: createRunJsOptions(`await ctx.getVar('ctx.popup.record.name'`),
    },
    {
      title: 'multiple paths in one argument',
      value: createRunJsOptions(`await ctx.getVar('ctx.user.id || ctx.user.password');`),
    },
    {
      title: 'placeholder injection in one argument',
      value: createRunJsOptions(`await ctx.getVar('ctx.user.id }} {{ ctx.popup.record.name');`),
    },
  ])('fails closed for $title', ({ value }) => {
    expect(collectPersistedRunJsVariableTemplates(value)).toEqual([]);
  });

  it.each([
    `function f(value = ctx.getVar('ctx.user.password'), ctx) {}`,
    `function f({ value = ctx.getVar('ctx.user.password') } = {}, ctx) {}`,
    `const f = (value = ctx.getVar('ctx.user.password'), { nested: [ctx] }) => value;`,
    `const f = (value = ctx.getVar('ctx.user.password'), ...ctx) => value;`,
  ])('rejects ctx.getVar in a parameter environment where ctx is bound: %s', (code) => {
    expect(collectPersistedRunJsVariableTemplates(createRunJsOptions(code))).toEqual([]);
  });

  it.each([
    `ctx = { getVar() {} }; ctx.getVar('ctx.user.password');`,
    `ctx.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `ctx.resolveJsonTemplate = () => {}; ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `globalThis.ctx = { resolveJsonTemplate() {} }; ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `globalThis['ctx'].resolveJsonTemplate = () => {}; ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `Object.defineProperty(globalThis, 'ctx', { value: {} }); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `Reflect.set(globalThis, 'ctx', {}); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `Object.assign(globalThis, { ctx: {} }); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `const runtimeGlobal = globalThis; runtimeGlobal.ctx = {}; ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `this.ctx = {}; ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `(0, eval)("globalThis.ctx = { resolveJsonTemplate: async () => {} }"); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `Function("globalThis.ctx = { resolveJsonTemplate: async () => {} }")(); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `new Function("globalThis.ctx = { resolveJsonTemplate: async () => {} }")(); ctx.resolveJsonTemplate('{{ ctx.user.password }}');`,
    `ctx['getVar'] ||= () => {}; ctx.getVar('ctx.user.password');`,
    `delete ctx.getVar; ctx.getVar('ctx.user.password');`,
    `Object.defineProperty(ctx, 'getVar', { value: () => {} }); ctx.getVar('ctx.user.password');`,
    `Reflect.set(ctx, 'getVar', () => {}); ctx.getVar('ctx.user.password');`,
    `Object.assign(ctx, { getVar: () => {} }); ctx.getVar('ctx.user.password');`,
    `const alias = ctx; alias.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `const alias = ctx; Object.defineProperty(alias, 'getVar', { value: () => {} }); ctx.getVar('ctx.user.password');`,
    `const replace = (target) => { target.getVar = () => {}; }; replace(ctx); ctx.getVar('ctx.user.password');`,
    `const [alias] = [ctx]; alias.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `class Mutator { constructor(target) { target.getVar = () => {}; } } new Mutator(ctx); ctx.getVar('ctx.user.password');`,
    `const mutate = (strings, target) => { target.getVar = () => {}; }; mutate\`${'${ctx}'}\`; ctx.getVar('ctx.user.password');`,
    `const alias = ({ value: ctx }).value; alias.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `const alias = (() => ctx)(); alias.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `ctx.__proto__.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `ctx.constructor.prototype.getVar = () => {}; ctx.getVar('ctx.user.password');`,
    `ctx.__defineGetter__('getVar', () => () => {}); ctx.getVar('ctx.user.password');`,
    `with ({ ctx: { getVar() {} } }) ctx.getVar('ctx.user.password');`,
  ])('rejects a RunJS source that rewrites ctx or ctx.getVar: %s', (code) => {
    expect(collectPersistedRunJsVariableTemplates(createRunJsOptions(code))).toEqual([]);
  });

  it('does not treat a shadowed ctx mutation as a mutation of the runtime ctx', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions(`
          function replace(ctx) { ctx.getVar = () => {}; }
          await ctx.getVar('ctx.popup.record.name');
        `),
      ),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });

  it('does not treat a shadowed globalThis reference as a runtime global rewrite', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions(`
          function replace(globalThis) { globalThis.ctx = {}; }
          await ctx.resolveJsonTemplate('{{ ctx.popup.record.name }}');
        `),
      ),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });

  it('allows local this and shadowed dynamic execution names without widening the contract', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions(`
          function eval() {}
          function Function() {}
          const helper = { value: 1, read() { return this.value; } };
          helper.read();
          await ctx.resolveJsonTemplate('{{ ctx.popup.record.name }}');
        `),
      ),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });

  it('allows class field and static block this bindings without widening the contract', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions(`
          class Helper {
            value = 1;
            read = () => this.value;
            static { this.ready = true; }
          }
          await ctx.resolveJsonTemplate('{{ ctx.popup.record.name }}');
        `),
      ),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });

  it('deduplicates static dependencies across persisted RunJS values', () => {
    const code = `await ctx.getVar('ctx.popup.record.name');`;
    expect(
      collectPersistedRunJsVariableTemplates({
        first: createRunJsOptions(code),
        second: [createRunJsOptions(code), createRunJsOptions(code, null, 'clickSettings')],
      }),
    ).toEqual(['{{ ctx.popup.record.name }}']);
  });

  it('skips oversized AST sources without losing other RunJS dependencies', () => {
    expect(
      collectPersistedRunJsVariableTemplates({
        valid: createRunJsOptions("await ctx.getVar('ctx.user.id');"),
        oversized: createRunJsOptions("await ctx.getVar('ctx.popup.record.name');".padEnd(MAX_RUNJS_SOURCE_LENGTH + 1)),
        later: createRunJsOptions("await ctx.getVar('ctx.view.record.title');"),
      }),
    ).toEqual(['{{ ctx.user.id }}', '{{ ctx.view.record.title }}']);
  });

  it('extracts dependencies at the exact AST source length limit', () => {
    expect(
      collectPersistedRunJsVariableTemplates(
        createRunJsOptions("await ctx.getVar('ctx.user.id');".padEnd(MAX_RUNJS_SOURCE_LENGTH)),
      ),
    ).toEqual(['{{ ctx.user.id }}']);
  });

  it.each(['v1', 'v2'])('preserves %s template semantics when a script exceeds the AST limit', (version) => {
    const code = [
      '// {{ ctx.user.password }}',
      "const value = '{{ ctx.popup.record.staffseq }}';",
      "await ctx.getVar('ctx.view.record.name');",
    ]
      .join('\n')
      .padEnd(MAX_RUNJS_SOURCE_LENGTH + 1);
    const prepared = prepareFlowModelVariableSource({
      independent: '{{ ctx.popup.record.id }}',
      ...createRunJsOptions(code, version),
    });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.runJsTemplates).toEqual([]);
    expect(
      analyzeVariableTemplate(prepared.templateSource, { mode: 'flow-model' }).paths.map((path) => path.runtimeKey),
    ).toEqual([
      JSON.stringify(['popup', 'record', 'id']),
      ...(version === 'v1' ? [JSON.stringify(['popup', 'record', 'staffseq'])] : []),
    ]);
  });

  it('screens v2 RunJS code from generic template analysis while preserving static getVar dependencies', () => {
    const prepared = prepareFlowModelVariableSource({
      normal: '{{ ctx.user.id }}',
      ...createRunJsOptions(`
          // {{ ctx.user.password }}
          const marker = '{{ ctx.popup.record.name }}';
          await ctx.getVar('ctx.view.record.title');
        `),
    });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    const source = prepared.templateSource as { stepParams: { jsSettings: { runJs: { code: string } } } };
    expect(source.stepParams.jsSettings.runJs.code).toBe('');
    expect(prepared.runJsTemplates).toEqual(['{{ ctx.view.record.title }}']);
    const analysis = analyzeVariableTemplate([prepared.templateSource, ...prepared.runJsTemplates], {
      mode: 'flow-model',
    });
    expect(analysis.paths.map((path) => path.runtimeKey)).toEqual([
      JSON.stringify(['user', 'id']),
      JSON.stringify(['view', 'record', 'title']),
    ]);
  });

  it('keeps v1 template compatibility while excluding JavaScript comments', () => {
    const code = `
      // {{ ctx.user.password }}
      /* {{ ctx.user.token }} */
      const marker = '{{ ctx.popup.record.name }}';
    `;
    const prepared = prepareFlowModelVariableSource(createRunJsOptions(code, 'v1'));

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    const source = prepared.templateSource as { stepParams: { jsSettings: { runJs: { code: string } } } };
    expect(source.stepParams.jsSettings.runJs.code).not.toContain('{{ ctx.user.password }}');
    expect(source.stepParams.jsSettings.runJs.code).not.toContain('{{ ctx.user.token }}');
    expect(analyzeVariableTemplate(source, { mode: 'flow-model' }).paths.map((path) => path.runtimeKey)).toEqual([
      JSON.stringify(['popup', 'record', 'name']),
    ]);
  });

  it('limits the number of AST sources without discarding configured templates', () => {
    const sources = Array.from({ length: MAX_RUNJS_SOURCES_PER_REQUEST + 1 }, (_, index) =>
      createRunJsOptions("await ctx.getVar('ctx.record.field" + index + "');"),
    );
    const prepared = prepareFlowModelVariableSource({ independent: '{{ ctx.user.id }}', sources });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.runJsTemplates).toHaveLength(MAX_RUNJS_SOURCES_PER_REQUEST);
    expect(prepared.runJsTemplates).toContain('{{ ctx.record.field99 }}');
    expect(prepared.runJsTemplates).not.toContain('{{ ctx.record.field100 }}');
    expect(analyzeVariableTemplate(prepared.templateSource).paths.map((path) => path.runtimeKey)).toEqual([
      JSON.stringify(['user', 'id']),
    ]);
  });

  it('limits aggregate AST source length without discarding configured templates', () => {
    const sources = Array.from({ length: MAX_RUNJS_TOTAL_SOURCE_LENGTH / MAX_RUNJS_SOURCE_LENGTH + 1 }, (_, index) =>
      createRunJsOptions(("await ctx.getVar('ctx.record.field" + index + "');").padEnd(MAX_RUNJS_SOURCE_LENGTH)),
    );
    const prepared = prepareFlowModelVariableSource({ independent: '{{ ctx.user.id }}', sources });

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.runJsTemplates).toEqual([
      '{{ ctx.record.field0 }}',
      '{{ ctx.record.field1 }}',
      '{{ ctx.record.field2 }}',
      '{{ ctx.record.field3 }}',
    ]);
    expect(analyzeVariableTemplate(prepared.templateSource).paths.map((path) => path.runtimeKey)).toEqual([
      JSON.stringify(['user', 'id']),
    ]);
  });

  it('still rejects scripts exceeding the model string budget', () => {
    expect(
      prepareFlowModelVariableSource(createRunJsOptions(' '.repeat(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH + 1))),
    ).toEqual({ ok: false });
    expect(
      prepareFlowModelVariableSource(
        Array.from({ length: 5 }, () => createRunJsOptions(' '.repeat(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH))),
      ),
    ).toEqual({ ok: false });
  });

  it('fails closed when a flat ordinary object exceeds the node limit', () => {
    const oversized = Object.fromEntries(
      Array.from({ length: MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES }, (_, index) => [`node${index}`, index]),
    );

    expect(prepareFlowModelVariableSource(oversized)).toEqual({ ok: false });
  });

  it('fails closed when ordinary FlowModel strings exceed single or aggregate limits', () => {
    const aggregateChunk = 'x'.repeat(Math.floor(MAX_FLOW_MODEL_VARIABLE_TOTAL_STRING_LENGTH / 5) + 1);
    expect(aggregateChunk.length).toBeLessThan(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH);

    expect(prepareFlowModelVariableSource({ text: 'x'.repeat(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH + 1) })).toEqual({
      ok: false,
    });
    expect(
      prepareFlowModelVariableSource({
        values: Array.from({ length: 5 }, () => aggregateChunk),
      }),
    ).toEqual({ ok: false });
  });

  it.each(['jsSettings', 'clickSettings'])(
    'fails closed when %s RunJS version exceeds the single-string limit',
    (settings) => {
      expect(
        prepareFlowModelVariableSource(
          createRunJsOptions('', 'x'.repeat(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH + 1), settings),
        ),
      ).toEqual({ ok: false });
    },
  );

  it('fails closed for deep, oversized, cyclic, accessor, and proxy-backed sources', () => {
    const deepRoot: Record<string, unknown> = {};
    let cursor = deepRoot;
    for (let index = 0; index <= MAX_FLOW_MODEL_VARIABLE_SOURCE_DEPTH; index += 1) {
      const child: Record<string, unknown> = {};
      cursor.child = child;
      cursor = child;
    }

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'runJs', {
      enumerable: true,
      get() {
        throw new TypeError('unexpected getter');
      },
    });

    const proxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new TypeError('unexpected proxy');
        },
      },
    );

    for (const value of [
      deepRoot,
      { items: new Array(MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES + 1) },
      cyclic,
      accessor,
      proxy,
    ]) {
      expect(prepareFlowModelVariableSource(value)).toEqual({ ok: false });
    }
  });

  it.each(['dynamic', 'defaultParams', 'linkageScript', 'linkageValue', 'filterValue', 'chartOption', 'chartEvents'])(
    'collects static dependencies from %s without executing scripts',
    (scene) => {
      const code = "await ctx.getVar('ctx.popup.record.name');";
      const runJsValue = { code, version: 'v2' };
      let source: unknown;
      if (scene === 'dynamic' || scene === 'defaultParams') {
        source = {
          flowRegistry: {
            custom: {
              steps: {
                customStep: {
                  use: 'runjs',
                  ...(scene === 'defaultParams' ? { defaultParams: runJsValue } : {}),
                },
              },
            },
          },
          stepParams: { custom: { customStep: scene === 'dynamic' ? runJsValue : {} } },
        };
      } else if (scene === 'linkageScript' || scene === 'linkageValue') {
        source = {
          stepParams: {
            eventSettings: {
              linkageRules: {
                value: [
                  {
                    actions: [
                      {
                        name: scene === 'linkageScript' ? 'linkageRunjs' : 'linkageAssignField',
                        params: { value: scene === 'linkageScript' ? { script: code } : [{ value: runJsValue }] },
                      },
                    ],
                  },
                ],
              },
            },
          },
        };
      } else if (scene === 'filterValue') {
        source = {
          stepParams: { formFilterBlockModelSettings: { defaultValues: { value: [{ value: runJsValue }] } } },
        };
      } else {
        source = {
          stepParams: {
            chartSettings: {
              configure: {
                chart: {
                  [scene === 'chartOption' ? 'option' : 'events']: { raw: code },
                },
              },
            },
          },
        };
      }
      expect(collectPersistedRunJsVariableTemplates([source])).toEqual(['{{ ctx.popup.record.name }}']);
    },
  );

  it.each(['filter', 'dynamic', 'defaultParams', 'linkage', 'existing'] as const)(
    'preserves only legacy template scanning when %s V2 scripts exceed the AST budget',
    (scene) => {
      const runJs = {
        code: (
          '// {{ ctx.user.password }}\n' + "return ctx.resolveJsonTemplate('{{ ctx.popup.record.name }}');"
        ).padEnd(MAX_RUNJS_SOURCE_LENGTH + 1),
        version: 'v2',
      };
      const sources = {
        filter: { stepParams: { formFilterBlockModelSettings: { defaultValues: { value: [{ value: runJs }] } } } },
        dynamic: {
          flowRegistry: { custom: { steps: { script: { use: 'runjs' } } } },
          stepParams: { custom: { script: runJs } },
        },
        defaultParams: { flowRegistry: { custom: { steps: { script: { use: 'runjs', defaultParams: runJs } } } } },
        linkage: {
          stepParams: {
            eventSettings: { linkageRules: { value: [{ actions: [{ params: { value: [{ value: runJs }] } }] }] } },
          },
        },
        existing: createRunJsOptions(runJs.code),
      };
      const prepared = prepareFlowModelVariableSource(sources[scene]);
      expect(prepared.ok).toBe(true);
      if (!prepared.ok) return;
      expect(prepared.runJsTemplates).toEqual([]);
      expect(
        analyzeVariableTemplate(prepared.templateSource, { mode: 'flow-model' }).paths.map((p) => p.runtimeKey),
      ).toEqual(scene === 'existing' ? [] : [JSON.stringify(['popup', 'record', 'name'])]);
    },
  );

  it('does not treat an unrelated custom action code parameter as RunJS', () => {
    expect(
      collectPersistedRunJsVariableTemplates({
        flowRegistry: { custom: { steps: { customStep: { use: 'otherAction' } } } },
        stepParams: { custom: { customStep: { code: "await ctx.getVar('ctx.popup.record.secret');" } } },
      }),
    ).toEqual([]);
  });

  it('preserves linkage templates and comment masking when the AST budget is exceeded', () => {
    const source = (script: string) => ({
      stepParams: {
        eventSettings: {
          linkageRules: {
            value: [
              {
                actions: [
                  {
                    name: 'linkageRunjs',
                    params: { value: { script } },
                  },
                ],
              },
            ],
          },
        },
      },
    });
    const code =
      "// {{ ctx.user.password }}\nconst value = '{{ ctx.popup.record.name }}';\nawait ctx.getVar('ctx.user.id');";
    const prepared = prepareFlowModelVariableSource(source(code.padEnd(MAX_RUNJS_SOURCE_LENGTH + 1)));
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.runJsTemplates).toEqual([]);
    expect(
      analyzeVariableTemplate(prepared.templateSource, { mode: 'flow-model' }).paths.map((path) => path.runtimeKey),
    ).toEqual([JSON.stringify(['popup', 'record', 'name'])]);
  });
});
