import antdEnUS from 'antd/lib/locale/en_US';
import antdZhCN from 'antd/lib/locale/zh_CN';
import enUS from './en_US';
import zhCN from './zh_CN';

export type LocaleOptions = {
  label: string;
  moment: string;
  antd: any;
  resources?: any;
};

export default {
  'en-US': {
    label: 'English',
    // https://github.com/moment/moment/blob/develop/locale/en.js
    moment: 'en',
    // https://github.com/ant-design/ant-design/tree/master/components/locale/en_US
    antd: antdEnUS,
    resources: {
      client: {
        ...enUS,
      },
    },
  },
  'zh-CN': {
    label: '简体中文',
    // https://github.com/moment/moment/blob/develop/locale/zh-cn.js
    moment: 'zh-cn',
    // https://github.com/ant-design/ant-design/tree/master/components/locale/zh_CN
    antd: antdZhCN,
    // i18next
    resources: {
      client: {
        ...zhCN,
      },
    },
  },
} as Record<string, LocaleOptions>;
