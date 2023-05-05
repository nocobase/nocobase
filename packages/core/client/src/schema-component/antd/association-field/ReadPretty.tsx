import React from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { FileManager } from './FileManager';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { AssociationSelect } from './AssociationSelect';
import { InternalSubTable } from './InternalSubTable';

export const ReadPretty = (props) => {
  const { mode = 'Picker' } = props;
  return (
    <AssociationFieldProvider>
      {mode === 'Picker' && <ReadPrettyInternalViewer {...props} />}
      {mode === 'FileManager' && <FileManager {...props} />}
      {mode === 'Nester' && <InternalNester {...props} />}
      {mode === 'Select' && <AssociationSelect {...props} />}
      {mode === 'SubTable' && <InternalSubTable {...props} />}
    </AssociationFieldProvider>
  );
};
