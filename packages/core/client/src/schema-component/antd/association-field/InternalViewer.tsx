/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { FC, Fragment, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../';
import { WithoutTableFieldResource } from '../../../block-provider';
import { Collection, useCollectionManager } from '../../../data-source';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { RecordProvider, useRecord } from '../../../record-provider';
import { useCompile } from '../../hooks';
import { ActionContextProvider, useActionContext } from '../action';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { PopupVisibleProvider } from '../page/PagePopups';
import { usePagePopup } from '../page/pagePopupUtils';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import { transformNestedData } from './InternalCascadeSelect';
import schema from './schema';
import { getLabelFormatValue, useLabelUiSchemaV2 } from './util';

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
  setRecord: any;
  fieldNames?: {
    label: string;
    value: string;
  };
}

const ButtonLinkList: FC<ButtonListProps> = (props) => {
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
  const { openPopup, getPopupContext } = usePagePopup();

  const renderRecords = () =>
    toArr(props.value).map((record, index, arr) => {
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
                  props.setBtnHover(true);
                }}
                onClick={(e) => {
                  props.setBtnHover(true);
                  e.stopPropagation();
                  e.preventDefault();
                  if (designable) {
                    insertViewer(schema.Viewer);
                  }
                  openPopup({
                    recordData: record,
                  });
                  props.setRecord(record);
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

  return <>{renderRecords()}</>;
};

interface ReadPrettyInternalViewerProps {
  ButtonList: FC<ButtonListProps>;
  value: any;
  fieldNames?: {
    label: string;
    value: string;
  };
}

export const ReadPrettyInternalViewer: React.FC = observer(
  (props: ReadPrettyInternalViewerProps) => {
    const { value, ButtonList = ButtonLinkList } = props;
    const fieldSchema = useFieldSchema();
    const recordCtx = useRecord();
    const cm = useCollectionManager();
    const { enableLink } = fieldSchema['x-component-props'] || {};
    // value 做了转换，但 props.value 和原来 useField().value 的值不一致
    const field = useField();
    const [visible, setVisible] = useState(false);
    const { options: collectionField } = useAssociationFieldContext();
    const [record, setRecord] = useState({});
    const targetCollection = cm.getCollection(collectionField?.target);
    const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();
    const { t } = useTranslation();
    const { visibleWithURL, setVisibleWithURL } = usePagePopup();
    const [btnHover, setBtnHover] = useState(!!visibleWithURL);

    const btnElement = (
      <EllipsisWithTooltip ellipsis={true} ref={ellipsisWithTooltipRef}>
        <ButtonList setBtnHover={setBtnHover} setRecord={setRecord} value={value} fieldNames={props.fieldNames} />
      </EllipsisWithTooltip>
    );

    if (enableLink === false || !btnHover) {
      return btnElement;
    }

    const renderWithoutTableFieldResourceProvider = () => (
      <VariablePopupRecordProvider recordData={record} collection={targetCollection as Collection}>
        <WithoutTableFieldResource.Provider value={true}>
          <RecursionField
            schema={fieldSchema}
            onlyRenderProperties
            basePath={field.address}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.Viewer';
            }}
          />
        </WithoutTableFieldResource.Provider>
      </VariablePopupRecordProvider>
    );

    const renderRecordProvider = () => {
      const collectionFieldNames = fieldSchema?.['x-collection-field']?.split('.');

      return collectionFieldNames && collectionFieldNames.length > 2 ? (
        <>
          <RecordProvider record={record} parent={recordCtx[collectionFieldNames[1]]}>
            {btnElement}
          </RecordProvider>
          {renderWithoutTableFieldResourceProvider()}
        </>
      ) : (
        <>
          <RecordProvider record={record} parent={recordCtx}>
            {btnElement}
          </RecordProvider>
          {renderWithoutTableFieldResourceProvider()}
        </>
      );
    };

    return (
      <PopupVisibleProvider visible={false}>
        <ActionContextProvider
          value={{
            visible: visible || visibleWithURL,
            setVisible: (value) => {
              setVisible?.(value);
              setVisibleWithURL?.(value);
            },
            openMode: 'drawer',
            snapshot: collectionField?.interface === 'snapshot',
            fieldSchema: fieldSchema,
          }}
        >
          {renderRecordProvider()}
        </ActionContextProvider>
      </PopupVisibleProvider>
    );
  },
  { displayName: 'ReadPrettyInternalViewer' },
);
