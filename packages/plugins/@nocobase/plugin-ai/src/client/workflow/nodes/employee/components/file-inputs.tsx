/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer, useField, useForm } from '@formily/react';
import { DataSourceCollectionCascader } from '@nocobase/client';
import { Form, Select } from 'antd';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client';
import ListCollapse from '../../../../components/ListCollapse';
import { useT } from '../../../../locale';

type FileInputItem = {
  type?: 'file_id' | 'file_url';
  collection?: string;
  value?: string;
};

const defaultFileInput: FileInputItem = {
  type: 'file_id',
};

export const FileInputs: React.FC = observer(() => {
  const t = useT();
  const field = useField();
  const form = useForm();
  const files = (form.getValuesIn(field.path) ?? []) as FileInputItem[];

  const updateFiles = (next: FileInputItem[]) => {
    form.setValuesIn(field.path, next);
  };

  const updateItem = (index: number, patch: Partial<FileInputItem>) => {
    updateFiles(files.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <ListCollapse<FileInputItem>
      value={files}
      onChange={updateFiles}
      defaultValue={defaultFileInput}
      addText={t('Add file')}
      itemTitle={t('Files')}
      renderHeader={(_, index) => `${t('Files')} ${index + 1}`}
      renderItem={(item, index) => (
        <Form component={false} layout="vertical">
          <Form.Item label={t('Attachment Type')} layout="vertical" required>
            <Select
              value={item.type ?? 'file_id'}
              options={[
                { label: t('File (load via Files collection)'), value: 'file_id' },
                { label: t('File (load via URL)'), value: 'file_url' },
              ]}
              onChange={(type) =>
                updateItem(index, {
                  type,
                  collection: type === 'file_id' ? item.collection : undefined,
                })
              }
            />
          </Form.Item>
          {item.type !== 'file_url' ? (
            <Form.Item label={t('Collection')} layout="vertical" required>
              <DataSourceCollectionCascader
                value={item.collection}
                dataSourceFilter={(dataSource) => dataSource.options.key === 'main'}
                collectionFilter={(collection) => collection.options.template === 'file'}
                onChange={(collection) => updateItem(index, { collection })}
              />
            </Form.Item>
          ) : null}
          <Form.Item label={item.type === 'file_url' ? t('URL') : t('ID')} layout="vertical" required>
            <WorkflowVariableInput
              variableOptions={{}}
              value={item.value}
              changeOnSelect
              onChange={(value) => updateItem(index, { value })}
            />
          </Form.Item>
        </Form>
      )}
    />
  );
});
