/**
 * 考虑到 Interface 的参数模板还不固定，暂时先放这里了，便于后续修改
 */
import * as types from './types';
export * as types from './types';

export const options = [
  {
    title: '基本类型',
    children: [
      types.string,
      types.textarea,
      types.phone,
      types.email,
      types.number,
      types.percent,
    ],
  },
  {
    title: '多媒体类型',
    children: [
      types.wysiwyg,
      types.attachment,
    ],
  },
  {
    title: '选择类型',
    children: [
      types.boolean,
      types.select,
      types.multipleSelect,
      types.radio,
      types.checkboxes,
    ],
  },
  {
    title: '日期和时间',
    children: [
      types.datetime,
      types.time,
    ],
  },
  {
    title: '关系类型',
    children: [
      types.subTable,
      types.linkTo,
    ],
  },
  {
    title: '系统信息',
    children: [
      types.createdAt,
      types.createdBy,
      types.updatedAt,
      types.updatedBy,
    ],
  },
  {
    title: '开发者模式',
    children: [
      types.primaryKey,
      types.sort,
      types.password,
      types.json,
    ],
  }
].map(({title, children}) => ({
  label: title,
  children: children.map(child => ({
    label: child.title,
    value: child.options.interface,
  })),
}));

export default options;
