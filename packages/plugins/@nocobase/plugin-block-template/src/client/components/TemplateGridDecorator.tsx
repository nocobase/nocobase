import React, { useCallback, useContext, useRef } from 'react';
import { observer, useFieldSchema, useField, useFormEffects } from '@formily/react';
import { onFieldReact } from '@formily/core';
import { useUpdate } from 'ahooks';
import { SchemaComponentOnChangeContext, useAPIClient } from '@nocobase/client';
import { useBlockTemplateInfo } from './BlockTemplateInfoContext';

export const TemplateGridDecorator = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const update = useUpdate();
  const preInitializerDisplay = useRef('block');
  const api = useAPIClient();
  const template = useBlockTemplateInfo();

  const { onChange: onChangeFromContext } = useContext(SchemaComponentOnChangeContext);

  fieldSchema['x-initializer-props'] = {
    style: {
      display: preInitializerDisplay.current,
    },
  };

  const updateInitializerDisplay = useCallback(
    (configured: boolean) => {
      const initializerDisplay = !configured ? 'block' : 'none';
      if (initializerDisplay !== preInitializerDisplay.current) {
        preInitializerDisplay.current = initializerDisplay;
        field.decoratorProps.style = {
          display: initializerDisplay,
        };
        update();
      }
    },
    [update, field],
  );

  const updateTemplateConfigured = useCallback(
    (configured: boolean) => {
      if (template && template.configured !== configured) {
        api.resource('blockTemplates').update({
          filter: {
            key: template.key,
          },
          values: { configured },
        });
        template.configured = configured;
      }
    },
    [api, template],
  );

  const onChange = useCallback(
    // schema will not be passed here, is it a core bug?
    () => {
      const configured = Object.keys(fieldSchema?.['properties'] || {}).length > 0;
      updateInitializerDisplay(configured);
      updateTemplateConfigured(configured);
      onChangeFromContext?.(fieldSchema);
    },
    [fieldSchema, updateInitializerDisplay, updateTemplateConfigured, onChangeFromContext],
  );

  useFormEffects(() => {
    onFieldReact('blocks.*.*', () => {
      const configured = Object.keys(fieldSchema['properties'] || {}).length > 0;
      updateInitializerDisplay(configured);
      updateTemplateConfigured(configured);
    });
  });

  return (
    <SchemaComponentOnChangeContext.Provider value={{ onChange }}>
      {props.children}
    </SchemaComponentOnChangeContext.Provider>
  );
});
