/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Options, TabulatorFull as Tabulator } from 'tabulator-tables';
import './tabulator.css';

export type TabulatorTableProps = Options;

const TabulatorTable: React.FC<TabulatorTableProps> = (props) => {
  const ref = React.useRef();
  const instanceRef: any = React.useRef();

  const initTabulator = async () => {
    const domEle: any = ref.current; // Directly access the DOM element

    instanceRef.current = new Tabulator(domEle, {
      layout: 'fitColumns', // fit columns to width of table (optional)
      ...props,
    });
  };

  React.useEffect(() => {
    // console.log('useEffect - onmount');
    initTabulator();

    // Cleanup function to destroy Tabulator instance on unmount
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []);

  React.useEffect(() => {
    // console.log('useEffect - props.data changed');
    if (instanceRef?.current) {
      initTabulator();
    }
  }, [props]);

  return <div ref={ref} />;
};

export default TabulatorTable;
