/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { CollectionCascader, AppendsSelect } from '@nocobase/plugin-workflow/client-v2';
import { Form, Radio, Space, Tooltip } from 'antd';
import React, { useEffect, useRef } from 'react';
import { CONTEXT_TYPE, CONTEXT_TYPE_OPTIONS } from '../../common/constants';
import { useT } from '../locale';

type ContextTypeRadioProps = {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  options?: typeof CONTEXT_TYPE_OPTIONS;
};

function ContextTypeRadio({ value, onChange, disabled, options = CONTEXT_TYPE_OPTIONS }: ContextTypeRadioProps) {
  const t = useT();

  return (
    <Radio.Group disabled={disabled} value={value} onChange={(event) => onChange?.(event.target.value)}>
      <Space direction="vertical">
        {options.map((option) => (
          <Radio key={option.value} value={option.value}>
            <Space>
              <span>{t(option.label)}</span>
              {option.tooltip ? (
                <Tooltip title={t(option.tooltip)}>
                  <QuestionCircleOutlined />
                </Tooltip>
              ) : null}
            </Space>
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );
}

function CollectionField({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const type = Form.useWatch(['config', 'type']);

  if (!type || type === CONTEXT_TYPE.GLOBAL) {
    return null;
  }

  return (
    <Form.Item name={['config', 'collection']} label={t('Collection', { ns: 'client' })} rules={[{ required: true }]}>
      <CollectionCascader disabled={disabled} />
    </Form.Item>
  );
}

export function CustomActionTriggerPresetConfig() {
  const t = useT();

  return (
    <>
      <Form.Item
        name={['config', 'type']}
        label={t('Context type')}
        initialValue={CONTEXT_TYPE.GLOBAL}
        rules={[{ required: true }]}
      >
        <ContextTypeRadio />
      </Form.Item>
      <CollectionField />
    </>
  );
}

export function CustomActionTriggerConfig() {
  const form = Form.useFormInstance();
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);
  const previousCollectionRef = useRef(collection);

  useEffect(() => {
    if (previousCollectionRef.current && previousCollectionRef.current !== collection) {
      form.setFieldValue(['config', 'appends'], []);
    }
    previousCollectionRef.current = collection;
  }, [collection, form]);

  return (
    <>
      <Form.Item name={['config', 'type']} label={t('Context type')} initialValue={CONTEXT_TYPE.GLOBAL}>
        <ContextTypeRadio disabled />
      </Form.Item>
      <CollectionField disabled />
      {collection ? (
        <Form.Item
          name={['config', 'appends']}
          label={t('Associations to use')}
          extra={t(
            'Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.',
            { ns: 'workflow' },
          )}
        >
          <AppendsSelect collection={collection} />
        </Form.Item>
      ) : null}
    </>
  );
}

export default CustomActionTriggerConfig;
