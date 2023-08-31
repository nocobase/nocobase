import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { Fragment, useRef, useState } from 'react';
import { useDesignable } from '../../';
import { BlockAssociationContext, WithoutTableFieldResource } from '../../../block-provider';
import { CollectionProvider, useCollectionManager } from '../../../collection-manager';
import { RecordProvider, useRecord } from '../../../record-provider';
import { FormProvider } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContextProvider, useActionContext } from '../action';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { getLabelFormatValue, useLabelUiSchema } from './util';
import { transformNestedData } from './InternalCascadeSelect';

interface IEllipsisWithTooltipRef {
  setPopoverVisible: (boolean) => void;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};
export const ReadPrettyInternalViewer: React.FC = observer(
  (props: any) => {
    const fieldSchema = useFieldSchema();
    const recordCtx = useRecord();
    const { getCollection } = useCollectionManager();
    const { enableLink } = fieldSchema['x-component-props'] || {};
    // value 做了转换，但 props.value 和原来 useField().value 的值不一致
    const field = useField();
    const fieldNames = useFieldNames(props);
    const [visible, setVisible] = useState(false);
    const insertViewer = useInsertSchema('Viewer');
    const { options: collectionField } = useAssociationFieldContext();
    const [record, setRecord] = useState({});
    const compile = useCompile();
    const { designable } = useDesignable();
    const { snapshot } = useActionContext();
    const targetCollection = getCollection(collectionField?.target);
    const isTreeCollection = targetCollection.template === 'tree';
    const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();
    const renderRecords = () =>
      toArr(props.value).map((record, index, arr) => {
        const label = isTreeCollection
          ? transformNestedData(record)
              .map((o) => o?.[fieldNames?.label || 'label'])
              .join(' / ')
          : record?.[fieldNames?.label || 'label'];
        const val = toValue(compile(label), 'N/A');
        const labelUiSchema = useLabelUiSchema(
          record?.__collection || collectionField?.target,
          fieldNames?.label || 'label',
        );
        const text = getLabelFormatValue(compile(labelUiSchema), val, true);
        return (
          <Fragment key={`${record.id}_${index}`}>
            <span>
              {snapshot ? (
                text
              ) : enableLink !== false && !props.enableLink ? (
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
        <RecordProvider record={recordCtx[collectionFieldNames[1]]}>
          <RecordProvider record={record}>{renderWithoutTableFieldResourceProvider()}</RecordProvider>
        </RecordProvider>
      ) : (
        <RecordProvider record={record}>{renderWithoutTableFieldResourceProvider()}</RecordProvider>
      );
    };

    return (
      <div>
        <BlockAssociationContext.Provider value={`${collectionField?.collectionName}.${collectionField?.name}`}>
          <CollectionProvider name={collectionField?.target ?? collectionField?.targetCollection}>
            <EllipsisWithTooltip ellipsis={true} ref={ellipsisWithTooltipRef}>
              {renderRecords()}
            </EllipsisWithTooltip>
            <ActionContextProvider
              value={{ visible, setVisible, openMode: 'drawer', snapshot: collectionField?.interface === 'snapshot' }}
            >
              {renderRecordProvider()}
            </ActionContextProvider>
          </CollectionProvider>
        </BlockAssociationContext.Provider>
      </div>
    );
  },
  { displayName: 'ReadPrettyInternalViewer' },
);
