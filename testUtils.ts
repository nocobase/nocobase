const globalTimeout = global.setTimeout;

export const alias = [
  { find: '@nocobase/evaluators/client', replacement: 'packages/core/evaluators/src/client' },
  { find: '@nocobase/utils/client', replacement: 'packages/core/utils/src/client' },
  { find: /^@nocobase\/app-(.*)/, replacement: 'packages/$1/src' },
  { find: /^@nocobase\/plugin-sample-(.*)/, replacement: 'packages/samples/$1/src' },
  { find: /^@nocobase\/plugin-pro-(.*)/, replacement: 'packages/pro-plugins/$1/src' },
  { find: /^@nocobase\/plugin-(.*)/, replacement: 'packages/plugins/$1/src' },
  { find: /^@nocobase\/preset-(.*)/, replacement: 'packages/presets/$1/src' },
  { find: /^@nocobase\/(.*)/, replacement: 'packages/core/$1/src' },
];

export const sleep = async (timeout = 0) => {
  await new Promise((resolve) => {
    globalTimeout(resolve, timeout);
  });
};
