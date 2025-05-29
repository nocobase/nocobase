/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageContainer } from '@ant-design/pro-layout';
import { observer } from '@formily/reactive-react';
import { uid } from '@formily/shared';
import { FlowModelComponent, useApplyAutoFlows, useFlowModel, withFlowModel } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageFlowModel } from './model';

function InternalPage(props) {
  const params = useParams();
  const model = useFlowModel<PageFlowModel>(params.name);
  const { tabList } = model.getProps();
  return (
    <div>
      <Tabs
        items={tabList}
        tabBarExtraContent={
          <Button
            onClick={async () => {
              await model.addTab({
                stepParams: {
                  defaultFlow: {
                    step1: {
                      title: `tab-${uid()}`,
                    },
                  },
                },
              });
            }}
          >
            Add tab
          </Button>
        }
      />
      Page {model.uid}
    </div>
  );
}

const InternalPageFlow = withFlowModel(observer(InternalPage));

export const FlowPage = () => {
  const params = useParams();
  const model = useFlowModel<PageFlowModel>(params.name);
  return <FlowModelComponent model={model} />;
};
