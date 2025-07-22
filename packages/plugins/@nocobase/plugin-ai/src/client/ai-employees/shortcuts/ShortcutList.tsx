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
import { useAIEmployeesContext } from '../AIEmployeesProvider';
import { AIEmployeeListItem } from '../AIEmployeeListItem';

export const ShortcutList: React.FC = () => {
  const flowEngine = useFlowEngine();
  const { designable } = useDesignable();
  const { shortcuts, uid, builtIn } = useShortcuts();
  const { token } = useToken();
  const designMode = designable && !builtIn;

  const {
    aiEmployees,
    service: { loading },
  } = useAIEmployeesContext();

  const [folded, setFolded] = useState(false);

  const model = useMemo(() => {
    return flowEngine.createModel({
      uid: `ai-shortcuts-${uid}`,
      use: 'AIEmployeeShortcutListModel',
      subModels: {
        shortcuts,
      },
    });
  }, [flowEngine, shortcuts]);

  return (
    <>
      {shortcuts.length > 0 && (
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
                        username: 'form_assistant',
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
      {(shortcuts.length || designMode) && (
        <Divider
          type="vertical"
          style={{
            height: '50px',
          }}
        />
      )}
    </>
  );
};
