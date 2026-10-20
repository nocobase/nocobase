/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { uid } from '@formily/shared';
import { ISchema, useForm } from '@formily/react';
import {
  ActionContextProvider,
  useActionContext,
  SchemaComponent,
  useApp,
  CollectionFieldOptions,
} from '@nocobase/client';
import { useT } from '../locale';

const useCloseActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = (onSubmit: (values: TimelineConfigFormValues) => void) => {
  const { setVisible } = useActionContext();
  const form = useForm<TimelineConfigFormValues>();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      onSubmit(values);
      setVisible(false);
    },
  };
};

const createSchema = (fields: CollectionFieldOptions, t: ReturnType<typeof useT>): ISchema => {
  return {
    type: 'void',
    name: uid(),
    'x-component': 'Action.Modal',
    'x-component-props': {
      width: 600,
    },
    'x-decorator': 'FormV2',
    properties: {
      titleField: {
        type: 'string',
        title: t('Title Field'),
        required: true,
        enum: fields
          ?.filter((item) => item.interface == 'input' || item.interface == 'textarea')
          ?.map((item) => ({ label: item.uiSchema?.title || item.name, value: item.name })),
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
      timeField: {
        type: 'string',
        title: t('Time Field'),
        required: true,
        enum: fields
          .filter((item) => item.type.includes('date'))
          .map((item) => ({ label: item.uiSchema?.title || item.name, value: item.name })),
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
      colorField: {
        type: 'string',
        title: t('Color Field'),
        required: false,
        enum: fields
          .filter((item) => item.type == 'string' && item.interface == 'select')
          .map((item) => ({ label: item.uiSchema?.title || item.name, value: item.name })),
        'x-decorator': 'FormItem',
        'x-component': 'Select',
      },
      footer: {
        type: 'void',
        'x-component': 'Action.Modal.Footer',
        properties: {
          close: {
            title: t('Close'),
            'x-component': 'Action',
            'x-component-props': {
              type: 'default',
            },
            'x-use-component-props': 'useCloseActionProps',
          },
          submit: {
            title: t('Submit'),
            'x-component': 'Action',
            'x-use-component-props': 'useSubmitActionProps',
          },
        },
      },
    },
  };
};

interface TimelineConfigFormValues {
  timeField: string;
  titleField: string;
  colorField: string;
}

export interface TimelineConfigFormProps {
  collection: string;
  dataSource?: string;
  onSubmit: (values: TimelineConfigFormValues) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const TimelineInitializerConfigForm: FC<TimelineConfigFormProps> = ({
  visible,
  setVisible,
  collection,
  dataSource,
  onSubmit,
}) => {
  const app = useApp();
  const t = useT();
  const fields = useMemo(
    () => app.getCollectionManager(dataSource).getCollection(collection).getFields(),
    [collection, dataSource],
  );
  const schema = useMemo(() => createSchema(fields, t), [fields]);

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <SchemaComponent
        schema={schema}
        scope={{ useSubmitActionProps: useSubmitActionProps.bind(null, onSubmit), useCloseActionProps }}
      />
    </ActionContextProvider>
  );
};
