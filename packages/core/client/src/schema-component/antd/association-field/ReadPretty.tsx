import React from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { AssociationSelectReadPretty } from './AssociationSelect';
import { InternalSubTable } from './InternalSubTable';

export const ReadPretty = (props) => {
  const { mode = 'Select', enableLink } = props;
  return (
    <AssociationFieldProvider>
      {(mode === 'Picker' || enableLink !== false) && <ReadPrettyInternalViewer {...props} />}
      {mode === 'Nester' && <InternalNester {...props} />}
      {mode === 'Select' && enableLink === false && <AssociationSelectReadPretty {...props} />}
      {mode === 'SubTable' && <InternalSubTable {...props} />}
    </AssociationFieldProvider>
  );
};
