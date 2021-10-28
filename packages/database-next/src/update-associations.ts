import {
  Sequelize,
  ModelCtor,
  Model,
  DataTypes,
  Utils,
  Association,
} from 'sequelize';

function isUndefinedOrNull(value: any) {
  return typeof value === 'undefined' || value === null;
}

function isStringOrNumber(value: any) {
  return typeof value === 'string' || typeof value === 'number';
}

function modelAssociations(instance: Model) {
  return (<typeof Model>instance.constructor).associations;
}

export async function updateAssociations(
  instance: Model,
  values: any,
  options: any = {},
) {
  // if no values set, return
  if (!values) {
    return;
  }

  const { transaction = await instance.sequelize.transaction() } = options;

  for (const key of Object.keys(modelAssociations(instance))) {
    if (values[key]) {
      await updateAssociation(instance, key, values[key], {
        ...options,
        transaction,
      });
    }
  }

  if (!options.transaction) {
    await transaction.commit();
  }
}

export async function updateAssociation(
  instance: Model,
  key: string,
  value: any,
  options: any = {},
) {
  const association: Association = modelAssociations(instance)[key];

  if (!association) {
    return false;
  }

  switch (association.associationType) {
    case 'HasOne':
    case 'BelongsTo':
      return updateSingleAssociation(instance, key, value, options);
    case 'HasMany':
    case 'BelongsToMany':
      return updateMultipleAssociation(instance, key, value, options);
  }
}

export async function updateSingleAssociation(
  model: Model,
  key: string,
  value: any,
  options: any = {},
) {
  // @ts-ignore
  const association = model.constructor.associations[key] as Association;
  if (!association) {
    return false;
  }
  if (!['undefined', 'string', 'number', 'object'].includes(typeof value)) {
    return false;
  }
  const { transaction = await model.sequelize.transaction() } = options;
  try {
    // @ts-ignore
    const setAccessor = association.accessors.set;
    if (isUndefinedOrNull(value)) {
      await model[setAccessor](null, { transaction });
      model.setDataValue(key, null);
      if (!options.transaction) {
        await transaction.commit();
      }
      return true;
    }
    if (isStringOrNumber(value)) {
      await model[setAccessor](value, { transaction });
      if (!options.transaction) {
        await transaction.commit();
      }
      return true;
    }
    if (value instanceof Model) {
      await model[setAccessor](value);
      model.setDataValue(key, value);
      if (!options.transaction) {
        await transaction.commit();
      }
      return true;
    }
    // @ts-ignore
    const createAccessor = association.accessors.create;
    let dataKey: string;
    let M: ModelCtor<Model>;
    if (association.associationType === 'BelongsTo') {
      M = association.target;
      // @ts-ignore
      dataKey = association.targetKey;
    } else {
      M = association.source;
      dataKey = M.primaryKeyAttribute;
    }
    if (isStringOrNumber(value[dataKey])) {
      let instance: any = await M.findOne({
        where: {
          [dataKey]: value[dataKey],
        },
        transaction,
      });
      if (instance) {
        await model[setAccessor](instance);
        await updateAssociations(instance, value, { transaction, ...options });
        model.setDataValue(key, instance);
        if (!options.transaction) {
          await transaction.commit();
        }
        return true;
      }
    }
    const instance = await model[createAccessor](value, { transaction });
    await updateAssociations(instance, value, { transaction, ...options });
    model.setDataValue(key, instance);
    // @ts-ignore
    if (association.targetKey) {
      model.setDataValue(association.foreignKey, instance[dataKey]);
    }
    if (!options.transaction) {
      await transaction.commit();
    }
  } catch (error) {
    if (!options.transaction) {
      await transaction.rollback();
    }
    throw error;
  }
}

export async function updateMultipleAssociation(
  model: Model,
  key: string,
  value: any,
  options: any = {},
) {
  // @ts-ignore
  const association = model.constructor.associations[key] as Association;
  if (!association) {
    return false;
  }
  if (!['undefined', 'string', 'number', 'object'].includes(typeof value)) {
    return false;
  }
  const { transaction = await model.sequelize.transaction() } = options;
  try {
    // @ts-ignore
    const setAccessor = association.accessors.set;
    // @ts-ignore
    const createAccessor = association.accessors.create;
    if (isUndefinedOrNull(value)) {
      await model[setAccessor](null, { transaction });
      model.setDataValue(key, null);
      return;
    }
    if (isStringOrNumber(value)) {
      await model[setAccessor](value, { transaction });
      return;
    }
    if (!Array.isArray(value)) {
      value = [value];
    }
    const list1 = []; // to be setted
    const list2 = []; // to be added
    for (const item of value) {
      if (isUndefinedOrNull(item)) {
        continue;
      }
      if (isStringOrNumber(item)) {
        list1.push(item);
      } else if (item instanceof Model) {
        list1.push(item);
      } else if (item.sequelize) {
        list1.push(item);
      } else if (typeof item === 'object') {
        list2.push(item);
      }
    }
    await model[setAccessor](list1, { transaction });
    const list3 = [];
    for (const item of list2) {
      const pk = association.target.primaryKeyAttribute;
      if (isUndefinedOrNull(item[pk])) {
        const instance = await model[createAccessor](item, { transaction });
        await updateAssociations(instance, item, { transaction, ...options });
        list3.push(instance);
      } else {
        const instance = await association.target.findByPk(item[pk], {
          transaction,
        });
        // @ts-ignore
        const addAccessor = association.accessors.add;
        await model[addAccessor](item[pk], { transaction });
        await updateAssociations(instance, item, { transaction, ...options });
        list3.push(instance);
      }
    }
    model.setDataValue(key, list1.concat(list3));
    if (!options.transaction) {
      await transaction.commit();
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
