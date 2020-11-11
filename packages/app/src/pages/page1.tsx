import React from 'react';
import { Link } from 'umi';

export default (props: any) => {
  return (
    <div>
      Page1
      <Link to={'/page2'}>Page2</Link>
    </div>
  );
};