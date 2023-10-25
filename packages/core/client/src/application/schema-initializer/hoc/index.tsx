import React from 'react';
import { ComponentType, useCallback } from 'react';
import { Popover, PopoverProps } from 'antd';
import { ISchema, observer } from '@formily/react';

import { useDesignable } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerV2Context } from '../context';
import { useGlobalStyles } from '../components/style';

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
      popoverProps,
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

    const { wrapSSR, hashId, componentCls } = useGlobalStyles();

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
            {...popoverProps}
            content={wrapSSR(
              <div
                className={`${componentCls} ${hashId}`}
                style={{
                  maxHeight: 'calc(50vh - 50px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                {children}
              </div>,
            )}
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
