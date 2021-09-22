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

export async function updateAssociations(
  model: Model,
  values: any,
  options: any = {},
) {
  const { transaction = await model.sequelize.transaction() } = options;
  // @ts-ignore
  for (const key of Object.keys(model.constructor.associations)) {
    // 如果 key 不存在才跳过
    if (!Object.keys(values).includes(key)) {
      continue;
    }
    await updateAssociation(model, key, values[key], {
      ...options,
      transaction,
    });
  }
  if (!options.transaction) {
    await transaction.commit();
  }
}

export async function updateAssociation(
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
  switch (association.associationType) {
    case 'HasOne':
    case 'BelongsTo':
      return updateSingleAssociation(model, key, value, options);
    case 'HasMany':
    case 'BelongsToMany':
      return updateMultipleAssociation(model, key, value, options);
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
      return await model[setAccessor](null, { transaction });
    }
    if (isStringOrNumber(value)) {
      return await model[setAccessor](value, { transaction });
    }
    // @ts-ignore
    const createAccessor = association.accessors.create;
    let key: string;
    let M: ModelCtor<Model>;
    if (association.associationType === 'BelongsTo') {
      // @ts-ignore
      key = association.targetKey;
      M = association.target;
    } else {
      // @ts-ignore
      key = association.sourceKey;
      M = association.source;
    }
    if (isStringOrNumber(value)) {
      let instance: any = await M.findOne({
        where: {
          [key]: value[key],
        },
        transaction,
      });
      if (!instance) {
        instance = await M.create(value, { transaction });
      }
      await model[setAccessor](value[key]);
      await updateAssociations(instance, value, { transaction, ...options });
    } else {
      const instance = await model[createAccessor](value, { transaction });
      await updateAssociations(instance, value, { transaction, ...options });
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
      return await model[setAccessor](null, { transaction });
    }
    if (isStringOrNumber(value)) {
      return await model[setAccessor](value, { transaction });
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
    console.log('updateMultipleAssociation', list1, list2);
    await model[setAccessor](list1, { transaction });
    for (const item of list2) {
      const pk = association.target.primaryKeyAttribute;
      if (isUndefinedOrNull(item[pk])) {
        const instance = await model[createAccessor](item, { transaction });
        await updateAssociations(instance, item, { transaction, ...options });
      } else {
        const instance = await association.target.findByPk(item[pk], { transaction });
        // @ts-ignore
        const addAccessor = association.accessors.add;
        await model[addAccessor](item[pk], { transaction });
        await updateAssociations(instance, item, { transaction, ...options });
      }
    }
    if (!options.transaction) {
      await transaction.commit();
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
