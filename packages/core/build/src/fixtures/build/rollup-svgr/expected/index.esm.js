import React, { createElement } from 'react';

var _defs, _path;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function SvgMenu(props) {
  return /*#__PURE__*/createElement("svg", _extends({
    className: "menu_svg__icon",
    viewBox: "0 0 1024 1024",
    xmlns: "http://www.w3.org/2000/svg",
    width: 200,
    height: 200
  }, props), _defs || (_defs = /*#__PURE__*/createElement("defs", null, /*#__PURE__*/createElement("style", null))), _path || (_path = /*#__PURE__*/createElement("path", {
    d: "M656 512h160c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H656c-8.8 0-16 7.2-16 16v22H346V320h86c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h86v378c0 17.7 14.3 32 32 32h314v22c0 8.8 7.2 16 16 16h160c8.8 0 16-7.2 16-16v-96c0-8.8-7.2-16-16-16H656c-8.8 0-16 7.2-16 16v22H346V474h294v22c0 8.8 7.2 16 16 16z"
  })));
}

var svgUrl = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20standalone%3D%22no%22%3F%3E%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%3Csvg%20t%3D%221558949630117%22%20class%3D%22icon%22%20style%3D%22%22%20viewBox%3D%220%200%201024%201024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%20%20%20%20p-id%3D%2233994%22%20%20%20%20%20width%3D%22200%22%20height%3D%22200%22%3E%20%20%3Cdefs%3E%20%20%20%20%3Cstyle%20type%3D%22text%2Fcss%22%3E%3C%2Fstyle%3E%20%20%3C%2Fdefs%3E%20%20%3Cpath%20%20%20%20d%3D%22M656%20512h160c8.8%200%2016-7.2%2016-16v-96c0-8.8-7.2-16-16-16H656c-8.8%200-16%207.2-16%2016v22H346V320h86c8.8%200%2016-7.2%2016-16v-96c0-8.8-7.2-16-16-16H208c-8.8%200-16%207.2-16%2016v96c0%208.8%207.2%2016%2016%2016h86v378c0%2017.7%2014.3%2032%2032%2032h314v22c0%208.8%207.2%2016%2016%2016h160c8.8%200%2016-7.2%2016-16v-96c0-8.8-7.2-16-16-16H656c-8.8%200-16%207.2-16%2016v22H346V474h294v22c0%208.8%207.2%2016%2016%2016z%22%20%20%20%20p-id%3D%2233995%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E";

console.log(svgUrl, /*#__PURE__*/React.createElement(SvgMenu, null));
