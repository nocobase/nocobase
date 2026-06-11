/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { CreateFormModel, EditFormModel, FormBlockContent } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { Pagination } from 'antd';
import React from 'react';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { dispatchEventDeep } from '@nocobase/client-v2';

const userProfileFormCardClassName = css`
  &.ant-card {
    box-shadow: none !important;
    background: transparent !important;
  }

  > .ant-card-body {
    background: transparent !important;
  }
`;

export class UserCreateFormModel extends CreateFormModel {
  onInit(options: any) {
    super.onInit(options);
    this.setDecoratorProps({ bordered: false, className: userProfileFormCardClassName });
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const { heightMode, height } = this.decoratorProps;

    return (
      <FormBlockContent
        model={this}
        gridModel={this.subModels.grid}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
        heightMode={heightMode}
        height={height}
        grid={<FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />}
      />
    );
  }
}

export class UserEditFormModel extends EditFormModel {
  onInit(options: any) {
    super.onInit(options);
    this.setDecoratorProps({ bordered: false, className: userProfileFormCardClassName });
  }

  handlePageChange = async (page: number) => {
    if (this.resource instanceof MultiRecordResource) {
      const multiResource = this.resource as MultiRecordResource;
      multiResource.setPage(page);
      multiResource.loading = true;
      await multiResource.refresh();
      await dispatchEventDeep(this, 'paginationChange');
    }
  };

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const { heightMode, height } = this.decoratorProps;
    const hasAvailableData = this.hasAvailableData();
    const footer =
      !this.resource.loading && !hasAvailableData ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            color: this.context?.themeToken?.colorTextDescription,
          }}
        >
          {this.translate('No available data currently')}
        </div>
      ) : this.isMultiRecordResource() && this.resource.getMeta('count') > 1 ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          <Pagination
            simple
            pageSize={1}
            showSizeChanger={false}
            defaultCurrent={(this.resource as MultiRecordResource).getPage()}
            total={(this.resource as MultiRecordResource).getTotalPage()}
            onChange={this.handlePageChange}
            style={{ display: 'inline-block' }}
          />
        </div>
      ) : null;

    return (
      <FormBlockContent
        model={this}
        gridModel={this.subModels.grid}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
        heightMode={heightMode}
        height={height}
        grid={<FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />}
        footer={footer}
      />
    );
  }
}
