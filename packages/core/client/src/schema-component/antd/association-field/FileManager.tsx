import { connect, mapReadPretty } from '@formily/react';
import React from 'react';

const Editable = () => {
  return <div>FileManager Editable</div>;
};

const ReadPretty = () => {
  return <div>FileManager ReadPretty</div>;
};

export const FileManager = connect(Editable, mapReadPretty(ReadPretty));
