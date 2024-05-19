/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { connect } from '@formily/react';

import { useCollectionRecordData } from '../../../data-source';
import { Upload } from '../upload/Upload';

/**
 * @deprecated
 * Only used for file collection preview field.
 * For file object preview, please use `Upload.ReadPretty` instead.
 */
export const Preview = connect((props) => {
  const data = useCollectionRecordData();
  return <Upload.ReadPretty {...props} value={data} />;
});

export default Preview;
