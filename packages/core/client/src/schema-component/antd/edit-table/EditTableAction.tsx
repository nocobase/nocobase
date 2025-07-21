/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { createForm, Field, Form } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Checkbox, ConfigProvider, Typography } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useNiceDropdownMaxHeight } from '../../../common/useNiceDropdownHeight';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useMobileLayout } from '../../../route-switch/antd/admin-layout';
import { useToken } from '../../../style';
import { FormProvider, SchemaComponent } from '../../core';
import { useDesignable } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { Action, ActionProps } from '../action';
import { useZIndexContext } from '../action/zIndexContext';
import { StablePopover } from '../popover';

// Mobile container component
const EditTableActionMobileContainer = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: 'click' | 'hover';
  content: React.ReactElement;
  children: React.ReactElement;
}) => {
  const { t } = useTranslation();
  const { open, onOpenChange, content, children } = props;
  const parentZIndex = useZIndexContext();
  const { token } = useToken();

  const newZIndex = parentZIndex + 1000; // Use a simple increment

  const closePopup = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const theme = useMemo(() => {
    return {
      token: {
        zIndexPopupBase: newZIndex,
      },
    };
  }, [newZIndex]);

  const bodyStyle = useMemo(
    () => ({
      borderTopLeftRadius: `${token.borderRadius}px`,
      borderTopRightRadius: `${token.borderRadius}px`,
      maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
      overflow: 'auto',
      zIndex: newZIndex,
    }),
    [newZIndex, token.borderRadius],
  );

  const zIndexStyle = useMemo(() => ({ zIndex: newZIndex }), [newZIndex]);

  // Get mobile container
  const getMobileContainer = useCallback(() => {
    if (!isDesktop) {
      return (document.querySelector('.mobile-container') as HTMLElement) || document.body;
    }
    return document.body;
  }, []);

  return (
    <ConfigProvider theme={theme}>
      {children}
      <Popup
        visible={open}
        onClose={closePopup}
        onMaskClick={closePopup}
        getContainer={getMobileContainer}
        bodyStyle={bodyStyle}
        maskStyle={zIndexStyle}
        style={zIndexStyle}
        closeOnSwipe
        destroyOnClose
      >
        <div
          style={{
            height: 'var(--nb-mobile-page-header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorSplit}`,
            position: 'sticky',
            top: 0,
            backgroundColor: token.colorBgContainer,
            zIndex: 1000,
          }}
        >
          {/* used to make the title center */}
          <span
            style={{
              display: 'inline-block',
              padding: `${token.padding}px`,
              visibility: 'hidden',
            }}
          >
            <CloseOutline />
          </span>
          <span>{t('Column Settings')}</span>
          <span
            style={{
              display: 'inline-block',
              padding: `${token.padding}px`,
              cursor: 'pointer',
            }}
            onClick={closePopup}
          >
            <CloseOutline />
          </span>
        </div>
        <div style={{ padding: `${token.padding}px` }}>{content}</div>
      </Popup>
    </ConfigProvider>
  );
};

export const EditTableActionContext = createContext<any>(null);
EditTableActionContext.displayName = 'EditTableActionContext';

export type EditTableActionProps<T = {}> = ActionProps & {
  columns?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
  /**
   * @default Popover
   * For mobile, will use mobile Popup component
   */
  Container?: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: 'click' | 'hover';
    content: React.ReactElement;
    children: React.ReactElement;
  }) => React.ReactElement;
};

const InternalEditTableAction = React.memo((props: EditTableActionProps) => {
  const field = useField<Field>();
  const [visible, setVisible] = useState(false);
  const { designable, dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const form = useMemo<Form>(() => props.form || createForm(), [props.form]);
  const popupMaxHeight = useNiceDropdownMaxHeight([visible]);

  // Compatible with old UISchema (before 1.0), keeping useProps for compatibility
  const { columns, onSubmit, onReset, Container: propContainer, icon, onlyIcon } = useProps(props);

  // Move currentColumns state to parent component to persist across popup open/close
  const [currentColumns, setCurrentColumns] = useState(() => columns || []);

  // Use mobile container in mobile layout
  const { isMobileLayout } = useMobileLayout();
  const Container = propContainer || (isMobileLayout ? EditTableActionMobileContainer : StablePopover);

  const onOpenChange = useCallback((visible: boolean): void => {
    setVisible(visible);
  }, []);

  const editTableActionContextValue = useMemo(
    () => ({ field, fieldSchema, designable, dn }),
    [designable, dn, field, fieldSchema],
  );

  const handleClick = useCallback(() => setVisible((visible) => !visible), []);

  const content = useMemo(() => {
    return (
      <EditTableActionContent
        form={form}
        columns={columns}
        currentColumns={currentColumns}
        setCurrentColumns={setCurrentColumns}
        field={field}
        fieldSchema={fieldSchema}
        onReset={onReset}
        setVisible={setVisible}
        popupMaxHeight={popupMaxHeight}
        onSubmit={onSubmit}
      />
    );
  }, [field, fieldSchema, form, onReset, onSubmit, columns, currentColumns, setCurrentColumns, popupMaxHeight]);

  return (
    <EditTableActionContext.Provider value={editTableActionContextValue}>
      <Container
        destroyTooltipOnHide
        placement={'bottomLeft'}
        open={visible}
        onOpenChange={onOpenChange}
        trigger={'click'}
        content={content}
      >
        {/* Adding a div here can prevent unnecessary re-rendering of Action */}
        <div>
          <Action onClick={handleClick} icon={icon} onlyIcon={onlyIcon} {...props} />
        </div>
      </Container>
    </EditTableActionContext.Provider>
  );
});

InternalEditTableAction.displayName = 'InternalEditTableAction';

export const EditTableAction = withDynamicSchemaProps((props: EditTableActionProps) => {
  // When clicking submit, "disabled" will change from undefined to false, which triggers a re-render.
  // Here we convert the default undefined to false to avoid unnecessary re-rendering.
  return <InternalEditTableAction {...props} disabled={!!props.disabled} />;
});

EditTableAction.displayName = 'EditTableAction';

const createHeaderStyle = (token: any) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token.paddingSM}px ${token.padding}px;
  border-bottom: 1px solid ${token.colorBorderSecondary};
  margin-bottom: 0;
`;

const createHeaderLeftStyle = (token: any) => css`
  display: flex;
  align-items: center;
  gap: ${token.margin}px;
`;

const createHeaderCheckboxStyle = (token: any) => css`
  margin-right: ${token.margin}px;
`;

const createStatsTextStyle = (token: any) => css`
  font-size: ${token.fontSize}px;
  color: ${token.colorTextSecondary};
  font-weight: ${token.fontWeightStrong};
`;

const contentStyle = css`
  padding: 0;
`;

const EditTableActionContent = observer(
  ({
    form,
    columns,
    currentColumns,
    setCurrentColumns,
    field,
    fieldSchema,
    onReset,
    setVisible,
    popupMaxHeight,
    onSubmit,
  }: {
    form: Form<any>;
    columns: any;
    currentColumns: any[];
    setCurrentColumns: React.Dispatch<React.SetStateAction<any[]>>;
    field: Field<any, any, any, any>;
    fieldSchema;
    onReset: any;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    popupMaxHeight: number;
    onSubmit: any;
  }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    // Initialize currentColumns from external columns only once
    useEffect(() => {
      if (columns && columns.length > 0 && currentColumns.length === 0) {
        setCurrentColumns(columns);
      }
    }, [columns, currentColumns.length, setCurrentColumns]);

    // Calculate stats for header
    const visibleCount = useMemo(() => {
      const count = currentColumns.filter((col) => col.visible).length;
      return count;
    }, [currentColumns]);
    const totalCount = useMemo(() => {
      const count = currentColumns.length;
      return count;
    }, [currentColumns]);

    // Global select all functionality
    const isAllChecked = visibleCount === totalCount;
    const isIndeterminate = visibleCount > 0 && visibleCount < totalCount;

    const handleGlobalCheckAll = (checked: boolean) => {
      const newColumns = currentColumns.map((col) => ({
        ...col,
        visible: checked,
      }));

      onSubmit?.({ columns: newColumns });
      setCurrentColumns([...newColumns]); // Force new array reference
    };

    const schema = useMemo(() => {
      const finalColumns = currentColumns || field.dataSource || [];

      const schema = {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            default: fieldSchema.default || finalColumns,
            'x-component': 'EditTable',
            'x-component-props': {
              columns: finalColumns,
              onChange: (columns) => {
                onSubmit?.({ columns });
                setCurrentColumns(columns);
              },
            },
          },
        },
      };

      return schema;
    }, [field?.dataSource, fieldSchema?.default, currentColumns]);

    return (
      <form>
        <FormProvider form={form}>
          <div className={createHeaderStyle(token)}>
            <div className={createHeaderLeftStyle(token)}>
              <Checkbox
                checked={isAllChecked}
                indeterminate={isIndeterminate}
                onChange={(e) => handleGlobalCheckAll(e.target.checked)}
                className={createHeaderCheckboxStyle(token)}
              />
              <span className={createStatsTextStyle(token)}>
                {t('visible')} {visibleCount}/{totalCount}
              </span>
            </div>
            <Typography.Link
              onClick={async () => {
                await form.reset();
                onReset?.({ columns: [] });
                onSubmit?.({ columns: [] });
                setCurrentColumns([]);
                setVisible(false);
              }}
            >
              {t('Reset')}
            </Typography.Link>
          </div>
          <div
            className={contentStyle}
            style={{
              maxHeight: popupMaxHeight - 80,
              overflowY: 'auto',
              contain: 'layout style',
            }}
          >
            <SchemaComponent key="edit-table-schema" schema={schema} />
          </div>
        </FormProvider>
      </form>
    );
  },
);

EditTableActionContent.displayName = 'EditTableActionContent';
