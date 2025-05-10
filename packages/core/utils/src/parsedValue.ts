import { parse } from './json-templates';

function appendArrayColumn(scope, key) {
  const paths = key.split('.');
  let data = scope;
  for (let p = 0; p < paths.length && data != null; p++) {
    const path = paths[p];
    const isIndex = path.match(/^\d+$/);
    if (Array.isArray(data) && !isIndex && !data[path]) {
      data[path] = data.map((item) => item[path]).flat();
    }
    data = data?.[path];
  }
}

export const parsedValue = (value, variables) => {
  const template = parse(value);
  template.parameters.forEach(({ key }) => {
    appendArrayColumn(variables, key);
  });
  return template(variables);
};
