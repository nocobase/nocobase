import { i18n, Plugin } from '@nocobase/client';
import { Select } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

const NAMESPACE = 'sample-shop-i18n';

i18n.addResources('zh-CN', NAMESPACE, {
  Shop: '店铺',
  I18n: '国际化',
  Pending: '已下单',
  Paid: '已支付',
  Delivered: '已发货',
  Received: '已签收',
});

const ORDER_STATUS_LIST = [
  { value: -1, label: 'Canceled (untranslated)' },
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Paid' },
  { value: 2, label: 'Delivered' },
  { value: 3, label: 'Received' },
];

function OrderStatusSelect() {
  const { t } = useTranslation(NAMESPACE);

  return (
    <Select style={{ minWidth: '8em' }}>
      {ORDER_STATUS_LIST.map((item) => (
        <Select.Option key={item.value} value={item.value}>
          {t(item.label)}
        </Select.Option>
      ))}
    </Select>
  );
}

class ShopI18nPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Shop", { ns: "${NAMESPACE}" })}}`,
      icon: 'ShopOutlined',
      Component: OrderStatusSelect,
    });
  }
}

export default ShopI18nPlugin;
