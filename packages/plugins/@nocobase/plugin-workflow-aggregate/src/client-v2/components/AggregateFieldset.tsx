/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Checkbox, Col, Form, InputNumber, Radio, Row } from 'antd';
import { CollectionCascader, FieldsSelect, FilterDynamicComponent } from '@nocobase/plugin-workflow/client-v2';
import { ASSOCIATED_TARGETS, AGGREGATORS } from '../constants';
import { useT } from '../locale';
import { isAggregateValueField } from '../utils';
import { AssociatedConfig } from './AssociatedConfig';

function AggregateFieldSelect({ collection }: { collection?: string }) {
  const t = useT();

  if (!collection) {
    return null;
  }

  return (
    <Form.Item name={['config', 'params', 'field']} label={t('Field to aggregate')} rules={[{ required: true }]}>
      <FieldsSelect collection={collection} filter={isAggregateValueField} />
    </Form.Item>
  );
}

function AggregateParamsFields() {
  const t = useT();
  const collection = Form.useWatch(['config', 'collection']);
  const aggregator = Form.useWatch(['config', 'aggregator']);

  if (!collection) {
    return null;
  }

  return (
    <>
      {aggregator === 'count' ? (
        <Form.Item name={['config', 'params', 'distinct']} valuePropName="checked">
          <Checkbox>{t('Distinct')}</Checkbox>
        </Form.Item>
      ) : null}

      <Form.Item name={['config', 'params', 'filter']} label={t('Filter')}>
        <FilterDynamicComponent collection={collection} />
      </Form.Item>
    </>
  );
}

export function AggregateFieldset() {
  const t = useT();
  const form = Form.useFormInstance();
  const associated = Form.useWatch(['config', 'associated']);
  const collection = Form.useWatch(['config', 'collection']);
  const associatedTargetOptions = [
    { label: t('Data of collection'), value: ASSOCIATED_TARGETS.COLLECTION },
    { label: t('Data of associated collection'), value: ASSOCIATED_TARGETS.ASSOCIATION },
  ];

  useEffect(() => {
    if (typeof form.getFieldValue(['config', 'aggregator']) === 'undefined') {
      form.setFieldValue(['config', 'aggregator'], 'count');
    }
    if (typeof form.getFieldValue(['config', 'associated']) === 'undefined') {
      form.setFieldValue(['config', 'associated'], false);
    }
    if (typeof form.getFieldValue(['config', 'precision']) === 'undefined') {
      form.setFieldValue(['config', 'precision'], 2);
    }
  }, [form]);

  return (
    <>
      <Form.Item name={['config', 'aggregator']} label={t('Aggregator function')} rules={[{ required: true }]}>
        <Radio.Group options={[...AGGREGATORS]} />
      </Form.Item>

      <Form.Item name={['config', 'associated']} label={t('Target type')} rules={[{ required: true }]}>
        <Radio.Group
          options={associatedTargetOptions}
          onChange={() => {
            form.setFieldValue(['config', 'collection'], null);
            form.setFieldValue(['config', 'association'], null);
            form.setFieldValue(['config', 'params', 'field'], null);
            form.setFieldValue(['config', 'params', 'filter'], null);
          }}
        />
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          {associated ? (
            <Form.Item
              name={['config', 'association']}
              label={t('Data of associated collection')}
              rules={[{ required: true }]}
            >
              <AssociatedConfig />
            </Form.Item>
          ) : (
            <Form.Item name={['config', 'collection']} label={t('Data of collection')} rules={[{ required: true }]}>
              <CollectionCascader
                onChange={() => {
                  form.setFieldValue(['config', 'params', 'field'], null);
                  form.setFieldValue(['config', 'params', 'filter'], null);
                }}
              />
            </Form.Item>
          )}
        </Col>
        <Col span={12}>
          <AggregateFieldSelect collection={collection} />
        </Col>
      </Row>

      <AggregateParamsFields />

      <Form.Item
        name={['config', 'precision']}
        label={t('Result precision')}
        extra={t('Number of decimal places for query result.')}
      >
        <InputNumber min={0} max={14} step={1} precision={0} className="auto-width" />
      </Form.Item>
    </>
  );
}

export default AggregateFieldset;
