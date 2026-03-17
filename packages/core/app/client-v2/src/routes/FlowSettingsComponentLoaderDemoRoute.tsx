/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import React from 'react';
import { useApp } from '../../../../client-v2/src/hooks/useApp';

const SchemaField = createSchemaField();

export default function FlowSettingsComponentLoaderDemoRoute() {
  const app = useApp();
  const form = React.useMemo(() => createForm(), []);

  return (
    <div>
      <div>Flow Settings Component Loader Demo Route</div>
      <FormProvider form={form}>
        <SchemaField
          schema={{
            type: 'object',
            properties: {
              demo: {
                type: 'void',
                'x-component': 'DemoFlowSettingsLazyField',
              },
            },
          }}
          components={app.flowEngine.flowSettings.components}
        />
      </FormProvider>
    </div>
  );
}
