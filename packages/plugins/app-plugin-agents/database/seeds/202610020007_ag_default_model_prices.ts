import { defineSeed, type SeedDefinition } from '@nocobase/db';

// The model prices a new installation starts with, for the coding tools (online models are priced per model service, by
// whoever sets one up): US dollars per million tokens at the providers' standard tier, as listed on 2026-10-01.
// Claude Code runs Anthropic's models, Codex OpenAI's; OpenCode and Pi run any of them. Cache writes are Anthropic's five-minute writes; OpenAI's cache reads are its cached input.
// Long-context, batch, fast and regional prices are not modelled. A model a tool already prices is left as it is, so a
// price someone changed is kept; seeds do not run again.
//
// - Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
// - OpenAI: https://developers.openai.com/api/docs/pricing (the Codex models: their model pages there)
// - Google: https://ai.google.dev/gemini-api/docs/pricing
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.

type Row = readonly [
  model: string,
  input: number,
  output: number,
  cacheRead: number,
  cacheWrite: number,
  note?: string,
];

const ANTHROPIC = 'Anthropic pricing, 2026-10-01';
const OPENAI = 'OpenAI pricing, 2026-10-01';
const GOOGLE = 'Gemini API pricing (≤200K prompts), 2026-10-01';

const PRICES: readonly (readonly [
  note: string,
  tools: readonly string[],
  rows: readonly Row[],
])[] = [
  [
    ANTHROPIC,
    ['claude', 'opencode', 'pi'],
    [
      ['claude-fable-5-1*', 10, 50, 0.25, 12.5],
      ['claude-fable-5*', 10, 50, 1, 12.5],
      ['claude-mythos-5-1*', 10, 50, 0.25, 12.5],
      ['claude-mythos-5*', 10, 50, 1, 12.5],
      ['claude-opus-5-5*', 4, 20, 0.2, 5],
      ['claude-opus-5*', 5, 25, 0.5, 6.25],
      ['claude-opus-4-8*', 5, 25, 0.5, 6.25],
      ['claude-opus-4-7*', 5, 25, 0.5, 6.25],
      ['claude-opus-4-6*', 5, 25, 0.5, 6.25],
      ['claude-opus-4-5*', 5, 25, 0.5, 6.25],
      ['claude-opus-4*', 15, 75, 1.5, 18.75, 'Opus 4 and 4.1'],
      ['claude-sonnet-5*', 2, 10, 0.2, 2.5],
      ['claude-sonnet-4*', 3, 15, 0.3, 3.75],
      ['claude-haiku-4-5*', 1, 5, 0.1, 1.25],
      ['claude-3-5-haiku*', 0.8, 4, 0.08, 1],
    ],
  ],
  [
    OPENAI,
    ['codex', 'opencode', 'pi'],
    [
      ['gpt-6-astra*', 10, 50, 1, 12.5],
      ['gpt-6.1-sol*', 2, 10, 0.1, 2.5],
      ['gpt-6-sol*', 2, 10, 0.2, 2.5],
      ['gpt-6-luna*', 0.1, 0.5, 0.01, 0.125],
      ['gpt-5.6-sol*', 4, 20, 0.4, 5, 'Promotional at least until 2026-11-21'],
      ['gpt-5.6-terra*', 2, 12, 0.2, 2.5],
      ['gpt-5.6-luna*', 0.2, 1.2, 0.02, 0.25],
      ['gpt-5.5-pro*', 30, 180, 0, 0],
      ['gpt-5.5*', 5, 30, 0.5, 0],
      ['gpt-5.4-pro*', 30, 180, 0, 0],
      ['gpt-5.4-mini*', 0.75, 4.5, 0.075, 0],
      ['gpt-5.4-nano*', 0.2, 1.25, 0.02, 0],
      ['gpt-5.4*', 2.5, 15, 0.25, 0],
      ['gpt-5.3-codex*', 1.75, 14, 0.175, 0],
      ['gpt-5.2-pro*', 21, 168, 0, 0],
      ['gpt-5.2*', 1.75, 14, 0.175, 0],
      ['gpt-5.1-codex-mini*', 0.25, 2, 0.025, 0],
      ['gpt-5.1*', 1.25, 10, 0.125, 0],
      ['gpt-5-pro*', 15, 120, 0, 0],
      ['gpt-5-mini*', 0.25, 2, 0.025, 0],
      ['gpt-5-nano*', 0.05, 0.4, 0.005, 0],
      ['gpt-5-codex*', 1.25, 10, 0.125, 0],
      ['gpt-5', 1.25, 10, 0.125, 0],
      ['gpt-5-20*', 1.25, 10, 0.125, 0],
      ['o3-mini*', 1.1, 4.4, 0.55, 0],
      ['o3*', 2, 8, 0.5, 0],
      ['o4-mini*', 1.1, 4.4, 0.275, 0],
      ['gpt-4.1-mini*', 0.4, 1.6, 0.1, 0],
      ['gpt-4.1-nano*', 0.1, 0.4, 0.025, 0],
      ['gpt-4.1*', 2, 8, 0.5, 0],
      ['gpt-4o-mini*', 0.15, 0.6, 0.075, 0],
      ['gpt-4o*', 2.5, 10, 1.25, 0],
    ],
  ],
  [
    GOOGLE,
    ['opencode', 'pi'],
    [
      [
        'gemini-3.8-flash*',
        0.75,
        3.75,
        0.075,
        0,
        'Promotional until 2026-12-31, then 1.50 / 7.50',
      ],
      [
        'gemini-3.7-flash*',
        0.75,
        3.75,
        0.075,
        0,
        'Promotional until 2026-12-31, then 1.50 / 7.50',
      ],
      [
        'gemini-3.6-flash*',
        0.75,
        3.75,
        0.075,
        0,
        'Promotional until 2026-12-31, then 1.50 / 7.50',
      ],
      ['gemini-3.5-flash-lite*', 0.3, 2.5, 0.03, 0],
      ['gemini-3.5-flash*', 1.5, 9, 0.15, 0],
      ['gemini-3.1-pro*', 2, 12, 0.2, 0],
      ['gemini-3.1-flash-lite*', 0.25, 1.5, 0.025, 0],
      ['gemini-3-flash*', 0.5, 3, 0.05, 0],
      ['gemini-2.5-pro*', 1.25, 10, 0.125, 0],
      ['gemini-2.5-flash-lite*', 0.1, 0.4, 0.01, 0],
      ['gemini-2.5-flash*', 0.3, 2.5, 0.03, 0],
    ],
  ],
];

const seed: SeedDefinition = defineSeed({
  name: '202610020007_ag_default_model_prices',
  transaction: true,

  async run({ query }) {
    const now = new Date();
    for (const [source, tools, rows] of PRICES)
      for (const tool of tools)
        for (const [
          model,
          input,
          output,
          cacheRead,
          cacheWrite,
          note,
        ] of rows) {
          const existing = await query
            .selectFrom('agModelPrices')
            .select('id')
            .where('tool', '=', tool)
            .where('model', '=', model)
            .executeTakeFirst();
          if (existing) continue;
          await query
            .insertInto('agModelPrices')
            .values({
              id: crypto.randomUUID(),
              tool,
              modelService: null,
              model,
              inputPerM: input,
              outputPerM: output,
              cacheReadPerM: cacheRead,
              cacheWritePerM: cacheWrite,
              currency: 'USD',
              note: note ? `${note}. ${source}` : source,
              createdAt: now,
              updatedAt: now,
            })
            .execute();
        }
  },
});

export default seed;
