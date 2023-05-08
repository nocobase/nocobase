import React, { useEffect, useState } from 'react';
import { useField } from '@formily/react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { InternalNester } from './InternalNester';
import { ReadPrettyInternalViewer } from './InternalViewer';
import { AssociationSelectReadPretty } from './AssociationSelect';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { InternalSubTable } from './InternalSubTable';
import { FileManageReadPretty } from './FileManager';

export const ReadPretty = (props) => {
  const { enableLink } = props;
  const field: any = useField();
  const { getField } = useCollection();
  const { getCollection } = useCollectionManager();
  const collectionField = getField(field.props.name);
  const isFileCollection = getCollection(collectionField?.target).template === 'file';
  const [currentMode, setCurrentMode] = useState(props.mode || isFileCollection ? 'FileManager' : 'Select');
  useEffect(() => {
    props.mode && setCurrentMode(props.mode);
  }, [props.mode]);
  return (
    <AssociationFieldProvider>
      {(currentMode === 'Picker' || (currentMode === 'Select' && enableLink !== false)) && (
        <ReadPrettyInternalViewer {...props} />
      )}
      {currentMode === 'Nester' && <InternalNester {...props} />}
      {currentMode === 'Select' && enableLink === false && <AssociationSelectReadPretty {...props} />}
      {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      {currentMode === 'FileManager' && <FileManageReadPretty {...props} />}
    </AssociationFieldProvider>
  );
};
