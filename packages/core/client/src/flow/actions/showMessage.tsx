/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { Radio, Input, InputNumber, message } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import React from 'react';

type MessageType = 'success' | 'error' | 'info' | 'warning' | 'loading';

type MessageValue = {
  type: MessageType;
  content: string;
  duration?: number;
};

export const showMessage = defineAction({
  name: 'showMessage',
  title: tExpr('Show message'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  sort: 500,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value: rawValue = {}, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const mergedValue: MessageValue = {
          type: rawValue.type ?? 'info',
          content: rawValue.content || '',
          duration: rawValue.duration ?? 3,
        };

        const updateValue = (partial: Partial<MessageValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleTypeChange = (event: RadioChangeEvent) => {
          updateValue({ type: event.target.value as MessageType });
        };

        const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          updateValue({ content: event.target.value });
        };

        const handleDurationChange = (value: number | null) => {
          updateValue({ duration: value ?? 3 });
        };

        const renderSectionLabel = (text: string) => (
          <div style={{ marginBottom: '4px', fontSize: '14px' }}>{text}</div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              {renderSectionLabel(t('Message type'))}
              <Radio.Group value={mergedValue.type} onChange={handleTypeChange}>
                <Radio value="success">{t('Success')}</Radio>
                <Radio value="error">{t('Error')}</Radio>
                <Radio value="info">{t('Info')}</Radio>
                <Radio value="warning">{t('Warning')}</Radio>
                <Radio value="loading">{t('Loading')}</Radio>
              </Radio.Group>
            </div>
            <div>
              {renderSectionLabel(t('Message content'))}
              <Input.TextArea
                value={mergedValue.content}
                onChange={handleContentChange}
                placeholder={t('Please input message content')}
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              {renderSectionLabel(t('Duration (seconds, 0 = no auto close)'))}
              <InputNumber
                value={mergedValue.duration}
                onChange={handleDurationChange}
                min={0}
                step={0.5}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: async (ctx, { value }) => {
    const params: MessageValue = value || { type: 'info', content: '', duration: 3 };
    const { type = 'info', content, duration = 3 } = params;

    if (!content) {
      return;
    }

    ctx.message.open({
      type,
      content,
      duration,
    });
  },
});
