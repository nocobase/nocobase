import { BaseColumnFieldOptions, CreateOptions, DataTypes, Field, Model } from '@nocobase/database';

export class SnapshotField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }

  createSnapshot = async (model: Model, { transaction, values }: CreateOptions) => {
    const { name, targetField } = this.options;
    const collectionName = this.collection.name;
    const primaryKey = this.collection.model.primaryKeyAttribute;

    if (!this.collection.hasField(targetField)) {
      return;
    }

    const repository = this.database.getRepository<any>(`${collectionName}.${targetField}`, model.get(primaryKey));
    const appends = (this.options.appends || []).filter((appendName) =>
      this.database.getFieldByPath(`${repository.targetCollection.name}.${appendName}`),
    );

    let data = await repository.find({
      transaction,
      appends,
    });

    if (Array.isArray(data)) {
      data = data.map((i) => i.toJSON());
    } else if (data?.toJSON) {
      data = data.toJSON();
    }

    await model.update(
      {
        [name]: {
          collectionName,
          data,
        },
      },
      { transaction },
    );
  };

  bind() {
    super.bind();
    this.on('afterCreateWithAssociations', this.createSnapshot);
  }

  unbind() {
    super.unbind();
    this.off('afterCreateWithAssociations', this.createSnapshot);
  }
}

export interface SnapshotFieldOptions extends BaseColumnFieldOptions {
  type: 'snapshot';
  targetField: string;
  targetCollection?: string;
  appends?: string[];
}
