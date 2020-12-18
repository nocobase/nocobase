/**
 * 考虑到 Interface 的参数模板还不固定，暂时先放这里了，便于后续修改
 */
import * as types from './types';
export * as types from './types';

export const options = [
  {
    key: 'basic',
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
    key: 'media',
    title: '多媒体类型',
    children: [
      types.wysiwyg,
      types.attachment,
    ],
  },
  {
    key: 'choices',
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
    key: 'datetime',
    title: '日期和时间',
    children: [
      types.datetime,
      types.time,
    ],
  },
  {
    key: 'relation',
    title: '关系类型',
    children: [
      types.subTable,
      types.linkTo,
    ],
  },
  {
    key: 'systemInfo',
    title: '系统信息',
    children: [
      types.createdAt,
      types.updatedAt,
      types.createdBy,
      types.updatedBy,
    ],
  },
  {
    key: 'developerMode',
    title: '开发者模式',
    children: [
      types.primaryKey,
      types.sort,
      types.password,
      types.json,
      types.icon,
    ],
  }
].map(({key, title, children}: any) => ({
  key,
  label: title,
  children: children.map(child => ({
    label: child.title,
    value: child.options.interface,
    disabled: child.disabled,
  })),
}));

export default options;
