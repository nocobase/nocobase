import lodash from 'lodash';
import { ModelCtor } from 'sequelize';
import { Model } from './model';
import { AssociationKeysToBeUpdate, BlackList, WhiteList } from './repository';

type UpdateValueItem = string | number | UpdateValues;

type UpdateValues = {
  [key: string]: UpdateValueItem | Array<UpdateValueItem>;
};

type UpdateAction = 'create' | 'update';
export class UpdateGuard {
  model: ModelCtor<any>;
  action: UpdateAction;
  private associationKeysToBeUpdate: AssociationKeysToBeUpdate;
  private blackList: BlackList;
  private whiteList: WhiteList;

  setAction(action: UpdateAction) {
    this.action = action;
  }

  setModel(model: ModelCtor<any>) {
    this.model = model;
  }

  setAssociationKeysToBeUpdate(associationKeysToBeUpdate: AssociationKeysToBeUpdate) {
    if (this.action == 'create') {
      this.associationKeysToBeUpdate = Object.keys(this.model.associations);
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

  /**
   * Sanitize values by whitelist blacklist
   * @param values
   */
  sanitize(values: UpdateValues) {
    values = lodash.clone(values);

    if (!this.model) {
      throw new Error('please set model first');
    }

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

      const filterAssociationToBeUpdate = (value) => {
        const associationKeysToBeUpdate = this.associationKeysToBeUpdate || [];

        if (associationKeysToBeUpdate.includes(association)) {
          return value;
        }

        const associationObj = associations[association];

        const associationKeyName =
          associationObj.associationType == 'BelongsTo' || associationObj.associationType == 'HasOne'
            ? (<any>associationObj).targetKey
            : associationObj.target.primaryKeyAttribute;

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
          if (typeof value == 'string' || typeof value == 'number') {
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

  static fromOptions(model, options) {
    const guard = new UpdateGuard();
    guard.setModel(model);
    guard.setWhiteList(options.whitelist);
    guard.setBlackList(options.blacklist);
    guard.setAction(lodash.get(options, 'action', 'update'));
    guard.setAssociationKeysToBeUpdate(options.updateAssociationValues);
    return guard;
  }
}
