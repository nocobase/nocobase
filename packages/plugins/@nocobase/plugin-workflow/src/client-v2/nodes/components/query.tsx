/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Checkbox, Form } from 'antd';
import { useNodeContext } from '../../canvas/contexts';
import { AppendsSelect, PaginationFields, SortFieldsInput } from '../../components/collection';
import { RadioWithTooltip, type RadioWithTooltipOption } from '../../components/RadioWithTooltip';
import { useT } from '../../locale';
import { NodeCollectionField } from './collection';
import { NodeFilterField } from './filter';

function useResultTypeOptions(): RadioWithTooltipOption[] {
  const t = useT();

  return [
    {
      label: t('Single record'),
      value: false,
      tooltip: t('The result will be an object of the first matching record only, or null if no matched record.'),
    },
    {
      label: t('Multiple records'),
      value: true,
      tooltip: t(
        'The result will be an array containing matched records, or an empty one if no matching records. This can be used to be processed in a loop node.',
      ),
    },
  ];
}

function QueryParamsFields() {
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);

  if (!collection) {
    return null;
  }

  return (
    <>
      <NodeFilterField collection={collection} required={false} />

      <Form.Item name={['config', 'params', 'sort']} label={t('Sort')}>
        <SortFieldsInput collection={collection} />
      </Form.Item>

      <PaginationFields pageName={['config', 'params', 'page']} pageSizeName={['config', 'params', 'pageSize']} />

      <Form.Item
        name={['config', 'params', 'appends']}
        label={t('Preload associations')}
        extra={t(
          'Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.',
        )}
      >
        <AppendsSelect collection={collection} />
      </Form.Item>
    </>
  );
}

export function QueryFieldset() {
  const t = useT();
  const node = useNodeContext();
  const form = Form.useFormInstance();
  const resultTypeOptions = useResultTypeOptions();

  useEffect(() => {
    if (typeof form.getFieldValue(['config', 'multiple']) === 'undefined') {
      form.setFieldValue(['config', 'multiple'], false);
    }
  }, [form]);

  return (
    <>
      <NodeCollectionField
        disabled={Boolean(node?.config?.collection)}
        onCollectionChanged={() => {
          form.setFieldValue(['config', 'params'], {});
        }}
      />

      <Form.Item name={['config', 'multiple']} label={t('Result type')}>
        <RadioWithTooltip options={resultTypeOptions} />
      </Form.Item>

      <QueryParamsFields />

      <Form.Item name={['config', 'failOnEmpty']} valuePropName="checked">
        <Checkbox>{t('Exit when query result is null')}</Checkbox>
      </Form.Item>
    </>
  );
}

export function QueryPresetFieldset() {
  return <NodeCollectionField />;
}

export default QueryFieldset;
