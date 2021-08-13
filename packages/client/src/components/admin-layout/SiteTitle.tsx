import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { useHistory } from 'react-router-dom';
import { request } from '../../schemas';

export const SiteTitle = () => {
  return (
    <div className={'site-info'}>
      <img
        className={'site-logo'}
        src={'https://www.nocobase.com/dist/images/logo-white.png'}
      />
      <div className={'site-title'}>NocoBase</div>
    </div>
  );
};
