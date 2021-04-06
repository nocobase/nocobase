import React, { useState, useEffect } from 'react';
import './style.less';
import { markdown } from '@/components/views/Field';

export function Wysiwyg(props) {
  const { data: record = {}, schema = {}, onDataChange } = props;

  const { html = '' } = schema;

  return <div dangerouslySetInnerHTML={{ __html: markdown(html) }}></div>;
}
