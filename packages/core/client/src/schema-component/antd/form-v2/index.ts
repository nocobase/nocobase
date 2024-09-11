/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsDesigner, FormDesigner, ReadPrettyFormDesigner } from './Form.Designer';
import { FilterDesigner } from './Form.FilterDesigner';
import { FormWithDataTemplates as FormV2 } from './FormWithDataTemplates';
import { Templates } from './Templates';
export * from './Form.Settings';

FormV2.Designer = FormDesigner;
FormV2.FilterDesigner = FilterDesigner;
FormV2.ReadPrettyDesigner = ReadPrettyFormDesigner;
FormV2.Templates = Templates;

export * from './FormField';
export * from './Templates';

export { DetailsDesigner, FormV2 };
