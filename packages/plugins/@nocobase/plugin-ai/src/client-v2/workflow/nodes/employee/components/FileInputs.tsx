/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { Form, Select } from 'antd';
import { useFlowEngine } from '@nocobase/flow-engine';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';
import { FormValueRegistry } from '../../../components/FormValueRegistry';
import { WorkflowListCollapse } from '../../../components/WorkflowListCollapse';
import type { AIEmployeeFileInput, AIEmployeeFileInputType } from '../../../types';
import { useT } from '../../../../locale';

const defaultFileInput: AIEmployeeFileInput = {
  type: 'attachments',
};

type CollectionLike = {
  name?: string;
  title?: string;
  hidden?: boolean;
  options?: {
    template?: string;
  };
};

type DataSourceLike = {
  getCollections?: () => CollectionLike[];
  collectionManager?: {
    getCollections?: () => CollectionLike[];
  };
};

type DataSourceManagerLike = {
  getDataSource?: (key: string) => DataSourceLike | undefined;
};

function toFiles(value?: AIEmployeeFileInput[]) {
  return Array.isArray(value) ? value : [];
}

function getCollectionOptions(dataSourceManager?: DataSourceManagerLike) {
  const dataSource = dataSourceManager?.getDataSource?.('main');
  const collections = dataSource?.getCollections?.() ?? dataSource?.collectionManager?.getCollections?.() ?? [];
  return collections
    .filter((collection) => !collection.hidden && collection.options?.template === 'file' && collection.name)
    .map((collection) => ({
      label: collection.title ?? collection.name,
      value: collection.name as string,
    }));
}

function getValueLabel(t: (key: string) => string, type?: AIEmployeeFileInputType) {
  switch (type) {
    case 'attachments':
      return t('Attachment field');
    case 'file_id':
      return t('ID');
    case 'file_url':
      return t('URL');
    default:
      return t('Unknown');
  }
}

export function FileInputs() {
  const t = useT();
  const form = Form.useFormInstance();
  const flowEngine = useFlowEngine();
  const watchedFiles = Form.useWatch(['config', 'files'], form);
  const files = toFiles(watchedFiles ?? form.getFieldValue(['config', 'files']));
  const collectionOptions = useMemo(
    () => getCollectionOptions(flowEngine.context.dataSourceManager as DataSourceManagerLike | undefined),
    [flowEngine.context.dataSourceManager],
  );

  const updateFiles = useCallback(
    (next: AIEmployeeFileInput[]) => {
      form.setFieldValue(['config', 'files'], next);
    },
    [form],
  );

  const updateItem = useCallback(
    (index: number, patch: Partial<AIEmployeeFileInput>) => {
      updateFiles(files.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    },
    [files, updateFiles],
  );

  return (
    <>
      <Form.Item name={['config', 'files']} noStyle>
        <FormValueRegistry />
      </Form.Item>
      <WorkflowListCollapse<AIEmployeeFileInput>
        value={files}
        onChange={updateFiles}
        defaultValue={defaultFileInput}
        getDefaultValue={() => ({ type: 'attachments' })}
        addText={t('Add file')}
        itemTitle={t('Files')}
        renderHeader={(_, index) => `${t('Files')} ${index + 1}`}
        renderItem={(item, index) => (
          <>
            <Form.Item label={t('Attachment Type')} required>
              <Select<AIEmployeeFileInputType>
                value={item.type}
                options={[
                  { label: t('File (load via Attachment)'), value: 'attachments' },
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
            {item.type === 'file_id' ? (
              <Form.Item label={t('Collection')} required>
                <Select
                  value={item.collection}
                  options={collectionOptions}
                  onChange={(collection) => updateItem(index, { collection })}
                />
              </Form.Item>
            ) : null}
            <Form.Item label={getValueLabel(t, item.type)} required>
              <WorkflowVariableInput value={item.value} onChange={(value) => updateItem(index, { value })} />
            </Form.Item>
          </>
        )}
      />
    </>
  );
}

export default FileInputs;
