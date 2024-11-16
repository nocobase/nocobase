/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSchemaComponent, AssociationField, useDesignable, Select } from '@nocobase/client';
import React, { useCallback } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Button as MobileButton, Dialog as MobileDialog } from 'antd-mobile';
import { MobilePicker } from './components/MobilePicker';
import { MobileDateTimePicker } from './components/MobileDatePicker';

const mobileComponents = {
  Button: MobileButton,
  Select: (props) => {
    const { designable } = useDesignable();
    if (designable !== false) {
      return <Select {...props} />;
    } else {
      return <MobilePicker {...props} />;
    }
  },
  DatePicker: MobileDateTimePicker,
  UnixTimestamp: MobileDateTimePicker,
  Modal: MobileDialog,
  AssociationField: (props) => {
    return <AssociationField {...props} popupMatchSelectWidth={true} />;
  },
};

export const MobilePage = () => {
  const { pageSchemaUid } = useParams<{ pageSchemaUid: string }>();
  const [pageNotFind, setPageNotFind] = React.useState(false);

  const onPageNotFind = useCallback(() => {
    setPageNotFind(true);
  }, []);

  if (pageNotFind) {
    return (
      <RemoteSchemaComponent
        uid={pageSchemaUid}
        NotFoundPage={'MobileNotFoundPage'}
        memoized={false}
        onPageNotFind={onPageNotFind}
      />
    );
  }

  return (
    <>
      <RemoteSchemaComponent
        uid={pageSchemaUid}
        NotFoundPage={'MobileNotFoundPage'}
        memoized={false}
        onPageNotFind={onPageNotFind}
        components={mobileComponents}
      />
      {/* 用于渲染子页面 */}
      <Outlet />
      <div className="nb-mobile-subpages-slot"></div>
    </>
  );
};
