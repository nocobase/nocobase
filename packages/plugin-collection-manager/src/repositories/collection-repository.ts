import { CreateOptions, FindOptions, Repository, transactionDecorator } from '@nocobase/database';
import { CollectionModel } from '../models/collection-model';
import { Model } from 'sequelize';
import { MetaCollectionOptions } from '../meta-collection-options';
import lodash from 'lodash';

interface LoadOptions extends FindOptions {}

export class CollectionRepository extends Repository {
  @transactionDecorator()
  async create<M extends Model>(options: CreateOptions): Promise<M> {
    const transaction = options.transaction;

    const collectionOptions = new MetaCollectionOptions(options.values);

    const collectionSaveValues = collectionOptions.asCollectionOptions();

    const collectionModel: CollectionModel = (await super.create<CollectionModel>({
      ...options,
      values: collectionSaveValues,
    })) as CollectionModel;

    if (lodash.get(collectionOptions, 'sortable')) {
      await CollectionModel.addField(
        {
          collectionName: collectionModel.getName(),
          name: 'sort',
          type: 'sort',
        },
        this.database,
        transaction,
      );
    }

    const fields = lodash.get(options, 'values.fields');

    if (lodash.isArray(fields)) {
      for (const fieldOption of fields) {
        await CollectionModel.addField(
          {
            collectionName: collectionModel.getName(),
            ...fieldOption,
          },
          this.database,
          transaction,
        );
      }
    }

    // @ts-ignore
    return collectionModel;
  }

  async load(options?: LoadOptions) {
    const instances = (await this.find(options)) as CollectionModel[];
    for (const instance of instances) {
      await this.loadCollectionModel(instance);
    }
  }

  async loadCollectionModel(instance: CollectionModel) {
    return instance.load();
  }
}
