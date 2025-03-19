/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActionContext, ActionContextProvider } from '../action/context';
import { useGetAriaLabelOfPopover } from '../action/hooks/useGetAriaLabelOfPopover';
import { useSetAriaLabelForPopover } from '../action/hooks/useSetAriaLabelForPopover';
import { StablePopover } from '../popover';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { useAssociationFieldContext } from './hooks';

const InternalPopoverNesterContentCss = css`
  min-width: 600px;
  max-width: 800px;
  max-height: 440px;
  overflow: auto;
  .ant-card {
    border: 0px;
  }
`;

export const InternalPopoverNester = observer(
  (props: {
    Container?: (props: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      trigger: 'click' | 'hover';
      content: React.ReactElement;
      children: React.ReactElement;
    }) => React.ReactElement;
    children?: React.ReactElement;
  }) => {
    const { field } = useAssociationFieldContext();
    const [visible, setVisible] = useState(false);
    const schema = useFieldSchema();
    schema['x-component-props'].enableLink = false;
    const ref = useRef();
    const nesterProps = {
      ...props,
      shouldMountElement: true,
    };
    const content = (
      <div ref={ref} className={`${InternalPopoverNesterContentCss} popover-subform-container`}>
        <InternalNester {...nesterProps} />
      </div>
    );
    const getContainer = () => ref.current;
    const ctx = useContext(ActionContext);
    const modalProps = {
      getContainer: getContainer,
    };
    const { getAriaLabel } = useGetAriaLabelOfPopover();
    const Container = props.Container || StablePopover;
    const handleOpenChange = useCallback((open: boolean) => {
      setVisible(open);
    }, []);
    const overlayStyle = useMemo(() => ({ padding: '0px' }), []);

    if (process.env.__E2E__) {
      useSetAriaLabelForPopover(visible);
    }

    return (
      <ActionContextProvider value={{ ...ctx, modalProps }}>
        <Container
          overlayStyle={overlayStyle}
          content={content}
          trigger="click"
          placement="topLeft"
          open={visible}
          onOpenChange={handleOpenChange}
          title={field?.title || ''}
        >
          <span style={{ cursor: 'pointer', display: 'flex' }}>
            <div
              style={{
                maxWidth: '95%',
              }}
            >
              <ReadPrettyInternalViewer {...(props as any)} />
            </div>
            <EditOutlined style={{ display: 'inline-flex', margin: '5px' }} />
          </span>
        </Container>
        {visible && (
          <div
            role="button"
            aria-label={getAriaLabel('mask')}
            onClick={() => setVisible(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              zIndex: 9999,
            }}
          />
        )}
      </ActionContextProvider>
    );
  },
  { displayName: 'InternalPopoverNester' },
);
