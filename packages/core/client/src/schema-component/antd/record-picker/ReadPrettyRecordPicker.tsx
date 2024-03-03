import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { Fragment, useRef, useState } from 'react';
import { WithoutTableFieldResource } from '../../../block-provider';
// TODO: 不要使用 '../../../block-provider' 这个路径引用 BlockAssociationContext，在 Vitest 中会报错，待修复
import { BlockAssociationContext } from '../../../block-provider/BlockProvider';
import {
  CollectionProvider_deprecated,
  useCollection_deprecated,
  useCollectionManager_deprecated,
} from '../../../collection-manager';
import { RecordProvider, useRecord } from '../../../record-provider';
import { FormProvider } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContextProvider, useActionContext } from '../action';
import { EllipsisWithTooltip } from '../input/EllipsisWithTooltip';
import { Preview } from '../preview';
import { isShowFilePicker } from './InputRecordPicker';
import { useFieldNames } from './useFieldNames';
import { getLabelFormatValue, useLabelUiSchema } from './util';

interface IEllipsisWithTooltipRef {
  setPopoverVisible: (boolean) => void;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};

export const ReadPrettyRecordPicker: React.FC = observer(
  (props: any) => {
    const { ellipsis } = props;
    const fieldSchema = useFieldSchema();
    const recordCtx = useRecord();
    const { getCollectionJoinField } = useCollectionManager_deprecated();
    // value 做了转换，但 props.value 和原来 useField().value 的值不一致
    // const field = useField<Field>();
    const fieldNames = useFieldNames(props);
    const [visible, setVisible] = useState(false);
    const { getField } = useCollection_deprecated();
    const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
    const [record, setRecord] = useState({});
    const compile = useCompile();
    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
    const showFilePicker = isShowFilePicker(labelUiSchema);
    const { snapshot } = useActionContext();
    const isTagsMode = fieldSchema['x-component-props']?.mode === 'tags';

    const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();

    if (showFilePicker) {
      return collectionField ? <Preview {...props} /> : null;
    }

    const renderRecords = () =>
      toArr(props.value).map((record, index, arr) => {
        const val = toValue(compile(record?.[fieldNames?.label || 'label']), 'N/A');
        const text = getLabelFormatValue(labelUiSchema, val, true);
        return (
          <Fragment key={`${record[fieldNames.value]}_${index}`}>
            {/* test-record-picker-read-pretty-item 用于在单元测试中方便选中元素 */}
            <span className="test-record-picker-read-pretty-item">
              {snapshot || isTagsMode ? (
                text
              ) : (
                <a
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setVisible(true);
                    setRecord(record);
                    ellipsisWithTooltipRef?.current?.setPopoverVisible(false);
                  }}
                >
                  {text}
                </a>
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
            filterProperties={(s) => {
              return s['x-component'] === 'RecordPicker.Viewer';
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

    return collectionField ? (
      <div>
        <BlockAssociationContext.Provider value={`${collectionField.collectionName}.${collectionField.name}`}>
          <CollectionProvider_deprecated name={collectionField.target ?? collectionField.targetCollection}>
            <EllipsisWithTooltip ellipsis={ellipsis} ref={ellipsisWithTooltipRef}>
              {renderRecords()}
            </EllipsisWithTooltip>
            <ActionContextProvider
              value={{ visible, setVisible, openMode: 'drawer', snapshot: collectionField.interface === 'snapshot' }}
            >
              {renderRecordProvider()}
            </ActionContextProvider>
          </CollectionProvider_deprecated>
        </BlockAssociationContext.Provider>
      </div>
    ) : null;
  },
  { displayName: 'ReadPrettyRecordPicker' },
);
