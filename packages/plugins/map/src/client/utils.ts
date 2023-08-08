export const getSource = (data: Record<string, any>, fields?: string[], type?: string) => {
  const res = fields?.reduce((obj, field, index) => {
    if (index === fields.length - 1 && (type === 'o2m' || type === 'm2m')) {
      return obj?.map((item) => item[field]).filter((v) => v !== null && v !== undefined);
    }
    return obj?.[field];
  }, data);
  return type === 'o2m' || type === 'm2m' ? res : [res];
};
