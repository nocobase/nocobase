/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import CardForm from './CardForm';

function CardAdder({ column, onConfirm }) {
  function confirmCard(card) {
    onConfirm(column, card);
    setAddingCard(false);
  }

  const [addingCard, setAddingCard] = useState(false);

  return (
    <>
      {addingCard ? (
        <CardForm onConfirm={confirmCard} onCancel={() => setAddingCard(false)} />
      ) : (
        <button className="react-kanban-card-adder-button" onClick={() => setAddingCard(!addingCard)}>
          +
        </button>
      )}
    </>
  );
}
export default CardAdder;
