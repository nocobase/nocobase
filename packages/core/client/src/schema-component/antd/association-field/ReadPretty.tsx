/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
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
    return (
      <AssociationFieldProvider>
        <ReadPrettyAssociationField {...props} />
      </AssociationFieldProvider>
    );
  },
  { displayName: 'ReadPretty' },
);
