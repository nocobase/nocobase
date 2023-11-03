import { Alert, Slider } from 'antd';
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
  const [zoom, setZoom] = React.useState(100);

  return (
    <div className="workflow-canvas-wrapper">
      <div className="workflow-canvas" style={{ zoom: zoom / 100 }}>
        <div
          className={cx(
            styles.branchBlockClass,
            css`
              margin-top: 0 !important;
            `,
          )}
        >
          <div className={styles.branchClass}>
            {workflow?.executed ? (
              <Alert
                type="warning"
                message={lang('Executed workflow cannot be modified')}
                showIcon
                className={css`
                  margin-bottom: 1em;
                `}
              />
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
        </div>
      </div>
      <div className="workflow-canvas-zoomer">
        <Slider vertical reverse defaultValue={100} step={10} min={10} value={zoom} onChange={setZoom} />
      </div>
    </div>
  );
}
