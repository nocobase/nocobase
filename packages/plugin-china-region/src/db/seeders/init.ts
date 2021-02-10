import { provinces, cities, areas, streets, villages } from 'china-division';

export default async function({ database }) {
  const Model = database.getModel('china_regions');
  await database.sequelize.transaction(async transaction => {
    // TODO(feature): 可以考虑再加一级大区，编码规则应该是支持的
    // 华北、东北、华东、华南、西南、西北、华中

    await Model.bulkCreate(provinces.map(item => ({
      code: item.code,
      name: item.name,
      level: 1
    })), { transaction });

    await Model.bulkCreate(cities.map(item => ({
      code: item.code,
      name: item.name,
      level: 2,
      parent_code: item.provinceCode
    })), { transaction });

    await Model.bulkCreate(areas.map(item => ({
      code: item.code,
      name: item.name,
      level: 3,
      parent_code: item.cityCode
    })), { transaction });

    await Model.bulkCreate(streets.map(item => ({
      code: item.code,
      name: item.name,
      level: 4,
      parent_code: item.areaCode
    })), { transaction });

    await Model.bulkCreate(villages.filter(item => item.code.startsWith('13')).map(item => ({
      code: item.code,
      name: item.name,
      level: 5,
      parent_code: item.streetCode
    })), { transaction });

    const count = await Model.count({ transaction });
    console.log(`${count} rows of region data imported`);
  });
};
