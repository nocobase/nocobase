/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageHeader } from '@ant-design/pro-layout';
import { FlowModel, FlowModelRenderer, FlowSettingsButton, escapeT } from '@nocobase/flow-engine';
import _ from 'lodash';
import React from 'react';
import { OldPageModel } from './OldPageModel';

/**
 * @deprecated Use `RootPageModel` instead.
 */
export class MainPageModel extends OldPageModel {
  renderFirstTab() {
    return <FlowModelRenderer model={this.subModels.tabs?.[0]} />;
  }

  render() {
    return (
      <>
        {this.props.displayTitle && <PageHeader title={this.props.title} style={this.props.headerStyle} />}
        {this.renderFirstTab()}
      </>
    );
  }
}
