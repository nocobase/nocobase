/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import _ from 'lodash';
import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDesignable, usePopupSettings } from '../../';
import { WithoutTableFieldResource } from '../../../block-provider';
import {
  CollectionRecordProvider,
  DataBlockProvider,
  useAssociationName,
  useCollection,
  useCollectionManager,
  useCollectionRecordData,
} from '../../../data-source';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { useCompile } from '../../hooks';
import { ActionContextProvider, useActionContext } from '../action';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { PopupVisibleProvider } from '../page/PagePopups';
import { usePopupUtils } from '../page/pagePopupUtils';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import { transformNestedData } from './InternalCascadeSelect';
import schema from './schema';
import { getLabelFormatValue, useLabelUiSchemaV2 } from './util';

const hasAddedViewer = (schemaProperties: Record<string, any>) => {
  if (!schemaProperties) {
    return false;
  }

  return Object.values(schemaProperties).some((schema) => schema['x-component'] === 'AssociationField.Viewer');
};

interface IEllipsisWithTooltipRef {
  setPopoverVisible: (boolean) => void;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};
export function isObject(value) {
  return typeof value === 'object' && value !== null;
}

export interface ButtonListProps {
  value: any;
  setBtnHover: any;
  fieldNames?: {
    label: string;
    value: string;
  };
  onClick?: (props: { recordData: any }) => void;
  ellipsis?: boolean;
}

const RenderRecord = React.memo(
  ({
    fieldNames,
    isTreeCollection,
    compile,
    getLabelUiSchema,
    collectionField,
    snapshot,
    enableLink,
    designable,
    insertViewer,
    fieldSchema,
    openPopup,
    recordData,
    ellipsisWithTooltipRef,
    value,
    setBtnHover,
    onClick,
    ellipsis,
  }: {
    fieldNames: any;
    isTreeCollection: boolean;
    compile: (source: any, ext?: any) => any;
    getLabelUiSchema;
    collectionField: any;
    snapshot: boolean;
    enableLink: any;
    designable: boolean;
    insertViewer: (ss: any) => void;
    fieldSchema;
    openPopup;
    recordData: any;
    ellipsisWithTooltipRef: React.MutableRefObject<IEllipsisWithTooltipRef>;
    value: any;
    setBtnHover: any;
    onClick?: (props: { recordData: any }) => void;
    ellipsis?: boolean;
  }) => {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<React.ReactNode[]>([]);
    const needWaitForFieldSchemaUpdatedRef = useRef(false);
    const fieldSchemaRef = useRef(fieldSchema);
    fieldSchemaRef.current = fieldSchema;
    const getCustomActionSchema = useCallback(() => {
      return fieldSchemaRef.current;
    }, []);

    // The map method here maybe quite time-consuming, especially in table blocks.
    // Therefore, we use an asynchronous approach to render the list,
    // which allows us to avoid blocking the main rendering process.
    useEffect(() => {
      const result = toArr(value).map((record, index, arr) => {
        const value = record?.[fieldNames?.label || 'label'];
        const label = isTreeCollection
          ? transformNestedData(record)
              .map((o) => o?.[fieldNames?.label || 'label'])
              .join(' / ')
          : isObject(value)
            ? JSON.stringify(value)
            : value;

        const val = toValue(compile(label), 'N/A');
        const labelUiSchema = getLabelUiSchema(
          record?.__collection || collectionField?.target,
          fieldNames?.label || 'label',
        );
        const text = getLabelFormatValue(compile(labelUiSchema), val, true);

        return (
          <Fragment key={`${record?.id}_${index}`}>
            <span>
              {snapshot ? (
                text
              ) : enableLink !== false ? (
                <a
                  onMouseEnter={() => {
                    setBtnHover(true);
                  }}
                  onClick={(e) => {
                    setBtnHover(true);
                    e.stopPropagation();
                    e.preventDefault();
                    if (designable && !hasAddedViewer(fieldSchema.properties)) {
                      insertViewer(schema.Viewer);
                      needWaitForFieldSchemaUpdatedRef.current = true;
                    }

                    if (needWaitForFieldSchemaUpdatedRef.current) {
                      // When first inserting, the fieldSchema instance will be updated to a new instance.
                      // We need to wait for the instance update before opening the popup to prevent configuration loss.
                      setTimeout(() => {
                        onClick?.({ recordData: record });
                        openPopup({
                          recordData: record,
                          parentRecordData: recordData,
                          customActionSchema: getCustomActionSchema(),
                        });
                      });
                      needWaitForFieldSchemaUpdatedRef.current = false;
                    } else if (fieldSchema.properties) {
                      onClick?.({ recordData: record });
                      openPopup({
                        recordData: record,
                        parentRecordData: recordData,
                      });
                    }

                    ellipsisWithTooltipRef?.current?.setPopoverVisible(false);
                  }}
                >
                  {text}
                </a>
              ) : (
                text
              )}
            </span>
            {index < arr.length - 1 ? <span style={{ marginRight: 4, color: '#aaa' }}>,</span> : null}
          </Fragment>
        );
      });
      setResult(result);
      setLoading(false);
    }, [
      collectionField?.target,
      compile,
      designable,
      ellipsisWithTooltipRef,
      enableLink,
      fieldNames?.label,
      fieldSchema,
      getLabelUiSchema,
      insertViewer,
      isTreeCollection,
      openPopup,
      recordData,
      setBtnHover,
      snapshot,
      value,
      getCustomActionSchema,
    ]);

    if (loading) {
      return null;
    }

    return <span style={ellipsis ? null : { whiteSpace: 'normal' }}>{result}</span>;
  },
);

RenderRecord.displayName = 'RenderRecord';

const ButtonLinkList: FC<ButtonListProps> = observer((props) => {
  const fieldSchema = useFieldSchema();
  const cm = useCollectionManager();
  const { enableLink } = fieldSchema['x-component-props'] || {};
  const fieldNames = useFieldNames({ fieldNames: props.fieldNames });
  const insertViewer = useInsertSchema('Viewer');
  const { options: collectionField } = useAssociationFieldContext();
  const compile = useCompile();
  const { designable } = useDesignable();
  const { snapshot } = useActionContext();
  const targetCollection = cm.getCollection(collectionField?.target);
  const isTreeCollection = targetCollection?.template === 'tree';
  const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();
  const getLabelUiSchema = useLabelUiSchemaV2();
  const { openPopup } = usePopupUtils();
  const recordData = useCollectionRecordData();

  return (
    <RenderRecord
      fieldNames={fieldNames}
      isTreeCollection={isTreeCollection}
      compile={compile}
      getLabelUiSchema={getLabelUiSchema}
      collectionField={collectionField}
      snapshot={snapshot}
      enableLink={enableLink}
      designable={designable}
      insertViewer={insertViewer}
      fieldSchema={fieldSchema}
      openPopup={openPopup}
      recordData={recordData}
      ellipsisWithTooltipRef={ellipsisWithTooltipRef}
      value={props.value}
      setBtnHover={props.setBtnHover}
      onClick={props.onClick}
      ellipsis={props.ellipsis ?? true}
    />
  );
});

ButtonLinkList.displayName = 'ButtonLinkList';

interface ReadPrettyInternalViewerProps {
  ButtonList: FC<ButtonListProps>;
  value: any;
  fieldNames?: {
    label: string;
    value: string;
  };
  ellipsis?: boolean;
}

/**
 * the sourceData is used to get the sourceId
 * @param recordData
 * @param fieldSchema
 * @returns
 */
const getSourceData = (recordData, fieldSchema) => {
  const sourceRecordKey = (fieldSchema.name as string)
    .split('.')
    .filter((o, i, arr) => i < arr.length - 1)
    .join('.');

  if (!sourceRecordKey) {
    return recordData;
  }

  return _.get(recordData, sourceRecordKey);
};

export const ReadPrettyInternalViewer: React.FC<ReadPrettyInternalViewerProps> = (props) => {
  const { value, ButtonList = ButtonLinkList } = props;
  const fieldSchema = useFieldSchema();
  const { enableLink, openMode, openSize } = fieldSchema['x-component-props'] || {};
  // value 做了转换，但 props.value 和原来 useField().value 的值不一致
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { options: collectionField } = useAssociationFieldContext();
  const associationName = useAssociationName();
  const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
  const [btnHover, setBtnHover] = useState(!!visibleWithURL);
  const { defaultOpenMode } = useOpenModeContext();
  const parentRecordData = useCollectionRecordData();
  const [recordData, setRecordData] = useState(null);
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const collection = useCollection();

  const onClickItem = useCallback((props: { recordData: any }) => {
    setRecordData(props.recordData);
  }, []);

  const btnElement = (
    <EllipsisWithTooltip ellipsis={props.ellipsis ?? true}>
      <CollectionRecordProvider isNew={false} record={getSourceData(parentRecordData, fieldSchema)}>
        <ButtonList
          setBtnHover={setBtnHover}
          value={value}
          fieldNames={props.fieldNames}
          onClick={onClickItem}
          ellipsis={props.ellipsis ?? true}
        />
      </CollectionRecordProvider>
    </EllipsisWithTooltip>
  );

  const actionContextValue = useMemo(
    () => ({
      visible: visible || visibleWithURL,
      setVisible: (value) => {
        setVisible?.(value);
        setVisibleWithURL?.(value);
      },
      openMode: openMode || defaultOpenMode,
      snapshot: collectionField?.interface === 'snapshot',
      fieldSchema: fieldSchema,
      openSize,
    }),
    [collectionField?.interface, defaultOpenMode, fieldSchema, setVisibleWithURL, visible, visibleWithURL],
  );

  if (enableLink === false) {
    return btnElement;
  }

  const renderWithoutTableFieldResourceProvider = () => {
    if (isPopupVisibleControlledByURL()) {
      return (
        // The recordData here is only provided when the popup is opened, not the current row record
        <VariablePopupRecordProvider>
          <WithoutTableFieldResource.Provider value={true}>
            <NocoBaseRecursionField
              schema={fieldSchema}
              onlyRenderProperties
              basePath={field.address}
              filterProperties={(v) => {
                return v['x-component'] === 'AssociationField.Viewer';
              }}
            />
          </WithoutTableFieldResource.Provider>
        </VariablePopupRecordProvider>
      );
    }

    return (
      <DataBlockProvider
        dataSource={collection.dataSource}
        collection={collection.name}
        association={associationName}
        sourceId={recordData?.[collection.getPrimaryKey()]}
        record={recordData}
        parentRecord={parentRecordData}
        action="get"
      >
        <CollectionRecordProvider isNew={false} record={recordData} parentRecord={parentRecordData}>
          {/* The recordData here is only provided when the popup is opened, not the current row record */}
          <VariablePopupRecordProvider>
            <WithoutTableFieldResource.Provider value={true}>
              <NocoBaseRecursionField
                schema={fieldSchema}
                onlyRenderProperties
                basePath={field.address}
                filterProperties={(v) => {
                  return v['x-component'] === 'AssociationField.Viewer';
                }}
              />
            </WithoutTableFieldResource.Provider>
          </VariablePopupRecordProvider>
        </CollectionRecordProvider>
      </DataBlockProvider>
    );
  };

  return (
    <PopupVisibleProvider visible={false}>
      <ActionContextProvider value={actionContextValue}>
        {btnElement}
        {btnHover && renderWithoutTableFieldResourceProvider()}
      </ActionContextProvider>
    </PopupVisibleProvider>
  );
};
