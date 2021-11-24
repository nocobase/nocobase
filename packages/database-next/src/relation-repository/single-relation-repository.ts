import { RelationRepository, transaction } from './relation-repository';
import { Model, SingleAssociationAccessors } from 'sequelize';
import { updateModelByValues } from '../update-associations';
import lodash from 'lodash';
import {
  Appends,
  Except,
  Fields,
  PrimaryKey,
  TransactionAble,
  UpdateOptions,
} from '../repository';

interface SingleRelationFindOption extends TransactionAble {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
}

interface SetOption extends TransactionAble {
  pk?: PrimaryKey;
}

export abstract class SingleRelationRepository extends RelationRepository {
  @transaction()
  async remove(options?: TransactionAble): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    return await sourceModel[this.accessors().set](null, {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      pk: args[0],
      transaction,
    };
  })
  async set(options: PrimaryKey | SetOption): Promise<void> {
    const transaction = await this.getTransaction(options);
    let handleKey = lodash.isPlainObject(options)
      ? (<SetOption>options).pk
      : options;

    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[this.accessors().set](handleKey, {
      transaction,
    });
  }

  async find(options?: SingleRelationFindOption): Promise<Model<any>> {
    const transaction = await this.getTransaction(options);
    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[getAccessor]({
      ...findOptions,
      transaction,
    });
  }

  @transaction()
  async destroy(options?: TransactionAble): Promise<Boolean> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
    });

    await target.destroy({
      transaction,
    });

    return true;
  }

  @transaction()
  async update(options: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
    });

    await updateModelByValues(target, options?.values, {
      ...lodash.omit(options, 'values'),
      transaction,
    });

    return target;
  }

  accessors() {
    return <SingleAssociationAccessors>super.accessors();
  }
}
