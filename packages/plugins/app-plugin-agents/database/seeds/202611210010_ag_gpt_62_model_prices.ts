import { defineSeed, type SeedDefinition } from '@nocobase/db';

// OpenAI Standard short-context prices in USD per million tokens, using the 30-minute cache write rate.
// https://developers.openai.com/api/docs/pricing
const TOOLS = ['codex', 'opencode', 'pi'] as const;
const PRICES = [
  ['gpt-6.2-astra', 8, 40, 0.4, 10],
  ['gpt-6.2-sol', 2, 10, 0.1, 2.5],
] as const;

const seed: SeedDefinition = defineSeed({
  name: '202611210010_ag_gpt_62_model_prices',
  transaction: true,
  async run(context) {
    const prices = context.repository('agModelPrices');
    const now = new Date();
    for (const tool of TOOLS) {
      for (const [
        model,
        inputPerM,
        outputPerM,
        cacheReadPerM,
        cacheWritePerM,
      ] of PRICES) {
        const filter = { tool, model: `${model}*` };
        if (await prices.exists({ filter })) continue;
        await prices.createOne({
          values: {
            ...filter,
            id: `default-${tool}-${model}`,
            modelService: null,
            inputPerM,
            outputPerM,
            cacheReadPerM,
            cacheWritePerM,
            currency: 'USD',
            note: 'OpenAI Standard short context and 30-minute cache writes, 2026-11-21',
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  },
});

export default seed;
