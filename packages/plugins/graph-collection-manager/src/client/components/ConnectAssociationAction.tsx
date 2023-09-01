import React from 'react';
import { Button } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';

export const ConnectAssociationAction = (props) => {
  const { targetGraph, item } = props;
  return (
    <BranchesOutlined
      className="btn-assocition"
      onClick={() => {
        targetGraph.onConnectionAssociation(item);
      }}
    />
  );
};
