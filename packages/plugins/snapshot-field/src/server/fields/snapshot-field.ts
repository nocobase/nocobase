import { Field, BaseColumnFieldOptions, Model, CreateOptions } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import isObject from 'lodash/isObject';

export class SnapshotField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }

  afterCreateWithAssociations = async (model: Model, options: CreateOptions) => {
    const { transaction, values } = options;

    const { collection: resourceCollection, database } = this.context;

    const fields = resourceCollection.fields;
    const snapshotFields: Field[] = [];
    for (let [, field] of fields) {
      if (field.options.type === 'snapshot') snapshotFields.push(field);
    }
    const snapshotFieldsData = {};
    for (let field of snapshotFields) {
      const { targetField: targetFieldName, appends, name: snapshotFieldName } = field.options;
      const targetField = resourceCollection.getField(targetFieldName);
      const { target: targetFieldCollectionName, targetKey, sourceKey } = targetField.options;
      const targetFieldTargetKey = targetKey ?? sourceKey;
      const targetFieldRepository = database.getRepository(targetFieldCollectionName);
      const paramValue = values?.[targetFieldName];

      if (!paramValue) continue;

      let filterValues;

      if (Array.isArray(paramValue)) {
        filterValues = paramValue.map((i) => i[targetFieldTargetKey]);
      } else if (isObject(paramValue)) {
        filterValues = paramValue[targetFieldTargetKey];
      } else {
        filterValues = paramValue;
      }

      const res: Model[] = await targetFieldRepository.find({
        filter: {
          [targetFieldTargetKey]: filterValues,
        },
        appends,
        transaction,
      });

      snapshotFieldsData[snapshotFieldName] = {
        collectionName: targetFieldCollectionName,
        data: res.map((r) => r.toJSON()),
      };
    }

    console.log(values, model.toJSON());

    await model.update(
      {
        ...snapshotFieldsData,
      },
      {
        transaction,
      },
    );
  };

  bind() {
    super.bind();
    this.on('afterCreateWithAssociations', this.afterCreateWithAssociations);
  }
}

export interface SnapshotFieldOptions extends BaseColumnFieldOptions {
  type: 'snapshot';
}
