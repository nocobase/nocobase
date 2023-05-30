import { connect, mapReadPretty, mapProps } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { ReadPretty as InputReadPretty } from '../input';
import './style.less';

export const RichText = connect(
  (props) => {
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
    return (
      <ReactQuill
        modules={modules}
        formats={formats}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        readOnly={disabled}
      />
    );
  },
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
