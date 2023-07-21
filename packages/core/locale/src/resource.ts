const arr2obj = (items: any[]) => {
  const obj = {};
  for (const item of items) {
    Object.assign(obj, item);
  }
  return obj;
};

export const getResource = (packageName: string, lang: string) => {
  const resources = [];
  const prefixes = ['src', 'lib'];
  const localeKeys = ['locale', 'client/locale', 'server/locale'];
  for (const prefix of prefixes) {
    for (const localeKey of localeKeys) {
      try {
        const file = `${packageName}/${prefix}/${localeKey}/${lang}`;
        require.resolve(file);
        const resource = require(file).default;
        resources.push(resource);
      } catch (error) {}
    }
    if (resources.length) {
      break;
    }
  }
  if (resources.length === 0 && lang.replace('-', '_') !== lang) {
    return getResource(packageName, lang.replace('-', '_'));
  }
  return arr2obj(resources);
};
