import path from 'path';

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

export const resolveAliasByVitest = (name: string) => {
  const item = alias.find((item) => (item.find instanceof RegExp ? item.find.test(name) : item.find === name));
  if (item) {
    if (item.find instanceof RegExp) {
      return path.resolve('./', item.replacement.replace('$1', name.replace(item.find, '$1')));
    }
    return path.resolve('./', item.replacement);
  }
  return name;
};
