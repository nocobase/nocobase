import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { ReadPretty as InputReadPretty } from '../input';
import './style.less';

export const RichText = connect(
  (props) => {
    const modules = {
      toolbar: [
        ['bold', 'italic', 'underline', 'link'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
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
    const { value, onChange } = props;
    return (
      <ReactQuill
        modules={modules}
        formats={formats}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
      />
    );
  },
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
