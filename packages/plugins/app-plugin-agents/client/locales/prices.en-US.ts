/** The prices sheet of the Usage page (`client/pages/usage/prices/`): the model prices costs are worked out from. */
const pricesEnUS = {
  prices: {
    loadFailed: 'Could not load the model prices',
    section: {
      title: 'Model prices',
      description:
        'Per million tokens, input / output. The reports work out costs from them.',
      online: 'Online (model services)',
      noOnline:
        'No model to price yet. Turn on a model service and its models first.',
      runner: 'Runner (coding tools)',
    },
    price: {
      model: 'Model',
      state: 'Price source and actions',
      input: 'Input / 1M',
      output: 'Output / 1M',
      inputOf: 'Input price of {{model}}, per million tokens',
      outputOf: 'Output price of {{model}}, per million tokens',
      save: 'Save the price of {{model}}',
      saved: 'Price of {{model}} saved.',
      remove: 'Remove the price of {{model}}',
      removed: 'Price of {{model}} removed.',
      unpriced: 'Unpriced',
      unpricedHint: 'Its cost reads “—” in the reports until it has a price.',
      via: 'by {{pattern}}',
      viaHint:
        'Priced by the rule {{pattern}}. Saving here gives this model its own price.',
      invalid: 'Prices are numbers of 0 or more.',
      readOnly: 'Only someone who manages model prices may change them.',
    },
    tool: {
      description:
        'What runs of {{tool}} cost, priced by the model each run reports.',
      subscription: 'Subscription (not billed)',
      subscriptionTag: 'Subscription',
      subscriptionHint:
        'Paid by a monthly plan: its runs cost nothing in the reports.',
      subscribed: '{{tool}} is billed by subscription.',
      unsubscribed: '{{tool}} is billed by its prices.',
      seen: 'Models seen in runs',
      noneSeen: 'No run of {{tool}} has reported a model yet.',
      rules: 'Price rules ({{count}})',
      rulesHint:
        'A rule is a model ID or a pattern such as claude-sonnet-4*; the most specific match wins.',
      ruleModel: 'Model or pattern',
      addRule: 'Add price',
      ruleAdded: 'Price of {{model}} added.',
    },
  },
};

export type PricesLocale = typeof pricesEnUS;

export default pricesEnUS;
