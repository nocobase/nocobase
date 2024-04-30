/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
