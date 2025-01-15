/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType } from 'react';
import { observer, useFieldSchema } from '@formily/react';
import { useEventDefinitions, useEventSettings } from '../hooks';
import { SchemaSettingsKey, SchemaDefinitionsKey } from '../types';

const WarpComponent = (props: any) => {
  const fieldSchema = useFieldSchema();
  useEventDefinitions(fieldSchema?.[SchemaDefinitionsKey]);
  useEventSettings(fieldSchema?.[SchemaSettingsKey]);
  return props.children;
};

export const withSchemaEvent = (Component: ComponentType) => {
  const displayName = Component.displayName || Component.name;

  const ComponentParse = (props: any) => {
    return (
      <WarpComponent>
        <Component {...props}>{props.children}</Component>
      </WarpComponent>
    );
  };
  Component.displayName = displayName;
  ComponentParse.displayName = `withSchemaEvent(${displayName})`;
  return ComponentParse;
};
