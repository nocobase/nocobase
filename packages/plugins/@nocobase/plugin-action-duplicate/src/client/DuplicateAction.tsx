/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { observer, useField, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  CollectionProvider_deprecated,
  FormBlockContext,
  NocoBaseRecursionField,
  PopupSettingsProvider,
  RecordProvider,
  RefreshComponentProvider,
  TabsContextProvider,
  fetchTemplateData,
  useACLActionParamsContext,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollectionManager_deprecated,
  useCollectionParentRecordData,
  useCollection_deprecated,
  useDesignable,
  useFormBlockContext,
  useRecord,
  useCollection,
  useDataSourceHeaders,
  useDataSourceKey,
  Icon,
} from '@nocobase/client';
import { App, Button, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const actionDesignerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--colorBgSettingsHover);
    border: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    '&.nb-in-template': {
      background: 'var(--colorTemplateBgSettingsHover)';
    }
    ,
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

export const DuplicateAction = observer(
  ({ onlyIcon, ...props }: any) => {
    const { children, icon, title, ...others } = props;
    const { message } = App.useApp();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const disabled: boolean = field.disabled || props.disabled;
    const { designable } = useDesignable();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const { service, __parent, block, resource } = useBlockRequestContext();
    const { duplicateFields, duplicateMode = 'quickDulicate', duplicateCollection } = fieldSchema['x-component-props'];
    const record = useRecord();
    const parentRecordData: any = useCollectionParentRecordData();
    const collection = useCollection();
    const { id, __collection } = record;
    const ctx = useActionContext();
    const { name } = useCollection_deprecated();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const { t } = useTranslation();
    const collectionFields = getCollectionFields(__collection || name);
    const formctx = useFormBlockContext();
    const aclCtx = useACLActionParamsContext();
    const dataSource = useDataSourceKey();
    const headers = useDataSourceHeaders(dataSource);
    const dataId = Array.isArray(collection.filterTargetKey)
      ? Object.assign(
          {},
          ...collection.filterTargetKey.map((v) => {
            return { [v]: record[v] };
          }),
        )
      : record[collection.filterTargetKey] || id;

    const template = {
      key: 'duplicate',
      dataId,
      default: true,
      fields:
        duplicateFields?.filter((v) => {
          return collectionFields.find((k) => v.includes(k.name));
        }) || [],
      collection: __collection || name,
    };
    const isLinkBtn = fieldSchema['x-component'] === 'Action.Link';
    const handelQuickDuplicate = async () => {
      setLoading(true);
      try {
        const data = await fetchTemplateData(api, template, headers);
        await resource['create']({
          values: {
            ...data,
          },
        });
        message.success(t('Saved successfully'));
        if (block === 'form') {
          __parent?.service?.refresh?.();
        } else {
          await service?.refresh?.();
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error(error); // Handle or log the error appropriately
      }
    };
    const handelDuplicate = () => {
      if (!disabled && !loading && aclCtx) {
        if (duplicateFields?.length > 0) {
          if (duplicateMode === 'quickDulicate') {
            handelQuickDuplicate();
          } else {
            setVisible(true);
          }
        } else {
          message.error(t('Please configure the duplicate fields'));
        }
      }
    };
    return (
      <div
        ref={others.setNodeRef}
        className={cx(actionDesignerCss, {
          [css`
            .general-schema-designer {
              top: -10px;
              bottom: -10px;
              left: -10px;
              right: -10px;
            }
          `]: isLinkBtn,
        })}
      >
        <FormBlockContext.Provider
          value={{
            ...formctx,
            duplicateData: {
              display: false,
              enabled: true,
              defaultTemplate: template,
            },
          }}
        >
          <div>
            {isLinkBtn ? (
              <a
                className="nb-action-link"
                role={props.role}
                aria-label={props['aria-label']}
                //@ts-ignore
                disabled={disabled}
                style={{
                  ...others.style,
                  opacity: designable && field?.data?.hidden && 0.1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative',
                }}
                onClick={handelDuplicate}
              >
                <Tooltip title={title}>
                  <span style={{ marginRight: 3 }}>
                    {icon && typeof icon === 'string' ? <Icon type={icon} /> : icon}
                  </span>
                </Tooltip>
                {onlyIcon ? children[1] : loading ? t('Duplicating') : children || t('Duplicate')}
              </a>
            ) : (
              <Button
                role={props.role}
                aria-label={props['aria-label']}
                disabled={disabled}
                style={{
                  opacity: designable && field?.data?.hidden && 0.1,
                }}
                {...props}
                onClick={handelDuplicate}
              >
                {loading ? t('Duplicating') : children || t('Duplicate')}
              </Button>
            )}
            {/* Clear the context of Tabs to avoid affecting the Tabs of the upper-level popup */}
            <TabsContextProvider>
              <CollectionProvider_deprecated name={duplicateCollection || name}>
                {/* 这里的 record 就是弹窗中创建表单的 sourceRecord */}
                <RecordProvider record={{ ...parentRecordData, __collection: duplicateCollection || __collection }}>
                  <ActionContextProvider value={{ ...ctx, visible, setVisible, formValueChanged, setFormValueChanged }}>
                    <PopupSettingsProvider enableURL={false}>
                      <RefreshComponentProvider refresh={_.noop}>
                        <NocoBaseRecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
                      </RefreshComponentProvider>
                    </PopupSettingsProvider>
                  </ActionContextProvider>
                </RecordProvider>
              </CollectionProvider_deprecated>
            </TabsContextProvider>
          </div>
        </FormBlockContext.Provider>
      </div>
    );
  },
  {
    displayName: 'DuplicateAction',
  },
);
