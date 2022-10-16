
import React from 'react';
import { Select } from 'antd';
import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

i18n.addResources('zh-CN', '@nocobase/plugin-sample-shop-i18n', {
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
  const { t } = useTranslation('@nocobase/plugin-sample-shop-i18n');

  return (
    <Select style={{ minWidth: '8em' }}>
      {ORDER_STATUS_LIST.map(item => (
        <Select.Option value={item.value}>{t(item.label)}</Select.Option>
      ))}
    </Select>
  );
}

export default React.memo((props) => {
  return <OrderStatusSelect />;
});
