/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { Radio, Input, InputNumber, Select, notification } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import React from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';
type NotificationPlacement = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type NotificationValue = {
  type: NotificationType;
  title: string;
  description: string;
  duration?: number;
  placement?: NotificationPlacement;
};

const DEFAULT_DURATION = 5;

function normalizeDuration(duration: number | null | undefined, fallback = DEFAULT_DURATION) {
  if (duration === null || typeof duration === 'undefined') {
    return fallback;
  }

  const numeric = Number(duration);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(numeric));
}

export const showNotification = defineAction({
  name: 'showNotification',
  title: tExpr('Show notification'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  sort: 600,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value: rawValue = {}, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const mergedValue: NotificationValue = {
          type: rawValue.type ?? 'info',
          title: rawValue.title || '',
          description: rawValue.description || '',
          duration: normalizeDuration(rawValue.duration),
          placement: rawValue.placement ?? 'topRight',
        };

        const updateValue = (partial: Partial<NotificationValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleTypeChange = (event: RadioChangeEvent) => {
          updateValue({ type: event.target.value as NotificationType });
        };

        const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          updateValue({ title: event.target.value });
        };

        const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          updateValue({ description: event.target.value });
        };

        const handleDurationChange = (value: number | null) => {
          updateValue({ duration: normalizeDuration(value) });
        };

        const handlePlacementChange = (value: NotificationPlacement) => {
          updateValue({ placement: value });
        };

        const placementOptions = [
          { label: t('Top left'), value: 'topLeft' },
          { label: t('Top right'), value: 'topRight' },
          { label: t('Bottom left'), value: 'bottomLeft' },
          { label: t('Bottom right'), value: 'bottomRight' },
        ];

        const renderSectionLabel = (text: string) => (
          <div style={{ marginBottom: '4px', fontSize: '14px' }}>{text}</div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              {renderSectionLabel(t('Notification type'))}
              <Radio.Group value={mergedValue.type} onChange={handleTypeChange}>
                <Radio value="success">{t('Success')}</Radio>
                <Radio value="error">{t('Error')}</Radio>
                <Radio value="info">{t('Info')}</Radio>
                <Radio value="warning">{t('Warning')}</Radio>
              </Radio.Group>
            </div>
            <div>
              {renderSectionLabel(t('Notification title'))}
              <Input
                value={mergedValue.title}
                onChange={handleTitleChange}
                placeholder={t('Please input notification title')}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              {renderSectionLabel(t('Notification description'))}
              <Input.TextArea
                value={mergedValue.description}
                onChange={handleDescriptionChange}
                placeholder={t('Please input notification description')}
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              {renderSectionLabel(t('Placement'))}
              <Select
                value={mergedValue.placement}
                onChange={handlePlacementChange}
                options={placementOptions}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              {renderSectionLabel(t('Duration (seconds, 0 = no auto close)'))}
              <InputNumber
                value={mergedValue.duration}
                onChange={handleDurationChange}
                min={0}
                step={1}
                precision={0}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: async (ctx, { value }) => {
    const params: NotificationValue = value || {
      type: 'info',
      title: '',
      description: '',
      duration: DEFAULT_DURATION,
      placement: 'topRight',
    };
    const { type = 'info', title, description, duration = DEFAULT_DURATION, placement = 'topRight' } = params;
    const normalizedDuration = normalizeDuration(duration);

    if (!title && !description) {
      return;
    }

    ctx.notification.open({
      type,
      message: title,
      description,
      duration: normalizedDuration,
      placement,
    });
  },
});
