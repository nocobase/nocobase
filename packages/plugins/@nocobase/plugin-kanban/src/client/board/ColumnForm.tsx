/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createRef } from 'react';
import { when } from './utils';

function ColumnForm({ onConfirm, onCancel }) {
  // FIXME use hook
  const inputColumnTitle = createRef<any>();

  function addColumn(event) {
    event.preventDefault();

    when(inputColumnTitle.current.value)(onConfirm);
  }

  return (
    <div className="react-kanban-column" style={{ minWidth: '230px' }}>
      <form style={{ display: 'flex', justifyContent: 'space-between' }} onSubmit={addColumn}>
        <input type="text" ref={inputColumnTitle} autoFocus />
        <button type="submit">Add</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default ColumnForm;
