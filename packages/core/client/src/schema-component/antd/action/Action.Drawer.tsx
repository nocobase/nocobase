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
import { useTranslation } from 'react-i18next';
import React, { FC, startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { ErrorFallback } from '../error-fallback';
import { useCurrentPopupContext } from '../page/PagePopups';
import { TabsContextProvider, useTabsContext } from '../tabs/context';
import { useStyles } from './Action.Drawer.style';
import { ActionContextNoRerender } from './context';
import { useActionContext } from './hooks';
import { useSetAriaLabelForDrawer } from './hooks/useSetAriaLabelForDrawer';
import { ActionDrawerProps, ComposedActionDrawer, OpenSize } from './types';
import { getZIndex, useZIndexContext, zIndexContext } from './zIndexContext';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

const MemoizeRecursionField = React.memo(RecursionField);
MemoizeRecursionField.displayName = 'MemoizeRecursionField';

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

const ActionDrawerContent: FC<{ footerNodeName: string; field: any; schema: any }> = React.memo(
  ({ footerNodeName, field, schema }) => {
    // Improve the speed of opening the drawer
    const [deferredVisible, setDeferredVisible] = useState(false);
    const filterOutFooterNode = useCallback(
      (s) => {
        return s['x-component'] !== footerNodeName;
      },
      [footerNodeName],
    );

    useEffect(() => {
      startTransition(() => {
        setDeferredVisible(true);
      });
    }, []);

    if (!deferredVisible) {
      return null;
    }

    return (
      <NocoBaseRecursionField
        basePath={field.address}
        schema={schema}
        onlyRenderProperties
        filterProperties={filterOutFooterNode}
      />
    );
  },
);

ActionDrawerContent.displayName = 'ActionDrawerContent';

export const InternalActionDrawer: React.FC<ActionDrawerProps> = observer(
  (props) => {
    const { footerNodeName = 'Action.Drawer.Footer', zIndex: _zIndex, onClose: onCloseFromProps, ...others } = props;
    const { visible, setVisible, openSize = 'middle', drawerProps } = useActionContext();
    const schema = useFieldSchema();
    const field = useField();
    const { t } = useTranslation();
    const { componentCls, hashId } = useStyles();
    const tabContext = useTabsContext();
    const parentZIndex = useZIndexContext();
    const footerSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === footerNodeName) {
        return s;
      }
      return buf;
    });
    const { hidden } = useCurrentPopupContext();
    const rootStyle: React.CSSProperties = useMemo(() => {
      return {
        ...drawerProps?.style,
        ...others?.style,
        display: hidden ? 'none' : 'block',
      };
    }, [hidden, drawerProps?.style, others?.style]);

    if (process.env.__E2E__) {
      useSetAriaLabelForDrawer(visible);
    }

    const zIndex = getZIndex('drawer', _zIndex || parentZIndex, props.level || 0);

    const onClose = useCallback(
      (e) => {
        setVisible(false, true);
        onCloseFromProps?.(e);
      },
      [setVisible, onCloseFromProps],
    );
    const keepFooterNode = useCallback(
      (s) => {
        return s['x-component'] === footerNodeName;
      },
      [footerNodeName],
    );
    return (
      <ActionContextNoRerender>
        <zIndexContext.Provider value={zIndex}>
          <TabsContextProvider {...tabContext} tabBarExtraContent={null}>
            <Drawer
              zIndex={zIndex}
              width={openSizeWidthMap.get(openSize)}
              title={typeof field.title === 'string' ? t(field.title, { ns: NAMESPACE_UI_SCHEMA }) : field.title}
              {...others}
              {...drawerProps}
              rootStyle={rootStyle}
              destroyOnClose
              open={visible}
              onClose={onClose}
              rootClassName={classNames(componentCls, hashId, drawerProps?.className, others.className, 'reset')}
              footer={
                footerSchema && (
                  <div className={'footer'}>
                    <MemoizeRecursionField
                      basePath={field.address}
                      schema={schema}
                      onlyRenderProperties
                      filterProperties={keepFooterNode}
                    />
                  </div>
                )
              }
            >
              <ActionDrawerContent footerNodeName={footerNodeName} field={field} schema={schema} />
            </Drawer>
          </TabsContextProvider>
        </zIndexContext.Provider>
      </ActionContextNoRerender>
    );
  },
  { displayName: 'InternalActionDrawer' },
);

export const ActionDrawer: ComposedActionDrawer = React.memo((props) => (
  <ErrorBoundary FallbackComponent={DrawerErrorFallback} onError={console.log}>
    <InternalActionDrawer {...props} />
  </ErrorBoundary>
));

ActionDrawer.displayName = 'ActionDrawer';

ActionDrawer.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <MemoizeRecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionDrawer.Footer' },
);

ActionDrawer.FootBar = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return (
      <div
        className="ant-drawer-footer"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
        }}
      >
        <div className="footer">
          <MemoizeRecursionField basePath={field.address} schema={schema} onlyRenderProperties />
        </div>
      </div>
    );
  },
  { displayName: 'ActionDrawer.FootBar' },
);

export default ActionDrawer;
