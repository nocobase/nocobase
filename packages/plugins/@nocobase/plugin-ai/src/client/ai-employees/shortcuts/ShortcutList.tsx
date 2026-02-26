/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { useShortcuts } from './useShortcuts';
import { useDesignable, useRequest } from '@nocobase/client';
import { AIEmployeeListItem } from '../AIEmployeeListItem';
import { observer } from '@nocobase/flow-engine';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';
import { isHide } from '../built-in/utils';
import { AIEmployee } from '../types';

export const ShortcutList: React.FC = observer(() => {
  const { designable } = useDesignable();
  const { model, builtIn } = useShortcuts();
  const designMode = designable && !builtIn;
  const hasShortcuts = model?.subModels?.shortcuts?.length > 0;

  const aiConfigRepository = useAIConfigRepository();
  const { loading, data } = useRequest<AIEmployee[]>(async () => {
    return aiConfigRepository.getAIEmployees();
  });
  const aiEmployees = data || [];

  return (
    <>
      {hasShortcuts && <FlowModelRenderer model={model} />}
      {!builtIn && (
        <AddSubModelButton
          model={model}
          subModelKey={'shortcuts'}
          afterSubModelAdd={async () => {
            if (!model.isNewModel) {
              return;
            }
            await model.save();
            model.isNewModel = false;
          }}
          items={async () => {
            return loading
              ? []
              : aiEmployees
                  ?.filter((aiEmployee) => !isHide(aiEmployee))
                  .map((aiEmployee) => ({
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
    </>
  );
});
