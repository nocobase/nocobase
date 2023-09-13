import Database from '@nocobase/database';

export function afterCreateForForeignKeyField(db: Database) {
  function generateFkOptions(collectionName: string, foreignKey: string) {
    const collection = db.getCollection(collectionName);

    if (!collection) {
      throw new Error('collection not found');
    }

    const M = collection.model;

    const attr = M.rawAttributes[foreignKey];

    if (!attr) {
      throw new Error(`${collectionName}.${foreignKey} does not exists`);
    }

    return attribute2field(attr);
  }

  // Foreign key types are only integer and string
  function attribute2field(attribute: any) {
    let type = 'bigInt';
    if (attribute.type.constructor.name === 'INTEGER') {
      type = 'integer';
    } else if (attribute.type.constructor.name === 'STRING') {
      type = 'string';
    }
    const name = attribute.fieldName;
    const data = {
      interface: 'integer',
      name,
      type,
      uiSchema: {
        type: 'number',
        title: name,
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    };
    if (type === 'string') {
      data['interface'] = 'input';
      data['uiSchema'] = {
        type: 'string',
        title: name,
        'x-component': 'Input',
        'x-read-pretty': true,
      };
    }
    return data;
  }

  async function createFieldIfNotExists({ values, transaction }) {
    const { collectionName, name } = values;
    if (!collectionName || !name) {
      throw new Error(`field options invalid`);
    }
    const r = db.getRepository('fields');
    const instance = await r.findOne({
      filter: {
        collectionName,
        name,
      },
      transaction,
    });

    if (instance) {
      if (instance.type !== values.type) {
        throw new Error(`fk type invalid`);
      }
      instance.set('sort', 1);
      instance.set('isForeignKey', true);
      await instance.save({ transaction });
    } else {
      const creatInstance = await r.create({
        values: {
          isForeignKey: true,
          ...values,
        },
        transaction,
      });
      // SortField#setSortValue instance._previousDataValues[scopeKey] judgment cause create set sort:1 invalid, need update
      creatInstance.set('sort', 1);
      await creatInstance.save({ transaction });
    }
    // update ID sort:0
    await r.update({
      filter: {
        collectionName,
        options: {
          primaryKey: true,
        },
      },
      values: {
        sort: 0,
      },
      transaction,
    });
  }

  const hook = async (model, { transaction, context }) => {
    // skip if no app context
    if (!context) {
      return;
    }

    const {
      type,
      interface: interfaceType,
      collectionName,
      target,
      through,
      foreignKey,
      otherKey,
      source,
    } = model.get();

    if (source) return;

    // foreign key in target collection
    if (['oho', 'o2m'].includes(interfaceType)) {
      const values = generateFkOptions(target, foreignKey);
      await createFieldIfNotExists({
        values: {
          collectionName: target,
          ...values,
        },
        transaction,
      });
    }

    // foreign key in source collection
    else if (['obo', 'm2o'].includes(interfaceType)) {
      const values = generateFkOptions(collectionName, foreignKey);
      await createFieldIfNotExists({
        values: { collectionName, ...values },
        transaction,
      });
    }

    // foreign key in through collection
    else if (['linkTo', 'm2m'].includes(interfaceType)) {
      if (type !== 'belongsToMany') {
        return;
      }
      const r = db.getRepository('collections');
      const instance = await r.findOne({
        filter: {
          name: through,
        },
        transaction,
      });
      if (!instance) {
        await r.create({
          values: {
            name: through,
            title: through,
            timestamps: true,
            autoGenId: false,
            hidden: true,
            autoCreate: true,
            isThrough: true,
            sortable: false,
          },
          context,
          transaction,
        });
      }
      const opts1 = generateFkOptions(through, foreignKey);
      const opts2 = generateFkOptions(through, otherKey);
      await createFieldIfNotExists({
        values: {
          collectionName: through,
          ...opts1,
        },
        transaction,
      });
      await createFieldIfNotExists({
        values: {
          collectionName: through,
          ...opts2,
        },
        transaction,
      });
    }
  };

  return async (model, options) => {
    try {
      await hook(model, options);
    } catch (error) {}
  };
}
