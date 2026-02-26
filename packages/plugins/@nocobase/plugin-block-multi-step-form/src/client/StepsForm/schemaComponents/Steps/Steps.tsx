import { Steps as AntdSteps, StepsProps as AntdStepProps } from 'antd';
import React from 'react';
import { RecursionField } from '@formily/react';
import { stepsFormStepTitleSettings } from './settings';
import { css } from '@emotion/css';

export interface StepProps extends AntdStepProps {
  items: any;
}
export function Steps(props: StepProps) {
  const items =
    props.items?.map((x, index) => {
      const key = `${x.title}${index}`;
      return {
        title: (
          <RecursionField
            key={key}
            name={key}
            onlyRenderProperties
            schema={{
              type: 'void',
              properties: {
                [x.name]: {
                  type: 'void',
                  'x-decorator': 'BlockItem',
                  'x-toolbar': 'TableColumnSchemaToolbar',
                  'x-settings': stepsFormStepTitleSettings.name,
                  'x-component': 'div',
                  'x-template-uid': x.contentSchema?.['x-template-uid'],
                  'x-component-props': {
                    style: {
                      paddingTop: '12px',
                      marginTop: '-12px',
                    },
                  },
                  'x-content': x.title,
                }, 
              },
            }}
          />
        ),
      };
    }) || [];

  return (
    <AntdSteps
      {...props}
      items={items}
      className={css`
        width: auto;
        flex-grow: 1;
        > .ant-steps-item {
          padding: 12px 0;
          flex-shrink: 0;
          flex: 1;
        }
      `}
    />
  );
}
