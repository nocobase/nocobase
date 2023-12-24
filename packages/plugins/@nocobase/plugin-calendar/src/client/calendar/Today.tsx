import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { Navigate } from 'react-big-calendar/dist/react-big-calendar.esm';
import { CalendarToolbarContext } from './context';
import { useDesignable } from '@nocobase/client';
import { useTranslation } from '../../locale';

export const Today = observer(
  (props) => {
    const { DesignableBar } = useDesignable();
    const { onNavigate } = useContext(CalendarToolbarContext);
    const { t } = useTranslation();
    return (
      <Button
        onClick={() => {
          onNavigate(Navigate.TODAY);
        }}
      >
        {t('Today')}
        <DesignableBar />
      </Button>
    );
  },
  { displayName: 'Today' },
);
