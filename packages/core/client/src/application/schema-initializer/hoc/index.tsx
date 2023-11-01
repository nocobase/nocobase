import React, { useMemo, useState } from 'react';
import { ComponentType, useCallback } from 'react';
import { Popover } from 'antd';
import { ISchema, observer } from '@formily/react';

import { useDesignable } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerContext } from '../context';
import { useSchemaInitializerStyles } from '../components/style';

const defaultWrap = (s: ISchema) => s;

export function withInitializer<T>(C: ComponentType<T>) {
  const WithInitializer = observer((props: SchemaInitializerOptions<T>) => {
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
      noPopover,
      style,
      componentProps,
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

    const { wrapSSR, hashId, componentCls } = useSchemaInitializerStyles();
    const [visible, setVisible] = useState(false);

    const cProps = useMemo(
      () => ({
        options: props,
        style,
        ...componentProps,
      }),
      [componentProps, props, style],
    );

    // designable 为 false 时，不渲染
    if (!designable && propsDesignable !== true) {
      return null;
    }

    return (
      <SchemaInitializerContext.Provider
        value={{
          visible,
          setVisible,
          insert: insertSchema,
          options: props,
        }}
      >
        {noPopover ? (
          React.createElement(C, cProps)
        ) : (
          <Popover
            {...popoverProps}
            open={visible}
            onOpenChange={setVisible}
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
      </SchemaInitializerContext.Provider>
    );
  });

  WithInitializer.displayName = `WithInitializer(${C.displayName || C.name})`;
  return WithInitializer;
}
