import _ from 'lodash';
import { has, merge, generateRandomString } from '../utils';
import { interfaces } from '../interfaces';
import { Model } from '@nocobase/database';

export default async function beforeValidate(model: Model, opts = {}) {
  let data = model.get();
  const { interface: interfaceType } = data;
  if (!interfaceType || !interfaces.has(interfaceType)) {
    return;
  }
  const defaults = {};
  Object.keys(data).forEach(name => {
    const match = /options\.x-(\w+)-props\.(\w+)/.exec(name);
    if (match) {
      if (match[1] !== interfaceType) {
        delete data[name];
        delete model.dataValues[name];
      } else {
        _.set(defaults, match[2], data[name]);
      }
    }
  });
  const { options, properties = {}, initialize } = interfaces.get(interfaceType);
  Object.keys(properties).forEach(name => {
    if (has(data, `x-${interfaceType}-props.${name}`)) {
      const value = _.get(data, `x-${interfaceType}-props.${name}`);
      _.set(data, name, value);
    }
  });
  data = merge(merge(defaults, options), data);
  initialize && await initialize(data, model);
  model.set(data);
  // 清除掉 interfaceType 下的临时数据
  model.set(`x-${interfaceType}-props`, undefined);
}
