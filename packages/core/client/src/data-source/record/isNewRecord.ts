import { isObject } from 'lodash';

// 使用 Symbol 作为 key，避免与其他属性冲突，同时也可以防止通过表单提交到后端
const key = Symbol('isNewRecord');

/**
 * 判断一个记录对象是否是新记录，可通过 markRecordAsNew 标记
 * @param record
 * @returns
 */
export const isNewRecord = (record: object) => {
  return !!record?.[key];
};

/**
 * 将一个记录对象标记为新记录，可通过 isNewRecord 判断
 * @param record
 * @returns
 */
export const markRecordAsNew = (record: object) => {
  if (!isObject(record)) throw new Error('markRecordAsNew: record must be an object');

  record[key] = true;
  return record;
};
