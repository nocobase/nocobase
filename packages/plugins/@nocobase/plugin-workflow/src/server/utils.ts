import { Model } from '@nocobase/database';

export function toJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}
