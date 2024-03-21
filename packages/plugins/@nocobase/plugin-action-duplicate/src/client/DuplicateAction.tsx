import { css, cx } from '@emotion/css';
import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  CollectionProvider_deprecated,
  RecordProvider,
  CollectionProvider,
  FormBlockContext,
  CollectionRecordProvider,
  fetchTemplateData,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useDesignable,
  useFormBlockContext,
  useCollectionParentRecordData,
  useRecord,
  useCollectionRecord,
} from '@nocobase/client';
import { App, Button } from 'antd';
import React, { useState } from 'react';
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
  (props: any) => {
    const { children } = props;
    const { message } = App.useApp();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const disabled: boolean = field.disabled || props.disabled;
    const { designable } = useDesignable();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { service, __parent, block } = useBlockRequestContext();
    const { duplicateFields, duplicateMode = 'quickDulicate', duplicateCollection } = fieldSchema['x-component-props'];
    const record = useRecord();
    const parentRecordData = useCollectionParentRecordData();
    const { id, __collection } = record;
    const ctx = useActionContext();
    const { name } = useCollection_deprecated();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const { t } = useTranslation();
    const collectionFields = getCollectionFields(__collection || name);
    const formctx = useFormBlockContext();
    const template = {
      key: 'duplicate',
      dataId: id,
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
        const data = await fetchTemplateData(api, template, t);
        await api.resource(__collection || name).create({
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
      if (!disabled && !loading) {
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
                  opacity: designable && field?.data?.hidden && 0.1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative',
                }}
                onClick={handelDuplicate}
              >
                {loading ? t('Duplicating') : children || t('Duplicate')}
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
            <CollectionProvider_deprecated name={duplicateCollection || name}>
              <RecordProvider
                record={{ ...record, __collection: duplicateCollection || __collection }}
                parent={parentRecordData}
              >
                <ActionContextProvider value={{ ...ctx, visible, setVisible }}>
                  <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
                </ActionContextProvider>
              </RecordProvider>
            </CollectionProvider_deprecated>
          </div>
        </FormBlockContext.Provider>
      </div>
    );
  },
  {
    displayName: 'DuplicateAction',
  },
);
