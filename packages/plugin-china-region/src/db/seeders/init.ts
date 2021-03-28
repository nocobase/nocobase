import { provinces, cities, areas, streets, villages } from 'china-division';

export default async function ({ database }) {
  const Model = database.getModel('china_regions');
  // TODO(feature): 可以考虑再加一级大区，编码规则应该是支持的
  // 华北、东北、华东、华南、西南、西北、华中
  const timer = Date.now();

  await Model.bulkCreate(provinces.map(item => ({
    code: item.code,
    name: item.name,
    level: 1
  })));

  await Model.bulkCreate(cities.map(item => ({
    code: item.code,
    name: item.name,
    level: 2,
    parent_code: item.provinceCode
  })));

  await Model.bulkCreate(areas.map(item => ({
    code: item.code,
    name: item.name,
    level: 3,
    parent_code: item.cityCode
  })));

  // // 乡级数据 2856 条
  // await Model.bulkCreate(streets.map(item => ({
  //   code: item.code,
  //   name: item.name,
  //   level: 4,
  //   parent_code: item.areaCode
  // })));

  // // 村级数据 658001 条
  // await Model.bulkCreate(villages.map(item => ({
  //   code: item.code,
  //   name: item.name,
  //   level: 5,
  //   parent_code: item.streetCode
  // })));

  const count = await Model.count();
  console.log(`${count} rows of region data imported in ${(Date.now() - timer) / 1000}s`);
};
