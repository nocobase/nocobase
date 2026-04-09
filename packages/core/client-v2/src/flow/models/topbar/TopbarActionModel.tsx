/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HighlightOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import { FlowModel } from '@nocobase/flow-engine';
import { Button, Tooltip } from 'antd';
import React from 'react';

export class TopbarActionModel extends FlowModel {
  declare icon: React.ReactNode;
  declare tooltip: string;
  declare sort: number;

  onClick() {}

  render() {
    return (
      <Tooltip title={this.tooltip}>
        <Button {...this.props} icon={this.icon} type="link" onClick={this.onClick.bind(this)}></Button>
      </Tooltip>
    );
  }
}

export class UIEditorTopbarActionModel extends TopbarActionModel {
  sort = 0;
  icon = (<HighlightOutlined />);
  tooltip = 'UI Editor';

  onClick() {
    const flowSettings = this.context.engine.flowSettings;
    if (flowSettings.enabled) {
      flowSettings.disable();
    } else {
      flowSettings.enable();
    }
  }
}

export class MessageTopbarActionModel extends TopbarActionModel {
  sort = 200;
  icon = (<BellOutlined />);
  tooltip = 'Message';

  onClick() {
    console.log('Message');
  }
}

export class PluginSettingsTopbarActionModel extends TopbarActionModel {
  sort = 100;
  icon = (<SettingOutlined />);
  tooltip = 'Message';

  onClick() {
    console.log('Message');
  }
}
