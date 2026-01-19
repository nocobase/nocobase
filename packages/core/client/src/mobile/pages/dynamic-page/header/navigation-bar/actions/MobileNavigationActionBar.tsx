/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@emotion/css';
import { ISchema, observer, useFieldSchema } from '@formily/react';
import { SpaceProps } from 'antd';
import React, { CSSProperties, useContext } from 'react';
import { withDynamicSchemaProps } from '../../../../../../hoc/withDynamicSchemaProps';
import { useSchemaToolbar } from '../../../../../../application/schema-toolbar/context';
import { useProps } from '../../../../../../schema-component/hooks/useProps';
import { useSchemaInitializerRender } from '../../../../../../application/schema-initializer/hooks/useSchemaInitializerRender';
import { DndContext } from '../../../../../../schema-component/common/dnd-context';
import { NocoBaseRecursionField } from '../../../../../../formily/NocoBaseRecursionField';

export interface MobileActionBarProps {
  style?: CSSProperties;
  className?: string;
  spaceProps?: SpaceProps;
  layout?: string;
}

export interface MobileActionBarContextValue {
  container?: Element | DocumentFragment;
  forceProps?: MobileActionBarProps;
  parentComponents?: string[];
}

const ActionBarContext = React.createContext<MobileActionBarContextValue>({
  container: undefined,
});

export const MobileActionBarProvider: React.FC<MobileActionBarContextValue> = ({ children, ...props }) => {
  return <ActionBarContext.Provider value={props}>{children}</ActionBarContext.Provider>;
};

export const useMobileActionBarContext = () => {
  return useContext(ActionBarContext);
};

export const MobileNavigationActionBar = withDynamicSchemaProps(
  observer((props: any) => {
    const { forceProps = {} } = useMobileActionBarContext();
    const { style, spaceProps, ...others } = { ...useProps(props), ...forceProps } as any;
    const { position } = useSchemaToolbar();

    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], {
      ...fieldSchema['x-initializer-props'],
      wrap(actionSchema: ISchema) {
        return {
          'x-position': position,
          ...actionSchema,
        };
      },
    });
    return (
      <DndContext>
        {position !== 'bottom' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              ...style,
              marginTop: 0,
              justifyContent: position === 'left' ? 'flex-start' : 'flex-end',
            }}
            {...others}
            data-testid={`mobile-navigation-action-bar-${position}`}
            className={cx(others.className, 'nb-action-bar')}
          >
            {position === 'left' && render({})}
            {props.children && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <NocoBaseRecursionField
                  onlyRenderProperties
                  schema={fieldSchema}
                  filterProperties={(schema) => schema['x-position'] === position}
                />
              </div>
            )}
            {position === 'right' && render({})}
          </div>
        ) : (
          <NocoBaseRecursionField
            onlyRenderProperties
            schema={fieldSchema}
            filterProperties={(schema) => schema['x-position'] === position}
          />
        )}
      </DndContext>
    );
  }),
  { displayName: 'MobileNavigationActionBar' },
);
