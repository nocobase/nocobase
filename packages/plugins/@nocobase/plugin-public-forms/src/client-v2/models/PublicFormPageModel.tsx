/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { define, observable } from '@formily/reactive';
import { ChildPageModel, PoweredBy } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import type { DataSourceManager, FlowModel } from '@nocobase/flow-engine';
import { theme } from 'antd';
import React, { useMemo } from 'react';
import { PUBLIC_FORM_LAYOUT_UID, PUBLIC_FORM_SUBMIT_ACTION_MODEL } from '../constants';
import { useT } from '../locale';

type PublicFormLayoutRuntimeModel = FlowModel & {
  currentLayoutRoute?: unknown;
  getPageUidFromLayoutRoute?: (match: unknown) => string;
  context: FlowModel['context'] & {
    dataSourceManager?: DataSourceManager;
  };
};

const PublicFormSettingsContent = observer((props: { model: PublicFormPageModel }) => {
  const { model } = props;
  const t = useT();
  const { token } = theme.useToken();
  const className = useMemo(
    () => css`
      max-width: 800px;
      margin: 20px auto 0;

      .nb-block-grid {
        padding: 0 !important;
      }

      .public-form-settings-content-title {
        margin: ${token.marginLG}px 0 ${token.marginSM}px;
        font-size: ${token.fontSizeHeading4}px;
        font-weight: ${token.fontWeightStrong};
        line-height: ${token.lineHeightHeading4};
      }

      [data-flow-add-block],
      div:has(> [data-flow-add-block]) {
        display: none !important;
      }

      .public-form-settings-powered-by {
        margin-top: ${token.marginLG}px;
      }

      @media (max-width: ${token.screenMD}px) {
        margin-top: 20px;
      }
    `,
    [
      token.fontSizeHeading4,
      token.fontWeightStrong,
      token.lineHeightHeading4,
      token.marginLG,
      token.marginSM,
      token.screenMD,
    ],
  );

  return (
    <div className={className}>
      {model.renderStep(0)}
      <div className="public-form-settings-content-title">{t('Prompt after successful submission')}</div>
      {model.renderStep(1)}
      <div className="public-form-settings-powered-by">
        <PoweredBy />
      </div>
    </div>
  );
});

export class PublicFormPageModel extends ChildPageModel {
  publicFormSubmitted = false;

  constructor(options: any) {
    super(options);
    define(this, {
      publicFormSubmitted: observable.ref,
    });
  }

  private getPublicFormDataSourceManager() {
    const layoutModel = this.flowEngine.getModel<PublicFormLayoutRuntimeModel>(PUBLIC_FORM_LAYOUT_UID, true);
    const routePageUid = this.parent?.uid;
    const layoutPageUid = layoutModel?.getPageUidFromLayoutRoute?.(layoutModel.currentLayoutRoute);

    if (!routePageUid || layoutPageUid !== routePageUid) {
      return undefined;
    }

    return layoutModel?.context?.dataSourceManager;
  }

  onInit(options: any): void {
    super.onInit(options);
    this.setProps('showFlowSettings', false);
    this.context.defineProperty('dataSourceManager', {
      get: () => this.getPublicFormDataSourceManager() || this.flowEngine.context.dataSourceManager,
      cache: false,
    });
    this.context.defineProperty('publicFormPageModel', {
      value: this,
    });
    this.context.defineProperty('allowedFormActionModelNames', {
      value: [PUBLIC_FORM_SUBMIT_ACTION_MODEL],
    });
    this.context.defineProperty('publicFormSubmitted', {
      get: () => this.publicFormSubmitted,
      observable: true,
      cache: false,
    });
    this.context.defineMethod('setPublicFormSubmitted', (submitted: boolean) => {
      this.setPublicFormSubmitted(submitted);
    });
  }

  setPublicFormSubmitted(submitted: boolean) {
    this.publicFormSubmitted = !!submitted;
    this.setProps('publicFormSubmitted', this.publicFormSubmitted);
  }

  renderStep(index: number) {
    return this.subModels.tabs?.[index]?.renderChildren?.() || null;
  }

  render() {
    if (this.props.publicRuntime || this.context.publicFormRuntime) {
      return this.renderStep(this.publicFormSubmitted || this.props.publicFormSubmitted ? 1 : 0);
    }

    return <PublicFormSettingsContent model={this} />;
  }
}

export default PublicFormPageModel;
