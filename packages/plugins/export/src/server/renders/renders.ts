import moment from 'moment';

export function _(field, row, ctx, column?: any) {
  if (column?.dataIndex.length > 1) {
    return column.dataIndex.reduce((result, col) => {
      return result?.[col];
    }, row);
  } else {
    return row.get(field.name);
  }
}

export function datetime(field, row, ctx) {
  const value = row.get(field.name);
  return moment(value).format(field.showTime ? `${field.dateFormat} ${field.timeFormat}` : field.dateFormat);
}

export function percent(field, row, ctx) {
  const value = row.get(field.name);
  return value && `${value}%`;
}

export function boolean(field, row, ctx) {
  const value = row.get(field.name);
  // TODO(feature): i18n
  return value ? '是' : '否';
}

export function select(field, row, ctx) {
  const value = row.get(field.name);
  const repository = ctx.db.getCollection('uiSchemas').repository;
  const schema = repository.findById(field.options.uiSchemaUid);
  debugger;
  const option = field.dataSource.find((item) => item.value === value);
  return option && option.label;
}

export function multipleSelect(field, row, ctx) {
  const values = row.get(field.name);
  return (
    values &&
    values.map((value) => {
      const option = field.dataSource.find((item) => item.value === value);
      return option && option.label;
    })
  );
}

export const radio = select;

export const checkboxes = multipleSelect;

export function subTable(field, row, ctx) {
  // TODO: need title field to be defined
  return (row.get(field.name) || []).map((item) => item[field.sourceKey]);
}

export function linkTo(field, row, ctx) {
  return (row.get(field.name) || []).map((item) => item[field.labelField]);
}

export function attachment(field, row, ctx) {
  return (row.get(field.name) || []).map((item) => item[field.url]).join(' ');
}

export function chinaRegion(field, row, ctx) {
  const value = row.get(field.name);
  const values = (Array.isArray(value) ? value : [value]).sort((a, b) =>
    a.level !== b.level ? a.level - b.level : a.sort - b.sort,
  );
  return values.map((item) => item.name).join('/');
}
