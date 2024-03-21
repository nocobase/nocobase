import Database, { Model } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { Utils } from 'sequelize';

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
    if (!model.get('target')) {
      model.set('target', Utils.pluralize(model.get('name')));
    }

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
    if (!model.get('target')) {
      model.set('target', model.get('name'));
    }

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
    if (!model.get('target')) {
      model.set('target', model.get('name'));
    }

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
    if (model.get('sortable') && model.get('type') === 'hasMany') {
      model.set('sortBy', model.get('foreignKey') + 'Sort');
    }
  },
  hasOne(model: Model, { database }) {
    if (!model.get('target')) {
      model.set('target', Utils.pluralize(model.get('name')));
    }

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

function getAttributeType(attribute) {
  return attribute?.type.constructor.toString();
}

export const beforeCheckOptions = {
  belongsTo(model: Model, { database }) {
    const target = model.get('target');

    const targetModel = database.getCollection(target)?.model;
    const sourceModel = database.getCollection(model.get('collectionName'))?.model;
    if (!sourceModel || !targetModel) {
      return;
    }

    const foreignKey = sourceModel.rawAttributes[model.get('foreignKey')];
    const targetKey = targetModel.rawAttributes[model.get('targetKey')];

    const foreignKeyType = getAttributeType(foreignKey);
    const targetKeyType = getAttributeType(targetKey);

    if (foreignKeyType && foreignKeyType !== targetKeyType) {
      throw new Error(
        `Foreign key "${model.get('foreignKey')}" type "${foreignKeyType}" does not match target key "${model.get(
          'targetKey',
        )}" type "${targetKeyType}"`,
      );
    }
  },

  hasMany(model: Model, { database }) {
    const target = model.get('target');
    const source = model.get('collectionName');
    const targetModel = database.getCollection(target)?.model;
    const sourceModel = database.getCollection(source)?.model;

    if (!sourceModel || !targetModel) {
      return;
    }

    const foreignKey = targetModel.rawAttributes[model.get('foreignKey')];
    const sourceKey = sourceModel.rawAttributes[model.get('sourceKey')];

    const foreignKeyType = getAttributeType(foreignKey);
    const sourceKeyType = getAttributeType(sourceKey);

    if (foreignKeyType && foreignKeyType !== sourceKeyType) {
      throw new Error(
        `Foreign key "${model.get('foreignKey')}" type "${foreignKeyType}" does not match source key "${model.get(
          'sourceKey',
        )}" type "${sourceKeyType}"`,
      );
    }
  },

  hasOne(model: Model, { database }) {
    const target = model.get('target');
    const source = model.get('collectionName');
    const targetModel = database.getCollection(target)?.model;
    const sourceModel = database.getCollection(source)?.model;
    if (!sourceModel || !targetModel) {
      return;
    }

    const foreignKey = targetModel.rawAttributes[model.get('foreignKey')];
    const sourceKey = sourceModel.rawAttributes[model.get('sourceKey')];

    const foreignKeyType = getAttributeType(foreignKey);
    const sourceKeyType = getAttributeType(sourceKey);

    if (foreignKeyType && foreignKeyType !== sourceKeyType) {
      throw new Error(
        `Foreign key "${model.get('foreignKey')}" type "${foreignKeyType}" does not match source key "${model.get(
          'sourceKey',
        )}" type "${sourceKeyType}"`,
      );
    }
  },
  belongsToMany(model: Model, { database }) {
    const target = model.get('target');
    const through = model.get('through');
    const throughCollection = database.getCollection(through);
    if (!throughCollection) {
      return;
    }

    const targetModel = database.getCollection(target)?.model;
    const sourceModel = database.getCollection(model.get('collectionName'))?.model;

    if (!sourceModel || !targetModel) {
      return;
    }

    const foreignKey = throughCollection.model.rawAttributes[model.get('foreignKey')];
    const otherKey = throughCollection.model.rawAttributes[model.get('otherKey')];
    const sourceKey = sourceModel.rawAttributes[model.get('sourceKey')];
    const targetKey = targetModel.rawAttributes[model.get('targetKey')];

    const foreignKeyType = getAttributeType(foreignKey);
    const otherKeyType = getAttributeType(otherKey);
    const sourceKeyType = getAttributeType(sourceKey);
    const targetKeyType = getAttributeType(targetKey);

    if (foreignKeyType && foreignKeyType !== sourceKeyType) {
      throw new Error(
        `Foreign key "${model.get('foreignKey')}" type "${foreignKeyType}" does not match source key "${model.get(
          'sourceKey',
        )}" type "${sourceKeyType}"`,
      );
    }

    if (otherKeyType && otherKeyType !== targetKeyType) {
      throw new Error(
        `Other key "${model.get('otherKey')}" type "${otherKeyType}" does not match target key "${model.get(
          'targetKey',
        )}" type "${targetKeyType}"`,
      );
    }
  },
};
