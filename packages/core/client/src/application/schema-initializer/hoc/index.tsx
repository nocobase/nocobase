import React from 'react';
import { ComponentType, useCallback } from 'react';
import { Popover } from 'antd';
import { ISchema, observer } from '@formily/react';

import { useDesignable } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerV2Context } from '../context';

const defaultWrap = (s: ISchema) => s;

export function withInitializer<T>(C: ComponentType<T>, cProps: T) {
  const WithInitializer = observer((props: SchemaInitializerOptions) => {
    const { designable, insertAdjacent } = useDesignable();
    const {
      insert,
      useInsert,
      wrap = defaultWrap,
      insertPosition = 'beforeEnd',
      onSuccess,
      designable: propsDesignable,
      dropdownProps,
      children,
      noDropdown,
    } = props;

    // 插入 schema 的能力
    const insertCallback = useInsert ? useInsert() : insert;
    const insertSchema = useCallback(
      (schema) => {
        if (insertCallback) {
          insertCallback(wrap(schema));
        } else {
          insertAdjacent(insertPosition, wrap(schema), { onSuccess });
        }
      },
      [insertCallback, wrap, insertAdjacent, insertPosition, onSuccess],
    );

    // designable 为 false 时，不渲染
    if (!designable && propsDesignable !== true) {
      return null;
    }

    return (
      <SchemaInitializerV2Context.Provider value={{ insert: insertSchema, options: props }}>
        {noDropdown ? (
          React.createElement(C, cProps)
        ) : (
          <Popover
            content={
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
            }
          >
            <span>{React.createElement(C, cProps)}</span>
          </Popover>
        )}
      </SchemaInitializerV2Context.Provider>
    );
  });

  WithInitializer.displayName = `WithInitializer(${C.displayName || C.name})`;
  return WithInitializer;
}
