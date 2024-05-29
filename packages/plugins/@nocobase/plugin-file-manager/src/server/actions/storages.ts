import Plugin from '..';

export async function getRules(context, next) {
  const { storagesCache } = context.app.pm.get(Plugin) as Plugin;
  let result;
  const { filterByTk } = context.action.params;
  if (!filterByTk) {
    result = Array.from(storagesCache.values()).find((item) => item.default);
  } else {
    const isNumber = /^[1-9]\d*$/.test(filterByTk);
    result = isNumber
      ? storagesCache.get(Number.parseInt(filterByTk, 10))
      : Array.from(storagesCache.values()).find((item) => item.name === filterByTk);
  }
  if (!result) {
    return context.throw(404);
  }
  context.body = result.rules;

  next();
}
