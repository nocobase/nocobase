/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { AIEmployee } from '../types';
import { SchemaComponent } from '@nocobase/client';
import { BlockSelector } from '../selector/BlockSelector';
import { useChatBoxContext } from './ChatBoxContext';
import { useT } from '../../locale';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import { Card } from 'antd';

const schemaMap = {
  blocks: {
    'x-component': 'BlockSelector',
    'x-component-props': {},
  },
  collections: {
    'x-component': 'CollectionSelect',
    'x-component-props': {
      multiple: true,
    },
  },
};

export const InfoForm: React.FC<{
  aiEmployee: AIEmployee;
}> = ({ aiEmployee }) => {
  const infoForm = aiEmployee?.chatSettings?.infoForm || [];
  const schemaProperties = infoForm.map((field) => ({
    name: field.name,
    title: field.title,
    type: 'string',
    'x-decorator': 'FormItem',
    ...schemaMap[field.type],
  }));
  return (
    <SchemaComponent
      components={{ BlockSelector }}
      schema={{
        type: 'void',
        properties: schemaProperties.reduce((acc, field) => {
          acc[field.name] = field;
          return acc;
        }, {}),
      }}
    />
  );
};

export const ReadPrettyInfoForm: React.FC<{
  aiEmployee: AIEmployee;
}> = ({ aiEmployee }) => {
  const infoForm = aiEmployee?.chatSettings?.infoForm || [];
  const schemaProperties = infoForm.map((field) => ({
    name: field.name,
    title: field.title,
    type: 'string',
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      style: {
        marginBottom: '5px',
      },
    },
    'x-component': 'Select',
    'x-read-pretty': true,
  }));
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: schemaProperties.reduce((acc, field) => {
          acc[field.name] = field;
          return acc;
        }, {}),
      }}
    />
  );
};

export const InfoFormMessage: React.FC<{
  values: any;
}> = ({ values }) => {
  const { currentEmployee } = useChatBoxContext();
  const t = useT();
  const form = useMemo(
    () =>
      createForm({
        initialValues: values,
      }),
    [values],
  );
  return (
    <>
      {t('I will use the following information')}
      <SchemaComponent
        components={{ ReadPrettyInfoForm }}
        schema={{
          type: 'void',
          properties: {
            [uid()]: {
              type: 'void',
              'x-decorator': 'FormV2',
              'x-decorator-props': {
                form,
                layout: 'horizontal',
              },
              'x-component': 'ReadPrettyInfoForm',
              'x-component-props': {
                aiEmployee: currentEmployee,
              },
            },
          },
        }}
      />
    </>
  );
};
