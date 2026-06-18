/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppendsSelect, CollectionCascader } from '@nocobase/plugin-workflow/client-v2';
import { Checkbox, Form, Radio, Space } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';

import { COLLECTION_TRIGGER_ACTION } from './ActionTrigger';
import { useT } from './locale';

export function ActionTriggerPresetConfig() {
  const t = useT();
  return (
    <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default function ActionTriggerConfig() {
  const t = useT();
  const form = Form.useFormInstance();
  const collection = Form.useWatch(['config', 'collection']);
  const global = Form.useWatch(['config', 'global']);
  const previousCollectionRef = useRef(collection);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousCollectionRef.current = collection;
      return;
    }
    if (previousCollectionRef.current !== collection) {
      form.setFieldValue(['config', 'appends'], []);
    }
    previousCollectionRef.current = collection;
  }, [collection, form]);

  const actionOptions = useMemo(
    () => [
      { label: t('Create record action'), value: COLLECTION_TRIGGER_ACTION.CREATE },
      { label: t('Update record action'), value: COLLECTION_TRIGGER_ACTION.UPDATE },
    ],
    [t],
  );

  return (
    <fieldset>
      <Form.Item
        name={['config', 'collection']}
        label={t('Collection')}
        tooltip={t('The collection to which the triggered data belongs.')}
        rules={[{ required: true }]}
      >
        <CollectionCascader disabled />
      </Form.Item>

      {collection ? (
        <Form.Item name={['config', 'global']} label={t('Trigger mode')} initialValue={false}>
          <Radio.Group>
            <Space direction="vertical">
              <Radio value={false}>
                {t('Local mode, triggered after the completion of actions bound to this workflow')}
              </Radio>
              <Radio value>{t('Global mode, triggered after the completion of the following actions')}</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      ) : null}

      {collection && global ? (
        <Form.Item name={['config', 'actions']} label={t('Select actions')} rules={[{ required: true }]}>
          <Checkbox.Group>
            <Space direction="vertical">
              {actionOptions.map((option) => (
                <Checkbox key={option.value} value={option.value}>
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      ) : null}

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
    </fieldset>
  );
}
