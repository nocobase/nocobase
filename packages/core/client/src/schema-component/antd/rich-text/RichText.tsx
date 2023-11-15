import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { isVariable } from '../../../variables/utils/isVariable';
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
    const { value, defaultValue, onChange, disabled } = props;
    const resultValue = isVariable(value || defaultValue) ? undefined : value || defaultValue || '';

    return wrapSSR(
      <ReactQuill
        className={`${componentCls} ${hashId}`}
        modules={modules}
        formats={formats}
        value={resultValue}
        onChange={onChange}
        readOnly={disabled}
      />,
    );
  },
  mapProps({
    initialValue: 'defaultValue',
  }),
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
