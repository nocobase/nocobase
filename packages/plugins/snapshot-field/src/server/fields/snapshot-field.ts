import { Field, BaseColumnFieldOptions, Model, CreateOptions, Repository } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import isObject from 'lodash/isObject';

export class SnapshotField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }

  afterCreateWithAssociations = async (model: Model, { transaction, values }: CreateOptions) => {
    const snapshotOwnerCollectionName = this.collection.name;
    const { targetField: targetFieldName, name: snapshotFieldName, appends } = this.options;
    const primaryKey = this.collection.model.primaryKeyAttribute;
    const targetField = this.collection.getField(targetFieldName);
    const { target: targetFieldCollectionName } = targetField.options;

    const repository: Repository = this.database.getRepository<any>(
      `${snapshotOwnerCollectionName}.${targetFieldName}`,
      model.get(primaryKey),
    );

    let res: Model[] | Model;

    try {
      res = await repository.find({
        transaction,
        appends,
      });
    } catch (err) {
      // when appends failed
      res = [];
    }

    const snapshotData = {
      collectionName: targetFieldCollectionName,
      data: Array.isArray(res) ? res.map((r) => r.toJSON()) : res,
    };

    await model.update(
      {
        [snapshotFieldName]: snapshotData,
      },
      {
        transaction,
        hooks: false,
      },
    );
  };

  bind() {
    super.bind();
    this.on('afterCreateWithAssociations', this.afterCreateWithAssociations);
  }

  unbind() {
    super.unbind();
    this.off('afterCreateWithAssociations', this.afterCreateWithAssociations);
  }
}

export interface SnapshotFieldOptions extends BaseColumnFieldOptions {
  type: 'snapshot';
}
