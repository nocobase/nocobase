import React from 'react';
import { useParams } from 'react-router-dom';
import { RemoteSchemaComponent, useRoute } from '@nocobase/client';
import { css, cx } from '@emotion/css';

const MApplication: React.FC = (props) => {
  const route = useRoute();
  const params = useParams<{ name: string }>();

  return (
    <div
      className={cx(
        'nb-mobile-application',
        css`
          display: flex;
          flex-direction: column;
          width: 100%;
        `,
      )}
    >
      {params.name ? (
        props.children
      ) : (
        <RemoteSchemaComponent uid={route.uiSchemaUid}>{props.children}</RemoteSchemaComponent>
      )}
    </div>
  );
};

export default MApplication;
