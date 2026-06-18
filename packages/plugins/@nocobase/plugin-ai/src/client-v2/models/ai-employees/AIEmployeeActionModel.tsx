/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ActionModel,
  ActionSceneEnum,
  CollectionActionGroupModel,
  FormActionGroupModel,
  PopupSubTableFormActionGroupModel,
  RecordActionGroupModel,
} from '@nocobase/client-v2';
import { type FlowModelContext } from '@nocobase/flow-engine';
import { Avatar, Flex, Popover, Typography, theme } from 'antd';
import { AIEmployeeProfileCard } from '../../ai-employees/ProfileCard';
import { avatars } from '../../ai-employees/avatars';
import type { AIEmployee } from '../../ai-employees/types';
import { tExpr } from '../../locale';

const isHiddenEmployee = (aiEmployee: AIEmployee) =>
  aiEmployee?.deprecated === true || aiEmployee?.category === 'developer';

const AIEmployeeListItem: React.FC<{
  aiEmployee: AIEmployee;
}> = ({ aiEmployee }) => {
  const { token } = theme.useToken();

  return (
    <Popover content={<AIEmployeeProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
      <Flex align="center" gap="small">
        <Avatar shape="circle" size={token.controlHeightLG} src={avatars(aiEmployee.avatar)} />
        <Flex vertical>
          <Typography.Text style={{ fontSize: token.fontSizeSM, lineHeight: token.lineHeight }}>
            {aiEmployee.nickname}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, lineHeight: token.lineHeight }}>
            {aiEmployee.position}
          </Typography.Text>
        </Flex>
      </Flex>
    </Popover>
  );
};

type AIConfigContext = FlowModelContext & {
  aiConfigRepository: {
    getAIEmployees: () => Promise<AIEmployee[]>;
  };
};

export class AIEmployeeActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;

  static async defineChildren(ctx: FlowModelContext) {
    const aiContext = ctx as AIConfigContext;
    const aiEmployees = await aiContext.aiConfigRepository.getAIEmployees();

    return aiEmployees
      ?.filter((aiEmployee) => !isHiddenEmployee(aiEmployee))
      .map((aiEmployee) => ({
        key: aiEmployee.username,
        label: <AIEmployeeListItem aiEmployee={aiEmployee} />,
        createModelOptions: {
          use: 'AIEmployeeButtonModel',
          props: {
            aiEmployee: {
              username: aiEmployee.username,
            },
            context: {
              workContext: [{ type: 'flow-model', uid: ctx.model.uid }],
            },
            auto: false,
          },
        },
      }));
  }
}

AIEmployeeActionModel.define({
  label: tExpr('AI employees'),
  sort: 8000,
});

CollectionActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});

RecordActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});

FormActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});

PopupSubTableFormActionGroupModel.registerActionModels({
  AIEmployeeActionModel,
});
