import moment from 'moment';

export async function _(field, row, ctx, column?: any) {
  if (column?.dataIndex.length > 1) {
    return column.dataIndex.reduce((result, col) => {
      return result?.[col.name];
    }, row);
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

export async function boolean(field, row, ctx) {
  const value = row.get(field.name);
  // TODO(feature): i18n
  return value ? '是' : '否';
}

export async function select(field, row, ctx) {
  const value = row.get(field.name);
  const repository = ctx.db.getCollection('uiSchemas').repository;
  const { schema } = await repository.findById(field.options.uiSchemaUid);
  const option = schema.enum.find((item) => item.value === value);
  return option?.label;
}

export async function multipleSelect(field, row, ctx) {
  const values = row.get(field.name);
  const repository = ctx.db.getCollection('uiSchemas').repository;
  const { schema } = await repository.findById(field.options.uiSchemaUid);
  return values
    ?.map((value) => {
      const option = schema.enum.find((item) => item.value === value);
      return option?.label;
    })
    ?.join();
}

export const radio = select;

export const checkboxes = multipleSelect;

export async function subTable(field, row, ctx) {
  // TODO: need title field to be defined
  return (row.get(field.name) || []).map((item) => item[field.sourceKey]);
}

export async function linkTo(field, row, ctx, column?: any) {
  return (row.get(field.name) || []).map((item) => {
    return column.dataIndex.reduce((buf, cur) => {
      buf = item[cur.name];
      return buf;
    });
  });
  // return (row.get(field.name) || []).map((item) => item[field.labelField]);
}

export async function attachment(field, row, ctx) {
  return (row.get(field.name) || []).map((item) => item[field.url]).join(' ');
}

export async function chinaRegion(field, row, ctx) {
  const value = row.get(field.name);
  const values = (Array.isArray(value) ? value : [value]).sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.sort - b.sort,
  );
  return values.map((item) => item.name).join('/');
}
