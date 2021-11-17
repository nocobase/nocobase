import { RelationRepository } from './relation-repository';
import { omit } from 'lodash';
import { Op, Sequelize } from 'sequelize';

type FindOptions = any;
type FindAndCountOptions = any;
type FindOneOptions = any;
type CountOptions = any;

export class MultipleRelationRepository extends RelationRepository {
  async find(options?: FindOptions): Promise<any> {
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
        })
      ).map((row) => row.get(this.target.primaryKeyAttribute));

      return await sourceModel[getAccessor]({
        ...omit(findOptions, ['limit', 'offset']),
        where: {
          [this.target.primaryKeyAttribute]: {
            [Op.in]: ids,
          },
        },
      });
    }

    return await sourceModel[getAccessor](findOptions);
  }

  async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]> {
    return [await this.find(options), await this.count(options)];
  }

  async count(options: CountOptions) {
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
    });

    return count.count;
  }

  async findOne(options?: FindOneOptions): Promise<any> {
    const rows = await this.find({ ...options, limit: 1 });
    return rows.length == 1 ? rows[0] : null;
  }
}
