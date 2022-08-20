import { merge } from '@nocobase/utils';
import _ from 'lodash';
import { Utils } from 'sequelize';
import Database from './database';
import { Model } from './model';
const Dottie = require('dottie');

export class MagicAttributeModel extends Model {
  get magicAttribute() {
    const db: Database = (<any>this.constructor).database;
    const collection = db.getCollection(this.constructor.name);
    return collection.options.magicAttribute || 'options';
  }

  set(key: any, value?: any, options?: any) {
    if (typeof key === 'string') {
      const [column] = key.split('.');
      if ((this.constructor as any).hasAlias(column)) {
        return this.setV1(key, value, options);
      }
      if ((this.constructor as any).rawAttributes[column]) {
        return this.setV1(key, value, options);
      }
      if (_.isPlainObject(value)) {
        const opts = super.get(this.magicAttribute) || {};
        return this.setV1(`${this.magicAttribute}.${key}`, merge(opts?.[key], value), options);
      }
      return this.setV1(`${this.magicAttribute}.${key}`, value, options);
    } else {
      if (!key) {
        return;
      }
      Object.keys(key).forEach((k) => {
        this.setV1(k, key[k], options);
      });
    }
    return this.setV1(key, value, options);
  }

  setV1(key?: any, value?: any, options?: any) {
    let values;
    let originalValue;

    if (typeof key === 'object' && key !== null) {
      values = key;
      options = value || {};

      if (options.reset) {
        // @ts-ignore
        this.dataValues = {};
        for (const key in values) {
          this.changed<any>(key, false);
        }
      }

      // If raw, and we're not dealing with includes or special attributes, just set it straight on the dataValues object
      // @ts-ignore
      if (
        options.raw &&
        // @ts-ignore
        !(this._options && this._options.include) &&
        !(options && options.attributes) &&
        // @ts-ignore
        !this.constructor._hasDateAttributes &&
        // @ts-ignore
        !this.constructor._hasBooleanAttributes
      ) {
        // @ts-ignore
        if (Object.keys(this.dataValues).length) {
          // @ts-ignore
          Object.assign(this.dataValues, values);
        } else {
          // @ts-ignore
          this.dataValues = values;
        }
        // If raw, .changed() shouldn't be true
        // @ts-ignore
        this._previousDataValues = { ...this.dataValues };
      } else {
        // Loop and call set
        if (options.attributes) {
          const setKeys = (data) => {
            for (const k of data) {
              if (values[k] === undefined) {
                continue;
              }
              this.set(k, values[k], options);
            }
          };
          setKeys(options.attributes);
          // @ts-ignore
          if (this.constructor._hasVirtualAttributes) {
            // @ts-ignore
            setKeys(this.constructor._virtualAttributes);
          }
          // @ts-ignore
          if (this._options.includeNames) {
            // @ts-ignore
            setKeys(this._options.includeNames);
          }
        } else {
          for (const key in values) {
            this.set(key, values[key], options);
          }
        }

        if (options.raw) {
          // If raw, .changed() shouldn't be true
          // @ts-ignore
          this._previousDataValues = { ...this.dataValues };
        }
      }
      return this;
    }
    if (!options) options = {};
    if (!options.raw) {
      // @ts-ignore
      originalValue = this.dataValues[key];
    }

    // If not raw, and there's a custom setter
    // @ts-ignore
    if (!options.raw && this._customSetters[key]) {
      // @ts-ignore
      this._customSetters[key].call(this, value, key);
      // custom setter should have changed value, get that changed value
      // TODO: v5 make setters return new value instead of changing internal store
      // @ts-ignore
      const newValue = this.dataValues[key];
      if (!_.isEqual(newValue, originalValue)) {
        // @ts-ignore
        this._previousDataValues[key] = originalValue;
        this.changed(key, true);
      }
    } else {
      // Check if we have included models, and if this key matches the include model names/aliases
      // @ts-ignore
      if (this._options && this._options.include && this._options.includeNames.includes(key)) {
        // Pass it on to the include handler
        // @ts-ignore
        this._setInclude(key, value, options);
        return this;
      }
      // Bunch of stuff we won't do when it's raw
      if (!options.raw) {
        // If attribute is not in model definition, return
        // @ts-ignore
        if (!this._isAttribute(key)) {
          // @ts-ignore
          if (key.includes('.') && this.constructor._jsonAttributes.has(key.split('.')[0])) {
            // @ts-ignore
            const previousNestedValue = Dottie.get(this.dataValues, key);
            if (!_.isEqual(previousNestedValue, value)) {
              // @ts-ignore
              this._previousDataValues = _.cloneDeep(this._previousDataValues);
              // @ts-ignore
              Dottie.set(this.dataValues, key, value);
              this.changed(key.split('.')[0], true);
            }
          }
          return this;
        }

        // If attempting to set primary key and primary key is already defined, return
        // @ts-ignore
        if (this.constructor._hasPrimaryKeys && originalValue && this.constructor._isPrimaryKey(key)) {
          return this;
        }

        // If attempting to set read only attributes, return
        // @ts-ignore
        if (
          !this.isNewRecord &&
          // @ts-ignore
          this.constructor._hasReadOnlyAttributes &&
          // @ts-ignore
          this.constructor._readOnlyAttributes.has(key)
        ) {
          return this;
        }
      }

      // If there's a data type sanitizer
      if (
        !(value instanceof Utils.SequelizeMethod) &&
        // @ts-ignore
        Object.prototype.hasOwnProperty.call(this.constructor._dataTypeSanitizers, key)
      ) {
        // @ts-ignore
        value = this.constructor._dataTypeSanitizers[key].call(this, value, options);
      }

      // Set when the value has changed and not raw
      if (
        !options.raw &&
        // True when sequelize method
        (value instanceof Utils.SequelizeMethod ||
          // Check for data type type comparators
          // @ts-ignore
          (!(value instanceof Utils.SequelizeMethod) &&
            // @ts-ignore
            this.constructor._dataTypeChanges[key] &&
            // @ts-ignore
            this.constructor._dataTypeChanges[key].call(this, value, originalValue, options)) || // Check default
          // @ts-ignore
          (!this.constructor._dataTypeChanges[key] && !_.isEqual(value, originalValue)))
      ) {
        // @ts-ignore
        this._previousDataValues[key] = originalValue;
        this.changed(key, true);
      }

      // set data value
      // @ts-ignore
      this.dataValues[key] = value;
    }
    return this;
  }

  get(key?: any, value?: any): any {
    if (typeof key === 'string') {
      const [column] = key.split('.');
      if ((this.constructor as any).hasAlias(column)) {
        return super.get(key, value);
      }
      if ((this.constructor as any).rawAttributes[column]) {
        return super.get(key, value);
      }
      const options = super.get(this.magicAttribute, value);
      return _.get(options, key);
    }
    const data = super.get(key, value);
    return {
      ..._.omit(data, this.magicAttribute),
      ...data[this.magicAttribute],
    };
  }

  async update(values?: any, options?: any) {
    // @ts-ignore
    this._changed = new Set();
    return super.update(values, options);
  }
}
