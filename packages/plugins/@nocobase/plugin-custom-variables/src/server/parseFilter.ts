export const parseFilter = (filter: any, ctx: Record<string, any>) => {
  if (typeof filter !== 'string') {
    filter = JSON.stringify(filter);
  }

  Object.keys(ctx).forEach((key) => {
    filter = filter.replaceAll(`"${key}"`, JSON.stringify(ctx[key]));
  });

  return JSON.parse(filter);
}
