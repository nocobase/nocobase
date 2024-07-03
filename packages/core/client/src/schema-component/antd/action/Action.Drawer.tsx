/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Drawer } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ErrorFallback } from '../error-fallback';
import { useLastPopupInfo } from '../page/PagePopups';
import { useStyles } from './Action.Drawer.style';
import { useActionContext } from './hooks';
import { useSetAriaLabelForDrawer } from './hooks/useSetAriaLabelForDrawer';
import { ActionDrawerProps, ComposedActionDrawer, OpenSize } from './types';

const DrawerErrorFallback: React.FC<FallbackProps> = (props) => {
  const { visible, setVisible } = useActionContext();
  return (
    <Drawer open={visible} onClose={() => setVisible(false, true)} width="50%">
      <ErrorFallback {...props} />
    </Drawer>
  );
};

const openSizeWidthMap = new Map<OpenSize, string>([
  ['small', '30%'],
  ['middle', '50%'],
  ['large', '70%'],
]);
export const InternalActionDrawer: React.FC<ActionDrawerProps> = observer(
  (props) => {
    const { footerNodeName = 'Action.Drawer.Footer', ...others } = props;
    const { visible, setVisible, openSize = 'middle', drawerProps, modalProps } = useActionContext();
    const schema = useFieldSchema();
    const field = useField();
    const { componentCls, hashId } = useStyles();
    const footerSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === footerNodeName) {
        return s;
      }
      return buf;
    });
    const { isSubpageLast } = useLastPopupInfo();
    const rootStyle: React.CSSProperties = useMemo(() => {
      return {
        ...drawerProps?.style,
        ...others?.style,
        display: isSubpageLast ? 'none' : 'block',
      };
    }, [isSubpageLast, drawerProps?.style, others?.style]);

    if (process.env.__E2E__) {
      useSetAriaLabelForDrawer(visible);
    }

    return (
      <Drawer
        width={openSizeWidthMap.get(openSize)}
        title={field.title}
        {...others}
        {...drawerProps}
        rootStyle={rootStyle}
        destroyOnClose
        open={visible}
        onClose={() => setVisible(false, true)}
        rootClassName={classNames(componentCls, hashId, drawerProps?.className, others.className, 'reset')}
        footer={
          footerSchema && (
            <div className={'footer'}>
              <RecursionField
                basePath={field.address}
                schema={schema}
                onlyRenderProperties
                filterProperties={(s) => {
                  return s['x-component'] === footerNodeName;
                }}
              />
            </div>
          )
        }
      >
        <RecursionField
          basePath={field.address}
          schema={schema}
          onlyRenderProperties
          filterProperties={(s) => {
            return s['x-component'] !== footerNodeName;
          }}
        />
      </Drawer>
    );
  },
  { displayName: 'ActionDrawer' },
);

export const ActionDrawer: ComposedActionDrawer = (props) => (
  <ErrorBoundary FallbackComponent={DrawerErrorFallback} onError={(err) => console.log(err)}>
    <InternalActionDrawer {...props} />
  </ErrorBoundary>
);

ActionDrawer.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionDrawer.Footer' },
);

export default ActionDrawer;
