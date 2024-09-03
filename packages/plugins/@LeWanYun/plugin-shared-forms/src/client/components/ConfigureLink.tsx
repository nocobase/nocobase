import { useFilterByTk } from '@nocobase/client';
import React from 'react';
import { Link } from 'react-router-dom';

export function ConfigureLink() {
  const value = useFilterByTk();
  return <Link to={`/admin/settings/public-forms/${value}`}>配置</Link>;
}
