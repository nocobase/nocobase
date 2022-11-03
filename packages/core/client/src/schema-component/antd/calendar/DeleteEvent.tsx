import { observer } from '@formily/react';
import { Modal, Radio, Space, Typography } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useBlockRequestContext, useFilterByTk } from '../../../block-provider';
import { useRecord } from '../../../record-provider';
import { useActionContext } from '../action';
const { Text } = Typography;

export const DeleteEvent = observer(() => {
  const { visible, setVisible } = useActionContext();
  const { exclude = [], cron, ...record } = useRecord();
  const startDate = moment(record.__parent.__event.start).format();
  const filterByTk = useFilterByTk();
  const { resource, service, __parent } = useBlockRequestContext();
  const [value, onChange] = useState(startDate);
  const [loading, setLoading] = useState(false);
  const onOk = async () => {
    setLoading(true);
    if (value === 'all' || !cron) {
      await resource.destroy({
        filterByTk,
      });
    } else {
      await resource.update({
        filterByTk,
        values: {
          exclude: (exclude || []).concat(value),
        },
      });
    }
    setLoading(false);
    __parent?.service?.refresh?.();
    service?.refresh?.();
    setVisible?.(false, true);
  };

  const { t } = useTranslation();
  return createPortal(
    <Modal
      title={cron ? t('Delete events') : null}
      visible={visible}
      onCancel={() => setVisible(false)}
      onOk={() => onOk()}
      confirmLoading={loading}
    >
      {cron ? (
        <Radio.Group value={value} onChange={(event) => onChange(event.target.value)}>
          <Space direction="vertical">
            <Radio value={startDate}>{t('This event')}</Radio>
            <Radio value={`${startDate}_after`}>{t('This and following events')}</Radio>
            <Radio value="all">{t('All events')}</Radio>
          </Space>
        </Radio.Group>
      ) : (
        <Text strong style={{ fontSize: '18px' }}>
          {t('Delete this event?')}
        </Text>
      )}
    </Modal>,
    document.body,
  );
});

export default DeleteEvent;
