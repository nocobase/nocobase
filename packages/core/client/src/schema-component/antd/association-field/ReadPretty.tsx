import React, { useEffect, useState } from 'react';
import { useField, observer } from '@formily/react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { InternalSubTable } from './InternalSubTable';
import { FileManageReadPretty } from './FileManager';
import { useAssociationFieldContext } from './hooks';

export const ReadPretty = observer((props: any) => {
  const { isFileCollection } = useAssociationFieldContext();
  const [currentMode, setCurrentMode] = useState(props.mode || (isFileCollection ? 'FileManager' : 'Select'));
  useEffect(() => {
    props.mode && setCurrentMode(props.mode);
  }, [props.mode]);
  return (
    <AssociationFieldProvider>
      {['Select', 'Picker'].includes(currentMode) && <ReadPrettyInternalViewer {...props} />}
      {currentMode === 'Nester' && <InternalNester {...props} />}
      {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      {currentMode === 'FileManager' && <FileManageReadPretty {...props} />}
    </AssociationFieldProvider>
  );
});
