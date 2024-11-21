/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSchemaComponent, AssociationField, useDesignable, Select, DatePicker, Action } from '@nocobase/client';
import React, { useCallback } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Button as MobileButton, Dialog as MobileDialog } from 'antd-mobile';
import { MobilePicker } from './components/MobilePicker';
import { MobileDateTimePicker } from './components/MobileDatePicker';

const AssociationFieldMobile = (props) => {
  return <AssociationField {...props} popupMatchSelectWidth={true} />;
};

AssociationFieldMobile.SubTable = AssociationField.SubTable;
AssociationFieldMobile.Nester = AssociationField.Nester;
AssociationFieldMobile.AddNewer = Action.Container;
AssociationFieldMobile.Selector = Action.Container;
AssociationFieldMobile.Viewer = Action.Container;
AssociationFieldMobile.InternalSelect = AssociationField.InternalSelect;
AssociationFieldMobile.ReadPretty = AssociationField.ReadPretty;
AssociationFieldMobile.FileSelector = AssociationField.FileSelector;

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
  DatePicker: (props) => {
    const { designable } = useDesignable();
    if (designable !== false) {
      return <DatePicker {...props} />;
    } else {
      return <MobileDateTimePicker {...props} />;
    }
  },
  UnixTimestamp: MobileDateTimePicker,
  Modal: MobileDialog,
  AssociationField: AssociationFieldMobile,
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
