import { Plugin } from '@nocobase/server';
import { areas, cities, provinces } from 'china-division';
import { resolve } from 'path';

export class PluginChinaRegion extends Plugin {
  async install() {
    await this.importData();
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
    this.app.acl.allow('chinaRegions', 'list', 'loggedIn');
  }

  async importData() {
    const timer = Date.now();
    const ChinaRegion = this.db.getModel('chinaRegions');

    await ChinaRegion.bulkCreate(
      provinces.map((item) => ({
        code: item.code,
        name: item.name,
        level: 1,
      })),
    );

    await ChinaRegion.bulkCreate(
      cities.map((item) => ({
        code: item.code,
        name: item.name,
        level: 2,
        parentCode: item.provinceCode,
      })),
    );

    await ChinaRegion.bulkCreate(
      areas.map((item) => ({
        code: item.code,
        name: item.name,
        level: 3,
        parentCode: item.cityCode,
      })),
    );

    // // 乡级数据 2856 条
    // await ChinaRegion.bulkCreate(streets.map(item => ({
    //   code: item.code,
    //   name: item.name,
    //   level: 4,
    //   parentCode: item.areaCode
    // })));

    // // 村级数据 658001 条
    // await ChinaRegion.bulkCreate(villages.map(item => ({
    //   code: item.code,
    //   name: item.name,
    //   level: 5,
    //   parentCode: item.streetCode
    // })));

    const count = await ChinaRegion.count();
    // console.log(`${count} rows of region data imported in ${(Date.now() - timer) / 1000}s`);
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default PluginChinaRegion;
