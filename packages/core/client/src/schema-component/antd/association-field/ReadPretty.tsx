import React from 'react';
import { useField } from '@formily/react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { AssociationSelectReadPretty } from './AssociationSelect';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { InternalSubTable } from './InternalSubTable';
import { FileManageReadPretty } from './FileManager';

export const ReadPretty = (props) => {
  const field: any = useField();
  const { getField } = useCollection();
  const { getCollection } = useCollectionManager();
  const collectionField = getField(field.props.name);
  const isFileCollection = getCollection(collectionField?.target).template === 'file';
  const { mode = isFileCollection ? 'FileManager' : 'Select', enableLink } = props;
  return (
    <AssociationFieldProvider>
      {(mode === 'Picker' || (mode === 'Select' && enableLink !== false)) && <ReadPrettyInternalViewer {...props} />}
      {mode === 'Nester' && <InternalNester {...props} />}
      {mode === 'Select' && enableLink === false && <AssociationSelectReadPretty {...props} />}
      {mode === 'SubTable' && <InternalSubTable {...props} />}
      {mode === 'FileManager' && <FileManageReadPretty {...props} />}
    </AssociationFieldProvider>
  );
};
