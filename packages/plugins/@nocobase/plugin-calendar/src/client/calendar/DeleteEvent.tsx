import { observer } from '@formily/react';
import { Modal, Radio, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeleteEventContext } from './Calendar';
import { formatDate } from './utils';
import { useActionContext, useRecord, useFilterByTk, useBlockRequestContext } from '@nocobase/client';
import { useTranslation } from '../../locale';
const { Text } = Typography;

export const DeleteEvent = observer(
  () => {
    const { visible, setVisible } = useActionContext();
    const { exclude = [], cron, ...record } = useRecord();
    const { close } = useContext(DeleteEventContext);
    const startDate = formatDate(dayjs(record.__parent?.__event.start));
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
      close();
    };

    const { t } = useTranslation();
    return createPortal(
      <Modal
        title={cron ? t('Delete events') : null}
        open={visible}
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
  },
  { displayName: 'DeleteEvent' },
);

export default DeleteEvent;
