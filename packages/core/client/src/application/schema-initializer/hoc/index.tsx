import React from 'react';
import { ComponentType, useCallback } from 'react';
import { Card, Dropdown } from 'antd';
import classNames from 'classnames';
import { ISchema, observer } from '@formily/react';

import { useDesignable } from '../../../schema-component';
import { SchemaInitializerOptions } from '../types';
import { SchemaInitializerV2Context } from '../hooks';

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
      items,
      designable: propsDesignable,
      dropdownProps,
      children,
      noDropdown,
    } = props;
    // designable 为 false 时，不渲染
    if (!designable && propsDesignable !== true) {
      return null;
    }

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

    return (
      <SchemaInitializerV2Context.Provider value={{ insert: insertSchema, options: props }}>
        {noDropdown || !items || items.length === 0 ? (
          React.createElement(C, cProps)
        ) : (
          <Dropdown
            className={classNames('nb-schema-initializer-button')}
            openClassName={`nb-schema-initializer-button-open`}
            {...dropdownProps}
            dropdownRender={() => <Card>{children}</Card>}
          >
            <span>{React.createElement(C, cProps)}</span>
          </Dropdown>
        )}
      </SchemaInitializerV2Context.Provider>
    );
  });

  WithInitializer.displayName = `WithInitializer(${C.displayName || C.name})`;
  return WithInitializer;
}
