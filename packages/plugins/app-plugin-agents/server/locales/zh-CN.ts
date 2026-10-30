import type enUS from './en-US.js';
import accessZhCN from '../../shared/locales/access.zh-CN.js';

const zhCN: typeof enUS = {
  ...accessZhCN,
  runnerConversation: {
    title: '对话：{{title}}',
    other: '他人对话',
    untitled: '新对话',
  },
};

export default zhCN;
