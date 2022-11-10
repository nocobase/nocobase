import Database, { Collection, Field, MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable, UniqueConstraintError } from 'sequelize';

interface LoadOptions extends Transactionable {
  // TODO
  skipExist?: boolean;
}

interface MigrateOptions extends SyncOptions, Transactionable {
  isNew?: boolean;
}

async function migrate(field: Field, options: MigrateOptions): Promise<void> {
  const { unique } = field.options;
  const { model } = field.collection;

  const ukName = `${model.tableName}_${field.name}_uk`;
  const queryInterface = model.sequelize.getQueryInterface();
  const fieldAttribute = model.rawAttributes[field.name];

  // @ts-ignore
  const existedConstraints = (await queryInterface.showConstraint(model.tableName, ukName, {
    transaction: options.transaction,
  })) as any[];

  const constraintBefore = existedConstraints.find((item) => item.constraintName === ukName);

  if (typeof fieldAttribute?.unique !== 'undefined') {
    if (constraintBefore && !unique) {
      await queryInterface.removeConstraint(model.tableName, ukName, { transaction: options.transaction });
    }

    fieldAttribute.unique = Boolean(constraintBefore);
  }

  await field.sync(options);

  if (!constraintBefore && unique) {
    await queryInterface.addConstraint(model.tableName, {
      type: 'unique',
      fields: [field.name],
      name: ukName,
      transaction: options.transaction,
    });
  }

  if (typeof fieldAttribute?.unique !== 'undefined') {
    fieldAttribute.unique = unique;
  }

  // @ts-ignore
  const updatedConstraints = (await queryInterface.showConstraint(model.tableName, ukName, {
    transaction: options.transaction,
  })) as any[];

  const indexAfter = updatedConstraints.find((item) => item.constraintName === ukName);

  if (unique && !indexAfter) {
    throw new UniqueConstraintError({
      fields: { [field.name]: undefined },
    });
  }
}

export class FieldModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  async load(loadOptions?: LoadOptions) {
    const { skipExist = false } = loadOptions || {};
    const collectionName = this.get('collectionName');
    if (!this.db.hasCollection(collectionName)) {
      return;
    }

    const collection = this.db.getCollection(collectionName);
    const name = this.get('name');
    if (skipExist && collection.hasField(name)) {
      return collection.getField(name);
    }

    const options = this.get();

    if (options.uiSchemaUid) {
      const UISchema = this.db.getModel('uiSchemas');
      const uiSchema = await UISchema.findByPk(options.uiSchemaUid, {
        transaction: loadOptions.transaction,
      });
      Object.assign(options, { uiSchema: uiSchema.get() });
    }

    return collection.setField(name, options);
  }

  async migrate({ isNew, ...options }: MigrateOptions = {}) {
    let field;
    try {
      field = await this.load({
        transaction: options.transaction,
      });
      if (!field) {
        return;
      }
      await migrate(field, options);
    } catch (error) {
      // field sync failed, delete from memory
      if (isNew && field) {
        // update field should not remove field from memory
        field.remove();
      }
      throw error;
    }
  }

  async remove(options?: any) {
    const collection = this.getFieldCollection();
    if (!collection) {
      return;
    }

    const field = collection.getField(this.get('name'));
    if (!field) {
      return;
    }
    return field.removeFromDb({
      transaction: options.transaction,
    });
  }

  async syncDefaultValue(
    options: Transactionable & {
      defaultValue: any;
    },
  ) {
    const collection = this.getFieldCollection();

    if (!collection) {
      return;
    }

    const field = collection.getField(this.get('name'));

    const queryInterface = collection.db.sequelize.getQueryInterface();

    await queryInterface.changeColumn(
      collection.model.tableName,
      this.get('name'),
      {
        type: field.dataType,
        defaultValue: options.defaultValue,
      },
      {
        transaction: options.transaction,
      },
    );
  }

  async syncReferenceCheckOption(options: Transactionable) {
    const reverseKey = this.get('reverseKey');
    if (!reverseKey) return;

    const reverseField = await this.db.getCollection('fields').repository.findOne({
      filterByTk: reverseKey,
      transaction: options.transaction,
    });

    if (!reverseField) return;
    reverseField.set('onDelete', this.get('onDelete'));
    await reverseField.save({ hooks: false, transaction: options.transaction });
  }

  protected getFieldCollection(): Collection | null {
    const collectionName = this.get('collectionName');

    if (!this.db.hasCollection(collectionName)) {
      return;
    }

    return this.db.getCollection(collectionName);
  }
}
