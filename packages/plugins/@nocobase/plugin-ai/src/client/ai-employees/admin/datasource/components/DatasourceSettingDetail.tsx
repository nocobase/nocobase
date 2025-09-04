/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Button, Flex, Form, Space, Tabs } from 'antd';
import { FlowModelContext, MultiRecordResource, observable, useFlowContext } from '@nocobase/flow-engine';
import { FilterGroupType, transformFilter } from '@nocobase/client';
import { CollectionSetting, FieldsSetting, FilterSetting, Preview, SortSetting } from './form-steps';

type RecordType = any;

const dataScope: FilterGroupType = observable({
  logic: '$and',
  items: [],
});

const TabDecorator: React.FC<PropsWithChildren> = ({ children }) => {
  return <>{children}</>;
};

export const DatasourceSettingDetail: React.FC<{ record: RecordType }> = ({ record }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const { Header, Footer } = ctx.view;
  const [collectionForm] = Form.useForm();
  const [fieldsForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [sortForm] = Form.useForm();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const allForms = [collectionForm, fieldsForm, filterForm, sortForm];

  useEffect(() => {
    if (record) {
      setFormData(record);
      collectionForm.setFieldsValue(record);
      fieldsForm.setFieldValue('fields', record.fields);

      allForms.forEach((form) => {
        form.setFieldValue('collection', [record.datasource, record.collectionName]);
      });
    }
  }, [record]);

  const onSubmit = async () => {
    try {
      let data = {};
      for (const form of allForms) {
        const { collection, datasource, collectionName, ...rest } = await form.validateFields();
        data = { ...data, ...rest };
      }
      data['filter'] = transformFilter(dataScope);
      await ctx.resource.update(record.id, data);
      ctx.message.success(ctx.t('Save datasource successfully'));
      ctx.view.close();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const items = [
    {
      key: 'Tab-0',
      label: ctx.t('Collection'),
      children: (
        <TabDecorator>
          <CollectionSetting
            form={collectionForm}
            name="collectionSetting"
            show={true}
            disableCollectionCascader={true}
          />
        </TabDecorator>
      ),
    },
    {
      key: 'Tab-1',
      label: ctx.t('Fields'),
      children: (
        <TabDecorator>
          <FieldsSetting form={fieldsForm} name="fieldsSetting" show={true} />
        </TabDecorator>
      ),
    },
    {
      key: 'Tab-2',
      label: ctx.t('Filter'),
      children: (
        <TabDecorator>
          <FilterSetting form={filterForm} dataScope={dataScope} name="filterSetting" show={true} />
        </TabDecorator>
      ),
    },
    {
      key: 'Tab-3',
      label: ctx.t('Sort'),
      children: (
        <TabDecorator>
          <SortSetting form={sortForm} name="sortSetting" show={true} />
        </TabDecorator>
      ),
    },
    {
      key: 'Tab-4',
      label: ctx.t('Preview'),
      children: (
        <TabDecorator>
          <Preview formData={formData} show={true} />
        </TabDecorator>
      ),
    },
  ];

  return (
    <>
      <Header title={ctx.t('Edit datasource')} />

      <Tabs defaultActiveKey="Tab-0" items={items} />

      <Footer>
        <Flex justify="flex-end" align="end">
          <Space>
            {ctx.view && (
              <Button
                onClick={() => {
                  ctx.view.close();
                }}
              >
                {ctx.t('Cancel')}
              </Button>
            )}

            <Button type="primary" onClick={onSubmit}>
              {ctx.t('Submit')}
            </Button>
          </Space>
        </Flex>
      </Footer>
    </>
  );
};
