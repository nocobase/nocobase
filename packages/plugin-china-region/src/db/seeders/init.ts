import { provinces, cities, areas, streets } from 'china-division';

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

    // 乡级数据 2856 条
    await Model.bulkCreate(streets.map(item => ({
      code: item.code,
      name: item.name,
      level: 4,
      parent_code: item.areaCode
    })), { transaction });

    // TODO(optimize): 暂时抛弃很少使用但占空间比较大（658001 条）村级数据
    // 平均导入每 10000 条时间 20s 左右
    // const AMOUNT_PER_BATCH = 10000;
    // const batch = Math.ceil(villages.length / AMOUNT_PER_BATCH);
    // const villageGroups = [];
    // for (let i = 0; i < batch; i++) {
    //   villageGroups.push(villages.slice(i * AMOUNT_PER_BATCH, (i + 1) * AMOUNT_PER_BATCH));
    // }
    // for (const group of villageGroups) {
    //   const timer = Date.now();
    //   await Model.bulkCreate(group.map(item => ({
    //     code: item.code,
    //     name: item.name,
    //     level: 5,
    //     parent_code: item.streetCode
    //   })), { transaction });
    //   console.log(`${group.length} villages imported in ${(Date.now() - timer) / 1000}s`);
    // }

    const count = await Model.count({ transaction });
    console.log(`${count} rows of region data imported`);
  });
};
