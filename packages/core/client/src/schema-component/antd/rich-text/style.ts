import { genStyleHook } from './../__builtins__';

/*!
 * Quill Editor v1.3.7
 * https://quilljs.com/
 * Copyright (c) 2014, Jason Chen
 * Copyright (c) 2013, salesforce.com
 */
export const useStyles = genStyleHook('nb-rich-text', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.ql-container': {
        boxSizing: 'border-box',
        height: '100%',
        margin: '0px',
        position: 'relative',
      },
      '.ql-container.ql-disabled .ql-tooltip': { visibility: 'hidden' },
      '.ql-container.ql-disabled .ql-editor ul[data-checked] > li::before': {
        pointerEvents: 'none',
      },
      '.ql-clipboard': {
        left: '-100000px',
        height: '1px',
        overflowY: 'hidden',
        position: 'absolute',
        top: '50%',
      },
      '.ql-clipboard p': { margin: '0', padding: '0' },
      '.ql-editor': {
        minHeight: '10em',
        boxSizing: 'border-box',
        lineHeight: 1.42,
        height: '100%',
        outline: 'none',
        overflowY: 'auto',
        padding: '12px 15px',
        tabSize: 4,
        MozTabSize: '4',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      },
      '.ql-editor > *': { cursor: 'text' },
      '.ql-editor p,\n.ql-editor ol,\n.ql-editor ul,\n.ql-editor pre,\n.ql-editor blockquote,\n.ql-editor h1,\n.ql-editor h2,\n.ql-editor h3,\n.ql-editor h4,\n.ql-editor h5,\n.ql-editor h6':
        {
          margin: '0',
          padding: '0',
          counterReset: 'list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9',
        },
      '.ql-editor ol,\n.ql-editor ul': { paddingLeft: '0' },
      '.ql-editor ol > li,\n.ql-editor ul > li': { listStyleType: 'none' },
      '.ql-editor ul > li::before': { content: "'\\2022'" },
      ".ql-editor ul[data-checked='true'],\n.ql-editor ul[data-checked='false']": {
        pointerEvents: 'none',
      },
      ".ql-editor ul[data-checked='true'] > li *,\n.ql-editor ul[data-checked='false'] > li *": {
        pointerEvents: 'all',
      },
      ".ql-editor ul[data-checked='true'] > li::before,\n.ql-editor ul[data-checked='false'] > li::before": {
        color: '#777',
        cursor: 'pointer',
        pointerEvents: 'all',
      },
      ".ql-editor ul[data-checked='true'] > li::before": { content: "'\\2611'" },
      ".ql-editor ul[data-checked='false'] > li::before": { content: "'\\2610'" },
      '.ql-editor li::before': {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        width: '1.2em',
      },
      '.ql-editor li:not(.ql-direction-rtl)::before': {
        marginLeft: '-1.5em',
        marginRight: '0.3em',
        textAlign: 'right',
      },
      '.ql-editor li.ql-direction-rtl::before': {
        marginLeft: '0.3em',
        marginRight: '-1.5em',
      },
      '.ql-editor ol li:not(.ql-direction-rtl),\n.ql-editor ul li:not(.ql-direction-rtl)': {
        paddingLeft: '1.5em',
      },
      '.ql-editor ol li.ql-direction-rtl,\n.ql-editor ul li.ql-direction-rtl': {
        paddingRight: '1.5em',
      },
      '.ql-editor ol li': {
        counterReset: 'list-1 list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9',
        counterIncrement: 'list-0',
      },
      '.ql-editor ol li:before': { content: "counter(list-0, decimal) '. '" },
      '.ql-editor ol li.ql-indent-1': {
        counterIncrement: 'list-1',
        counterReset: 'list-2 list-3 list-4 list-5 list-6 list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-1:before': {
        content: "counter(list-1, lower-alpha) '. '",
      },
      '.ql-editor ol li.ql-indent-2': {
        counterIncrement: 'list-2',
        counterReset: 'list-3 list-4 list-5 list-6 list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-2:before': {
        content: "counter(list-2, lower-roman) '. '",
      },
      '.ql-editor ol li.ql-indent-3': {
        counterIncrement: 'list-3',
        counterReset: 'list-4 list-5 list-6 list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-3:before': {
        content: "counter(list-3, decimal) '. '",
      },
      '.ql-editor ol li.ql-indent-4': {
        counterIncrement: 'list-4',
        counterReset: 'list-5 list-6 list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-4:before': {
        content: "counter(list-4, lower-alpha) '. '",
      },
      '.ql-editor ol li.ql-indent-5': {
        counterIncrement: 'list-5',
        counterReset: 'list-6 list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-5:before': {
        content: "counter(list-5, lower-roman) '. '",
      },
      '.ql-editor ol li.ql-indent-6': {
        counterIncrement: 'list-6',
        counterReset: 'list-7 list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-6:before': {
        content: "counter(list-6, decimal) '. '",
      },
      '.ql-editor ol li.ql-indent-7': {
        counterIncrement: 'list-7',
        counterReset: 'list-8 list-9',
      },
      '.ql-editor ol li.ql-indent-7:before': {
        content: "counter(list-7, lower-alpha) '. '",
      },
      '.ql-editor ol li.ql-indent-8': {
        counterIncrement: 'list-8',
        counterReset: 'list-9',
      },
      '.ql-editor ol li.ql-indent-8:before': {
        content: "counter(list-8, lower-roman) '. '",
      },
      '.ql-editor ol li.ql-indent-9': { counterIncrement: 'list-9' },
      '.ql-editor ol li.ql-indent-9:before': {
        content: "counter(list-9, decimal) '. '",
      },
      '.ql-editor .ql-indent-1:not(.ql-direction-rtl)': { paddingLeft: '3em' },
      '.ql-editor li.ql-indent-1:not(.ql-direction-rtl)': { paddingLeft: '4.5em' },
      '.ql-editor .ql-indent-1.ql-direction-rtl.ql-align-right': {
        paddingRight: '3em',
      },
      '.ql-editor li.ql-indent-1.ql-direction-rtl.ql-align-right': {
        paddingRight: '4.5em',
      },
      '.ql-editor .ql-indent-2:not(.ql-direction-rtl)': { paddingLeft: '6em' },
      '.ql-editor li.ql-indent-2:not(.ql-direction-rtl)': { paddingLeft: '7.5em' },
      '.ql-editor .ql-indent-2.ql-direction-rtl.ql-align-right': {
        paddingRight: '6em',
      },
      '.ql-editor li.ql-indent-2.ql-direction-rtl.ql-align-right': {
        paddingRight: '7.5em',
      },
      '.ql-editor .ql-indent-3:not(.ql-direction-rtl)': { paddingLeft: '9em' },
      '.ql-editor li.ql-indent-3:not(.ql-direction-rtl)': { paddingLeft: '10.5em' },
      '.ql-editor .ql-indent-3.ql-direction-rtl.ql-align-right': {
        paddingRight: '9em',
      },
      '.ql-editor li.ql-indent-3.ql-direction-rtl.ql-align-right': {
        paddingRight: '10.5em',
      },
      '.ql-editor .ql-indent-4:not(.ql-direction-rtl)': { paddingLeft: '12em' },
      '.ql-editor li.ql-indent-4:not(.ql-direction-rtl)': { paddingLeft: '13.5em' },
      '.ql-editor .ql-indent-4.ql-direction-rtl.ql-align-right': {
        paddingRight: '12em',
      },
      '.ql-editor li.ql-indent-4.ql-direction-rtl.ql-align-right': {
        paddingRight: '13.5em',
      },
      '.ql-editor .ql-indent-5:not(.ql-direction-rtl)': { paddingLeft: '15em' },
      '.ql-editor li.ql-indent-5:not(.ql-direction-rtl)': { paddingLeft: '16.5em' },
      '.ql-editor .ql-indent-5.ql-direction-rtl.ql-align-right': {
        paddingRight: '15em',
      },
      '.ql-editor li.ql-indent-5.ql-direction-rtl.ql-align-right': {
        paddingRight: '16.5em',
      },
      '.ql-editor .ql-indent-6:not(.ql-direction-rtl)': { paddingLeft: '18em' },
      '.ql-editor li.ql-indent-6:not(.ql-direction-rtl)': { paddingLeft: '19.5em' },
      '.ql-editor .ql-indent-6.ql-direction-rtl.ql-align-right': {
        paddingRight: '18em',
      },
      '.ql-editor li.ql-indent-6.ql-direction-rtl.ql-align-right': {
        paddingRight: '19.5em',
      },
      '.ql-editor .ql-indent-7:not(.ql-direction-rtl)': { paddingLeft: '21em' },
      '.ql-editor li.ql-indent-7:not(.ql-direction-rtl)': { paddingLeft: '22.5em' },
      '.ql-editor .ql-indent-7.ql-direction-rtl.ql-align-right': {
        paddingRight: '21em',
      },
      '.ql-editor li.ql-indent-7.ql-direction-rtl.ql-align-right': {
        paddingRight: '22.5em',
      },
      '.ql-editor .ql-indent-8:not(.ql-direction-rtl)': { paddingLeft: '24em' },
      '.ql-editor li.ql-indent-8:not(.ql-direction-rtl)': { paddingLeft: '25.5em' },
      '.ql-editor .ql-indent-8.ql-direction-rtl.ql-align-right': {
        paddingRight: '24em',
      },
      '.ql-editor li.ql-indent-8.ql-direction-rtl.ql-align-right': {
        paddingRight: '25.5em',
      },
      '.ql-editor .ql-indent-9:not(.ql-direction-rtl)': { paddingLeft: '27em' },
      '.ql-editor li.ql-indent-9:not(.ql-direction-rtl)': { paddingLeft: '28.5em' },
      '.ql-editor .ql-indent-9.ql-direction-rtl.ql-align-right': {
        paddingRight: '27em',
      },
      '.ql-editor li.ql-indent-9.ql-direction-rtl.ql-align-right': {
        paddingRight: '28.5em',
      },
      '.ql-editor .ql-video': { display: 'block', maxWidth: '100%' },
      '.ql-editor .ql-video.ql-align-center': { margin: '0 auto' },
      '.ql-editor .ql-video.ql-align-right': { margin: '0 0 0 auto' },
      '.ql-editor .ql-bg-black': { backgroundColor: '#000' },
      '.ql-editor .ql-bg-red': { backgroundColor: '#e60000' },
      '.ql-editor .ql-bg-orange': { backgroundColor: '#f90' },
      '.ql-editor .ql-bg-yellow': { backgroundColor: '#ff0' },
      '.ql-editor .ql-bg-green': { backgroundColor: '#008a00' },
      '.ql-editor .ql-bg-blue': { backgroundColor: token.colorPrimaryTextHover },
      '.ql-editor .ql-bg-purple': { backgroundColor: '#93f' },
      '.ql-editor .ql-color-white': { color: '#fff' },
      '.ql-editor .ql-color-red': { color: '#e60000' },
      '.ql-editor .ql-color-orange': { color: '#f90' },
      '.ql-editor .ql-color-yellow': { color: '#ff0' },
      '.ql-editor .ql-color-green': { color: '#008a00' },
      '.ql-editor .ql-color-blue': { color: token.colorPrimaryTextHover },
      '.ql-editor .ql-color-purple': { color: '#93f' },
      '.ql-editor .ql-font-serif': {
        fontFamily: 'Georgia, Times New Roman, serif',
      },
      '.ql-editor .ql-font-monospace': {
        fontFamily: 'Monaco, Courier New, monospace',
      },
      '.ql-editor .ql-size-small': { fontSize: '0.75em' },
      '.ql-editor .ql-size-large': { fontSize: '1.5em' },
      '.ql-editor .ql-size-huge': { fontSize: '2.5em' },
      '.ql-editor .ql-direction-rtl': { direction: 'rtl', textAlign: 'inherit' },
      '.ql-editor .ql-align-center': { textAlign: 'center' },
      '.ql-editor .ql-align-justify': { textAlign: 'justify' },
      '.ql-editor .ql-align-right': { textAlign: 'right' },
      '.ql-editor.ql-blank::before': {
        color: 'rgba(0, 0, 0, 0.6)',
        content: 'attr(data-placeholder)',
        fontStyle: 'italic',
        left: '15px',
        pointerEvents: 'none',
        position: 'absolute',
        right: '15px',
      },
      '.ql-snow.ql-toolbar:after,\n.ql-snow .ql-toolbar:after': {
        clear: 'both',
        content: "''",
        display: 'table',
      },
      '.ql-snow.ql-toolbar button,\n.ql-snow .ql-toolbar button': {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-block',
        cssFloat: 'left',
        height: '24px',
        padding: '3px 5px',
        width: '28px',
      },
      '.ql-snow.ql-toolbar button svg,\n.ql-snow .ql-toolbar button svg': {
        cssFloat: 'left',
        height: '100%',
      },
      '.ql-snow.ql-toolbar button:active:hover,\n.ql-snow .ql-toolbar button:active:hover': {
        outline: 'none',
      },
      ".ql-snow.ql-toolbar input.ql-image[type='file'],\n.ql-snow .ql-toolbar input.ql-image[type='file']": {
        display: 'none',
      },
      '.ql-snow.ql-toolbar button:hover,\n.ql-snow .ql-toolbar button:hover,\n.ql-snow.ql-toolbar button:focus,\n.ql-snow .ql-toolbar button:focus,\n.ql-snow.ql-toolbar button.ql-active,\n.ql-snow .ql-toolbar button.ql-active,\n.ql-snow.ql-toolbar .ql-picker-label:hover,\n.ql-snow .ql-toolbar .ql-picker-label:hover,\n.ql-snow.ql-toolbar .ql-picker-label.ql-active,\n.ql-snow .ql-toolbar .ql-picker-label.ql-active,\n.ql-snow.ql-toolbar .ql-picker-item:hover,\n.ql-snow .ql-toolbar .ql-picker-item:hover,\n.ql-snow.ql-toolbar .ql-picker-item.ql-selected,\n.ql-snow .ql-toolbar .ql-picker-item.ql-selected':
        {
          color: token.colorPrimaryTextHover,
        },
      '.ql-snow.ql-toolbar button:hover .ql-fill,\n.ql-snow .ql-toolbar button:hover .ql-fill,\n.ql-snow.ql-toolbar button:focus .ql-fill,\n.ql-snow .ql-toolbar button:focus .ql-fill,\n.ql-snow.ql-toolbar button.ql-active .ql-fill,\n.ql-snow .ql-toolbar button.ql-active .ql-fill,\n.ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,\n.ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,\n.ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,\n.ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,\n.ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,\n.ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,\n.ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,\n.ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill,\n.ql-snow.ql-toolbar button:hover .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar button:hover .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar button:focus .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar button:focus .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar button.ql-active .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar button.ql-active .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,\n.ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill,\n.ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill':
        {
          fill: token.colorPrimaryTextHover,
        },
      '.ql-snow.ql-toolbar button:hover .ql-stroke,\n.ql-snow .ql-toolbar button:hover .ql-stroke,\n.ql-snow.ql-toolbar button:focus .ql-stroke,\n.ql-snow .ql-toolbar button:focus .ql-stroke,\n.ql-snow.ql-toolbar button.ql-active .ql-stroke,\n.ql-snow .ql-toolbar button.ql-active .ql-stroke,\n.ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,\n.ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,\n.ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,\n.ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,\n.ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,\n.ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,\n.ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,\n.ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke,\n.ql-snow.ql-toolbar button:hover .ql-stroke-miter,\n.ql-snow .ql-toolbar button:hover .ql-stroke-miter,\n.ql-snow.ql-toolbar button:focus .ql-stroke-miter,\n.ql-snow .ql-toolbar button:focus .ql-stroke-miter,\n.ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,\n.ql-snow .ql-toolbar button.ql-active .ql-stroke-miter,\n.ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter,\n.ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter,\n.ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,\n.ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,\n.ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter,\n.ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter,\n.ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter,\n.ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter':
        {
          stroke: token.colorPrimaryTextHover,
        },
      '@media (pointer: coarse)': {
        '.ql-snow.ql-toolbar button:hover:not(.ql-active),\n  .ql-snow .ql-toolbar button:hover:not(.ql-active)': {
          color: token.colorTextSecondary,
        },
        '.ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-fill,\n  .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-fill,\n  .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill,\n  .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill':
          {
            fill: token.colorTextSecondary,
          },
        '.ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke,\n  .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke,\n  .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter,\n  .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter':
          {
            stroke: token.colorTextSecondary,
          },
      },
      '.ql-snow': { boxSizing: 'border-box' },
      '.ql-snow *': { boxSizing: 'border-box' },
      '.ql-snow .ql-hidden': { display: 'none' },
      '.ql-snow .ql-out-bottom,\n.ql-snow .ql-out-top': { visibility: 'hidden' },
      '.ql-snow .ql-tooltip': {
        position: 'absolute',
        transform: 'translateY(10px)',
        backgroundColor: '#fff',
        border: `1px solid ${token.colorBorder}`,
        boxShadow: '0px 0px 5px #ddd',
        color: token.colorTextSecondary,
        padding: '5px 12px',
        whiteSpace: 'nowrap',
      },
      '.ql-snow .ql-tooltip a': {
        cursor: 'pointer',
        textDecoration: 'none',
        lineHeight: '26px',
      },
      '.ql-snow .ql-tooltip.ql-flip': { transform: 'translateY(-10px)' },
      '.ql-snow .ql-formats': { display: 'inline-block', verticalAlign: 'middle' },
      '.ql-snow .ql-formats:after': {
        clear: 'both',
        content: "''",
        display: 'table',
      },
      '.ql-snow .ql-stroke': {
        fill: 'none',
        stroke: token.colorTextSecondary,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
      },
      '.ql-snow .ql-stroke-miter': {
        fill: 'none',
        stroke: token.colorTextSecondary,
        strokeMiterlimit: '10',
        strokeWidth: 2,
      },
      '.ql-snow .ql-fill,\n.ql-snow .ql-stroke.ql-fill': { fill: token.colorTextSecondary },
      '.ql-snow .ql-empty': { fill: 'none' },
      '.ql-snow .ql-even': { fillRule: 'evenodd' },
      '.ql-snow .ql-thin,\n.ql-snow .ql-stroke.ql-thin': { strokeWidth: 1 },
      '.ql-snow .ql-transparent': { opacity: 0.4 },
      '.ql-snow .ql-direction svg:last-child': { display: 'none' },
      '.ql-snow .ql-direction.ql-active svg:last-child': { display: 'inline' },
      '.ql-snow .ql-direction.ql-active svg:first-child': { display: 'none' },
      '.ql-snow .ql-editor h1': { fontSize: '2em' },
      '.ql-snow .ql-editor h2': { fontSize: '1.5em' },
      '.ql-snow .ql-editor h3': { fontSize: '1.17em' },
      '.ql-snow .ql-editor h4': { fontSize: '1em' },
      '.ql-snow .ql-editor h5': { fontSize: '0.83em' },
      '.ql-snow .ql-editor h6': { fontSize: '0.67em' },
      '.ql-snow .ql-editor a': { textDecoration: 'underline' },
      '.ql-snow .ql-editor blockquote': {
        borderLeft: '4px solid #ccc',
        marginBottom: '5px',
        marginTop: '5px',
        paddingLeft: '16px',
      },
      '.ql-snow .ql-editor code,\n.ql-snow .ql-editor pre': {
        backgroundColor: '#f0f0f0',
        borderRadius: '3px',
      },
      '.ql-snow .ql-editor pre': {
        whiteSpace: 'pre-wrap',
        marginBottom: '5px',
        marginTop: '5px',
        padding: '5px 10px',
      },
      '.ql-snow .ql-editor code': { fontSize: '85%', padding: '2px 4px' },
      '.ql-snow .ql-editor pre.ql-syntax': {
        backgroundColor: '#23241f',
        color: '#f8f8f2',
        overflow: 'visible',
      },
      '.ql-snow .ql-editor img': { maxWidth: '100%' },
      '.ql-snow .ql-picker': {
        color: token.colorTextSecondary,
        display: 'inline-block',
        cssFloat: 'left',
        fontSize: '14px',
        fontWeight: 500,
        height: '24px',
        position: 'relative',
        verticalAlign: 'middle',
      },
      '.ql-snow .ql-picker-label': {
        cursor: 'pointer',
        display: 'inline-block',
        height: '100%',
        paddingLeft: '8px',
        paddingRight: '2px',
        position: 'relative',
        width: '100%',
      },
      '.ql-snow .ql-picker-label::before': {
        display: 'inline-block',
        lineHeight: '22px',
      },
      '.ql-snow .ql-picker-options': {
        backgroundColor: '#fff',
        display: 'none',
        minWidth: '100%',
        padding: '4px 8px',
        position: 'absolute',
        whiteSpace: 'nowrap',
      },
      '.ql-snow .ql-picker-options .ql-picker-item': {
        cursor: 'pointer',
        display: 'block',
        paddingBottom: '5px',
        paddingTop: '5px',
      },
      '.ql-snow .ql-picker.ql-expanded .ql-picker-label': {
        color: '#ccc',
        zIndex: 2,
      },
      '.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill': { fill: '#ccc' },
      '.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke': {
        stroke: '#ccc',
      },
      '.ql-snow .ql-picker.ql-expanded .ql-picker-options': {
        display: 'block',
        marginTop: '-1px',
        top: '100%',
        zIndex: 1,
      },
      '.ql-snow .ql-color-picker,\n.ql-snow .ql-icon-picker': { width: '28px' },
      '.ql-snow .ql-color-picker .ql-picker-label,\n.ql-snow .ql-icon-picker .ql-picker-label': {
        padding: '2px 4px',
      },
      '.ql-snow .ql-color-picker .ql-picker-label svg,\n.ql-snow .ql-icon-picker .ql-picker-label svg': {
        right: '4px',
      },
      '.ql-snow .ql-icon-picker .ql-picker-options': { padding: '4px 0px' },
      '.ql-snow .ql-icon-picker .ql-picker-item': {
        height: '24px',
        width: '24px',
        padding: '2px 4px',
      },
      '.ql-snow .ql-color-picker .ql-picker-options': {
        padding: '3px 5px',
        width: '152px',
      },
      '.ql-snow .ql-color-picker .ql-picker-item': {
        border: '1px solid transparent',
        cssFloat: 'left',
        height: '16px',
        margin: '2px',
        padding: '0px',
        width: '16px',
      },
      '.ql-snow .ql-picker:not(.ql-color-picker):not(.ql-icon-picker) svg': {
        position: 'absolute',
        marginTop: '-9px',
        right: '0',
        top: '50%',
        width: '18px',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-label]:not([data-label=''])::before,\n.ql-snow .ql-picker.ql-font .ql-picker-label[data-label]:not([data-label=''])::before,\n.ql-snow .ql-picker.ql-size .ql-picker-label[data-label]:not([data-label=''])::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-label]:not([data-label=''])::before,\n.ql-snow .ql-picker.ql-font .ql-picker-item[data-label]:not([data-label=''])::before,\n.ql-snow .ql-picker.ql-size .ql-picker-item[data-label]:not([data-label=''])::before":
        {
          content: 'attr(data-label)',
        },
      '.ql-snow .ql-picker.ql-header': { width: '98px' },
      '.ql-snow .ql-picker.ql-header .ql-picker-label::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item::before':
        {
          content: "'Normal'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before":
        {
          content: "'Heading 1'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before":
        {
          content: "'Heading 2'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before":
        {
          content: "'Heading 3'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before":
        {
          content: "'Heading 4'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before":
        {
          content: "'Heading 5'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,\n.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before":
        {
          content: "'Heading 6'",
        },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before": {
        fontSize: '2em',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before": {
        fontSize: '1.5em',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before": {
        fontSize: '1.17em',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before": {
        fontSize: '1em',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before": {
        fontSize: '0.83em',
      },
      ".ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before": {
        fontSize: '0.67em',
      },
      '.ql-snow .ql-picker.ql-font': { width: '108px' },
      '.ql-snow .ql-picker.ql-font .ql-picker-label::before,\n.ql-snow .ql-picker.ql-font .ql-picker-item::before': {
        content: "'Sans Serif'",
      },
      ".ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,\n.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before":
        {
          content: "'Serif'",
        },
      ".ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,\n.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before":
        {
          content: "'Monospace'",
        },
      ".ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before": {
        fontFamily: 'Georgia, Times New Roman, serif',
      },
      ".ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before": {
        fontFamily: 'Monaco, Courier New, monospace',
      },
      '.ql-snow .ql-picker.ql-size': { width: '98px' },
      '.ql-snow .ql-picker.ql-size .ql-picker-label::before,\n.ql-snow .ql-picker.ql-size .ql-picker-item::before': {
        content: "'Normal'",
      },
      ".ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,\n.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before":
        {
          content: "'Small'",
        },
      ".ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,\n.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before":
        {
          content: "'Large'",
        },
      ".ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,\n.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before":
        {
          content: "'Huge'",
        },
      ".ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before": {
        fontSize: '10px',
      },
      ".ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before": {
        fontSize: '18px',
      },
      ".ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before": {
        fontSize: '32px',
      },
      '.ql-snow .ql-color-picker.ql-background .ql-picker-item': {
        backgroundColor: '#fff',
      },
      '.ql-snow .ql-color-picker.ql-color .ql-picker-item': {
        backgroundColor: '#000',
      },
      '.ql-toolbar.ql-snow': {
        border: `1px solid ${token.colorBorder}`,
        boxSizing: 'border-box',
        padding: '8px',
        borderTopLeftRadius: '2px',
        borderTopRightRadius: '2px',
        lineHeight: 1.6,
      },
      '.ql-toolbar.ql-snow .ql-formats': { marginRight: '15px' },
      '.ql-toolbar.ql-snow .ql-picker-label': { border: '1px solid transparent' },
      '.ql-toolbar.ql-snow .ql-picker-options': {
        border: '1px solid transparent',
        boxShadow: 'rgba(0, 0, 0, 0.2) 0 2px 8px',
      },
      '.ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label': {
        borderColor: token.colorBorder,
      },
      '.ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options': {
        borderColor: token.colorBorder,
      },
      '.ql-toolbar.ql-snow .ql-color-picker .ql-picker-item.ql-selected,\n.ql-toolbar.ql-snow .ql-color-picker .ql-picker-item:hover':
        {
          borderColor: '#000',
        },
      '.ql-toolbar.ql-snow + .ql-container.ql-snow': { borderTop: '0px' },
      '.ql-snow .ql-tooltip::before': {
        content: "'Visit URL:'",
        lineHeight: '26px',
        marginRight: '8px',
      },
      ".ql-snow .ql-tooltip input[type='text']": {
        display: 'none',
        border: `1px solid ${token.colorBorder}`,
        fontSize: '13px',
        height: '26px',
        margin: '0px',
        padding: '3px 5px',
        width: '170px',
      },
      '.ql-snow .ql-tooltip a.ql-preview': {
        display: 'inline-block',
        maxWidth: '200px',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'top',
      },
      '.ql-snow .ql-tooltip a.ql-action::after': {
        borderRight: '1px solid #ccc',
        content: "'Edit'",
        marginLeft: '16px',
        paddingRight: '8px',
      },
      '.ql-snow .ql-tooltip a.ql-remove::before': {
        content: "'Remove'",
        marginLeft: '8px',
      },
      '.ql-snow .ql-tooltip.ql-editing a.ql-preview,\n.ql-snow .ql-tooltip.ql-editing a.ql-remove': {
        display: 'none',
      },
      ".ql-snow .ql-tooltip.ql-editing input[type='text']": {
        display: 'inline-block',
      },
      '.ql-snow .ql-tooltip.ql-editing a.ql-action::after': {
        borderRight: '0px',
        content: "'Save'",
        paddingRight: '0px',
      },
      ".ql-snow .ql-tooltip[data-mode='link']::before": {
        content: "'Enter link:'",
      },
      ".ql-snow .ql-tooltip[data-mode='formula']::before": {
        content: "'Enter formula:'",
      },
      ".ql-snow .ql-tooltip[data-mode='video']::before": {
        content: "'Enter video:'",
      },
      '.ql-snow a': { color: token.colorPrimaryTextHover },
      '.ql-container.ql-snow': {
        border: `1px solid ${token.colorBorder}`,
        borderBottomLeftRadius: '2px',
        borderBottomRightRadius: '2px',
      },
    },
  };
});
