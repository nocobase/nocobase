import React, { useContext } from 'react';
import { Card, Button } from 'antd';
import { Form, FormItem } from '@formily/antd';
import { CheckOutlined } from '@ant-design/icons';
import { ChartLibraryContext, useToggleChartLibrary } from './renderer';
import { useChartsTranslation } from './locale';
import cls from 'classnames';
import { css } from '@emotion/css';

export const Settings = () => {
  const { t } = useChartsTranslation();
  const libraries = useContext(ChartLibraryContext);
  const { toggle } = useToggleChartLibrary();
  const list = Object.entries(libraries).map(([library, { enabled }]) => {
    return (
      <Button
        key={library}
        icon={enabled ? <CheckOutlined /> : ''}
        className={cls(
          css`
            margin: 8px 8px 8px 0;
          `,
          enabled
            ? css`
                color: #40a9ff;
                border-color: #40a9ff;
              `
            : '',
        )}
        onClick={() => toggle(library)}
      >
        {library}
      </Button>
    );
  });
  return (
    <Card>
      <Form layout="vertical">
        <FormItem label={t('Enabled Chart Library')}>{list}</FormItem>
      </Form>
    </Card>
  );
};
