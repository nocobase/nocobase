import { Form as FormV2 } from './Form';
import { DetailsDesigner, FormDesigner, ReadPrettyFormDesigner } from './Form.Designer';
import { FilterDesigner } from './Form.FilterDesigner';

FormV2.Designer = FormDesigner;
FormV2.FilterDesigner = FilterDesigner;
FormV2.ReadPrettyDesigner = ReadPrettyFormDesigner;

export * from './FormField';
export * from './SubForm';
export { FormV2, DetailsDesigner };
