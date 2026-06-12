/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Form, Select } from 'antd';
import React, { useMemo } from 'react';
import { ConditionField } from '../../components/FilterDynamicComponent';
import {
  AppendsSelect,
  CollectionCascader,
  FieldsSelect,
  type CollectionTriggerField,
} from '../../components/collection';
import { useT } from '../../locale';
import { COLLECTION_TRIGGER_MODE, collectionModeOptions, hasCollectionTriggerMode } from './constants';

function filterChangedField(field: CollectionTriggerField) {
  return (
    !field.hidden &&
    (field.uiSchema ? !field.uiSchema['x-read-pretty'] : true) &&
    !['linkTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)
  );
}

export function TriggerModeField() {
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);
  const options = useMemo(
    () => collectionModeOptions.map((item) => ({ value: item.value, label: t(item.label) })),
    [t],
  );

  if (!collection) {
    return null;
  }

  return (
    <Form.Item name={['config', 'mode']} label={t('Trigger on')} rules={[{ required: true }]}>
      <Select popupMatchSelectWidth={false} placeholder={t('Trigger on')} className="auto-width" options={options} />
    </Form.Item>
  );
}

export function CollectionTriggerConfig() {
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);
  const mode = Number(Form.useWatch(['config', 'mode']) || 0);

  return (
    <fieldset
      className={css`
        .ant-select.auto-width {
          width: auto;
          min-width: 6em;
        }
      `}
    >
      <Form.Item name={['config', 'collection']} label={t('Collection')}>
        <CollectionCascader disabled />
      </Form.Item>

      <TriggerModeField />

      {collection && hasCollectionTriggerMode(mode, COLLECTION_TRIGGER_MODE.UPDATED) ? (
        <Form.Item
          name={['config', 'changed']}
          label={t('Changed fields')}
          extra={t(
            'Triggered only if one of the selected fields changes. If unselected, it means that it will be triggered when any field changes. When record is added, any field is considered to have been changed.',
          )}
        >
          <FieldsSelect mode="multiple" placeholder={t('Select field')} filter={filterChangedField} />
        </Form.Item>
      ) : null}

      {collection && !hasCollectionTriggerMode(mode, COLLECTION_TRIGGER_MODE.DELETED) ? (
        <Form.Item name={['config', 'condition']} label={t('Only triggers when match conditions')}>
          <ConditionField collection={collection} />
        </Form.Item>
      ) : null}

      {collection && !hasCollectionTriggerMode(mode, COLLECTION_TRIGGER_MODE.DELETED) ? (
        <Form.Item
          name={['config', 'appends']}
          label={t('Preload associations')}
          extra={t(
            'Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.',
          )}
        >
          <AppendsSelect collection={collection} />
        </Form.Item>
      ) : null}
    </fieldset>
  );
}

export function CollectionPresetConfig() {
  const t = useT();
  return (
    <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default CollectionTriggerConfig;
