import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { ReadPretty as InputReadPretty } from '../input';
import { useStyles } from './style';

export const RichText = connect(
  (props) => {
    const { wrapSSR, hashId, componentCls } = useStyles();
    const modules = {
      toolbar: [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
    };
    const formats = [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
    ];
    const { value, onChange, disabled } = props;
    return wrapSSR(
      <ReactQuill
        className={`${componentCls} ${hashId}`}
        modules={modules}
        formats={formats}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        readOnly={disabled}
      />,
    );
  },
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
