import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import ReactQuill from 'react-quill';
import { isVariable } from '../../../variables/utils/isVariable';
import { ReadPretty as InputReadPretty } from '../input';
import { useStyles } from './style';
import { RichTextHOC } from './RichTextHOC';
import { Input } from 'antd';
import { Switch } from 'antd';

export const RichTextV2 = connect(
  (props) => {
    var stringToHTML 
    // const RichTextWithValue = RichTextHOC(RichTextV2);
    const [richTextToggle, setRichTextToggle] = React.useState(false);
    const [values, setValues] = React.useState('');

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
    const onChangeText = (values) => {
      setValues(values);
    };
    console.log(values);

    function handleCheck(value) {
      console.log('toggle value', value);
      setRichTextToggle(value);
    }
    function convertStringToHtml(event) {
   
      setValues(event.target.value)
      const parser = new DOMParser();
      const doc = parser.parseFromString(event.target.value, 'text/html');
      console.log(doc);

      //if the rich text is read only
      if(richTextToggle){
        stringToHTML = doc
        console.log("string to html",stringToHTML)
      }
    }
    
    return wrapSSR(
      <>
        <div>
          {/* <ReactQuill
            className={`${componentCls} ${hashId}`}
            modules={modules}
            formats={formats}
            value={values}
            onChange={onChangeText}
            readOnly={richTextToggle}
          /> */}
          <div>
            <Input.TextArea value={values} disabled={!richTextToggle} onChange={convertStringToHtml} />
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
