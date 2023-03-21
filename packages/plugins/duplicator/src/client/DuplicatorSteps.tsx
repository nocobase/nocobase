import { Button, Steps, Card } from 'antd';
import React, { useState } from 'react';
import { css } from '@emotion/css';

const content = css`
  margin-top: 16px;
`;
const action = css`
  margin-top: 24px;
`;

export const DuplicatorSteps = ({ children, steps, onChange }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    steps[current].handler && steps[current].handler();
    setCurrent(current + 1);
    onChange && onChange(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
    onChange && onChange(current - 1);
  };
  const { Step } = Steps;

  return (
    <Card>
      <Steps current={current}>
        {steps.map((item) => (
          <Step title={item.title} />
        ))}
      </Steps>
      <div className={content}>{children}</div>
      <div className={action}>
        {current < steps.length - 1 && steps[current].showButton && (
          <Button type="primary" onClick={() => next()}>
            {steps[current].buttonText}
          </Button>
        )}
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
            Previous
          </Button>
        )}
      </div>
    </Card>
  );
};
