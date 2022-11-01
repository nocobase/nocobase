import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { i18n, PluginManager, PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';

const ns = '@nocobase/plugin-sample-shop-i18n';

i18n.addResources('zh-CN', ns, {
  Shop: '店铺',
  I18n: '国际化',
  Pending: '已下单',
  Paid: '已支付',
  Delivered: '已发货',
  Received: '已签收'
});

const ORDER_STATUS_LIST = [
  { value: -1, label: 'Canceled (untranslated)' },
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Paid' },
  { value: 2, label: 'Delivered' },
  { value: 3, label: 'Received' },
]

function OrderStatusSelect() {
  const { t } = useTranslation(ns);

  return (
    <Select style={{ minWidth: '8em' }}>
      {ORDER_STATUS_LIST.map(item => (
        <Select.Option value={item.value}>{t(item.label)}</Select.Option>
      ))}
    </Select>
  );
}

export const ShopShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      key="workflow"
      icon={<ShopOutlined />}
      title={t('Workflow')}
      onClick={() => {
        history.push('/admin/settings/workflow/workflows');
      }}
    />
  );
};

export default React.memo((props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);

  return (
    <SettingsCenterProvider
      settings={{
        workflow: {
          icon: 'ShopOutlined',
          title: `{{t("Shop", { ns: "${ns}" })}}`,
          tabs: {
            workflows: {
              title: `{{t("I18n", { ns: "${ns}" })}}`,
              component: OrderStatusSelect,
            },
          },
        },
      }}
    >
      <PluginManagerContext.Provider
        value={{
          components: {
            ...ctx?.components,
            ShopShortcut,
          },
        }}
      >
        <RouteSwitchContext.Provider value={{ components: { ...components }, ...others, routes }}>
          {props.children}
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
});
