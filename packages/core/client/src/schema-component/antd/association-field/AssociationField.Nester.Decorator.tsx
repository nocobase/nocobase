import React from 'react';
import { CollectionProvider } from '../../../';

export const AssociationFieldNesterDecorator = (props) => {
  return <CollectionProvider name={props.target}>{props.children}</CollectionProvider>;
};
