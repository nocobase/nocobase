import { str2moment } from '@nocobase/utils';
import * as math from 'mathjs';

export async function _({ value, field }) {
  return value;
}

export async function password({ value, field }) {
  return `${value}`;
}

export async function o2o({ value, column, field, ctx }) {
  const { dataIndex, enum: enumData } = column;
  const repository = ctx.db.getRepository(field.options.target);
  let enumItem = null;
  if (enumData?.length > 0) {
    enumItem = enumData.find((e) => e.label === value);
  }
  const val = await repository.findOne({ filter: { [dataIndex[1]]: enumItem?.value ?? value } });
  return val;
}
export const oho = o2o;
export const obo = o2o;

export async function o2m({ value, column, field, ctx }) {
  let results = [];
  const values = value.split(';').map((val) => val.trim());
  const { dataIndex, enum: enumData } = column;
  const repository = ctx.db.getRepository(field.options.target);
  if (enumData?.length > 0) {
    const enumValues = values.map((val) => {
      const v = enumData.find((e) => e.label === val);
      if (v === undefined) {
        throw new Error(`not found enum value ${val}`);
      }
      return v.value;
    });
    results = await repository.find({ filter: { [dataIndex[1]]: enumValues } });
  } else {
    results = await repository.find({ filter: { [dataIndex[1]]: values } });
  }
  return results;
}

export async function m2o({ value, column, field, ctx }) {
  let results = null;
  const { dataIndex, enum: enumData } = column;
  const repository = ctx.db.getRepository(field.options.target);
  if (enumData?.length > 0) {
    const enumValue = enumData.find((e) => e.label === value?.trim())?.value;
    results = await repository.findOne({ filter: { [dataIndex[1]]: enumValue } });
  } else {
    results = await repository.findOne({ filter: { [dataIndex[1]]: value } });
  }
  return results;
}

export async function m2m({ value, column, field, ctx }) {
  let results = [];
  const values = value.split(';').map((val) => val.trim());
  const { dataIndex, enum: enumData } = column;
  const repository = ctx.db.getRepository(field.options.target);
  if (enumData?.length > 0) {
    const enumValues = values.map((val) => {
      const v = enumData.find((e) => e.label === val);
      if (v === undefined) {
        throw new Error(`not found enum value ${val}`);
      }
      return v.value;
    });
    results = await repository.find({ filter: { [dataIndex[1]]: enumValues } });
  } else {
    results = await repository.find({ filter: { [dataIndex[1]]: values } });
  }
  return results;
}
export async function datetime({ value, field, ctx }) {
  if (!value) {
    return '';
  }
  const utcOffset = ctx.get('X-Timezone');
  const props = field.options?.uiSchema?.['x-component-props'] ?? {};
  const m = str2moment(value, { ...props, utcOffset });
  console.log(m);
  return m.toDate();
}
export const time = datetime;
export async function percent({ value, field }) {
  if (value) {
    const numberValue = Number(value.split('%')[0]);
    return math.round(numberValue / 100, 9);
  }
  return 0;
}
export async function checkbox({ value, column, field, ctx }) {
  return value === '是' ? 1 : null;
}

export const boolean = checkbox;

export async function select({ value, column, field, ctx }) {
  const { enum: enumData } = column;
  const item = enumData.find((item) => item.label === value);
  return item?.value;
}
export const radio = select;

export const radioGroup = select;

export async function multipleSelect({ value, column, field, ctx }) {
  const values = value.split(';');
  const { enum: enumData } = column;
  const results = values.map((val) => enumData.find((item) => item.label === val));
  return results.map((result) => result.value);
}

export const checkboxes = multipleSelect;

export const checkboxGroup = multipleSelect;

export async function chinaRegion({ value, column, field, ctx }) {
  const values = value?.split('/')?.map((val) => val.trim());
  const repository = ctx.db.getRepository('chinaRegions');
  const results = await repository.find({ filter: { name: values } });
  return results;
}
