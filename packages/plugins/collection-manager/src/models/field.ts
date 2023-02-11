import Database, { Collection, Field, MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable, UniqueConstraintError } from 'sequelize';

interface LoadOptions extends Transactionable {
  // TODO
  skipExist?: boolean;
}

interface MigrateOptions extends SyncOptions, Transactionable {
  isNew?: boolean;
}

async function migrate(field: Field, options: MigrateOptions): Promise<void> {}

export class FieldModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  isAssociationField() {
    return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(this.get('type'));
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

  async syncUniqueIndex(options: Transactionable) {
    const unique = this.get('unique');
    const collection = this.getFieldCollection();
    const columnName = collection.model.rawAttributes[this.get('name')].field;

    // @ts-ignore
    const existsIndexes: any = await this.db.sequelize.getQueryInterface().showIndex(collection.model.tableName);

    const existUniqueIndex = existsIndexes.find((item) => {
      return item.unique && item.fields[0].attribute === columnName && item.fields.length === 1;
    });

    if (unique && !existUniqueIndex) {
      collection.addIndex({
        fields: [this.get('name')],
        unique: true,
      });

      // @ts-ignore
      await collection.sync(options);
    }

    if (!unique && existUniqueIndex) {
      await this.db.sequelize.getQueryInterface().removeIndex(collection.model.tableName, existUniqueIndex.name);
    }
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
