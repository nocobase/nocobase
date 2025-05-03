/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Modal, ModalProps, Skeleton } from 'antd';
import classNames from 'classnames';
import React, { FC, startTransition, useEffect, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { useToken } from '../../../style';
import { ErrorFallback } from '../error-fallback';
import { useCurrentPopupContext } from '../page/PagePopups';
import { TabsContextProvider, useTabsContext } from '../tabs/context';
import { ActionContextNoRerender } from './context';
import { useActionContext } from './hooks';
import { useSetAriaLabelForModal } from './hooks/useSetAriaLabelForModal';
import { ActionDrawerProps, ComposedActionDrawer, OpenSize } from './types';
import { getZIndex, useZIndexContext, zIndexContext } from './zIndexContext';

const ModalErrorFallback: React.FC<FallbackProps> = (props) => {
  const { visible, setVisible } = useActionContext();
  return (
    <Modal open={visible} onCancel={() => setVisible(false, true)} width="60%">
      <ErrorFallback {...props} />
    </Modal>
  );
};

const openSizeWidthMap = new Map<OpenSize, string>([
  ['small', '40%'],
  ['middle', '60%'],
  ['large', '80%'],
]);

const ActionModalContent: FC<{ footerNodeName: string; field: any; schema: any }> = React.memo(
  ({ footerNodeName, field, schema }) => {
    // Improve the speed of opening the drawer
    const [deferredVisible, setDeferredVisible] = useState(false);

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
        filterProperties={(s) => {
          return s['x-component'] !== footerNodeName;
        }}
      />
    );
  },
);

export function useDelayedVisible(visible: boolean, delay = 200) {
  const [ready, setReady] = useState(delay === 0);
  useEffect(() => {
    if (ready) {
      return;
    }
    if (visible) {
      const timer = setTimeout(() => setReady(true), delay);
      return () => clearTimeout(timer);
    } else {
      setReady(false);
    }
  }, [delay, ready, visible]);
  return ready;
}

export const InternalActionModal: React.FC<ActionDrawerProps<ModalProps>> = observer(
  (props) => {
    const { footerNodeName = 'Action.Modal.Footer', width, zIndex: _zIndex, delay = 200, ...others } = props;
    const { visible, setVisible, openSize = 'middle', modalProps } = useActionContext();
    const actualWidth = width ?? openSizeWidthMap.get(openSize);
    const schema = useFieldSchema();
    const field = useField();
    const { token } = useToken();
    const tabContext = useTabsContext();
    const parentZIndex = useZIndexContext();
    const footerSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === footerNodeName) {
        return s;
      }
      return buf;
    });
    const { hidden } = useCurrentPopupContext();
    const showFooter = !!footerSchema;
    if (process.env.__E2E__) {
      useSetAriaLabelForModal(visible);
    }

    const zIndex = getZIndex('modal', _zIndex || parentZIndex, props.level || 0);
    const ready = useDelayedVisible(visible, delay); // 200ms 与 Modal 动画时间一致

    return (
      <ActionContextNoRerender>
        <zIndexContext.Provider value={zIndex}>
          <TabsContextProvider {...tabContext} tabBarExtraContent={null}>
            <Modal
              zIndex={hidden ? -1 : zIndex}
              width={actualWidth}
              title={field.title}
              {...(others as ModalProps)}
              {...modalProps}
              style={{
                ...modalProps?.style,
                ...others?.style,
              }}
              destroyOnClose
              open={visible}
              onCancel={() => {
                setVisible(false, true);
              }}
              className={classNames(
                others.className,
                modalProps?.className,
                css`
                  &.nb-action-popup {
                    .ant-modal-header {
                      display: none;
                    }

                    .ant-modal-content {
                      background: var(--nb-box-bg);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      padding-bottom: 0;
                    }

                    // 这里的样式是为了保证页面 tabs 标签下面的分割线和页面内容对齐（页面内边距可以通过主题编辑器调节）
                    .ant-tabs-nav {
                      padding-left: ${token.paddingLG - token.paddingPageHorizontal}px;
                      padding-right: ${token.paddingLG - token.paddingPageHorizontal}px;
                      margin-left: ${token.paddingPageHorizontal - token.paddingLG}px;
                      margin-right: ${token.paddingPageHorizontal - token.paddingLG}px;
                    }

                    .ant-modal-footer {
                      display: ${showFooter ? 'block' : 'none'};
                    }
                  }
                `,
              )}
              footer={
                showFooter ? (
                  <NocoBaseRecursionField
                    basePath={field.address}
                    schema={schema}
                    onlyRenderProperties
                    filterProperties={(s) => {
                      return s['x-component'] === footerNodeName;
                    }}
                  />
                ) : (
                  false
                )
              }
            >
              {ready ? (
                <ActionModalContent footerNodeName={footerNodeName} field={field} schema={schema} />
              ) : (
                <Skeleton active paragraph={{ rows: 6 }} />
              )}
            </Modal>
          </TabsContextProvider>
        </zIndexContext.Provider>
      </ActionContextNoRerender>
    );
  },
  { displayName: 'ActionModal' },
);

export const ActionModal: ComposedActionDrawer<ModalProps> = (props) => (
  <ErrorBoundary FallbackComponent={ModalErrorFallback} onError={console.log}>
    <InternalActionModal {...props} />
  </ErrorBoundary>
);

ActionModal.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <NocoBaseRecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionModal.Footer' },
);

ActionModal.FootBar = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return (
      <div className="ant-modal-footer">
        <NocoBaseRecursionField basePath={field.address} schema={schema} onlyRenderProperties />
      </div>
    );
  },
  { displayName: 'ActionModal.FootBar' },
);

export default ActionModal;
