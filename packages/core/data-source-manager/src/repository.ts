import { IModel, IRepository } from './types';
import * as console from 'console';

export class Repository implements IRepository {
  async create(options) {
    console.log('Repository.create....');
  }
  async update(options) {}
  async find(options?: any): Promise<IModel[]> {
    return [];
  }
  async findOne(options?: any): Promise<IModel> {
    return {};
  }
  async destroy(options) {}

  count(options?: any): Promise<Number> {
    return Promise.resolve(undefined);
  }

  findAndCount(options?: any): Promise<[IModel[], Number]> {
    return Promise.resolve([[], undefined]);
  }
}
