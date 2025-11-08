/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import {
  Association,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
  Hookable,
  ModelStatic,
  Transactionable,
} from 'sequelize';
import { Model } from './model';
import { UpdateGuard } from './update-guard';
import { TargetKey } from './repository';
import Database from './database';
import { getKeysByPrefix, isStringOrNumber, isUndefinedOrNull } from './utils';

export function modelAssociations(instance: Model) {
  return (<typeof Model>instance.constructor).associations;
}

export function belongsToManyAssociations(instance: Model): Array<BelongsToMany> {
  const associations = modelAssociations(instance);
  return Object.entries(associations)
    .filter((entry) => {
      const [key, association] = entry;
      return association.associationType == 'BelongsToMany';
    })
    .map((association) => {
      return <BelongsToMany>association[1];
    });
}

export function modelAssociationByKey(
  instance: Model,
  key: string,
): Association & {
  update?: (instance: Model, value: any, options: UpdateAssociationOptions) => Promise<any>;
} {
  return modelAssociations(instance)[key] as Association;
}

type UpdateValue = { [key: string]: any };

interface UpdateOptions extends Transactionable {
  filter?: any;
  filterByTk?: TargetKey;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
  sanitized?: boolean;
  sourceModel?: Model;
}

export interface UpdateAssociationOptions extends Transactionable, Hookable {
  updateAssociationValues?: string[];
  sourceModel?: Model;
  context?: any;
  associationContext?: any;
  recursive?: boolean;
}

export async function updateModelByValues(instance: Model, values: UpdateValue, options?: UpdateOptions) {
  if (!options?.sanitized) {
    const guard = new UpdateGuard();
    //@ts-ignore
    guard.setModel(instance.constructor);
    guard.setBlackList(options.blacklist);
    guard.setWhiteList(options.whitelist);
    guard.setAssociationKeysToBeUpdate(options.updateAssociationValues);
    values = guard.sanitize(values);
  }
  (instance.constructor as typeof Model).collection.validate({
    values,
    operation: 'update',
  });
  await instance.update(values, options);
  await updateAssociations(instance, values, options);
}

export async function updateThroughTableValue(
  instance: Model,
  throughName: string,
  throughValues: any,
  source: Model,
  transaction = null,
) {
  // update through table values
  for (const belongsToMany of belongsToManyAssociations(instance)) {
    // @ts-ignore
    const throughModel = belongsToMany.through.model;
    const throughModelName = throughModel.name;

    if (throughModelName === throughModelName) {
      const where = {
        [belongsToMany.foreignKey]: instance.get(belongsToMany.sourceKey),
        [belongsToMany.otherKey]: source.get(belongsToMany.targetKey),
      };

      return await throughModel.update(throughValues, {
        where,
        transaction,
      });
    }
  }
}

/**
 * update association of instance by values
 * @param instance
 * @param values
 * @param options
 */
export async function updateAssociations(instance: Model, values: any, options: UpdateAssociationOptions = {}) {
  // if no values set, return
  if (!values) {
    return;
  }

  if (options?.updateAssociationValues) {
    options.recursive = true;
  }

  let newTransaction = false;
  let transaction = options.transaction;

  if (!transaction) {
    newTransaction = true;
    transaction = await instance.sequelize.transaction();
  }

  const keys = Object.keys(values);

  try {
    for (const key of Object.keys(modelAssociations(instance))) {
      if (keys.includes(key)) {
        await updateAssociation(instance, key, values[key], {
          ...options,
          transaction,
        });
      }
    }

    // update through table values
    for (const belongsToMany of belongsToManyAssociations(instance)) {
      // @ts-ignore
      const throughModel = belongsToMany.through.model;
      const throughModelName = throughModel.name;

      if (values[throughModelName] && options.sourceModel) {
        const where = {
          [belongsToMany.foreignKey]: instance.get(belongsToMany.sourceKey),
          [belongsToMany.otherKey]: options.sourceModel.get(belongsToMany.targetKey),
        };

        await throughModel.update(values[throughModel.name], {
          where,
          context: options.context,
          transaction,
        });
      }
    }

    if (newTransaction) {
      await transaction.commit();
    }
  } catch (error) {
    if (newTransaction) {
      await transaction.rollback();
    }
    throw error;
  }
}

function isReverseAssociationPair(a: any, b: any) {
  const typeSet = new Set();
  typeSet.add(a.associationType);
  typeSet.add(b.associationType);

  if (typeSet.size == 1 && typeSet.has('BelongsToMany')) {
    return (
      a.through.tableName === b.through.tableName &&
      a.target.name === b.source.name &&
      b.target.name === a.source.name &&
      a.foreignKey === b.otherKey &&
      a.sourceKey === b.targetKey &&
      a.otherKey === b.foreignKey &&
      a.targetKey === b.sourceKey
    );
  }

  if ((typeSet.has('HasOne') && typeSet.has('BelongsTo')) || (typeSet.has('HasMany') && typeSet.has('BelongsTo'))) {
    const sourceAssoc = a.associationType == 'BelongsTo' ? b : a;
    const targetAssoc = sourceAssoc == a ? b : a;

    return (
      sourceAssoc.source.name === targetAssoc.target.name &&
      sourceAssoc.target.name === targetAssoc.source.name &&
      sourceAssoc.foreignKey === targetAssoc.foreignKey &&
      sourceAssoc.sourceKey === targetAssoc.targetKey
    );
  }

  return false;
}

/**
 * update model association by key
 * @param instance
 * @param key
 * @param value
 * @param options
 */
export async function updateAssociation(
  instance: Model,
  key: string,
  value: any,
  options: UpdateAssociationOptions = {},
) {
  const association = modelAssociationByKey(instance, key);

  if (!association) {
    return false;
  }

  if (options.associationContext && isReverseAssociationPair(association, options.associationContext)) {
    return false;
  }

  if (association.update) {
    return association.update(instance, value, options);
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

/**
 * update belongsTo and HasOne
 * @param model
 * @param key
 * @param value
 * @param options
 */
export async function updateSingleAssociation(
  model: Model,
  key: string,
  value: any,
  options: UpdateAssociationOptions = {},
) {
  const association = <HasOne | BelongsTo>modelAssociationByKey(model, key);

  if (!association) {
    return false;
  }

  if (!['undefined', 'string', 'number', 'object'].includes(typeof value)) {
    return false;
  }

  if (Array.isArray(value)) {
    throw new Error(`The value of '${key}' cannot be in array format`);
  }

  const { recursive, context, updateAssociationValues = [], transaction } = options;
  const keys = getKeysByPrefix(updateAssociationValues, key);

  // set method of association
  const setAccessor = association.accessors.set;

  const removeAssociation = async () => {
    await model[setAccessor](null, { transaction });
    model.setDataValue(key, null);
    return true;
  };

  if (isUndefinedOrNull(value)) {
    return await removeAssociation();
  }

  // @ts-ignore
  if (association.associationType === 'HasOne' && !model.get(association.sourceKeyAttribute)) {
    // @ts-ignore
    throw new Error(`The source key ${association.sourceKeyAttribute} is not set in ${model.constructor.name}`);
  }

  const checkBelongsToForeignKeyValue = () => {
    // @ts-ignore
    if (association.associationType === 'BelongsTo' && !model.get(association.foreignKey)) {
      throw new Error(
        // @ts-ignore
        `The target key ${association.targetKey} is not set in ${association.target.name}`,
      );
    }
  };

  if (isStringOrNumber(value)) {
    await model[setAccessor](value, { context, transaction });
    return true;
  }

  if (value instanceof Model) {
    await model[setAccessor](value, { context, transaction });
    model.setDataValue(key, value);
    return true;
  }

  let dataKey: string;
  let M: ModelStatic<Model>;
  if (association.associationType === 'BelongsTo') {
    M = association.target as ModelStatic<Model>;
    // @ts-ignore
    dataKey = association.targetKey;
  } else {
    M = association.target as ModelStatic<Model>;
    dataKey = M.primaryKeyAttribute;
  }

  if (isStringOrNumber(value[dataKey])) {
    const instance: any = await M.findOne({
      where: {
        [dataKey]: value[dataKey],
      },
      transaction,
    });

    if (instance) {
      await model[setAccessor](instance, { context, transaction });

      if (!recursive) {
        return;
      }

      if (updateAssociationValues.includes(key)) {
        const updateValues = { ...value };

        if (association.associationType === 'HasOne') {
          delete updateValues[association.foreignKey];
        }

        const { repository, filterTargetKey } = instance.constructor['collection'];
        const filterByTk = Array.isArray(filterTargetKey)
          ? filterTargetKey.reduce((keys, key) => (keys[key] = instance.get(key)), {})
          : instance.get(filterTargetKey);
        await repository.update({ ...options, filterByTk, values: updateValues, transaction });
      }

      await updateAssociations(instance, value, {
        ...options,
        transaction,
        associationContext: association,
        updateAssociationValues: keys,
      });
      model.setDataValue(key, instance);
      return true;
    }
  }

  const TargetModel = association.target as typeof Model;
  const targetCollection = TargetModel.collection;
  targetCollection.validate({
    values: value,
    operation: 'create',
  });

  if (association instanceof HasOne) {
    value[association.foreignKey] = model.get(dataKey);
  }
  const instance = await targetCollection.repository.create({ values: value, context, transaction });
  if (association instanceof BelongsTo) {
    await model.update({ [association.foreignKey]: instance.get(dataKey) }, { transaction });
  }

  model.setDataValue(key, instance);
  // @ts-ignore
  if (association.targetKey) {
    model.setDataValue(association.foreignKey, instance[dataKey]);
  }

  // must have foreign key value
  checkBelongsToForeignKeyValue();
}

/**
 * update multiple association of model by value
 * @param model
 * @param key
 * @param value
 * @param options
 */
export async function updateMultipleAssociation(
  model: Model,
  key: string,
  value: any,
  options: UpdateAssociationOptions = {},
) {
  const association = <BelongsToMany | HasMany>modelAssociationByKey(model, key);

  if (!association) {
    return false;
  }

  if (!['undefined', 'string', 'number', 'object'].includes(typeof value)) {
    return false;
  }

  const { recursive, context, updateAssociationValues = [], transaction } = options;
  const keys = getKeysByPrefix(updateAssociationValues, key);

  const setAccessor = association.accessors.set;

  if (value == null || (Array.isArray(value) && value.length === 0)) {
    await model[setAccessor](value, { transaction, context, individualHooks: true, validate: false });
    model.setDataValue(key, null);
    return;
  }

  // @ts-ignore
  if (association.associationType === 'HasMany' && !model.get(association.sourceKeyAttribute)) {
    // @ts-ignore
    throw new Error(`The source key ${association.sourceKeyAttribute} is not set in ${model.constructor.name}`);
  }

  if (isStringOrNumber(value)) {
    await model[setAccessor](value, { transaction, context, individualHooks: true, validate: false });
    return;
  }

  value = lodash.castArray(value);

  const setItems = []; // to be setted
  const objectItems = []; // to be added

  // iterate item in value
  for (const item of value) {
    if (isUndefinedOrNull(item)) {
      continue;
    }

    if (isStringOrNumber(item)) {
      setItems.push(item);
    } else if (item instanceof Model) {
      setItems.push(item);
    } else if (item.sequelize) {
      setItems.push(item);
    } else if (typeof item === 'object') {
      // @ts-ignore
      const targetKey = (association as any).targetKey || association.options.targetKey || 'id';

      if (item[targetKey] != null) {
        const attributes = {
          [targetKey]: item[targetKey],
        };

        const instance = association.target.build(attributes, { isNewRecord: false });
        setItems.push(instance);
      }

      objectItems.push(item);
    }
  }

  // associate targets in lists1
  await model[setAccessor](setItems, { transaction, context, individualHooks: true, validate: false });

  const newItems = [];

  const pk = association.target.primaryKeyAttribute;
  let targetKey = pk;
  const db = model.constructor['database'] as Database;

  const tmpKey = association['options']?.['targetKey'];
  if (tmpKey !== pk) {
    const targetKeyFieldOptions = db.getFieldByPath(`${association.target.name}.${tmpKey}`)?.options;
    if (targetKeyFieldOptions?.unique) {
      targetKey = tmpKey;
    }
  }

  for (const item of objectItems) {
    const through = (<any>association).through ? (<any>association).through.model.name : null;

    const accessorOptions = {
      context,
      transaction,
    };

    const throughValue = item[through];

    if (pk !== targetKey && !isUndefinedOrNull(item[pk]) && isUndefinedOrNull(item[targetKey])) {
      throw new Error(`${targetKey} field value is empty`);
    }

    if (item[targetKey] == null) {
      // create new record
      const TargetModel = association.target as typeof Model;
      const targetCollection = TargetModel.collection;
      targetCollection.validate({
        values: item,
        operation: 'create',
      });

      if (association instanceof HasMany) {
        // @ts-ignore
        item[association.foreignKey] = model.get(association.sourceKey);
      }
      const instance = await targetCollection.repository.create({ ...accessorOptions, values: item });
      if (association instanceof BelongsToMany) {
        const ThroughModel = (<any>association).through.model as typeof Model;
        await ThroughModel.collection.repository.updateOrCreate({
          ...accessorOptions,
          filterKeys: [association.foreignKey, association.otherKey],
          values: {
            // @ts-ignore
            [association.foreignKey]: model.get(association.sourceKey),
            [association.otherKey]: instance.get(association.targetKey),
            ...throughValue,
          },
        });
      }

      newItems.push(instance);
    } else {
      // set & update record
      const where = {
        [targetKey]: item[targetKey],
      };
      let instance = await association.target.findOne<any>({
        where,
        transaction,
      });
      if (!instance) {
        // create new record
        const TargetModel = association.target as typeof Model;
        const targetCollection = TargetModel.collection;
        targetCollection.validate({
          values: item,
          operation: 'create',
        });

        if (association instanceof HasMany) {
          // @ts-ignore
          item[association.foreignKey] = model.get(association.sourceKey);
        }
        instance = await targetCollection.repository.create({ ...accessorOptions, values: item });
        if (association instanceof BelongsToMany) {
          const ThroughModel = (<any>association).through.model as typeof Model;
          await ThroughModel.collection.repository.updateOrCreate({
            ...accessorOptions,
            filterKeys: [association.foreignKey, association.otherKey],
            values: {
              // @ts-ignore
              [association.foreignKey]: model.get(association.sourceKey),
              [association.otherKey]: instance.get(association.targetKey),
              ...throughValue,
            },
          });
        }

        await updateAssociations(instance, item, {
          ...options,
          transaction,
          associationContext: association,
          updateAssociationValues: keys,
        });
        newItems.push(instance);
        continue;
      }

      if (association instanceof HasMany) {
        // @ts-ignore
        if (instance.get(association.foreignKey) !== model.get(association.sourceKey)) {
          const TargetModel = association.target as typeof Model;
          await TargetModel.collection.repository.update({
            ...accessorOptions,
            filterByTk: instance.get(TargetModel.collection.filterTargetKey || pk),
            values: {
              // @ts-ignore
              [association.foreignKey]: model.get(association.sourceKey),
            },
          });
        }
      } else {
        const ThroughModel = (<any>association).through.model as typeof Model;
        await ThroughModel.collection.repository.updateOrCreate({
          ...accessorOptions,
          filterKeys: [association.foreignKey, association.otherKey],
          values: {
            // @ts-ignore
            [association.foreignKey]: model.get(association.sourceKey),
            [association.otherKey]: instance.get(association.targetKey),
            ...throughValue,
          },
        });
      }

      if (!recursive) {
        continue;
      }
      if (updateAssociationValues.includes(key)) {
        if (association.associationType === 'HasMany') {
          delete item[association.foreignKey];
        }
        (association.target as typeof Model).collection.validate({
          values: item,
          operation: 'update',
        });
        const { repository, filterTargetKey } = instance.constructor['collection'];
        const filterByTk = Array.isArray(filterTargetKey)
          ? filterTargetKey.reduce((keys, key) => (keys[key] = instance.get(key)), {})
          : instance.get(filterTargetKey);
        await repository.update({ ...options, filterByTk, values: item, transaction });
      }

      newItems.push(instance);
    }
  }

  for (const newItem of newItems) {
    // @ts-ignore
    const findTargetKey = (association as any).targetKey || association.options.targetKey || targetKey;

    const existIndexInSetItems = setItems.findIndex((setItem) => setItem[findTargetKey] === newItem[findTargetKey]);

    if (existIndexInSetItems !== -1) {
      setItems[existIndexInSetItems] = newItem;
    } else {
      setItems.push(newItem);
    }
  }

  model.setDataValue(key, setItems);
}
