/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { onFieldValueChange } from '@formily/core';
import { useForm, useFormEffects, ISchema } from '@formily/react';
import { css, SchemaComponent } from '@nocobase/client';
import React, { useState } from 'react';
import { NAMESPACE } from '../../locale';
import { SCHEDULE_MODE, scheduleModeOptions } from './constants';
import { EndsByField } from './EndsByField';
import { OnField } from './OnField';
import { RepeatField } from './RepeatField';
import { ScheduleModes } from './ScheduleModes';

export const ScheduleConfig = () => {
  const { values = {}, clearFormGraph } = useForm();
  const [mode, setMode] = useState(values.mode);
  useFormEffects(() => {
    onFieldValueChange('mode', (field) => {
      setMode(field.value);
      clearFormGraph('collection');
      clearFormGraph('startsOn');
      clearFormGraph('repeat');
      clearFormGraph('endsOn');
      clearFormGraph('limit');
    });
  });

  return (
    <>
      <SchemaComponent
        schema={{
          type: 'number',
          title: `{{t("Trigger mode", { ns: "${NAMESPACE}" })}}`,
          name: 'mode',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: scheduleModeOptions,
          required: true,
          'x-disabled': true,
          default: SCHEDULE_MODE.STATIC,
        }}
      />
      <SchemaComponent
        schema={
          {
            type: 'void',
            properties: {
              [`mode-${mode}`]: {
                type: 'void',
                'x-component': 'fieldset',
                'x-component-props': {
                  className: css`
                    .ant-input-number {
                      width: auto;
                      min-width: 6em;
                    }

                    .ant-picker {
                      width: auto;
                    }
                  `,
                },
                properties: ScheduleModes[mode]?.fieldset,
              },
            },
          } as ISchema
        }
        components={{
          OnField,
          RepeatField,
          EndsByField,
        }}
      />
    </>
  );
};
