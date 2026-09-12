/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, observer, useFlowModel, type MultiRecordResource } from '@nocobase/flow-engine';
import { List } from 'antd';
import React, { useState } from 'react';
import { CommentSubmit } from './CommentSubmit';

type CommentRecord = {
  id: string | number;
  content?: string;
};

type CommentListProps = {
  resource: MultiRecordResource;
  handlePageChange: (page: number) => void;
  dataSource?: CommentRecord[];
};

export const CommentList = observer((props: CommentListProps) => {
  const { resource, handlePageChange, dataSource } = props;
  const [quoteContent, setQuoteContent] = useState('');
  const model = useFlowModel();

  model.context.defineMethod('setQuoteContent', (value: string) => {
    setQuoteContent(value);
  });

  return (
    <div>
      <List
        pagination={
          resource?.getMeta('count') > 0
            ? {
                onChange: handlePageChange,
                total: resource?.getMeta('count') || 0,
                pageSize: resource.getPageSize() || 10,
                current: resource.getPage() || 1,
              }
            : false
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {dataSource?.length
            ? dataSource.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === dataSource.length - 1;
                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      padding: `${isFirst ? 0 : '10px'} 0 ${isLast ? 0 : '10px'} 0`,
                    }}
                  >
                    {model.mapSubModels('items', (itemModel) => {
                      const fork = itemModel.createFork({}, `${item.id}-${item.content || ''}`);
                      fork.context.defineProperty('record', {
                        get: () => item,
                        cache: false,
                      });
                      return <FlowModelRenderer key={fork.uid} model={fork} />;
                    })}
                  </div>
                );
              })
            : null}
        </div>
      </List>
      <CommentSubmit defaultValue={quoteContent} />
    </div>
  );
});
