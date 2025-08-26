/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { ModelStatic } from 'sequelize';
import { Model } from './model';
import { AssociationKeysToBeUpdate, BlackList, WhiteList } from './repository';
import { Field } from './fields';

type UpdateValueItem = string | number | UpdateValues;

type UpdateValues = {
  [key: string]: UpdateValueItem | Array<UpdateValueItem>;
};

type UpdateAction = 'create' | 'update';

export class UpdateGuard {
  model: ModelStatic<any>;
  action: UpdateAction;
  underscored: boolean;
  private associationKeysToBeUpdate: AssociationKeysToBeUpdate;
  private blackList: BlackList;
  private whiteList: WhiteList;

  static fromOptions(model, options) {
    const guard = new UpdateGuard();
    guard.setModel(model);
    guard.setWhiteList(options.whitelist);
    guard.setBlackList(options.blacklist);
    guard.setAction(lodash.get(options, 'action', 'update'));
    guard.setAssociationKeysToBeUpdate(options.updateAssociationValues);

    if (options.underscored) {
      guard.underscored = options.underscored;
    }

    return guard;
  }

  setAction(action: UpdateAction) {
    this.action = action;
  }

  setModel(model: ModelStatic<any>) {
    this.model = model;
  }

  setAssociationKeysToBeUpdate(associationKeysToBeUpdate: AssociationKeysToBeUpdate) {
    if (this.action == 'create') {
      const keys = Object.keys(this.model.associations);
      this.associationKeysToBeUpdate = associationKeysToBeUpdate
        ? keys.filter((x) => associationKeysToBeUpdate?.includes(x))
        : keys;
    } else {
      this.associationKeysToBeUpdate = associationKeysToBeUpdate;
    }
  }

  setWhiteList(whiteList: WhiteList) {
    this.whiteList = whiteList;
  }

  setBlackList(blackList: BlackList) {
    this.blackList = blackList;
  }

  checkValues(values) {
    const dfs = (values, model) => {
      const associations = model.associations;
      const belongsToManyThroughNames = [];

      const associationValueKeys = Object.keys(associations).filter((key) => {
        return Object.keys(values).includes(key);
      });

      const belongsToManyValueKeys = associationValueKeys.filter((key) => {
        return associations[key].associationType === 'BelongsToMany';
      });

      const hasManyValueKeys = associationValueKeys.filter((key) => {
        return associations[key].associationType === 'HasMany';
      });

      for (const belongsToManyKey of belongsToManyValueKeys) {
        const association = associations[belongsToManyKey];
        const through = association.through.model;
        belongsToManyThroughNames.push(through.name);
      }

      for (const hasManyKey of hasManyValueKeys) {
        const association = associations[hasManyKey];
        if (belongsToManyThroughNames.includes(association.target.name)) {
          throw new Error(
            `HasMany association ${hasManyKey} cannot be used with BelongsToMany association ${association.target.name} with same through model`,
          );
        }
      }
    };

    dfs(values, this.model);
  }

  private filterAssociationValuesByTargetKey(value, key: string) {
    if (!lodash.isObject(value)) {
      return value;
    }
    if (key && value[key]) {
      value = lodash.pick(value, key);
    } else {
      delete value[key];
    }
    return value;
  }

  /**
   * Sanitize values by whitelist blacklist
   * @param values
   */
  sanitize(values: UpdateValues) {
    if (values === null || values === undefined) {
      return values;
    }

    values = lodash.clone(values);

    if (!this.model) {
      throw new Error('please set model first');
    }

    this.checkValues(values);

    const associations = this.model.associations;
    const associationsValues = lodash.pick(values, Object.keys(associations));

    // build params of association update guard
    const listOfAssociation = (list, association) => {
      if (list) {
        list = list
          .filter((whiteListKey) => whiteListKey.startsWith(`${association}.`))
          .map((whiteListKey) => whiteListKey.replace(`${association}.`, ''));

        if (list.length == 0) {
          return undefined;
        }

        return list;
      }

      return undefined;
    };

    // sanitize association values
    Object.keys(associationsValues).forEach((association) => {
      let associationValues = associationsValues[association];

      const associationObj = associations[association];

      const filterAssociationToBeUpdate = (value) => {
        if (value === null) {
          return value;
        }

        const associationKeysToBeUpdate = this.associationKeysToBeUpdate;

        if (associationKeysToBeUpdate?.includes(association)) {
          return value;
        }

        const associationKeyName = associationObj?.['options']?.targetKey
          ? associationObj['options'].targetKey
          : associationObj.target.primaryKeyAttribute;

        if (associationValues && associationKeysToBeUpdate && !associationKeysToBeUpdate.includes(association)) {
          return this.filterAssociationValuesByTargetKey(value, associationKeyName);
        }

        if (value[associationKeyName]) {
          return lodash.pick(value, [associationKeyName, ...Object.keys(associationObj.target.associations)]);
        }

        return value;
      };

      const sanitizeValue = (value) => {
        const associationUpdateGuard = new UpdateGuard();
        associationUpdateGuard.setModel(associations[association].target);

        ['whiteList', 'blackList', 'associationKeysToBeUpdate'].forEach((optionKey) => {
          associationUpdateGuard[`set${lodash.upperFirst(optionKey)}`](listOfAssociation(this[optionKey], association));
        });

        return associationUpdateGuard.sanitize(filterAssociationToBeUpdate(value));
      };

      if (Array.isArray(associationValues)) {
        associationValues = associationValues.map((value) => {
          if (value === undefined || value === null || typeof value == 'string' || typeof value == 'number') {
            return value;
          } else {
            return sanitizeValue(value);
          }
        });
      } else if (typeof associationValues === 'object' && associationValues !== null) {
        associationValues = sanitizeValue(associationValues);
      }

      // set association values to sanitized value
      values[association] = associationValues;

      if (associationObj.associationType === 'BelongsTo') {
        if (typeof associationValues === 'object' && associationValues !== null) {
          if (associationValues[(associationObj as any).targetKey] != null) {
            values[(associationObj as any).foreignKey] = associationValues[(associationObj as any).targetKey];
          }
        } else {
          values[(associationObj as any).foreignKey] = associationValues;
        }
      }
    });

    if (values instanceof Model) {
      return values;
    }

    let valuesKeys = Object.keys(values || {});

    // handle whitelist
    if (this.whiteList) {
      valuesKeys = valuesKeys.filter((valueKey) => {
        return (
          this.whiteList.findIndex((whiteKey) => {
            const keyPaths = whiteKey.split('.');
            return keyPaths[0] === valueKey;
          }) !== -1
        );
      });
    }

    // handle blacklist
    if (this.blackList) {
      valuesKeys = valuesKeys.filter((valueKey) => !this.blackList.includes(valueKey));
    }

    const result = valuesKeys.reduce((obj, key) => {
      lodash.set(obj, key, values[key]);
      return obj;
    }, {});

    return result;
  }
}
