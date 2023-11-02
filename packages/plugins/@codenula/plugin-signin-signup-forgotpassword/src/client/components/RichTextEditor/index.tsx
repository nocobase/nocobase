// TextEditor.tsx
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
 
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "code"],
    ["clean"],
  ],
};
 
const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "code",
];
 
interface OnChangeHandler {
  (e: any): void;
}
 
type Props = {
  value: string;
  placeholder: string;
  onChange: OnChangeHandler;
};
 
const TextEditor: React.FC<Props> = ({ value, onChange, placeholder }) => {
  return (
    <>
      <ReactQuill
        theme="snow"
        value={value || ""}
        modules={modules}
        formats={formats}
        onChange={onChange}
        placeholder={placeholder}
      />
    </>
  );
};
 
export default TextEditor;