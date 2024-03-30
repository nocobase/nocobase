import { cx } from '@emotion/css';
import { RecursionField, observer, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React, { CSSProperties, useContext } from 'react';
import { createPortal } from 'react-dom';
import { DndContext } from '../../common';
import { useDesignable, useProps } from '../../hooks';
import { useSchemaInitializerRender } from '../../../application';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

interface ActionBarContextForceProps {
  layout?: 'one-column' | 'tow-columns';
  style?: CSSProperties;
  className?: string;
}

export interface ActionBarContextValue {
  container?: Element | DocumentFragment;
  /**
   * override props
   */
  forceProps?: ActionBarContextForceProps;
  parentComponents?: string[];
}

const ActionBarContext = React.createContext<ActionBarContextValue>({
  container: null,
});

export const ActionBarProvider: React.FC<ActionBarContextValue> = ({ children, ...props }) => {
  return <ActionBarContext.Provider value={props}>{children}</ActionBarContext.Provider>;
};

export const useActionBarContext = () => {
  return useContext(ActionBarContext);
};

const Portal: React.FC = (props) => {
  const filedSchema = useFieldSchema();
  const { container, parentComponents = ['BlockItem', 'CardItem'] } = useActionBarContext();
  return (
    <>
      {container && parentComponents.includes(filedSchema.parent['x-component'])
        ? createPortal(props.children, container)
        : props.children}
    </>
  );
};

export const ActionBar = withDynamicSchemaProps(
  observer((props: any) => {
    const { forceProps = {} } = useActionBarContext();

    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { layout = 'tow-columns', style, spaceProps, ...others } = { ...useProps(props), ...forceProps } as any;

    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
    const { designable } = useDesignable();

    if (layout === 'one-column') {
      return (
        <Portal>
          <DndContext>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}
              {...others}
              className={cx(others.className, 'nb-action-bar')}
            >
              {props.children && (
                <div>
                  <Space {...spaceProps} style={{ flexWrap: 'wrap' }}>
                    {fieldSchema.mapProperties((schema, key) => {
                      return <RecursionField key={key} name={key} schema={schema} />;
                    })}
                  </Space>
                </div>
              )}
              {render({ style: { margin: '0 !important' } })}
            </div>
          </DndContext>
        </Portal>
      );
    }
    const hasActions = Object.keys(fieldSchema.properties ?? {}).length > 0;
    return (
      <div
        style={
          !designable && !hasActions
            ? undefined
            : {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                overflowX: 'auto',
                flexShrink: 0,
                ...style,
              }
        }
        {...others}
        className={cx(others.className, 'nb-action-bar')}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            overflow: 'hidden',
            flexWrap: 'wrap',
          }}
        >
          <DndContext>
            <Space {...spaceProps}>
              {fieldSchema.mapProperties((schema, key) => {
                if (schema['x-align'] !== 'left') {
                  return null;
                }
                return <RecursionField key={key} name={key} schema={schema} />;
              })}
            </Space>
            <Space {...spaceProps}>
              {fieldSchema.mapProperties((schema, key) => {
                if (schema['x-align'] === 'left') {
                  return null;
                }
                return <RecursionField key={key} name={key} schema={schema} />;
              })}
            </Space>
          </DndContext>
        </div>
        {render()}
      </div>
    );
  }),
  { displayName: 'ActionBar' },
);
