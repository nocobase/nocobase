import { CreateOptions, Repository } from '../repository';

export class ViewRepository extends Repository {
  async create(options: CreateOptions): Promise<any> {
    console.log('create view repository');
  }
}
