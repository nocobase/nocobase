/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Divider } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import React, { useMemo, useState } from 'react';
import { useShortcuts } from './useShortcuts';
import { useDesignable, useToken } from '@nocobase/client';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { observer } from '@formily/react';
import { useAIEmployeesData } from '../useAIEmployeesData';

export const ShortcutList: React.FC = observer(() => {
  const { designable } = useDesignable();
  const { model, builtIn } = useShortcuts();
  const { token } = useToken();
  const designMode = designable && !builtIn;
  const hasShortcuts = model?.subModels?.shortcuts?.length > 0;

  const { loading, aiEmployees } = useAIEmployeesData();

  const [folded, setFolded] = useState(false);

  return (
    <>
      {hasShortcuts && (
        <>
          <Button
            variant="text"
            color="default"
            icon={!folded ? <RightOutlined /> : <LeftOutlined />}
            style={{
              height: '52px',
              width: '12px',
              fontSize: token.fontSizeSM,
            }}
            onClick={() => setFolded(!folded)}
          />
          {!folded && <FlowModelRenderer model={model} />}
        </>
      )}
      {!builtIn && (
        <AddSubModelButton
          model={model}
          subModelKey={'shortcuts'}
          onSubModelAdded={async () => {
            if (!model.isNewModel) {
              return;
            }
            await model.save();
            model.isNewModel = false;
          }}
          items={async () => {
            return loading
              ? []
              : aiEmployees.map((aiEmployee) => ({
                  key: aiEmployee.username,
                  label: <AIEmployeeListItem aiEmployee={aiEmployee} />,
                  createModelOptions: {
                    use: 'AIEmployeeShortcutModel',
                    props: {
                      aiEmployee: {
                        username: aiEmployee.username,
                      },
                    },
                  },
                }));
          }}
        >
          <Button
            icon={<PlusOutlined />}
            variant="dashed"
            color="default"
            style={{
              width: '48px',
              height: '48px',
              color: 'var(--colorSettings)',
              borderColor: 'var(--colorSettings)',
              background: 'transparent',
            }}
          />
        </AddSubModelButton>
      )}
      {(hasShortcuts || designMode) && (
        <Divider
          type="vertical"
          style={{
            height: '50px',
          }}
        />
      )}
    </>
  );
});
