import React, { useEffect, useState } from 'react';
import { useField, observer } from '@formily/react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalSubTable } from './InternalSubTable';
import { FileManageReadPretty } from './FileManager';
import { useAssociationFieldContext } from './hooks';

const ReadPrettyAssociationField = observer((props: any) => {
  const { currentMode } = useAssociationFieldContext();

  return (
    <>
      {['Select', 'Picker'].includes(currentMode) && <ReadPrettyInternalViewer {...props} />}
      {currentMode === 'Nester' && <InternalNester {...props} />}
      {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      {currentMode === 'FileManager' && <FileManageReadPretty {...props} />}
    </>
  );
});

export const ReadPretty = observer((props) => {
  return (
    <AssociationFieldProvider>
      <ReadPrettyAssociationField {...props} />
    </AssociationFieldProvider>
  );
});
