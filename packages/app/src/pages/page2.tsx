import React from 'react';
import { Link } from 'umi';

export default (props: any) => {
  return (
    <div>
      Page2
      <Link to={'/page1'}>Page1</Link>
    </div>
  );
};