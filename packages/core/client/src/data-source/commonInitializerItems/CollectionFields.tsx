import React, { FC } from "react";
import { CollectionFieldsProps, useCollectionFieldContext } from "./utils";
import { AssociationFields, ParentCollectionFields, DisplayFields } from './items'

export const CollectionFields: FC<CollectionFieldsProps> = (props) => {
  const context = useCollectionFieldContext();
  if (context.collection) return null;
  return <>
    <DisplayFields {...props} context={context as Required<typeof context>} />
    <ParentCollectionFields {...props} context={context as Required<typeof context>} />
    <AssociationFields  {...props} context={context as Required<typeof context>} />
  </>;
}
