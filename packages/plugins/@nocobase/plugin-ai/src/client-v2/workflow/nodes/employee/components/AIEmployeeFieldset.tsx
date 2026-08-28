/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Tabs, Tooltip, theme } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { DEFAULT_AI_EMPLOYEE_USERNAME } from '../../../constants';
import { useT } from '../../../../locale';
import { AIEmployeeSelect } from './AIEmployeeSelect';
import { Assignees } from './Assignees';
import { FeedbackSettings } from './FeedbackSettings';
import { FileInputs } from './FileInputs';
import { MessageInputs } from './MessageInputs';
import { ModelOptions } from './ModelOptions';
import { SkillSettings } from './SkillSettings';
import { StructuredOutput } from './StructuredOutput';
import { UserInputFormItem } from './UserInput';
import { WebSearchOptions } from './WebSearchOptions';

export function AIEmployeeFieldset() {
  const t = useT();
  const form = Form.useFormInstance();
  const { token } = theme.useToken();
  const fieldsetClassName = css`
    .ant-form-item-control-input-content > .ant-select,
    .ant-form-item-control-input-content > .ant-space-compact {
      width: 100%;
    }
  `;
  const aiEmployeeInlineClass = css`
    display: flex;
    align-items: center;
    column-gap: ${token.marginXS}px;
    margin-bottom: ${token.margin}px;

    .nb-ai-employee-inline-label {
      display: inline-flex;
      align-items: center;
      column-gap: ${token.marginXXS}px;
      color: ${token.colorText};
      font-size: ${token.fontSize}px;
      font-weight: ${token.fontWeightStrong};
      line-height: ${token.lineHeight};
    }
  `;

  return (
    <Tabs
      items={[
        {
          key: 'task',
          label: t('Task'),
          forceRender: true,
          children: (
            <div className={fieldsetClassName}>
              <div className={aiEmployeeInlineClass}>
                <span className="nb-ai-employee-inline-label">
                  {t('AI employee')}
                  <Tooltip title={t('Choose the AI employee for this task')}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
                <Form.Item name={['config', 'username']} initialValue={DEFAULT_AI_EMPLOYEE_USERNAME} noStyle>
                  <AIEmployeeSelect
                    onChange={(username) => {
                      form.setFieldValue(['config', 'username'], username);
                      form.setFieldValue(['config', 'skillSettings', 'skills'], undefined);
                      form.setFieldValue(['config', 'skillSettings', 'tools'], undefined);
                    }}
                  />
                </Form.Item>
              </div>
              <ModelOptions />
              <UserInputFormItem />
              <MessageInputs />
              <Form.Item label={t('Attachments')} tooltip={t('Select the file or image to be sent to the LLM')}>
                <FileInputs />
              </Form.Item>
              <SkillSettings />
              <WebSearchOptions />
            </div>
          ),
        },
        {
          key: 'feedback',
          label: t('Feedback & Notification'),
          forceRender: true,
          children: (
            <div className={fieldsetClassName}>
              <StructuredOutput />
              <FeedbackSettings />
              <Assignees />
            </div>
          ),
        },
      ]}
    />
  );
}

export default AIEmployeeFieldset;
