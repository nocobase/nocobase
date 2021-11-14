import { flatten } from 'flat';
import lodash, { keys } from 'lodash';

import { Collection } from './collection';
import { Model, ModelCtor } from 'sequelize';
import { modelAssociations } from './update-associations';
import { type } from 'os';

type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

type UpdateValueItem = string | number | UpdateValues;

type UpdateValues = {
  [key: string]: UpdateValueItem | Array<UpdateValueItem>;
};

export class UpdateGuard {
  model: ModelCtor<any>;
  whiteList: WhiteList;
  blackList: BlackList;
  associationKeysToBeUpdate: AssociationKeysToBeUpdate;

  setModel(model: ModelCtor<any>) {
    this.model = model;
  }

  setAssociationKeysToBeUpdate(
    associationKeysToBeUpdate: AssociationKeysToBeUpdate,
  ) {
    this.associationKeysToBeUpdate = associationKeysToBeUpdate;
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
    if (!this.model) {
      throw new Error('please set collection first');
    }

    const associations = this.model.associations;
    const associationsValues = lodash.pick(values, Object.keys(associations));

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

    Object.keys(associationsValues).forEach((association) => {
      let associationValues = associationsValues[association];

      const sanitizeValue = (value) => {
        const associationUpdateGuard = new UpdateGuard();
        associationUpdateGuard.setModel(associations[association].target);

        ['whiteList', 'blackList', 'associationKeysToBeUpdate'].forEach(
          (optionKey) => {
            associationUpdateGuard[`set${lodash.upperFirst(optionKey)}`](
              listOfAssociation(this[optionKey], association),
            );
          },
        );

        return associationUpdateGuard.sanitize(value);
      };

      if (Array.isArray(associationValues)) {
        associationValues = associationValues.map((value) => {
          if (typeof value == 'string' || typeof value == 'number') {
            return value;
          } else {
            return sanitizeValue(value);
          }
        });
      } else if (
        typeof associationValues === 'object' &&
        associationValues !== null
      ) {
        associationValues = sanitizeValue(associationValues);
      }

      values[association] = associationValues;
    });

    let valuesKeys = Object.keys(values);

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

    if (this.blackList) {
      valuesKeys = valuesKeys.filter(
        (valueKey) => !this.blackList.includes(valueKey),
      );
    }

    return valuesKeys.reduce((obj, key) => {
      lodash.set(obj, key, values[key]);
      return obj;
    }, {});
  }

  static factory(collection: Collection) {}
}
