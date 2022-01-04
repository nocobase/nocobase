import { CreateOptions, Repository, transactionDecorator, uid } from '@nocobase/database';
import { Model } from 'sequelize';
import { FieldModel } from '../models/field-model';
import lodash from 'lodash';

export class FieldRepository extends Repository {
  @transactionDecorator()
  async create<M extends Model>(options: CreateOptions): Promise<M> {
    const { values, transaction } = options;
    const newValues = {
      name: values.name,
      type: values.type,
      interface: values.interface,
      uiSchema: values.uiSchema,
      options: values,
    };

    if (values.reverseKey) {
      newValues['reverseKey'] = values.reverseKey;
    }

    const metaCollection = this.database.getCollection('collections');

    const collectionModel = await metaCollection.repository.findOne({
      filter: {
        name: values.collectionName,
      },
      transaction,
    });

    const isSubTableField = FieldModel.isSubTableOptions(values);

    // sub table
    if (isSubTableField) {
      // create new collection as subTable
      const subTableCollection = await metaCollection.repository.create({
        values: {
          name: `sub-table${uid()}`,
        },
        transaction,
      });

      // set hasMany relation target attribute
      newValues['options']['target'] = subTableCollection.get('name');
    }

    return await super.create({
      ...options,
      values: {
        ...newValues,
        collectionKey: collectionModel.get('key'),
      },
    });
  }
}
