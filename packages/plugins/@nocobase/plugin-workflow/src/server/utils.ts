import { Model } from '@nocobase/database';

export function toJSON(data: Model | Model[]): object {
  if (!(data instanceof Model) || !data) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}
