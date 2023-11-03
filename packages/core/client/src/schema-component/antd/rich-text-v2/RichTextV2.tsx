import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { isVariable } from '../../../variables/utils/isVariable';
import { ReadPretty as InputReadPretty } from '../input';
import { useStyles } from './style';
import { RichTextHOC } from './RichTextHOC';
import { Input } from 'antd';
import { Switch } from 'antd';
import './style.css'

export const RichTextV2 = connect(
  (props) => {
    var stringToHTML;
    // const RichTextWithValue = RichTextHOC(RichTextV2);
    const [isTextToggled, setIsTextToggled] = React.useState(false);
    const [values, setValues] = React.useState('');
    const [customHTML, setCustomHTML] = React.useState('');

    const { wrapSSR, hashId, componentCls } = useStyles();
    const modules = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block','tables'],
      
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
          
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
      
        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
       
      
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
      
        ['clean']                                         // remove formatting button
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
      'background',
      'color',
      'font',
      'code',
      'size',
      'strike',
      'script',
      'align',
      'direction',
      'tables'
    ];
    const { value, defaultValue, onChange, disabled } = props;
    const resultValue = isVariable(value || defaultValue) ? undefined : value || defaultValue || '';
    const onRichTextChange = (values) => {
      console.log('rich text rendered');
      setValues(values);
    };

    function handleCheck(value) {
      console.log('toggle value', value);
      setIsTextToggled(value);
    }
    function onTextChange(event) {
      setValues(event.target.value);
    }
    console.log(values);
    return wrapSSR(
      <>
        <div>
          <ReactQuill
            className={`${componentCls} ${hashId}`}
            modules={modules}
            formats={formats}
            value={values}
            onChange={!isTextToggled ? onRichTextChange : () => null}
            readOnly={isTextToggled}
          />
          <div>
            <Input.TextArea  rows={8} value={values} disabled={!isTextToggled} onChange={onTextChange} />
          </div>
          <div>
            <Switch checkedChildren="switch to rich text" unCheckedChildren="switch to html" onChange={handleCheck} />
          </div>
        </div>
      </>,
    );
  },
  mapProps({
    initialValue: 'defaultValue',
  }),
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
