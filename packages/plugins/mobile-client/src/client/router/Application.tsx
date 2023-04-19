import React, { useEffect, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { AdminProvider, RemoteSchemaComponent, useRoute } from '@nocobase/client';
import { css, cx } from '@emotion/css';
import { useInterfaceContext } from './InterfaceProvider';

const MApplication: React.FC = (props) => {
  const route = useRoute();
  const params = useParams<{ name: string }>();
  const interfaceContext = useInterfaceContext();
  const Provider = useMemo(() => {
    return interfaceContext ? React.Fragment : AdminProvider;
  }, [!!interfaceContext]);
  return (
    <Provider>
      <div
        className={cx(
          'nb-mobile-application',
          css`
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            position: relative;
          `,
        )}
      >
        {params.name && !params.name.startsWith('tab_') ? (
          props.children
        ) : (
          <RemoteSchemaComponent key={route.uiSchemaUid} uid={route.uiSchemaUid}>
            {props.children}
          </RemoteSchemaComponent>
        )}
      </div>
    </Provider>
  );
};

export default MApplication;
