import antdEnUS from 'antd/lib/locale/en_US';
import antdJaJP from 'antd/lib/locale/ja_JP';
import antdRuRU from 'antd/lib/locale/ru_RU';
import antdTrTR from 'antd/lib/locale/tr_TR';
import antdZhCN from 'antd/lib/locale/zh_CN';
import enUS from './en_US';
import jaJP from './ja_JP';
import ruRU from './ru_RU';
import trTR from './tr_TR';
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
  'ja-JP': {
    label: '日本語',
    // https://github.com/moment/moment/blob/develop/locale/ja.js
    moment: 'ja',
    // https://github.com/ant-design/ant-design/tree/master/components/locale/ja_JP
    antd: antdJaJP,
    resources: {
      client: {
        ...jaJP,
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
  'ru-RU': {
    label: 'Русский',
    // https://github.com/moment/moment/blob/develop/locale/ru.js
    moment: 'ru',
    // https://github.com/ant-design/ant-design/tree/master/components/locale/ru_RU
    antd: antdRuRU,
    resources: {
      client: {
        ...ruRU,
      },
    },
  },
  'tr-TR': {
    label: 'Türkçe',
    // https://github.com/moment/moment/blob/develop/locale/tr.js
    moment: 'tr',
    // https://github.com/ant-design/ant-design/tree/master/components/locale/tr_TR
    antd: antdTrTR,
    resources: {
      client: {
        ...trTR,
      },
    },
  },
} as Record<string, LocaleOptions>;
