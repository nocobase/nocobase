import React from 'react';
import { SchemaComponent } from '../../schema-component';
import { roleSchema } from './schemas/roles';

export const RoleTable = () => {
  return (
    <div>
      <SchemaComponent schema={roleSchema} />
    </div>
  );
};
