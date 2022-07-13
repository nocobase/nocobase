import moment from 'moment';

export async function _(field, row, ctx, column?: any) {
  if (column?.dataIndex.length > 1) {
    const result = column.dataIndex.reduce((result, col) => {
      if (Array.isArray(result)) {
        const subResults = [];
        for (const r of result) {
          subResults.push(r?.[col]);
        }
        return subResults;
      } else {
        if (Array.isArray(result?.[col])) {
          const subResults = [];
          for (const r of result?.[col]) {
            subResults.push(r);
          }
          return subResults;
        } else {
          return result?.[col];
        }
      }
    }, row);
    if (Array.isArray(result)) {
      return result.join(',');
    } else {
      return result;
    }
  } else {
    return row.get(field.name);
  }
}

export async function datetime(field, row, ctx) {
  const value = row.get(field.name);
  return moment(value).format(field.showTime ? `${field.dateFormat} ${field.timeFormat}` : field.dateFormat);
}

export async function percent(field, row, ctx) {
  const value = row.get(field.name);
  return value && `${value}%`;
}

export async function boolean(field, row, ctx, column?: any) {
  const value = row.get(field.name);
  let { enum: enumData } = column ?? {};
  if (enumData?.length > 0) {
    const option = enumData.find((item) => item.value === value);
    return option?.label;
  } else {
    // FIXME: i18n
    return value ? '是' : value === null || value === undefined ? '' : '否';
  }
}

export const checkbox = boolean;

export async function select(field, row, ctx, column?: any) {
  const value = row.get(field.name);
  let { enum: enumData } = column ?? {};
  if (!enumData) {
    const repository = ctx.db.getCollection('uiSchemas').repository;
    const model = await repository.findById(field.options.uiSchemaUid);
    enumData = model.get('enum');
  }
  const option = enumData.find((item) => item.value === value);
  return option?.label;
}

export async function multipleSelect(field, row, ctx, column?: any) {
  const values = row.get(field.name);
  let { enum: enumData } = column ?? {};
  if (!enumData) {
    const repository = ctx.db.getCollection('uiSchemas').repository;
    const model = await repository.findById(field.options.uiSchemaUid);
    enumData = model.get('enum');
  }
  return values
    ?.map((value) => {
      const option = enumData.find((item) => item.value === value);
      return option?.label;
    })
    ?.join();
}

export const radio = select;

export const radioGroup = select;

export const checkboxes = multipleSelect;

export const checkboxGroup = multipleSelect;

export async function subTable(field, row, ctx) {
  // TODO: need title field to be defined
  return (row.get(field.name) || []).map((item) => item[field.sourceKey]);
}

export async function linkTo(field, row, ctx, column?: any) {
  return (row.get(field.name) || []).map((item) => {
    return column.dataIndex.reduce((buf, cur) => {
      buf = item[cur];
      return buf;
    });
  });
  // return (row.get(field.name) || []).map((item) => item[field.labelField]);
}

export async function attachment(field, row, ctx) {
  return (row.get(field.name) || []).map((item) => item[field.url]).join(' ');
}

export async function chinaRegion(field, row, ctx, column?: any) {
  const value = row.get(field.name);
  const values = (Array.isArray(value) ? value : [value]).sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.sort - b.sort,
  );
  return values.map((item) => item.name).join('/');
}
