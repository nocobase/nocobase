import React, { useCallback, useContext, useRef } from 'react';
import { observer, useFieldSchema, useField, useFormEffects } from '@formily/react';
import { onFieldReact } from '@formily/core';
import { useUpdate } from 'ahooks';
import { SchemaComponentOnChangeContext } from '@nocobase/client';
import { Schema } from '@nocobase/utils';

export const TemplateGridDecorator = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const update = useUpdate();
  const preInitializerDisplay = useRef('block');

  const { onChange: onChangeFromContext } = useContext(SchemaComponentOnChangeContext);

  fieldSchema['x-initializer-props'] = {
    style: {
      display: preInitializerDisplay.current,
    },
  };

  const updateInitializerDisplay = useCallback(() => {
    const initializerDisplay = Object.keys(fieldSchema['properties'] || {}).length === 0 ? 'block' : 'none';
    if (initializerDisplay !== preInitializerDisplay.current) {
      preInitializerDisplay.current = initializerDisplay;
      field.decoratorProps.style = {
        display: initializerDisplay,
      };
      update();
    }
  }, [update, fieldSchema, field]);

  const onChange = useCallback(
    (schema?: Schema) => {
      updateInitializerDisplay();
      onChangeFromContext?.(schema);
    },
    [updateInitializerDisplay, onChangeFromContext],
  );

  useFormEffects(() => {
    onFieldReact('blocks.*.*', () => {
      updateInitializerDisplay();
    });
  });

  return (
    <SchemaComponentOnChangeContext.Provider value={{ onChange }}>
      {props.children}
    </SchemaComponentOnChangeContext.Provider>
  );
});
