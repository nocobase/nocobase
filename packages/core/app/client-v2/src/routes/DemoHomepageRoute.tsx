/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function DemoHomepageRoute() {
  const navigate = useNavigate();
  return (
    <>
      <div>
        Demo Homepage Route
        <Button onClick={() => navigate('/demo/app-info')}>Go to demo route</Button>
      </div>
      <div>
        Demo flow settings page
        <Button onClick={() => navigate('/demo/flow-settings-component-loader')}>Go to demo route</Button>
      </div>
    </>
  );
}
