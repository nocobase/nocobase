import Database, { Collection, MagicAttributeModel, SyncOptions, Transactionable } from '@nocobase/database';

interface LoadOptions extends Transactionable {
  // TODO
  skipExist?: boolean;
}

interface MigrateOptions extends SyncOptions, Transactionable {
  isNew?: boolean;
}

export class FieldModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  isAssociationField() {
    return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(this.get('type'));
  }

  async load(loadOptions?: LoadOptions) {
    const { skipExist = false, transaction } = loadOptions || {};
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

    const field = await (async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return collection.setField(name, options);
    })();

    await this.db.emitAsync('field:loaded', {
      fieldKey: this.get('key'),
      transaction,
    });

    return field;
  }

  async syncSortByField(options: Transactionable) {
    const collectionName = this.get('collectionName');
    const collection = this.db.getCollection(collectionName);
    await this.load(options);
    await collection.sync({
      force: false,
      alter: {
        drop: false,
      },
      // @ts-ignore
      transaction: options.transaction,
    });
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
      const collection = this.getFieldCollection();

      if (isNew && collection.model.rawAttributes[this.get('name')] && this.get('unique')) {
        // trick: set unique to false to avoid auto sync unique index
        collection.model.rawAttributes[this.get('name')].unique = false;
      }

      await field.sync(options);

      if (isNew && this.get('unique')) {
        await this.syncUniqueIndex({
          transaction: options.transaction,
        });
      }
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

    return collection.removeFieldFromDb(this.get('name'), {
      transaction: options.transaction,
    });
  }

  async syncUniqueIndex(options: Transactionable) {
    const unique = this.get('unique');
    const collection = this.getFieldCollection();
    const field = collection.getField(this.get('name'));
    const columnName = collection.model.rawAttributes[this.get('name')].field;
    const tableName = collection.model.tableName;

    const queryInterface = this.db.sequelize.getQueryInterface() as any;

    const existsIndexes = await queryInterface.showIndex(collection.getTableNameWithSchema(), {
      transaction: options.transaction,
    });

    const existUniqueIndex = existsIndexes.find((item) => {
      return item.unique && item.fields[0].attribute === columnName && item.fields.length === 1;
    });

    let existsUniqueConstraint;

    const constraintName = `${tableName}_${field.name}_uk`;

    if (existUniqueIndex) {
      const existsUniqueConstraints = await queryInterface.showConstraint(
        collection.getTableNameWithSchema(),
        constraintName,
        {},
      );

      existsUniqueConstraint = existsUniqueConstraints[0];
    }

    if (unique && !existsUniqueConstraint) {
      // @ts-ignore
      await collection.sync({ ...options, force: false, alter: { drop: false } });

      await queryInterface.addConstraint(collection.getTableNameWithSchema(), {
        type: 'unique',
        fields: [columnName],
        name: constraintName,
        transaction: options.transaction,
      });

      this.db.logger.info(`add unique index ${constraintName}`);
    }

    if (!unique && existsUniqueConstraint) {
      await queryInterface.removeConstraint(collection.getTableNameWithSchema(), constraintName, {
        transaction: options.transaction,
      });

      this.db.logger.info(`remove unique index ${constraintName}`);
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

    // overriding field should not sync default value
    if (field.get('overriding')) {
      return;
    }

    const queryInterface = collection.db.sequelize.getQueryInterface();

    await queryInterface.changeColumn(
      collection.getTableNameWithSchema(),
      collection.model.rawAttributes[this.get('name')].field,
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
