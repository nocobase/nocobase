/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import React, { Fragment, useRef } from 'react';
import { useDesignable } from '../../';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useCollectionRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { useCompile } from '../../hooks';
import { useActionContext } from '../action';
import { usePopupUtils } from '../page/pagePopupUtils';
import { transformNestedData } from './InternalCascadeSelect';
import { ButtonListProps, ReadPrettyInternalViewer, isObject } from './InternalViewer';
import { useAssociationFieldContext, useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { getTabFormatValue, useLabelUiSchema } from './util';

interface IEllipsisWithTooltipRef {
  setPopoverVisible: (boolean) => void;
}

const toValue = (value, placeholder) => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  return value;
};

const ButtonTabList: React.FC<ButtonListProps> = (props) => {
  const fieldSchema = useFieldSchema();
  const { enableLink, tagColorField } = fieldSchema['x-component-props'];
  const fieldNames = useFieldNames({ fieldNames: props.fieldNames });
  const insertViewer = useInsertSchema('Viewer');
  const { options: collectionField } = useAssociationFieldContext();
  const compile = useCompile();
  const { designable } = useDesignable();
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
  const { snapshot } = useActionContext();
  const ellipsisWithTooltipRef = useRef<IEllipsisWithTooltipRef>();
  const { getCollection } = useCollectionManager_deprecated();
  const targetCollection = getCollection(collectionField?.target);
  const isTreeCollection = targetCollection?.template === 'tree';
  const { openPopup } = usePopupUtils();
  const recordData = useCollectionRecordData();

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
                    parentRecordData: recordData,
                  });
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

export const ReadPrettyInternalTag: React.FC = observer(
  (props: any) => {
    return <ReadPrettyInternalViewer {...props} ButtonList={ButtonTabList} />;
  },
  { displayName: 'ReadPrettyInternalTag' },
);
