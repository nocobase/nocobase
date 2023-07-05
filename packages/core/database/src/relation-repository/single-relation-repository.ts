import lodash from 'lodash';
import { SingleAssociationAccessors, Transaction, Transactionable } from 'sequelize';
import { Model } from '../model';
import { Appends, Except, Fields, Filter, TargetKey, UpdateOptions } from '../repository';
import { updateModelByValues } from '../update-associations';
import { RelationRepository, transaction } from './relation-repository';

export interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
  targetCollection?: string;
}

interface SetOption extends Transactionable {
  tk?: TargetKey;
}

export abstract class SingleRelationRepository extends RelationRepository {
  abstract filterOptions(transaction: Transaction);

  @transaction()
  async remove(options?: Transactionable): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    return await sourceModel[this.accessors().set](null, {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | SetOption): Promise<void> {
    const transaction = await this.getTransaction(options);
    const handleKey = lodash.isPlainObject(options) ? (<SetOption>options).tk : options;

    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[this.accessors().set](handleKey, {
      transaction,
    });
  }

  async find(options?: SingleRelationFindOption): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const addFilter = await this.filterOptions(await this.getTransaction(options));

    const findOptions = {
      ...options,
      filter: {
        $and: [options.filter || {}, addFilter],
      },
    };

    return await targetRepository.findOne(findOptions);
  }

  async findOne(options?: SingleRelationFindOption): Promise<Model<any>> {
    return this.find({ ...options, filterByTk: null } as any);
  }

  @transaction()
  async destroy(options?: Transactionable): Promise<boolean> {
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

    if (!target) {
      throw new Error('The record does not exist');
    }

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
