import { ModelCtor, Model } from 'sequelize';

export interface IRepository {

}

export class Repository implements IRepository {
  model: ModelCtor<Model>;

  constructor(model: ModelCtor<Model>) {
    this.model = model;
  }

  findAll() {}

  findOne() {}

  create() {}

  update() {}

  destroy() {}
}
