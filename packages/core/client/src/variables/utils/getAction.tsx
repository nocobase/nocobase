const TYPE_TO_ACTION = {
  hasMany: 'list',
  belongsTo: 'get',
  hasOne: 'get',
  belongsToMany: 'list',
};
export const getAction = (type: string) => {
  if (process.env.NODE_ENV !== 'production' && !(type in TYPE_TO_ACTION)) {
    throw new Error(`VariablesProvider: unknown type: ${type}`);
  }

  return TYPE_TO_ACTION[type];
};
