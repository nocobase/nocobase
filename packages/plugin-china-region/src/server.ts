import path from 'path';
import { provinces, cities, areas, streets, villages } from 'china-division';
import { Plugin } from '@nocobase/server';

async function importData(model) {
  const timer = Date.now();

  await model.bulkCreate(
    provinces.map((item) => ({
      code: item.code,
      name: item.name,
      level: 1,
    })),
  );

  await model.bulkCreate(
    cities.map((item) => ({
      code: item.code,
      name: item.name,
      level: 2,
      parent_code: item.provinceCode,
    })),
  );

  await model.bulkCreate(
    areas.map((item) => ({
      code: item.code,
      name: item.name,
      level: 3,
      parent_code: item.cityCode,
    })),
  );

  // // 乡级数据 2856 条
  // await model.bulkCreate(streets.map(item => ({
  //   code: item.code,
  //   name: item.name,
  //   level: 4,
  //   parent_code: item.areaCode
  // })));

  // // 村级数据 658001 条
  // await model.bulkCreate(villages.map(item => ({
  //   code: item.code,
  //   name: item.name,
  //   level: 5,
  //   parent_code: item.streetCode
  // })));

  const count = await model.count();
  console.log(`${count} rows of region data imported in ${(Date.now() - timer) / 1000}s`);
}

export default class PluginChinaRegion extends Plugin {
  async beforeLoad() {
    this.app.on('installing', async () => {
      const ChinaRegion = this.db.getCollection('china_regions').model;
      await importData(ChinaRegion);
    });
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}
