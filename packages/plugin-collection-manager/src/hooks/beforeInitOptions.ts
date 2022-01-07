import { uid } from '@nocobase/utils';
import { Model } from 'sequelize';

export default {
  belongsTo(model: Model) {
    const defaults = {
      targetKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
  },
  belongsToMany(model: Model) {
    const defaults = {
      targetKey: 'id',
      sourceKey: 'id',
      through: `t_${uid()}`,
      foreignKey: `f_${uid()}`,
      otherKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
  },
  hasMany(model: Model) {
    const defaults = {
      targetKey: 'id',
      sourceKey: 'id',
      foreignKey: `f_${uid()}`,
      target: `t_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
  },
  hasOne(model: Model) {
    const defaults = {
      sourceKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
  },
};
