import { DataTypes } from 'sequelize';

import { BaseFieldOptions, Field } from '@nocobase/database';
import evaluators from '@nocobase/evaluators';

export interface FormulaFieldOptions extends BaseFieldOptions {
  type: 'formula',
  engine: string;
  expression: string;
}

const DataTypeMap = {
  boolean: {
    type: DataTypes.BOOLEAN,
    transformers: Boolean
  },
  integer: {
    type: DataTypes.INTEGER,
    transformers: {
      boolean(value: boolean) {
        return Number(value);
      },
      number(value: number) {
        return value >= 0 ? Math.floor(value) : Math.ceil(value);
      },
      bigint(value: bigint) {
        return Number(value);
      },
      string(value: string) {
        const result = Number.parseInt(value, 10);
        if (Number.isNaN(result) || !Number.isFinite(result)) {
          return null;
        }
        return result;
      },
      date(value: Date) {
        const result = value.valueOf();
        if (Number.isNaN(result)) {
          return null;
        }
        return result;
      }
    }
  },
  bigInt: {
    type: DataTypes.BIGINT,
    transformers: {
      boolean(value: boolean) {
        return Number(value);
      },
      number(value: number) {
        return Math.floor(value >= 0 ? Math.floor(value) : Math.ceil(value));
      },
      bigint(value: bigint) {
        return Number(value);
      },
      string(value: string) {
        const result = Number.parseInt(value, 10);
        if (Number.isNaN(result) || !Number.isFinite(result)) {
          return null;
        }
        return result;
      },
      date(value: Date) {
        const result = value.valueOf();
        if (Number.isNaN(result)) {
          return null;
        }
        return result;
      }
    }
  },
  double: {
    type: DataTypes.DOUBLE,
    transformers: {
      boolean(value: boolean) {
        return Number(value);
      },
      number(value: number) {
        return value;
      },
      bigint(value: bigint) {
        return Number(value);
      },
      string(value: string) {
        const result = Number.parseFloat(value);
        if (Number.isNaN(result) || !Number.isFinite(result)) {
          return null;
        }
        return result;
      },
      date(value: Date) {
        const result = value.valueOf();
        if (Number.isNaN(result)) {
          return null;
        }
        return result;
      }
    }
  },
  decimal: {
    type: DataTypes.DECIMAL,
    transformers: {
      boolean(value: boolean) {
        return Number(value);
      },
      number(value: number) {
        return value;
      },
      bigint(value: bigint) {
        return value;
      },
      date(value: Date) {
        const result = value.valueOf();
        if (Number.isNaN(result)) {
          return null;
        }
        return result;
      }
    }
  },
  string: {
    type: DataTypes.STRING,
    transformers: {
      boolean(value: boolean) {
        return value.toString();
      },
      number(value: number) {
        return value.toString();
      },
      bigint(value: bigint) {
        return value.toString();
      },
      string(value: string) {
        return value;
      },
      date(value: Date) {
        return value.toISOString();
      }
    }
  },
  date: {
    type: DataTypes.DATE(3),
    transformers: {
      boolean(value: boolean) {
        return null;
      },
      number(value: number) {
        const result = new Date(value);
        if (Number.isNaN(result.valueOf())) {
          return null;
        }
        return result;
      },
      bigint(value: bigint) {
        const result = new Date(Number(value));
        if (Number.isNaN(result.valueOf())) {
          return null;
        }
        return result;
      },
      string(value: string) {
        const ts = Date.parse(value);
        if (Number.isNaN(ts)) {
          return null;
        }
        return new Date(ts);
      },
      date(value: Date) {
        return new Date(value);
      }
    }
  },
}



function toDbType(value, type) {
  if (value == null) {
    return null;
  }

  let jsType: string = typeof value;
  if (jsType == 'object' && value instanceof Date) {
    jsType = 'date';
  }

  if (!DataTypeMap[type]) {
    return null;
  }

  const { transformers } = DataTypeMap[type];

  if (typeof transformers === 'function') {
    return transformers(value);
  }

  const transformer = transformers[jsType];
  return transformer ? transformer(value) : null;
}

export class FormulaField extends Field {
  get dataType() {
    const { dataType } = this.options;
    return DataTypeMap[dataType]?.type ?? DataTypes.DOUBLE;
  }

  calculate(scope) {
    const { expression, engine = 'math.js', dataType = 'double' } = this.options;
    const evaluate = evaluators.get(engine);
    try {
      const result = evaluate(expression, scope);
      return toDbType(result, dataType);
    } catch (e){
      console.error(e);
    }
    return null;
  }

  initFieldData = async ({ transaction }) => {
    const { name } = this.options;

    const records = await this.collection.repository.find({
      order: [this.collection.model.primaryKeyAttribute],
      transaction,
    });

    for (const record of records) {
      const scope = record.toJSON();
      const result = this.calculate(scope);
      if (result != null) {
        await record.update(
          {
            [name]: result,
          },
          {
            transaction,
            silent: true,
            hooks: false,
          },
        );
      }
    }
  };

  calculateField = async (instance) => {
    const { name } = this.options;
    const result = this.calculate(instance.toJSON());
    instance.set(name, result);
  };

  updateFieldData = async (instance, { transaction }) => {
    if (this.collection.name === instance.collectionName && instance.name === this.options.name) {
      this.options = Object.assign(this.options, instance.options);
      const { name } = this.options;

      const records = await this.collection.repository.find({
        order: [this.collection.model.primaryKeyAttribute],
        transaction,
      });

      for (const record of records) {
        const scope = record.toJSON();
        const result = this.calculate(scope);
        await record.update(
          {
            [name]: result,
          },
          {
            transaction,
            silent: true,
            hooks: false,
          },
        );
      }
    }
  };

  bind() {
    super.bind();
    this.on('afterSync', this.initFieldData);
    // TODO: should not depends on fields table (which is defined by other plugin)
    this.database.on('fields.afterUpdate', this.updateFieldData);
    this.on('beforeSave', this.calculateField);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.calculateField);
    // TODO: should not depends on fields table
    this.database.off('fields.afterUpdate', this.updateFieldData);
    this.off('afterSync', this.initFieldData);
  }
}
