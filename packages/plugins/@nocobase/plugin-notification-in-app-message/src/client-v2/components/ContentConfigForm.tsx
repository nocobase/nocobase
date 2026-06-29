/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ContentConfigFormProps } from '@nocobase/plugin-notification-manager/client-v2';
import { WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { Form, InputNumber } from 'antd';
import React from 'react';
import { useInAppMessageTranslation, useT } from '../locale';

function withPrefix(namePrefix: Array<string | number> | undefined, ...segments: Array<string | number>) {
  return [...(namePrefix ?? []), ...segments];
}

export function ContentConfigForm(props: ContentConfigFormProps) {
  const { t } = useInAppMessageTranslation();
  const compileT = useT();

  return (
    <>
      <Form.Item
        name={withPrefix(props.namePrefix, 'title')}
        label={t('Message title')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'content')}
        label={t('Message content')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <WorkflowVariableTextArea autoSize={{ minRows: 10 }} placeholder="Hi," delimiters={['{{{', '}}}']} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'url')}
        label={t('Details page for desktop')}
        extra={compileT(
          'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/admin". If using an external link, the link starts with "http", for example, "https://example.com".',
        )}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'mobileUrl')}
        label={t('Details page for mobile')}
        extra={compileT(
          'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/m". If using an external link, the link starts with "http", for example, "https://example.com".',
        )}
      >
        <WorkflowVariableInput variableOptions={{ types: ['string'] }} />
      </Form.Item>
      <Form.Item
        name={withPrefix(props.namePrefix, 'options', 'duration')}
        label={t('Close after')}
        extra={compileT('Unit is second. Will not close automatically when set to empty.')}
        initialValue={5}
      >
        <InputNumber />
      </Form.Item>
    </>
  );
}

export default ContentConfigForm;
