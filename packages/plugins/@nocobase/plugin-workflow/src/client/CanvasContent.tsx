import { Alert } from 'antd';
import React from 'react';

import { cx, css } from '@nocobase/client';

import { Branch } from './Branch';
import { useFlowContext } from './FlowContext';
import { lang } from './locale';
import useStyles from './style';
import { TriggerConfig } from './triggers';

export function CanvasContent({ entry }) {
  const { styles } = useStyles();
  const { workflow } = useFlowContext();

  return (
    <div className="workflow-canvas">
      {workflow?.executed ? (
        <Alert type="warning" message={lang('Executed workflow cannot be modified')} showIcon />
      ) : null}
      <TriggerConfig />
      <div
        className={cx(
          styles.branchBlockClass,
          css`
            margin-top: 0 !important;
          `,
        )}
      >
        <Branch entry={entry} />
      </div>
      <div className={styles.terminalClass}>{lang('End')}</div>
    </div>
  );
}
