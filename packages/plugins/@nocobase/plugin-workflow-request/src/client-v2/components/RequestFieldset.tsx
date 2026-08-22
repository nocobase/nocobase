/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, Flex, Form, Input, InputNumber, Select, Space, Button, type FormListFieldData } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React, { useEffect, useMemo, useRef } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  WorkflowVariableInput,
  WorkflowVariableJsonTextArea,
  WorkflowVariableTextArea,
} from '@nocobase/plugin-workflow/client-v2';
import {
  DEFAULT_MULTIPART_VALUE_TYPE,
  DEFAULT_REQUEST_CONTENT_TYPE,
  DEFAULT_REQUEST_METHOD,
  DEFAULT_TIMEOUT,
  MULTIPART_VALUE_TYPE_OPTIONS,
  REQUEST_CONTENT_TYPE_OPTIONS,
  REQUEST_METHOD_OPTIONS,
  isRequestFileVariableMatch,
} from '../constants';
import type { RequestContentType } from '../types';
import { useT } from '../locale';
import { getDefaultRequestBodyValue, getRequestBodyEditorKind } from '../utils';

function useContentTypeReset() {
  const form = Form.useFormInstance();
  const watchedContentType = Form.useWatch(['config', 'contentType'], form) as RequestContentType | undefined;
  const previousContentTypeRef = useRef<RequestContentType | undefined>();
  const initializedRef = useRef(false);

  useEffect(() => {
    const contentType =
      (form.getFieldValue(['config', 'contentType']) as RequestContentType | undefined) ??
      watchedContentType ??
      DEFAULT_REQUEST_CONTENT_TYPE;
    const currentData = form.getFieldValue(['config', 'data']);

    if (!initializedRef.current) {
      initializedRef.current = true;
      previousContentTypeRef.current = contentType;

      if (typeof currentData === 'undefined') {
        form.setFieldValue(['config', 'data'], getDefaultRequestBodyValue(contentType));
      }
      return;
    }

    if (previousContentTypeRef.current !== contentType) {
      form.setFieldValue(['config', 'data'], getDefaultRequestBodyValue(contentType));
    }

    previousContentTypeRef.current = contentType;
  }, [watchedContentType, form]);
}

function KeyValueListField({
  name,
  label,
  addLabel,
  addButtonFullWidth = false,
  extra,
  valueName = 'value',
  renderValueInput,
}: {
  name: NamePath;
  label: React.ReactNode;
  addLabel: React.ReactNode;
  addButtonFullWidth?: boolean;
  extra?: React.ReactNode;
  valueName?: string;
  renderValueInput?: (field: FormListFieldData) => React.ReactNode;
}) {
  const t = useT();

  return (
    <Form.Item label={label} extra={extra}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ display: 'flex' }}>
            {fields.map((field) => (
              <Flex key={field.key} align="flex-start" gap="small" style={{ width: '100%' }}>
                <Form.Item name={[field.name, 'name']} style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder={t('Name')} />
                </Form.Item>
                <Form.Item name={[field.name, valueName]} style={{ flex: 1, marginBottom: 0 }}>
                  {renderValueInput?.(field) ?? <WorkflowVariableInput placeholder={t('Value')} />}
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button aria-label={t('Delete')} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </Form.Item>
              </Flex>
            ))}
            <Button
              icon={<PlusOutlined />}
              onClick={() => add()}
              style={addButtonFullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }}
            >
              {addLabel}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

function MultipartValueRow({
  field,
  listName,
  onRemove,
}: {
  field: FormListFieldData;
  listName: (string | number)[];
  onRemove: (index: number) => void;
}) {
  const t = useT();
  const form = Form.useFormInstance();
  const valueType = Form.useWatch([...listName, field.name, 'valueType'], form) ?? DEFAULT_MULTIPART_VALUE_TYPE;

  const valueInput = useMemo(() => {
    if (valueType === 'file') {
      return (
        <WorkflowVariableInput
          variableOptions={{
            types: [isRequestFileVariableMatch],
          }}
        />
      );
    }

    return <WorkflowVariableInput placeholder={t('Value')} />;
  }, [t, valueType]);

  const valueFieldName = valueType === 'file' ? 'file' : 'text';

  return (
    <Flex align="flex-start" gap="small" style={{ width: '100%' }}>
      <Form.Item name={[field.name, 'name']} style={{ flex: 1, marginBottom: 0 }}>
        <Input placeholder={t('Name')} />
      </Form.Item>
      <Form.Item
        name={[field.name, 'valueType']}
        initialValue={DEFAULT_MULTIPART_VALUE_TYPE}
        style={{ marginBottom: 0 }}
      >
        <Select
          allowClear={false}
          options={MULTIPART_VALUE_TYPE_OPTIONS.map((item) => ({ ...item, label: t(item.label) }))}
        />
      </Form.Item>
      <Form.Item
        key={`${field.key}-${valueFieldName}`}
        name={[field.name, valueFieldName]}
        style={{ flex: 1, marginBottom: 0 }}
      >
        {valueInput}
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button aria-label={t('Delete')} icon={<DeleteOutlined />} onClick={() => onRemove(field.name)} />
      </Form.Item>
    </Flex>
  );
}

function MultipartListField({ name, label }: { name: NamePath; label: React.ReactNode }) {
  const t = useT();
  const listName = Array.isArray(name) ? name : [name];

  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ display: 'flex' }}>
            {fields.map((field) => (
              <MultipartValueRow key={field.key} field={field} listName={listName} onRemove={remove} />
            ))}
            <Button
              icon={<PlusOutlined />}
              onClick={() => add({ valueType: DEFAULT_MULTIPART_VALUE_TYPE })}
              style={{ width: '100%' }}
            >
              {t('Add key-value pairs')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

function RequestBodyField() {
  const t = useT();
  const form = Form.useFormInstance();
  const watchedContentType = Form.useWatch(['config', 'contentType'], form) as RequestContentType | undefined;
  const contentType =
    (form.getFieldValue(['config', 'contentType']) as RequestContentType | undefined) ??
    watchedContentType ??
    DEFAULT_REQUEST_CONTENT_TYPE;
  const bodyKind = getRequestBodyEditorKind(contentType);

  if (bodyKind === 'json') {
    return (
      <Form.Item name={['config', 'data']} label={t('Body')} initialValue={getDefaultRequestBodyValue(contentType)}>
        <WorkflowVariableJsonTextArea autoSize={{ minRows: 10 }} placeholder={t('Input request data')} />
      </Form.Item>
    );
  }

  if (bodyKind === 'pairs') {
    return (
      <KeyValueListField
        name={['config', 'data']}
        label={t('Body')}
        addLabel={t('Add key-value pairs')}
        renderValueInput={() => <WorkflowVariableInput placeholder={t('Value')} />}
      />
    );
  }

  if (bodyKind === 'multipart') {
    return <MultipartListField name={['config', 'data']} label={t('Body')} />;
  }

  return (
    <Form.Item name={['config', 'data']} label={t('Body')} initialValue={getDefaultRequestBodyValue(contentType)}>
      <WorkflowVariableTextArea
        autoSize={{ minRows: 10 }}
        placeholder={contentType === 'application/xml' ? '<?xml version="1.0" encoding="UTF-8"?>' : undefined}
      />
    </Form.Item>
  );
}

export function RequestFieldset() {
  const t = useT();
  useContentTypeReset();

  return (
    <>
      <Form.Item
        name={['config', 'method']}
        label={t('HTTP method')}
        rules={[{ required: true }]}
        initialValue={DEFAULT_REQUEST_METHOD}
      >
        <Select showSearch={false} allowClear={false} options={REQUEST_METHOD_OPTIONS} className="auto-width" />
      </Form.Item>

      <Form.Item name={['config', 'url']} label={t('URL')} rules={[{ required: true }]}>
        <WorkflowVariableInput placeholder="https://www.nocobase.com" />
      </Form.Item>

      <Form.Item name={['config', 'contentType']} label={t('Content-Type')} initialValue={DEFAULT_REQUEST_CONTENT_TYPE}>
        <Select allowClear={false} options={REQUEST_CONTENT_TYPE_OPTIONS} />
      </Form.Item>

      <KeyValueListField
        name={['config', 'headers']}
        label={t('Headers')}
        addLabel={t('Add request header')}
        addButtonFullWidth
        extra={t('"Content-Type" will be ignored from headers.')}
      />

      <KeyValueListField
        name={['config', 'params']}
        label={t('Parameters')}
        addLabel={t('Add parameter')}
        addButtonFullWidth
      />

      <RequestBodyField />

      <Form.Item name={['config', 'timeout']} label={t('Timeout config')} initialValue={DEFAULT_TIMEOUT}>
        <InputNumber addonAfter={t('ms')} min={1} step={1000} />
      </Form.Item>

      <Form.Item
        name={['config', 'onlyData']}
        valuePropName="checked"
        extra={t(
          'If enabled, only the response data will be saved into result, and the status code and headers will be ignored.',
        )}
        initialValue={true}
      >
        <Checkbox>{t('Only return response data')}</Checkbox>
      </Form.Item>

      <Form.Item name={['config', 'ignoreFail']} valuePropName="checked">
        <Checkbox>{t('Ignore failed request and continue workflow')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default RequestFieldset;
