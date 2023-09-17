import Database, { Model } from '@nocobase/database';
import { uid } from '@nocobase/utils';

const setTargetKey = (db: Database, model: Model) => {
  if (model.get('targetKey')) {
    return;
  }
  const target = model.get('target') as any;
  if (db.hasCollection(target)) {
    const targetModel = db.getCollection(target).model;
    model.set('targetKey', targetModel.primaryKeyAttribute || 'id');
  } else {
    model.set('targetKey', 'id');
  }
};

const setSourceKey = (db: Database, model: Model) => {
  if (model.get('sourceKey')) {
    return;
  }
  const source = model.get('collectionName') as any;
  if (db.hasCollection(source)) {
    const sourceModel = db.getCollection(source).model;
    model.set('sourceKey', sourceModel.primaryKeyAttribute || 'id');
  } else {
    model.set('sourceKey', 'id');
  }
};

export const beforeInitOptions = {
  belongsTo(model: Model, { database }) {
    const defaults = {
      // targetKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setTargetKey(database, model);
  },
  belongsToMany(model: Model, { database }) {
    const defaults = {
      // targetKey: 'id',
      // sourceKey: 'id',
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
    setTargetKey(database, model);
    setSourceKey(database, model);
  },
  hasMany(model: Model, { database }) {
    const defaults = {
      // targetKey: 'id',
      // sourceKey: 'id',
      foreignKey: `f_${uid()}`,
      target: `t_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setTargetKey(database, model);
    setSourceKey(database, model);
  },
  hasOne(model: Model, { database }) {
    const defaults = {
      // sourceKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setSourceKey(database, model);
  },
};
