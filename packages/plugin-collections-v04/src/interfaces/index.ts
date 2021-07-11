/**
 * 考虑到 Interface 的参数模板还不固定，暂时先放这里了，便于后续修改
 */
import * as types from './types';
export * as types from './types';

export const groupLabelMap = {
  basic: '基本类型',
  media: '多媒体类型',
  choices: '选择类型',
  datetime: '日期和时间',
  relation: '关系类型',
  systemInfo: '关系类型',
  developerMode: '开发者模式',
  others: '其他'
};

export function getOptions() {
  return Object.keys(groupLabelMap).map(key => ({
    key,
    label: groupLabelMap[key],
    children: Object.values(types)
      .filter(type => type['group'] === key)
      .map(type => ({
        label: type.title,
        value: type.options.interface,
        // TODO(draft): 配置信息一并存到数据库方便字段配置时取出参与联动计算
        // properties: type.properties,
        disabled: type['disabled'],
      }))
  }));
}

export type interfaceType = {
  title: string,
  group?: string,
  options: {
    [key: string]: any
  },
  disabled?: boolean
};

// TODO(draft)
// 目前仅在内存中注册，应用启动时需要解决扩展字段读取并注册到内存
export function register(type: interfaceType) {
  types[type.options.interface] = type;
}
