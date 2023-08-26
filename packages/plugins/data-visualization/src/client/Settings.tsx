import { CheckOutlined } from '@ant-design/icons';
import { Form, FormItem } from '@formily/antd-v5';
import { css } from '@nocobase/client';
import { Button, Card } from 'antd';
import cls from 'classnames';
import React, { useContext } from 'react';
import { useChartsTranslation } from './locale';
import { ChartLibraryContext, useToggleChartLibrary } from './chart/library';

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
