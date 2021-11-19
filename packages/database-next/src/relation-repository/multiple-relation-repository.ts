import { RelationRepository } from './relation-repository';
import { omit } from 'lodash';
import { MultiAssociationAccessors, Op, Sequelize } from 'sequelize';
import { UpdateGuard } from '../update-guard';
import { updateModelByValues } from '../update-associations';
import { TransactionAble } from '../repository';

type FindOptions = any;
type FindAndCountOptions = any;
type FindOneOptions = any;
type CountOptions = any;
type primaryKey = string | number;

export interface UpdateOptions extends TransactionAble {
  values: { [key: string]: any };
  filter?: any;
  filterByPk?: number | string;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}

export abstract class MultipleRelationRepository extends RelationRepository {
  async find(options?: FindOptions): Promise<any> {
    const transaction = options?.transaction;

    const findOptions = this.buildQueryOptions({
      ...options,
    });

    const getAccessor = this.accessors().get;
    const sourceModel = await this.getSourceModel();

    if (findOptions.include && findOptions.include.length > 0) {
      const ids = (
        await sourceModel[getAccessor]({
          ...findOptions,
          includeIgnoreAttributes: false,
          attributes: [this.target.primaryKeyAttribute],
          group: `${this.target.name}.${this.target.primaryKeyAttribute}`,
          transaction,
        })
      ).map((row) => row.get(this.target.primaryKeyAttribute));

      return await sourceModel[getAccessor]({
        ...omit(findOptions, ['limit', 'offset']),
        where: {
          [this.target.primaryKeyAttribute]: {
            [Op.in]: ids,
          },
        },
        transaction,
      });
    }

    return await sourceModel[getAccessor]({
      ...findOptions,
      transaction,
    });
  }

  async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]> {
    return [await this.find(options), await this.count(options)];
  }

  async count(options: CountOptions) {
    const transaction = options?.transaction;

    const sourceModel = await this.getSourceModel();
    const queryOptions = this.buildQueryOptions(options);

    const count = await sourceModel[this.accessors().get]({
      where: queryOptions.where,
      include: queryOptions.include,
      includeIgnoreAttributes: false,
      attributes: [
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.fn(
              'DISTINCT',
              Sequelize.col(
                `${this.target.name}.${this.target.primaryKeyAttribute}`,
              ),
            ),
          ),
          'count',
        ],
      ],
      raw: true,
      plain: true,
      transaction,
    });

    return count.count;
  }

  async findOne(options?: FindOneOptions): Promise<any> {
    const rows = await this.find({ ...options, limit: 1 });
    return rows.length == 1 ? rows[0] : null;
  }

  async remove(primaryKey: primaryKey | primaryKey[]): Promise<void> {
    if (!Array.isArray(primaryKey)) {
      primaryKey = [primaryKey];
    }

    const sourceModel = await this.getSourceModel();
    await sourceModel[this.accessors().removeMultiple](primaryKey);
    return;
  }

  async update(options?: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.target, options);

    const values = guard.sanitize(options.values);

    const queryOptions = this.buildQueryOptions(options);

    const instances = await this.find(queryOptions);

    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        sanitized: true,
        sourceModel: this.sourceModel,
        transaction,
      });
    }

    return true;
  }

  protected accessors() {
    return <MultiAssociationAccessors>super.accessors();
  }
}
