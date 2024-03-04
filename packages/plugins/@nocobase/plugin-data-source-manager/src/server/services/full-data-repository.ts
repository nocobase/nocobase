import { CountOptions, FindOptions } from '@nocobase/database';

export class FullDataRepository<T> {
  data: Array<T> = [];

  constructor(data: Array<T>) {
    this.data = data;
  }

  async count(countOptions?: CountOptions): Promise<number> {
    return this.data.length;
  }

  async find(options?: FindOptions): Promise<Array<T>> {
    const { limit, offset } = options || {};

    let results = this.data;

    // Handle offset
    if (offset) {
      results = results.slice(offset);
    }

    // Handle limit
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async findAndCount(options: {} = {}): Promise<[Array<T>, number]> {
    const count = await this.count();
    const results = count ? await this.find(options) : [];

    return [results, count];
  }
}
