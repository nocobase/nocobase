import React from 'react';
import { Tag } from 'antd';
import { cx } from '@emotion/css';

import { Branch } from './Branch';
import { lang } from './locale';
import { branchBlockClass, nodeCardClass, nodeMetaClass } from './style';
import { TriggerConfig } from './triggers';

export function CanvasContent({ entry }) {
  return (
    <div className="workflow-canvas">
      <TriggerConfig />
      <div className={branchBlockClass}>
        <Branch entry={entry} />
      </div>
      <div className={cx('end', nodeCardClass)}>
        <div className={cx(nodeMetaClass)}>
          <Tag color="#333">{lang('End')}</Tag>
        </div>
      </div>
    </div>
  );
}
