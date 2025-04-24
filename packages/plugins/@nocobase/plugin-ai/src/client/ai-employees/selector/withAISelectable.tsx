/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from '@nocobase/client';
import React, { ComponentType, forwardRef, useEffect, useMemo, useReducer } from 'react';
import { useAISelectionContext } from './AISelectorProvider';
import { useFieldSchema, useField } from '@formily/react';
import { useForm } from '@formily/react';

const useStyles = createStyles(({ token, css }) => {
  return {
    aiSelectable: css`
      position: relative;
      transition: all 0.3s ease;
      &:hover {
        cursor: grab;
      }
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 210, 255, 0.2);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 100;
      }

      &:hover::after {
        opacity: 1;
      }
    `,
  };
});

function addListenerToFormV2(schema) {
  function traverse(current) {
    if (current && current['x-component'] === 'FormV2') {
      current.addProperty('__aiCtxCollector__', {
        type: 'void',
        'x-component': 'AIContextCollector',
        'x-component-props': {
          uid: schema['x-uid'],
        },
      });
      return true;
    }

    if (current.properties) {
      const propertyKeys = Object.keys(current.properties);
      for (const key of propertyKeys) {
        if (traverse(current.properties[key])) {
          return true;
        }
      }
    }

    return false;
  }

  traverse(schema);
}

export function withAISelectable<T = any>(
  WrappedComponent: React.ComponentType,
  options: {
    selectType: string;
  },
) {
  const { selectType } = options;
  const SelectableComponent: ComponentType<T> = (props) => {
    const { styles } = useStyles();
    const { selectable, selector, stopSelect } = useAISelectionContext();
    const fieldSchema = useFieldSchema();
    const field = useField() as any;
    if (selectType === 'blocks') {
      addListenerToFormV2(fieldSchema);
    }

    const handleSelect = () => {
      if (selectable !== selectType) {
        return;
      }
      selector?.onSelect?.({
        uid: fieldSchema['x-uid'],
        value: field?.value,
      });
      stopSelect();
    };

    return (
      <div className={selectable === selectType ? styles.aiSelectable : ''} onClick={handleSelect}>
        <WrappedComponent {...props} />
      </div>
    );
  };
  return SelectableComponent;
}
