import { observer, useFieldSchema} from '@formily/react';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useActionContext } from '.';
import { ComposedActionDrawer } from './types';
import {
  useBlockRequestContext,
  useCollection,
  useCompile,
  useDocumentTitle,
  useRecord
} from '../../../';

export const ActionPage: ComposedActionDrawer = observer((props) => {
  const history = useHistory();
  const { visible } = useActionContext();
  const { service } = useBlockRequestContext();

  const schema = useFieldSchema();
  const collection = useCollection();
  const record = useRecord();
  const compile = useCompile();
  const { title } = useDocumentTitle();
  if (visible) {
    const filterTargetKey = collection.filterTargetKey || 'id';
    const filterTargetVal = record?.[filterTargetKey];

    const searchStr = `subXUid=${schema['x-uid']}&collectionName=${
      collection.name
    }&filterTargetKey=${filterTargetKey}&filterTargetVal=${filterTargetVal}&title=${compile(title)}&subTitle=${compile(
      schema.title,
    )}&serviceParams=${JSON.stringify(service?.params)}&openMode=page`;

    history.push({
      search: searchStr,
    });
    return null;
  }
  return null;
});

export default ActionPage;
