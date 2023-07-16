import { cx } from '@nocobase/client';
import { Tag } from 'antd';
import React from 'react';
import { Branch } from './Branch';
import { lang } from './locale';
import useStyles from './style';
import { TriggerConfig } from './triggers';

export function CanvasContent({ entry }) {
  const { styles } = useStyles();

  return (
    <div className="workflow-canvas">
      <TriggerConfig />
      <div className={styles.branchBlockClass}>
        <Branch entry={entry} />
      </div>
      <div className={cx('end', styles.nodeCardClass)}>
        <div className={cx(styles.nodeMetaClass)}>
          <Tag color="#333">{lang('End')}</Tag>
        </div>
      </div>
    </div>
  );
}
