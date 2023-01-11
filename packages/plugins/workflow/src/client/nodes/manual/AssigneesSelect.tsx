import { RemoteSelect } from '@nocobase/client';
import React from 'react';
import { Operand, parseValue, VariableTypes, VariableTypesContext } from '../../variable';
import { NAMESPACE } from '../../locale';



export function AssigneesSelect({ multiple = false, value = [], onChange }) {
  const VTypes = {
    ...VariableTypes,
    constant: {
      title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
      value: 'constant',
    }
  };

  const operand = parseValue(value[0], VTypes);

  return (
    <VariableTypesContext.Provider value={VTypes}>
      <Operand
        types={[{ type: 'reference', options: { collection: 'users' } }]}
        value={value[0]}
        onChange={(next) => {
          onChange([next]);
        }}
      >
        {operand.type === 'constant'
          ? (
            <RemoteSelect
              fieldNames={{
                label: 'nickname',
                value: 'id',
              }}
              service={{
                resource: 'users'
              }}
              value={value[0]}
              onChange={(v) => {
                onChange([v]);
              }}
            />
          )
          : null
        }
      </Operand>
    </VariableTypesContext.Provider>
  );
}
