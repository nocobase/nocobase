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
      <div className={styles.terminalClass}>{lang('End')}</div>
    </div>
  );
}
