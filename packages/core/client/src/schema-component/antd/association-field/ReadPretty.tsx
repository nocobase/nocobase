import React from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { AssociationSelectReadPretty } from './AssociationSelect';
import { InternalSubTable } from './InternalSubTable';

export const ReadPretty = (props) => {
  const { mode = 'Picker' } = props;
  return (
    <AssociationFieldProvider>
      {mode === 'Picker' && <ReadPrettyInternalViewer {...props} />}
      {mode === 'Nester' && <InternalNester {...props} />}
      {mode === 'Select' && <AssociationSelectReadPretty {...props} />}
      {mode === 'SubTable' && <InternalSubTable {...props} />}
    </AssociationFieldProvider>
  );
};
