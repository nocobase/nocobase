/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { Form, Input, Select } from 'antd';
import { cloneDeep, get, set } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';

interface FieldFormProps {
  mode: 'create' | 'edit';
  dataSourceKey: string;
  collection: Record<string, any>;
  field?: Record<string, any>;
  onSubmitted: () => void;
}

function getFieldInterfaces(ctx: any, dataSourceType?: string) {
  return ctx.dataSourceManager.collectionFieldInterfaceManager?.getFieldInterfaces?.(dataSourceType) || [];
}

function toInitialValues(interfaceOptions?: Record<string, any>, field?: Record<string, any>) {
  if (field) {
    return cloneDeep(field);
  }
  const values = {
    name: randomId('f_'),
    ...cloneDeep(interfaceOptions?.default || {}),
    interface: interfaceOptions?.name,
  };
  if (interfaceOptions?.default?.uiSchema?.title) {
    set(values, 'uiSchema.title', interfaceOptions.default.uiSchema.title);
  }
  return values;
}

export function FieldForm(props: FieldFormProps) {
  const t = useT();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const fieldInterfaces = useMemo(
    () => getFieldInterfaces(ctx, dataSource?.options?.type),
    [ctx, dataSource?.options?.type],
  );
  const [interfaceName, setInterfaceName] = useState(props.field?.interface || fieldInterfaces[0]?.name);
  const fieldInterface = useMemo(
    () => fieldInterfaces.find((item) => item.name === interfaceName),
    [fieldInterfaces, interfaceName],
  );
  const configure = plugin.fieldInterfaceConfigureRegistry.get(interfaceName);
  const effectiveFieldInterface = useMemo(
    () => ({
      ...fieldInterface,
      ...configure,
      default: configure?.default || fieldInterface?.default,
    }),
    [configure, fieldInterface],
  );
  const ConfigureForm = configure?.ConfigureForm;
  const initialValues = useMemo(
    () => toInitialValues(effectiveFieldInterface, props.field),
    [effectiveFieldInterface, props.field],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleInterfaceChange = useCallback(
    (nextInterface: string) => {
      const nextConfigure = plugin.fieldInterfaceConfigureRegistry.get(nextInterface);
      const nextFieldInterface = fieldInterfaces.find((item) => item.name === nextInterface);
      const currentTitle = form.getFieldValue(['uiSchema', 'title']);
      const nextValues = toInitialValues(nextConfigure || nextFieldInterface);
      if (currentTitle) {
        set(nextValues, 'uiSchema.title', currentTitle);
      }
      setInterfaceName(nextInterface);
      form.setFieldsValue(nextValues);
    },
    [fieldInterfaces, form, plugin.fieldInterfaceConfigureRegistry],
  );

  const normalizeValues = useCallback(
    (values: Record<string, any>) => {
      const context = {
        mode: props.mode,
        fieldInterface: effectiveFieldInterface,
        collection: props.collection,
        field: props.field,
        createOnly: props.mode === 'create',
        editMainOnly: props.mode === 'edit',
        disabledJSONB: props.mode === 'edit',
      };
      const normalized = configure?.normalizeValues ? configure.normalizeValues(values, context as any) : values;
      return cloneDeep(normalized);
    },
    [configure, effectiveFieldInterface, props.collection, props.field, props.mode],
  );

  const handleSubmit = useCallback(async () => {
    const values = normalizeValues(await form.validateFields());
    setSubmitting(true);
    try {
      const associatedIndex = `${props.dataSourceKey}.${props.collection.name}`;
      if (props.mode === 'create') {
        await ctx.api.request({
          url: `dataSourcesCollections/${associatedIndex}/fields:create`,
          method: 'post',
          data: values,
        });
      } else {
        await ctx.api.request({
          url: `dataSourcesCollections/${associatedIndex}/fields:update?filterByTk=${props.field?.name}`,
          method: 'post',
          data: values,
        });
      }
      await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, ctx.dataSourceManager, form, normalizeValues, props]);

  const collectionTitle = compileLegacyTemplateText(get(props.collection, 'title') || props.collection.name, t);
  const title = `${collectionTitle} - ${props.mode === 'create' ? t('Add field') : t('Edit field')}`;

  return (
    <DrawerFormLayout
      title={title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="interface" label={t('Field interface')} rules={[{ required: true }]}>
          <Select
            disabled={props.mode === 'edit'}
            options={fieldInterfaces.map((item) => ({
              value: item.name,
              label: compileLegacyTemplate(item.title || item.name, t),
            }))}
            onChange={handleInterfaceChange}
          />
        </Form.Item>
        <Form.Item name="name" label={t('Field name')} rules={[{ required: true }]}>
          <Input disabled={props.mode === 'edit'} />
        </Form.Item>
        <Form.Item name={['uiSchema', 'title']} label={t('Field display name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label={t('Storage type')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea />
        </Form.Item>
        {ConfigureForm && configure ? (
          <ConfigureForm
            mode={props.mode}
            fieldInterface={configure}
            collection={props.collection}
            field={props.field}
            createOnly={props.mode === 'create'}
            editMainOnly={props.mode === 'edit'}
            disabledJSONB={props.mode === 'edit'}
          />
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}
