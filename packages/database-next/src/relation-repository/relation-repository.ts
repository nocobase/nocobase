import { Association, Model, ModelCtor } from 'sequelize';
import { OptionsParser } from '../optionsParser';
import { Collection } from '../collection';
import { FindOptions } from '../repository';

export abstract class RelationRepository {
  source: Collection;
  association: Association;
  target: ModelCtor<any>;
  sourceId: string | number;
  sourceModel: Model;

  constructor(
    source: Collection,
    association: string,
    sourceId: string | number,
  ) {
    this.source = source;
    this.sourceId = sourceId;
    this.association = this.source.model.associations[association];

    this.target = this.source.model.associations[association].target;
  }

  async getSourceModel() {
    if (!this.sourceModel) {
      this.sourceModel = await this.source.model.findByPk(this.sourceId);
    }

    return this.sourceModel;
  }

  protected buildQueryOptions(options: FindOptions) {
    const parser = new OptionsParser(this.source, options);
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }
}
