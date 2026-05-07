import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { useFlowEngineContext } from '@nocobase/flow-engine';
import React from 'react';
import type { Application } from '@nocobase/client-v2';

const SchemaField = createSchemaField();

export default function FlowSettingsComponentLoaderDemoRoute() {
  const app = useFlowEngineContext().app as Application;
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
