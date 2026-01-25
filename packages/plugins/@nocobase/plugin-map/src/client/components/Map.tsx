/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import { css } from '@nocobase/client';
import React from 'react';
import { AMapComponentProps } from './AMap';
import Designer from './Designer';
import { MapComponent } from './MapComponent';
import ReadPretty from './ReadPretty';
import { useMapHeight } from './hook';

type MapProps = AMapComponentProps;

const className = css`
  height: 100%;
  border: 1px solid transparent;
  .ant-formily-item-error & {
    border: 1px solid #ff4d4f;
  }
`;

const InternalMap = connect((props: MapProps) => {
  const height = useMapHeight();
  return (
    <div className={className}>
      <MapComponent {...props} height={height} />
    </div>
  );
}, mapReadPretty(ReadPretty));

const Map = InternalMap as typeof InternalMap & {
  Designer: typeof Designer;
};

Map.Designer = Designer;

export { Map };
