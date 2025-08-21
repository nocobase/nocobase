/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ArrayTable } from '@formily/antd-v5';
import { onFieldValueChange } from '@formily/core';
import { useForm, useFormEffects } from '@formily/react';
import { Flex, Tag } from 'antd';
import { joinCollectionName, useCompile, usePlugin, DataSourceProvider, RemoteSelect } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export function TriggerWorkflowSelect(props) {
  const { t } = useTranslation();
  const index = ArrayTable.useIndex();
  const { setValuesIn } = useForm();
  const compile = useCompile();
  const dataSourceKey = props.collection?.dataSource.options.key;
  const collectionName = props.collection?.options.name;
  const [workflowCollection, setWorkflowCollection] = useState(joinCollectionName(dataSourceKey, collectionName));

  const workflowPlugin = usePlugin('workflow') as any;
  const triggerOptions = workflowPlugin.useTriggersOptions();

  useFormEffects(() => {
    onFieldValueChange(`group[${index}].context`, (field) => {
      let collection: any = props.collection;
      if (field.value) {
        const paths = field.value.split('.');
        for (let i = 0; i < paths.length && collection; i++) {
          const path = paths[i];
          const associationField = collection.fields.find((f) => f.name === path);
          if (associationField) {
            collection = props.collection?.dataSource.collectionManager.getCollection(
              associationField.target,
              dataSourceKey,
            );
          }
        }
      }
      setWorkflowCollection(joinCollectionName(dataSourceKey, collectionName));
      setValuesIn(`group[${index}].workflowKey`, null);
    });
  });

  const optionFilter = useCallback(
    ({ key, type, config }) => {
      if (key === props.value) {
        return true;
      }
      if (typeof props.optionFilter === 'function') {
        return props.optionFilter({ key, type, config });
      }
      const trigger = workflowPlugin.triggers.get(type);
      if (trigger.actionTriggerableScope === true) {
        return true;
      }
      if (props.scope && typeof trigger.actionTriggerableScope === 'function') {
        return trigger.actionTriggerableScope(config, props.scope);
      }
      return false;
    },
    [props, workflowPlugin.triggers],
  );

  return (
    <DataSourceProvider dataSource="main">
      <RemoteSelect
        manual={false}
        placeholder={t('Select workflow', { ns: 'workflow' })}
        fieldNames={{
          label: 'title',
          value: 'key',
        }}
        service={{
          resource: 'workflows',
          action: 'list',
          params: {
            filter: {
              type: props.types,
              enabled: true,
              'config.collection': workflowCollection,
            },
          },
        }}
        optionFilter={optionFilter}
        optionRender={({ label, data }) => {
          const typeOption = triggerOptions.find((item) => item.value === data.type);
          return typeOption ? (
            <Flex justify="space-between">
              <span>{label}</span>
              <Tag color={typeOption.color}>{compile(typeOption.label)}</Tag>
            </Flex>
          ) : (
            label
          );
        }}
        {...props}
      />
    </DataSourceProvider>
  );
}
