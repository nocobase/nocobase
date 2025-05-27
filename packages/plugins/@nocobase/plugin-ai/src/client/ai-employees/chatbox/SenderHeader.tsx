/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useChatBoxContext } from './ChatBoxContext';
import { Sender } from '@ant-design/x';
import { AIEmployeeHeader } from './AIEmployeeHeader';
import { Avatar } from 'antd';
import { avatars } from '../avatars';
import { useT } from '../../locale';
import { SchemaComponent, useToken } from '@nocobase/client';
import { InfoForm } from './InfoForm';
import { uid } from '@formily/shared';

export const SenderHeader: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const currentEmployee = useChatBoxContext('currentEmployee');
  const startNewConversation = useChatBoxContext('startNewConversation');
  return null;
  //   <Sender.Header
  //     onOpenChange={startNewConversation}
  //     title={
  //       <div
  //         style={{
  //           display: 'flex',
  //           alignItems: 'flex-start',
  //         }}
  //       >
  //         <Avatar src={avatars(currentEmployee.avatar)} />
  //         <div
  //           style={{
  //             marginLeft: '4px',
  //             paddingTop: '4px',
  //           }}
  //         >
  //           <div
  //             style={{
  //               color: token.colorTextDisabled,
  //             }}
  //           >
  //             {t('Please tell me the following information')}
  //           </div>
  //         </div>
  //       </div>
  //     }
  //   >
  //     <SchemaComponent
  //       components={{ InfoForm }}
  //       schema={{
  //         type: 'void',
  //         properties: {
  //           [uid()]: {
  //             type: 'void',
  //             'x-decorator': 'FormV2',
  //             'x-decorator-props': {
  //               form,
  //             },
  //             'x-component': 'InfoForm',
  //             'x-component-props': {
  //               aiEmployee: currentEmployee,
  //             },
  //           },
  //         },
  //       }}
  //     />
  //   </Sender.Header>
  // ) : null;
};
