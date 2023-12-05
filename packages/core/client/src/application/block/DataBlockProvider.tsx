import { observer } from '@formily/react';
import React, { FC, ReactNode, useMemo } from 'react';
import { useRecordV2 } from './RecordProvider';
import { BlockProviderV2 } from './BlockProvider';
import { CollectionProviderV2 } from './CollectionProvider';
import { AssociationProviderV2 } from './AssociationProvider';
import { BlockRequestProviderV2 } from './BlockUseRequestProvider';
import { merge } from 'lodash';

interface DataBlockProviderProps {
  collection: string;
  action: string;
  params?: Record<string, any>;
  sourceId?: string;
  association?: string;
  useParams?: string;
  useSourceId?: string;
  children?: ReactNode;
  [index: string]: any;
}

export const DataBlockProviderV2: FC<DataBlockProviderProps> = observer((props) => {
  const { collection, association, action, params, children } = props;
  const record = useRecordV2<{ sourceId?: string; filterByTk?: string; params?: Record<string, any> }>();
  const mergedParams = useMemo(() => {
    return merge(params, record.current.params);
  }, [params, record]);
  return (
    <BlockProviderV2 {...props}>
      <CollectionProviderV2 name={collection}>
        <AssociationProviderV2 name={association}>
          <BlockRequestProviderV2
            collection={collection}
            association={association}
            action={action}
            sourceId={record.current.sourceId}
            filterByTk={record.current.filterByTk}
            params={mergedParams}
          >
            {children}
          </BlockRequestProviderV2>
        </AssociationProviderV2>
      </CollectionProviderV2>
    </BlockProviderV2>
  );
});
