/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Modal, Radio, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useContext, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DeleteEventContext } from './Calendar';
import { formatDate } from './utils';
import {
  useActionContext,
  useRecord,
  useFilterByTk,
  useBlockRequestContext,
  getStoredPopupContext,
  usePopupUtils,
} from '@nocobase/client';
import { useTranslation } from '../../locale';
const { Text } = Typography;

export const DeleteEvent = observer(
  () => {
    const { visible, setVisible, setSubmitted } = useActionContext();
    const { exclude = [], cron, ...record } = useRecord();
    const { close } = useContext(DeleteEventContext);
    const { context: popUpCtx, closePopup } = usePopupUtils();
    const parentXUid = popUpCtx?.params?.popupuid || '';
    const eventData = getStoredPopupContext(parentXUid) || { record: null, service: null };
    const startDate = useMemo(
      () => formatDate(dayjs(eventData.record?.data?.__event.start)),
      [eventData.record?.data?.__event.start],
    );
    // directly access popup can only del all, for we have no event detail
    const disableDelPart = eventData.record ? false : true;
    const filterByTk = useFilterByTk();
    const { resource, service, __parent } = useBlockRequestContext();
    const [value, onChange] = useState(disableDelPart ? 'all' : startDate);
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
      setSubmitted?.(true);
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
              <Radio value={startDate} disabled={disableDelPart}>
                {t('This event')}
              </Radio>
              <Radio value={`${startDate}_after`} disabled={disableDelPart}>
                {t('This and following events')}
              </Radio>
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
