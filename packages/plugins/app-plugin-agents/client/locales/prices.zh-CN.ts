import type { PricesLocale } from './prices.en-US.js';

/** The prices sheet of the Usage page (`client/pages/usage/prices/`). */
const pricesZhCN: PricesLocale = {
  prices: {
    loadFailed: '无法加载模型价格',
    section: {
      title: '模型价格',
      description: '按每百万 token 计，输入 / 输出。报表据此计算费用。',
      online: '在线（模型服务）',
      noOnline: '还没有可定价的模型。请先启用模型服务及其模型。',
      runner: 'Runner（编码工具）',
    },
    price: {
      model: '模型',
      state: '价格来源与操作',
      input: '输入 / 百万',
      output: '输出 / 百万',
      inputOf: '{{model}} 每百万 token 的输入价格',
      outputOf: '{{model}} 每百万 token 的输出价格',
      save: '保存 {{model}} 的价格',
      saved: '已保存 {{model}} 的价格。',
      remove: '删除 {{model}} 的价格',
      removed: '已删除 {{model}} 的价格。',
      unpriced: '未定价',
      unpricedHint: '设置价格前，报表中它的费用显示为“—”。',
      via: '按 {{pattern}}',
      viaHint: '按规则 {{pattern}} 计价。在这里保存会给这个模型单独定价。',
      invalid: '价格必须是非负数。',
      readOnly: '只有可以管理模型价格的人能修改。',
    },
    tool: {
      description: '{{tool}} 运行的费用，按每次运行上报的模型计价。',
      subscription: '包月/订阅（不计费）',
      subscriptionTag: '订阅',
      subscriptionHint: '按月付费：报表中它的运行不计费用。',
      subscribed: '{{tool}} 已改为订阅计费。',
      unsubscribed: '{{tool}} 已改为按价格计费。',
      seen: '运行中出现的模型',
      noneSeen: '{{tool}} 的运行还没有上报过模型。',
      rules: '价格规则（{{count}}）',
      rulesHint:
        '规则是模型 ID 或 claude-sonnet-4* 这样的通配；最具体的匹配优先。',
      ruleModel: '模型或通配',
      addRule: '添加价格',
      ruleAdded: '已添加 {{model}} 的价格。',
    },
  },
};

export default pricesZhCN;
