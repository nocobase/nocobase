import { Alert } from 'antd';
import React from 'react';
import { Branch } from './Branch';
import { lang } from './locale';
import useStyles from './style';
import { TriggerConfig } from './triggers';
import { useFlowContext } from './FlowContext';

export function CanvasContent({ entry }) {
  const { styles } = useStyles();
  const { workflow } = useFlowContext();

  return (
    <div className="workflow-canvas">
      {workflow?.executed ? (
        <Alert type="warning" message={lang('Executed workflow cannot be modified')} showIcon />
      ) : null}
      <TriggerConfig />
      <div className={styles.branchBlockClass}>
        <Branch entry={entry} />
      </div>
      <div className={styles.terminalClass}>{lang('End')}</div>
    </div>
  );
}
