/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import React from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { FileManageReadPretty } from './FileManager';
import { InternalNester } from './InternalNester';
import { InternalSubTable } from './InternalSubTable';
import { ReadPrettyInternalTag } from './InternalTag';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { useAssociationFieldContext } from './hooks';

const ReadPrettyAssociationField = (props: any) => {
  const { currentMode } = useAssociationFieldContext();
  return (
    <>
      {['Select', 'Picker', 'CascadeSelect'].includes(currentMode) && <ReadPrettyInternalViewer {...props} />}
      {currentMode === 'Tag' && <ReadPrettyInternalTag {...props} />}
      {currentMode === 'Nester' && <InternalNester {...props} />}
      {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      {currentMode === 'FileManager' && <FileManageReadPretty {...props} />}
    </>
  );
};

export const ReadPretty = observer(
  (props) => {
    // Using props.value directly causes issues - UI won't update when field.value or field.initialValue changes
    const field: any = useField();
    // Don't inline this - we need to access field.initialValue separately to ensure proper dependency tracking
    const defaultValue = field.initialValue;
    const value = field.value || defaultValue;

    return (
      <AssociationFieldProvider>
        <ReadPrettyAssociationField {...props} value={value} />
      </AssociationFieldProvider>
    );
  },
  { displayName: 'ReadPretty' },
);
