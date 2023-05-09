import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { Fragment, useRef, useState } from 'react';
import { BlockAssociationContext, WithoutTableFieldResource } from '../../../block-provider';
import { CollectionProvider, useCollection, useCollectionManager } from '../../../collection-manager';
import { getLinkedParentRecord, RecordProvider, useRecord } from '../../../record-provider';
import { FormProvider } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContext, useActionContext } from '../action';
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

export const ReadPrettyRecordPicker: React.FC = observer((props: any) => {
  const { ellipsis } = props;
  const fieldSchema = useFieldSchema();
  const recordCtx = useRecord();
  const { getCollectionJoinField } = useCollectionManager();
  // value 做了转换，但 props.value 和原来 useField().value 的值不一致
  // const field = useField<Field>();
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const { getField } = useCollection();
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
        <Fragment key={`${record.id}_${index}`}>
          <span>
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
    const names = (fieldSchema?.name as string)?.split('.') || [];

    // 最后一个是在用户点击的时候设置的，这里不用处理
    names.pop();

    if (names.length > 0) {
      let parentRecord = recordCtx;
      try {
        for (const name of names) {
          // 根据关系字段的层级关系链接 record
          // TODO: 当被选中的字段没有在当前区块显示的时候，是不会存在数据的，所以这里会报错，当存在这种情况时，需要刷新一下区块的数据，应该就会包含当前字段的数据了
          parentRecord = getLinkedParentRecord(parentRecord[name], parentRecord);
        }
      } catch (err) {
        console.error(err);
        throw new Error(`ReadPrettyRecordPicker: ${fieldSchema.name} is not a valid field name`);
      }

      return (
        <RecordProvider record={parentRecord}>
          {/* 在这里再把用户点击的关系字段的数据作为 record 传进去 */}
          <RecordProvider record={record}>{renderWithoutTableFieldResourceProvider()}</RecordProvider>
        </RecordProvider>
      );
    }

    return <RecordProvider record={record}>{renderWithoutTableFieldResourceProvider()}</RecordProvider>;
  };

  return collectionField ? (
    <div>
      <BlockAssociationContext.Provider value={`${collectionField.collectionName}.${collectionField.name}`}>
        <CollectionProvider name={collectionField.target ?? collectionField.targetCollection}>
          <EllipsisWithTooltip ellipsis={ellipsis} ref={ellipsisWithTooltipRef}>
            {renderRecords()}
          </EllipsisWithTooltip>
          <ActionContext.Provider
            value={{ visible, setVisible, openMode: 'drawer', snapshot: collectionField.interface === 'snapshot' }}
          >
            {renderRecordProvider()}
          </ActionContext.Provider>
        </CollectionProvider>
      </BlockAssociationContext.Provider>
    </div>
  ) : null;
});
