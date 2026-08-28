/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { observer } from '@nocobase/flow-engine';
import { AIEmployeeDropdown } from '../../../../ai-employees/AIEmployeeDropdown';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';

type AIEmployeeSelectProps = {
  value?: string;
  onChange?: (value?: string) => void;
};

export const AIEmployeeSelect: React.FC<AIEmployeeSelectProps> = observer(({ value, onChange }) => {
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const currentEmployee = useMemo(
    () => aiEmployees.find((employee) => employee.username === value),
    [aiEmployees, value],
  );

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  return (
    <AIEmployeeDropdown
      aiEmployees={aiEmployees}
      currentEmployee={currentEmployee}
      onSelect={(employee) => onChange?.(employee.username)}
    />
  );
});

export default AIEmployeeSelect;
