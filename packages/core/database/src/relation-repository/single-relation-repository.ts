import lodash from 'lodash';
import { SingleAssociationAccessors, Transactionable } from 'sequelize';
import injectTargetCollection from '../decorators/target-collection-decorator';
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
  abstract filterOptions(sourceModel);

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

    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[this.accessors().set](this.convertTk(options), {
      transaction,
    });
  }

  async find(options?: SingleRelationFindOption): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const sourceModel = await this.getSourceModel(await this.getTransaction(options));

    if (!sourceModel) return null;

    const addFilter = await this.filterOptions(sourceModel);

    const findOptions = {
      ...options,
      filter: {
        $and: [options?.filter || {}, addFilter],
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
  @injectTargetCollection
  async update(options: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
      targetCollection: options.targetCollection,
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
