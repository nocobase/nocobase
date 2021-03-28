export function makeOptions(type: string, options: any) {
  if (!options) {
    return;
  }
  let name = type;
  let target = 'users';
  switch (typeof options) {
    case 'string':
      name = options;
      break;
    // 今后支持多账号体系时可以扩展配置
    case 'object':
      name = options.name || name;
      target = options.target || target;
      break;
  }
  return {
    type,
    name,
    target
  };
}

export default async function (table) {
  const { createdBy, updatedBy } = table.getOptions();
  const fieldsToMake = { createdBy, updatedBy };
  Object.keys(fieldsToMake)
    .filter(type => Boolean(fieldsToMake[type]))
    .map(type => table.addField(makeOptions(type, fieldsToMake[type])));
}

// export default async function(model, options) {
//   const { database } = model;
//   const tableName = model.get('name') as string;
//   const table = database.getTable(tableName);
//   const { createdBy, updatedBy } = table.getOptions();
//   const fieldsToMake = { createdBy, updatedBy };
//   const addedFields = Object.keys(fieldsToMake)
//     .filter(type => Boolean(fieldsToMake[type]))
//     .map(type => table.addField(makeOptions(type, fieldsToMake[type])));

//   if (addedFields.length) {
//     await table.sync({
//       force: false,
//       alter: {
//         drop: false,
//       }
//     });
//   }
// }
