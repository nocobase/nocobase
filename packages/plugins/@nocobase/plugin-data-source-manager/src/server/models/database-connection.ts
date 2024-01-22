import Database, { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { DatabaseIntrospector, LocalData } from '../services/database-introspector';

interface LoadIntoApplicationOptions {
  app: Application;
}
export class DatabaseConnectionModel extends MagicAttributeModel {
  getRemoteDatabaseInstance(): Database {
    return new Database({
      ...this.toJSON(),
    });
  }

  async checkConnection() {
    const remoteDB = this.getRemoteDatabaseInstance();
    try {
      await remoteDB.sequelize.authenticate();
    } catch (error) {
      throw new Error(`Unable to connect to the remote database: ${error.message}`);
    } finally {
      await remoteDB.close();
    }
  }

  async loadIntoApplication(options: LoadIntoApplicationOptions) {
    const { app } = options;

    // set remote database instance
    const dbInstance = this.getRemoteDatabaseInstance();
    this.extendDatabaseInstanceByMainDatabase(dbInstance, app.db);
    app.setDb(dbInstance, this.get('name'));

    // load local data
    const localData = await this.loadLocalData();

    // load remote collections
    const introspection = new DatabaseIntrospector(dbInstance);
    const collections = await introspection.getCollections({
      localData,
    });

    introspection.loadCollections({ collections });

    // set a new acl instance
    const acl = app.createNewACL(this.get('name'));

    acl.allow('*', '*', (ctx) => {
      return ctx.state.currentRole === 'root';
    });
  }

  private extendDatabaseInstanceByMainDatabase(db: Database, mainDb: Database) {
    const fieldTypes = mainDb.fieldTypes;
    for (const fieldName of mainDb.fieldTypes.keys()) {
      if (!db.fieldTypes.has(fieldName)) {
        db.fieldTypes.set(fieldName, fieldTypes.get(fieldName));
      }
    }

    for (const model of mainDb.models.keys()) {
      if (!db.models.has(model)) {
        db.models.set(model, mainDb.models.get(model));
      }
    }
  }

  private async loadLocalData(): Promise<LocalData> {
    const connectionName = this.get('name');

    const remoteCollections = await this.db.getRepository('remoteCollections').find({
      filter: {
        connectionName,
      },
    });

    const remoteFields = await this.db.getRepository('remoteFields').find({
      filter: {
        connectionName,
      },
    });

    const localData = {};
    for (const remoteCollection of remoteCollections) {
      const remoteCollectionOptions = remoteCollection.toJSON();
      localData[remoteCollectionOptions.name] = remoteCollectionOptions;
    }

    for (const remoteField of remoteFields) {
      const remoteFieldOptions = remoteField.toJSON();
      const collectionName = remoteFieldOptions.collectionName;

      if (!localData[collectionName]) {
        localData[collectionName] = {
          name: collectionName,
          fields: [],
        };
      }

      if (!localData[collectionName].fields) {
        localData[collectionName].fields = [];
      }

      localData[collectionName].fields.push(remoteFieldOptions);
    }

    return localData;
  }
}
