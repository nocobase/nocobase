/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { when } from './utils';

function CardForm({ onConfirm, onCancel }) {
  const inputCardTitle = useRef<any>();
  const inputCardDescription = useRef<any>();

  function addCard(event) {
    event.preventDefault();
    when(inputCardTitle.current.value)((value) => {
      onConfirm({ title: value, description: inputCardDescription.current.value });
    });
  }

  return (
    <div className="react-kanban-card-adder-form">
      <form onSubmit={addCard}>
        <input
          className="react-kanban-card-adder-form__title"
          name="title"
          autoFocus
          defaultValue="Title"
          ref={inputCardTitle}
        />
        <input
          className="react-kanban-card-adder-form__description"
          name="description"
          defaultValue="Description"
          ref={inputCardDescription}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <button className="react-kanban-card-adder-form__button" type="submit">
            Add
          </button>
          <button className="react-kanban-card-adder-form__button" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CardForm;
