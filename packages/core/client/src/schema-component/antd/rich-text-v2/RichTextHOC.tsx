import React from 'react';
import { ComponentType } from 'react';
type WithTextAreaProps = {
   
    
    className: string;
    modules: object;
    formats: string[];
    value: string;
    onChange: (value: string) => void;
    // disabled: boolean;
    readOnly:any
  };


export function RichTextHOC(WrappedComponent) {
  return function RichTextHOCComponent(props) {
   

   

    return (
      <div>
        <WrappedComponent
          className={props.className}
          modules={props.modules}
          formats={props.formats}
          value={props.value}
          onChange={props.onChange}
        //   disabled={props.disabled}
          readOnly={props.readOnly}
        />
        <textarea value={props.value}  onChange={props.onChange} />
      </div>
    );
  };
}
