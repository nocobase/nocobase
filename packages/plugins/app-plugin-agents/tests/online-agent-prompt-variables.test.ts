// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import { createAuthorization } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';

const context: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: {},
  authorization: createAuthorization({ plugins: [] }).for({
    principal: { type: 'user', id: 'alice' },
  }),
};

describe('final variables and ordered prompt rendering', () => {
  it('renders global templates from final options with replacement variables', async () => {
    const c = new OnlineAgentConfigurator();
    c.registerOnlineAgentGlobalScope({
      context: { variable: { first: true } },
      systemPromptTemplate: {
        template: (ctx) => `Global:${JSON.stringify(ctx.variable)}`,
      },
    });
    c.registerOnlineAgentScope('business', {
      context: { variable: { second: true } },
      systemPromptTemplate: {
        template: (ctx) => `${ctx.systemPrompt}:business`,
      },
    });
    const config = await c.resolve(context, {
      scope: ['business'],
      context: { variable: { knowledgeRetrieval: 'always' } },
    });
    expect(config.variable).toEqual({ knowledgeRetrieval: 'always' });
    expect(config.systemPrompt).toBe(
      'Global:{"knowledgeRetrieval":"always"}:business',
    );
  });

  it('parses all schemas before rendering without stripping unrelated fields', async () => {
    const c = new OnlineAgentConfigurator();
    c.registerOnlineAgentGlobalScope({
      systemPromptTemplate: {
        variableSchema: z.strictObject({ a: z.string().default('A') }),
        template: (ctx) => JSON.stringify(ctx.variable),
      },
    });
    c.registerOnlineAgentScope('business', {
      systemPromptTemplate: {
        variableSchema: z.strictObject({
          b: z
            .string()
            .transform((value) => value.toUpperCase())
            .default('B'),
        }),
        template: (ctx) =>
          `${ctx.systemPrompt}:${JSON.stringify(ctx.variable)}`,
      },
    });
    const config = await c.resolve(context, {
      scope: ['business'],
      context: { variable: { b: 'bee', trusted: 1 } },
    });
    expect(config.variable).toEqual({ a: 'A', b: 'BEE', trusted: 1 });
    expect(config.systemPrompt).toBe(
      '{"b":"BEE","trusted":1,"a":"A"}:{"b":"BEE","trusted":1,"a":"A"}',
    );
  });

  it('evaluates providers once before rendering, isolating template variable copies', async () => {
    const c = new OnlineAgentConfigurator();
    const provider = vi.fn((ctx: OnlineAgentContext) => {
      expect(ctx.systemPrompt).toBe('');
      expect(ctx.variable).toEqual({ earlier: true });
      return {
        systemPromptTemplate: {
          template: (inner: OnlineAgentContext) =>
            `${inner.systemPrompt}:business`,
        },
      };
    });
    c.registerOnlineAgentGlobalScope({
      context: { variable: { earlier: true } },
      systemPromptTemplate: {
        template: (ctx) => {
          if (
            ctx.variable &&
            typeof ctx.variable === 'object' &&
            !Array.isArray(ctx.variable)
          )
            ctx.variable.changed = true;
          return 'Global';
        },
      },
    });
    c.registerOnlineAgentScope('business', provider);
    c.registerOnlineAgentScope('last', {
      systemPromptTemplate: {
        template: (ctx) =>
          `${ctx.systemPrompt}:${JSON.stringify(ctx.variable)}`,
      },
    });
    const config = await c.resolve(context, {
      scope: ['business', 'last'],
      context: { variable: { final: true } },
    });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(config.variable).toEqual({ final: true });
    expect(config.systemPrompt).toBe('Global:business:{"final":true}');
    expect(
      (
        await c.resolve(
          context,
          {
            context: { systemPrompt: 'reset' },
            systemPromptTemplate: { template: (ctx) => `${ctx.systemPrompt}!` },
          },
          config,
        )
      ).systemPrompt,
    ).toBe('reset!');
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('authorizes HTTP variables before any template and only from selected schemas', async () => {
    const c = new OnlineAgentConfigurator();
    const render = vi.fn((ctx: OnlineAgentContext) =>
      JSON.stringify(ctx.variable),
    );
    c.registerOnlineAgentGlobalScope({
      systemPromptTemplate: {
        variableSchema: z.object({ secret: z.string().default('trusted') }),
        template: render,
      },
    });
    c.registerOnlineAgentScope('business', {
      systemPromptTemplate: {
        variableSchema: z.object({ policy: z.enum(['always', 'on-demand']) }),
        template: (ctx) => ctx.systemPrompt!,
      },
    });
    await expect(
      c.resolve(
        context,
        {
          scope: ['business'],
          context: { variable: { policy: 'always', secret: 'attack' } },
        },
        undefined,
        true,
      ),
    ).rejects.toThrow('declared');
    expect(render).not.toHaveBeenCalled();
    const config = await c.resolve(
      context,
      { scope: ['business'], context: { variable: { policy: 'always' } } },
      undefined,
      true,
    );
    expect(config.systemPrompt).toBe('{"policy":"always","secret":"trusted"}');
    for (const variable of [null, [], 1, 'x'])
      await expect(
        c.resolve(
          context,
          { scope: ['business'], context: { variable } },
          undefined,
          true,
        ),
      ).rejects.toThrow();
  });

  it('rejects non-object candidates and inconsistent shared field normalization', async () => {
    const c = new OnlineAgentConfigurator();
    c.registerOnlineAgentGlobalScope({
      systemPromptTemplate: {
        variableSchema: z.object({ a: z.string().default('a') }),
        template: () => 'global',
      },
    });
    for (const variable of [null, [], 1, 'x'])
      await expect(
        c.resolve(context, { context: { variable } }),
      ).rejects.toThrow();
    expect((await c.resolve(context, {})).variable).toEqual({ a: 'a' });
    c.registerOnlineAgentScope('conflict', {
      systemPromptTemplate: {
        variableSchema: z.object({
          a: z.string().transform((value) => value.toUpperCase()),
        }),
        template: () => 'business',
      },
    });
    await expect(
      c.resolve(context, {
        scope: ['conflict'],
        context: { variable: { a: 'a' } },
      }),
    ).rejects.toThrow();
  });
  it('retains object constraints, compatible shared fields, optional removal and arbitrary JSON without schemas', async () => {
    const bare = new OnlineAgentConfigurator();
    for (const variable of [null, [], 1, 'x'])
      expect(
        (await bare.resolve(context, { context: { variable } })).variable,
      ).toEqual(variable);
    const c = new OnlineAgentConfigurator();
    const schema = z
      .strictObject({
        a: z.string().transform((value) => value.toUpperCase()),
        removed: z
          .unknown()
          .transform(() => undefined)
          .optional(),
      })
      .refine((value) => value.a !== 'NO');
    c.registerOnlineAgentGlobalScope({
      systemPromptTemplate: {
        variableSchema: schema,
        template: (ctx) => JSON.stringify(ctx.variable),
      },
    });
    c.registerOnlineAgentScope('same', {
      systemPromptTemplate: {
        variableSchema: z.object({
          a: z.string().transform((value) => value.toUpperCase()),
        }),
        template: (ctx) => ctx.systemPrompt!,
      },
    });
    expect(
      (
        await c.resolve(context, {
          scope: ['same'],
          context: { variable: { a: 'yes', removed: 'raw', other: true } },
        })
      ).variable,
    ).toEqual({ a: 'YES', other: true });
    await expect(
      c.resolve(context, { context: { variable: { a: 'no' } } }),
    ).rejects.toThrow();
  });

  it('preserves explicit strings and scope context prompt precedence', async () => {
    const c = new OnlineAgentConfigurator();
    c.registerOnlineAgentGlobalScope({ systemPromptTemplate: 'Global' });
    c.registerOnlineAgentScope('business', {
      context: { systemPrompt: 'Scope' },
      systemPromptTemplate: {
        template: (ctx) => `${ctx.systemPrompt}:business`,
      },
    });
    expect(
      (await c.resolve(context, { scope: ['business'] })).systemPrompt,
    ).toBe('Scope:business');
    expect(
      (
        await c.resolve(context, {
          scope: ['business'],
          systemPromptTemplate: 'final',
        })
      ).systemPrompt,
    ).toBe('final');
  });

  it('keeps HTTP supplied values invisible to providers and accepts an explicitly empty selected schema', async () => {
    const c = new OnlineAgentConfigurator();
    const provider = vi.fn((ctx: OnlineAgentContext) => {
      expect(ctx.variable).toBeUndefined();
      return {
        systemPromptTemplate: {
          variableSchema: z.object({}),
          template: () => 'empty',
        },
      };
    });
    c.registerOnlineAgentScope('empty', provider);
    expect(
      (
        await c.resolve(
          context,
          { scope: ['empty'], context: { variable: {} } },
          undefined,
          true,
        )
      ).systemPrompt,
    ).toBe('empty');
    expect(provider).toHaveBeenCalledTimes(1);
    for (const options of [
      { tool: [] },
      { model: [] },
      { skill: [] },
      { systemPromptTemplate: 'forged' },
      { context: { systemPrompt: 'forged' } },
    ])
      await expect(
        c.resolve(context, options, undefined, true),
      ).rejects.toThrow('HTTP configuration');
  });
});
