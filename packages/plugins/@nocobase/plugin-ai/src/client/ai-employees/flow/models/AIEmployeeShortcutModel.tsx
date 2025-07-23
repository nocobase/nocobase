/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Button, Spin, Popover } from 'antd';
import { FlowModel, defineFlow, escapeT } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, Task, TriggerTaskOptions } from '../../types';
import { useAIEmployeesContext } from '../../AIEmployeesProvider';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import { ProfileCard } from '../../ProfileCard';

const Shortcut: React.FC<TriggerTaskOptions> = ({ aiEmployee: { username }, tasks }) => {
  const [focus, setFocus] = useState(false);

  const {
    aiEmployeesMap,
    service: { loading },
  } = useAIEmployeesContext();
  const aiEmployee = aiEmployeesMap[username];

  const { triggerTask } = useChatBoxActions();

  const currentAvatar = useMemo(() => {
    const avatar = aiEmployee?.avatar;
    if (!avatar) {
      return null;
    }
    if (focus) {
      return avatars(avatar, {
        gesture: ['waveLongArm'],
        gestureProbability: 100,
        translateX: -15,
      });
    }
    return avatars(avatar);
  }, [aiEmployee, focus]);

  return (
    <Spin spinning={loading}>
      <Popover content={<ProfileCard aiEmployee={aiEmployee} />} placement="topLeft">
        <Avatar
          src={currentAvatar}
          size={52}
          shape="square"
          style={{
            cursor: 'pointer',
          }}
          // @ts-ignore
          onMouseEnter={() => setFocus(true)}
          onMouseLeave={() => setFocus(false)}
          onClick={() => {
            triggerTask({ aiEmployee, tasks });
          }}
        />
      </Popover>
    </Spin>
  );
};

export class AIEmployeeShortcutModel extends FlowModel {
  public declare props: TriggerTaskOptions & {
    builtIn?: boolean;
  };

  render() {
    return <Shortcut {...this.props} />;
  }
}

AIEmployeeShortcutModel.registerFlow({
  key: 'shortcutSettings',
  auto: true,
  title: escapeT('Task settings'),
  steps: {
    editTasks: {
      title: escapeT('Edit tasks'),
      uiSchema: {
        background: {
          type: 'string',
          title: 'Background',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        message: {
          type: 'string',
          title: 'Default message',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        block: {
          type: 'string',
          title: 'Block UID',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        autoSend: {
          type: 'boolean',
          title: 'Send default message automatically',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
      },
      handler(ctx, params) {
        const task: Task = {
          message: {
            user: params.message,
            system: params.background,
          },
          autoSend: params.autoSend,
        };
        if (params.block) {
          task.message.workContext = [
            {
              type: 'flow-model',
              uid: params.block,
            },
          ];
        }
        ctx.model.setProps({
          tasks: [task],
        });
      },
    },
  },
});
