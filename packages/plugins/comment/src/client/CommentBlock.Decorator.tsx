import React from 'react';
import { CardItem, useDesigner } from '@nocobase/client';

export const CommentBlockDecorator = (props) => {
  return <CardItem>{props.children}</CardItem>;
};
