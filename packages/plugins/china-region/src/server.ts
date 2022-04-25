import { Database } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class ChinaRegionPlugin extends Plugin {
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

    const db = new Database({
      dialect: 'sqlite',
      storage: resolve(process.cwd(), 'node_modules/china-division/dist/data.sqlite'),
    });

    const [provinces] = await db.sequelize.query('SELECT `code`, `name` FROM `province`') as any;
    const [cities] = await db.sequelize.query('SELECT `code`, `name`, `provinceCode` FROM `city`') as any;
    const [areas] = await db.sequelize.query('SELECT `code`, `name`, `cityCode` FROM `area`') as any;

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
    console.log(`${count} rows of region data imported in ${(Date.now() - timer) / 1000}s`);
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default ChinaRegionPlugin;
