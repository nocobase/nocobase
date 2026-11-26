import optionMessages from '../../locales/zh-CN.js';
import type { AuthorizationResource } from './en-US.js';
import components from './components-zh-CN.js';
import settings from './settings-zh-CN.js';

const zhCN: AuthorizationResource = {
  ...components,
  settings,
  audit: optionMessages.audit,
  options: optionMessages.options,
  sections: optionMessages.sections,
  permissionSets: {
    builtIn: { root: '系统管理员', member: '成员' },
  },
};

export default zhCN;
