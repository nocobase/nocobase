import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

function getChinaDivisionData(key: string) {
  try {
    require.resolve(`../china-division/${key}.json`);
    return require(`../china-division/${key}.json`);
  } catch (error) {
    return require(`china-division/dist/${key}.json`);
  }
}

export class PluginChinaRegion extends Plugin {
  async install() {
    await this.importData();
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));

    this.app.acl.allow('chinaRegions', 'list', 'loggedIn');

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action.params;

      if (resourceName == 'chinaRegions' && actionName !== 'list') {
        ctx.throw(404, 'Not Found');
      } else {
        await next();
      }
    });
  }

  async importData() {
    const areas = getChinaDivisionData('areas');
    const cities = getChinaDivisionData('cities');
    const provinces = getChinaDivisionData('provinces');

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
}

export default PluginChinaRegion;
