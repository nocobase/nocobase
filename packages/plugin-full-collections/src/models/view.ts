import _ from 'lodash';
import BaseModel from './base';
import { interfaces } from '../interfaces';
import has from 'just-has';

export class ViewModel extends BaseModel {

  get(key?: any, options?: any) {
    if (typeof key !== 'string') {
      const data = super.get(key);
      const { type } = data;
      if (type && interfaces.has(type)) {
        const { properties = {} } = interfaces.get(type);
        Object.keys(properties).forEach(name => {
          if (has(data, name)) {
            const value = _.get(data, name);
            _.set(data, `x-${type}-props.${name}`, value);
          }
        });
      }
      return data;
    }
    return super.get(key, options);
  }

  async getOptions(): Promise<any> {
    return {
      ...this.get(),
    };
  }
}

export default ViewModel;
