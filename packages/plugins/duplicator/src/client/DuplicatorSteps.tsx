import { Button, Steps, Card } from 'antd';
import React from 'react';
import { css } from '@emotion/css';
import { useTheme } from './hooks/useTheme';
import { usePluginUtils } from './hooks/i18';

export const DuplicatorSteps = ({ children, steps, loading, current, onChange }) => {
  const theme = useTheme();
  const { t } = usePluginUtils();

  const styleMap = {
    default: {
      contentMarginTop: '16px',
      actionMarginTop: '24px',
    },
    compact: {
      contentMarginTop: '12px',
      actionMarginTop: '12px',
    },
  };
  const content = css`
    margin-top: ${styleMap[theme].contentMarginTop};
  `;
  const action = css`
    margin-top: ${styleMap[theme].actionMarginTop};
  `;

  const next = async () => {
    steps[current].handler && (await steps[current].handler());
    onChange && onChange(current + 1);
  };

  const prev = () => {
    onChange && onChange(current - 1);
  };
  const { Step } = Steps;

  return (
    <Card>
      <Steps current={current} size="small">
        {steps.map((item) => (
          <Step title={item.title} />
        ))}
      </Steps>
      <div className={content}>{children}</div>
      <div className={action}>
        {current < steps.length - 1 && steps[current].showButton && (
          <Button type="primary" loading={loading} onClick={next}>
            {steps[current].buttonText}
          </Button>
        )}
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
            {t('Go back')}
          </Button>
        )}
      </div>
    </Card>
  );
};
