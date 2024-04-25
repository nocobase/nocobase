import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app
import { ReadPretty } from '../upload/Upload';

export const Preview = connect((props) => {
  return <ReadPretty.File {...props} />;
}, mapReadPretty(ReadPretty.File));

export default Preview;
