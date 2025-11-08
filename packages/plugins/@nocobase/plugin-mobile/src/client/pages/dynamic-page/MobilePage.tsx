/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Action,
  AssociationField,
  DatePicker,
  RemoteSchemaComponent,
  SchemaComponentOptions,
  Select,
  TimePicker,
  useDesignable,
} from '@nocobase/client';
import { Button as MobileButton, Dialog as MobileDialog } from 'antd-mobile';
import React, { useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { Outlet, useParams } from 'react-router-dom';
import {
  MobileDateFilterWithPicker,
  MobileDateTimePicker,
  MobileRangePicker,
  MobileTimePicker,
} from './components/MobileDatePicker';
import { MobilePicker } from './components/MobilePicker';

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

const DatePickerMobile = (props) => {
  if (isMobile) {
    return <MobileDateTimePicker {...props} />;
  } else {
    return <DatePicker {...props} />;
  }
};
DatePickerMobile.FilterWithPicker = (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { designable } = useDesignable();
  if (designable !== false) {
    return <DatePicker.FilterWithPicker {...props} />;
  } else {
    return <MobileDateFilterWithPicker {...props} />;
  }
};
DatePickerMobile.RangePicker = MobileRangePicker;

export const mobileComponents = {
  Button: MobileButton,
  Select: (props) => {
    const { designable } = useDesignable();
    if (designable !== false) {
      return <Select {...props} popupMatchSelectWidth={true} />;
    } else {
      return <MobilePicker {...props} />;
    }
  },
  DatePicker: DatePickerMobile,
  UnixTimestamp: MobileDateTimePicker,
  Modal: MobileDialog,
  AssociationField: AssociationFieldMobile,
  TimePicker: (props) => {
    const { designable } = useDesignable();
    if (designable !== false) {
      return <TimePicker {...props} />;
    } else {
      return <MobileTimePicker {...props} />;
    }
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
      <SchemaComponentOptions components={mobileComponents}>
        <Outlet />
      </SchemaComponentOptions>

      <div className="nb-mobile-subpages-slot"></div>
    </>
  );
};
