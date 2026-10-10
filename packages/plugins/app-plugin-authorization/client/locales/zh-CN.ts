import optionMessages from '../../locales/zh-CN.js';
import type { AuthorizationResource } from './en-US.js';

const zhCN: AuthorizationResource = {
  options: optionMessages.options,
  sections: optionMessages.sections,
  permissionSets: {
    builtIn: { root: '系统管理员', member: '成员' },
  },
};

export default zhCN;
