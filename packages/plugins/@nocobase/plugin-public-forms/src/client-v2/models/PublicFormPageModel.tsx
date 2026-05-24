/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { Steps } from 'antd';
import React, { useMemo, useState } from 'react';
import { useT } from '../locale';

const PublicFormSettingsSteps = observer((props: { model: PublicFormPageModel }) => {
  const { model } = props;
  const t = useT();
  const [current, setCurrent] = useState(0);
  const items = useMemo(
    () => [
      {
        title: t('Configure form'),
      },
      {
        title: t('After successful submission'),
      },
    ],
    [t],
  );

  return (
    <>
      <Steps current={current} items={items} onChange={setCurrent} />
      {model.renderStep(current)}
    </>
  );
});

export class PublicFormPageModel extends ChildPageModel {
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('publicFormPageModel', {
      value: this,
    });
  }

  renderStep(index: number) {
    return this.subModels.tabs?.[index]?.renderChildren?.() || null;
  }

  render() {
    if (this.props.publicRuntime) {
      return this.renderStep(this.props.publicFormSubmitted ? 1 : 0);
    }

    return <PublicFormSettingsSteps model={this} />;
  }
}

export default PublicFormPageModel;
