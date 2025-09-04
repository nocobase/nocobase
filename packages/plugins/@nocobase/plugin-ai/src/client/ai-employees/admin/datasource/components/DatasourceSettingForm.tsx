/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Divider, Flex, Form, Space, StepProps, Steps } from 'antd';
import {
  FlowModelContext,
  MultiRecordResource,
  observable,
  useFlowContext,
  createCollectionContextMeta,
} from '@nocobase/flow-engine';
import { FilterGroupType, transformFilter } from '@nocobase/client';
import { CollectionSetting, FieldsSetting, FilterSetting, Preview, SortSetting } from './form-steps';

type RecordType = any;

const dataScope: FilterGroupType = observable({
  logic: '$and',
  items: [],
});

export const DatasourceSettingForm: React.FC<{ record?: RecordType }> = ({ record }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const { Header, Footer } = ctx.view;
  const [collectionForm] = Form.useForm();
  const [fieldsForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [sortForm] = Form.useForm();
  const [previewForm] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const getCurrentForm = () => {
    switch (current) {
      case 0:
        return collectionForm;
      case 1:
        return fieldsForm;
      case 2:
        return filterForm;
      case 3:
        return sortForm;
      case 4:
        return previewForm;
      default:
        throw new Error('Invalid step');
    }
  };

  const next = async () => {
    try {
      const form = getCurrentForm();
      await form.validateFields();
      form.submit();
      setCurrent(current + 1);
    } catch (error) {
      console.debug('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items: StepProps[] = [
    {
      title: ctx.t('Collection'),
    },
    {
      title: ctx.t('Fields'),
    },
    {
      title: ctx.t('Filter'),
    },
    {
      title: ctx.t('Sort'),
    },
    {
      title: ctx.t('Preview'),
    },
  ];

  const onCollectionCascaderChange = (value: string[] | null) => {
    if (!value) {
      return;
    }
    const [dataSourceKey, collectionName] = value;
    ctx.model.context.defineProperty('collection', {
      get: () => ctx.dataSourceManager.getCollection(dataSourceKey, collectionName),
      meta: createCollectionContextMeta(
        () => ctx.dataSourceManager.getCollection(dataSourceKey, collectionName),
        ctx.t('Current collection'),
      ),
    });
    dataScope.items = [];
    fieldsForm.setFieldValue('fields', []);
  };

  const onFormFinish = (name, { values }) => {
    setFormData((prev) => ({ ...prev, ...values }));
    if (name === 'collectionSetting') {
      fieldsForm.setFieldValue('collection', values.collection);
      filterForm.setFieldValue('collection', values.collection);
      sortForm.setFieldValue('collection', values.collection);
      if (values.collection) {
        const [datasource, collectionName] = values.collection;
        setFormData((prev) => ({ ...prev, datasource, collectionName }));
      }
    } else if (name === 'filterSetting') {
      setFormData((prev) => ({ ...prev, filter: transformFilter(dataScope) }));
    }
  };

  return (
    <>
      <Header title={record ? ctx.t('Edit datasource') : ctx.t('Add datasource')} />
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Steps current={current} items={items} size="small" />
        <Divider dashed />
        <Form.Provider onFormFinish={onFormFinish}>
          <CollectionSetting
            form={collectionForm}
            onCollectionCascaderChange={onCollectionCascaderChange}
            name="collectionSetting"
            show={current === 0}
          />
          <FieldsSetting form={fieldsForm} name="fieldsSetting" show={current === 1} />
          <FilterSetting form={filterForm} dataScope={dataScope} name="filterSetting" show={current === 2} />
          <SortSetting form={sortForm} name="sortSetting" show={current === 3} />
        </Form.Provider>
        <Preview formData={formData} show={current === 4} />
      </Space>

      <Footer>
        <Flex justify="flex-end" align="end">
          <Space>
            <Button style={{ margin: '0 8px' }} onClick={() => prev()} disabled={current === 0}>
              Previous
            </Button>
            {current < items.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Next
              </Button>
            )}
            {current === items.length - 1 && (
              <Button
                type="primary"
                onClick={async () => {
                  const resource = ctx.resource as MultiRecordResource;
                  if (record) {
                    await resource.update(record.id, formData);
                  } else {
                    await resource.create(formData);
                  }
                  ctx.message.success('Processing complete!');
                  ctx.view?.close();
                }}
              >
                Submit
              </Button>
            )}
          </Space>
        </Flex>
      </Footer>
    </>
  );
};
