import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { Fragment, useRef, useState } from 'react';
import { useDesignable } from '../../';
import { BlockAssociationContext, WithoutTableFieldResource } from '../../../block-provider';
import { CollectionProvider_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { RecordProvider, useRecord } from '../../../record-provider';
import { FormProvider } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContextProvider, useActionContext } from '../action';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { getTabFormatValue, useLabelUiSchema } from './util';
import { transformNestedData } from './InternalCascadeSelect';
import { isObject } from './InternalViewer';

interface IEllipsisWithTooltipRef {
  setPopoverVisible: (boolean) => void;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};
export const ReadPrettyInternalTag: React.FC = observer(
  (props: any) => {
    const fieldSchema = useFieldSchema();
    const recordCtx = useRecord();
    const { enableLink, tagColorField } = fieldSchema['x-component-props'];
    // value 做了转换，但 props.value 和原来 useField().value 的值不一致
    const field = useField();
    const fieldNames = useFieldNames(props);
    const [visible, setVisible] = useState(false);
    const insertViewer = useInsertSchema('Viewer');
    const { options: collectionField } = useAssociationFieldContext();
    const [record, setRecord] = useState({});
    const compile = useCompile();
    const { designable } = useDesignable();
    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
    const { snapshot } = useActionContext();
    const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();
    const { getCollection } = useCollectionManager_deprecated();
    const targetCollection = getCollection(collectionField?.target);
    const isTreeCollection = targetCollection?.template === 'tree';

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
        const text = getTabFormatValue(compile(labelUiSchema), val, record[tagColorField]);
        return (
          <Fragment key={`${record?.[fieldNames.value]}_${index}`}>
            <span>
              {snapshot ? (
                text
              ) : enableLink !== false ? (
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (designable) {
                      insertViewer(schema.Viewer);
                    }
                    setVisible(true);
                    setRecord(record);
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

    const renderWithoutTableFieldResourceProvider = () => (
      <WithoutTableFieldResource.Provider value={true}>
        <FormProvider>
          <RecursionField
            schema={fieldSchema}
            onlyRenderProperties
            basePath={field.address}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.Viewer';
            }}
          />
        </FormProvider>
      </WithoutTableFieldResource.Provider>
    );

    const renderRecordProvider = () => {
      const collectionFieldNames = fieldSchema?.['x-collection-field']?.split('.');

      return collectionFieldNames && collectionFieldNames.length > 2 ? (
        <RecordProvider record={record} parent={recordCtx[collectionFieldNames[1]]}>
          {renderWithoutTableFieldResourceProvider()}
        </RecordProvider>
      ) : (
        <RecordProvider record={record} parent={recordCtx}>
          {renderWithoutTableFieldResourceProvider()}
        </RecordProvider>
      );
    };

    return (
      <div>
        <BlockAssociationContext.Provider value={`${collectionField?.collectionName}.${collectionField?.name}`}>
          <CollectionProvider_deprecated name={collectionField?.target ?? collectionField?.targetCollection}>
            <EllipsisWithTooltip ellipsis={true} ref={ellipsisWithTooltipRef}>
              {renderRecords()}
            </EllipsisWithTooltip>
            <ActionContextProvider
              value={{ visible, setVisible, openMode: 'drawer', snapshot: collectionField?.interface === 'snapshot' }}
            >
              {renderRecordProvider()}
            </ActionContextProvider>
          </CollectionProvider_deprecated>
        </BlockAssociationContext.Provider>
      </div>
    );
  },
  { displayName: 'ReadPrettyInternalTag' },
);
