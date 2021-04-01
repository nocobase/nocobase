import { Model } from '@nocobase/database';
import { provinces, cities, areas, streets, villages } from 'china-division';

export class ChinaRegion extends Model {
  static async importData() {
    const timer = Date.now();

    await this.bulkCreate(provinces.map(item => ({
      code: item.code,
      name: item.name,
      level: 1
    })));

    await this.bulkCreate(cities.map(item => ({
      code: item.code,
      name: item.name,
      level: 2,
      parent_code: item.provinceCode
    })));

    await this.bulkCreate(areas.map(item => ({
      code: item.code,
      name: item.name,
      level: 3,
      parent_code: item.cityCode
    })));

    // // 乡级数据 2856 条
    // await this.bulkCreate(streets.map(item => ({
    //   code: item.code,
    //   name: item.name,
    //   level: 4,
    //   parent_code: item.areaCode
    // })));

    // // 村级数据 658001 条
    // await this.bulkCreate(villages.map(item => ({
    //   code: item.code,
    //   name: item.name,
    //   level: 5,
    //   parent_code: item.streetCode
    // })));

    const count = await this.count();
    console.log(`${count} rows of region data imported in ${(Date.now() - timer) / 1000}s`);
  }
}