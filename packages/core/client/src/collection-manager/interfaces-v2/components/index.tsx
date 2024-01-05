import { Switch } from 'antd';
import React from 'react';

export const TargetKey = () => {
  return <div>Target key</div>;
};

export const ThroughCollection = () => {
  return (
    <div>
      Through collection{' '}
      <Switch size={'small'} defaultChecked checkedChildren="Auto fill" unCheckedChildren="Customize" />
    </div>
  );
};

export const SourceKey = () => {
  return <div>Source key</div>;
};

export const ForeignKey = () => {
  return (
    <div>
      Foreign key <Switch size={'small'} defaultChecked checkedChildren="Auto fill" unCheckedChildren="Customize" />
    </div>
  );
};

export const ForeignKey1 = () => {
  return (
    <div>
      Foreign key 1 <a>新建</a>
    </div>
  );
};

export const ForeignKey2 = () => {
  return (
    <div>
      Foreign key 2 <a>新建</a>
    </div>
  );
};
