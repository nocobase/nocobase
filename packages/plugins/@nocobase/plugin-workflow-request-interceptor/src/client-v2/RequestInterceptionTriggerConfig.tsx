/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';
import { Checkbox, Form, Radio, Space } from 'antd';
import React, { useMemo } from 'react';

import { INTERCEPTABLE_ACTIONS } from '../common/constants';
import { useT } from './locale';

export function RequestInterceptionTriggerPresetConfig() {
  const t = useT();
  return (
    <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default function RequestInterceptionTriggerConfig() {
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);
  const global = Form.useWatch(['config', 'global']);
  const actionOptions = useMemo(
    () => [
      { label: t('Create record'), value: INTERCEPTABLE_ACTIONS.CREATE },
      { label: t('Update record'), value: INTERCEPTABLE_ACTIONS.UPDATE },
      { label: t('Delete record'), value: INTERCEPTABLE_ACTIONS.DESTROY },
    ],
    [t],
  );

  return (
    <fieldset>
      <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
        <CollectionCascader disabled />
      </Form.Item>

      {collection ? (
        <Form.Item name={['config', 'global']} label={t('Trigger mode')} initialValue={false}>
          <Radio.Group>
            <Space direction="vertical">
              <Radio value={false}>
                {t('Local mode, triggered before executing the actions bound to this workflow')}
              </Radio>
              <Radio value>{t('Global mode, triggered before executing the following actions')}</Radio>
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
    </fieldset>
  );
}
