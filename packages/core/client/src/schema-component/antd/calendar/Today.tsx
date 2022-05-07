import { observer } from '@formily/react';
import { Button } from 'antd';
import React, { useContext } from 'react';
import { navigate } from 'react-big-calendar/lib/utils/constants';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks';
import { CalendarToolbarContext } from './context';

export const Today = observer((props) => {
  const { DesignableBar } = useDesignable();
  const { onNavigate } = useContext(CalendarToolbarContext);
  const { t } = useTranslation();
  return (
    <Button
      onClick={() => {
        onNavigate(navigate.TODAY);
      }}
    >
      {t('Today')}
      <DesignableBar />
    </Button>
  );
});
