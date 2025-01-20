/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { observer, useFieldSchema, useField, useFormEffects } from '@formily/react';
import { onFieldReact } from '@formily/core';
import { useUpdate } from 'ahooks';
import { SchemaComponentOnChangeContext, useAPIClient } from '@nocobase/client';
import { useBlockTemplateInfo } from './BlockTemplateInfoContext';
import { Schema } from '@nocobase/utils';

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

  // used to hide add blocks button in toolbar, for the moment, only support one layer
  const updateInitializer = useCallback(
    (display: string) => {
      let updatedLayer = 0;
      const updater = (s: Schema) => {
        if (s['x-toolbar'] || s['x-settings']) {
          s['x-toolbar-props'] = {
            ...s['x-toolbar-props'],
            initializer: display === 'block' ? undefined : false,
          };
          updatedLayer++;
        }
        if (updatedLayer > 0) {
          return;
        }
        if (s.properties) {
          Object.keys(s.properties).forEach((key) => {
            updater(s.properties[key]);
          });
        }
      };
      updater(fieldSchema);
    },
    [fieldSchema],
  );

  const updateInitializerDisplay = useCallback(
    (configured: boolean) => {
      const initializerDisplay = !configured ? 'block' : 'none';
      if (initializerDisplay !== preInitializerDisplay.current) {
        preInitializerDisplay.current = initializerDisplay;
        field.decoratorProps.style = {
          display: initializerDisplay,
        };
        updateInitializer(initializerDisplay);
        field.form.clearFormGraph(); // refresh form graph
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

  const syncTemplateInfo = useCallback(() => {
    const configured = Object.keys(fieldSchema['properties'] || {}).length > 0;
    updateInitializerDisplay(configured);
    updateTemplateConfigured(configured);
  }, [fieldSchema, updateInitializerDisplay, updateTemplateConfigured]);

  const onChange = useCallback(
    // schema will not be passed here, is it a core bug?
    () => {
      syncTemplateInfo();
      onChangeFromContext?.(fieldSchema);
    },
    [fieldSchema, syncTemplateInfo, onChangeFromContext],
  );

  useFormEffects(() => {
    onFieldReact('blocks.*.*', () => {
      syncTemplateInfo();
    });
  });

  useEffect(() => {
    syncTemplateInfo();
  }, [syncTemplateInfo]);

  return (
    <SchemaComponentOnChangeContext.Provider value={{ onChange }}>
      {props.children}
    </SchemaComponentOnChangeContext.Provider>
  );
});
