import React from 'react';
import { MobileCenter } from '../core/MobileCenter';
import { useRouteMatch } from 'react-router-dom';
import { RemoteSchemaComponent, useRoute } from '@nocobase/client';

const MobileApplication: React.FC = () => {
  const route = useRoute();
  return <RemoteSchemaComponent uid={route.uiSchemaUid}></RemoteSchemaComponent>;
};

export default MobileApplication;
