import React from 'react';
import { Link } from 'react-router-dom';
import { useActionContext, useRecord } from '..';


export const WorkflowLink = () => {
  const { id } = useRecord();
  const { setVisible } = useActionContext();
  return (
    <Link to={`/admin/plugins/workflows/${id}`} onClick={() => setVisible(false)}>流程配置</Link>
  );
}
