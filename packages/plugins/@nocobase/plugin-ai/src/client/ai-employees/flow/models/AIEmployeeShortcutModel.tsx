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
import { FlowModel } from '@nocobase/flow-engine';
import { avatars } from '../../avatars';
import { AIEmployee, TriggerTaskOptions } from '../../types';
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
  console.log(aiEmployee);

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
  public declare props: TriggerTaskOptions;

  render() {
    return <Shortcut {...this.props} />;
  }
}
