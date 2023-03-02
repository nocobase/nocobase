import { FilterFormDesigner } from './Form.FilterFormDesigner';
import { Form as FormV2 } from './Form';
import { DetailsDesigner, FormDesigner, ReadPrettyFormDesigner } from './Form.Designer';

FormV2.Designer = FormDesigner;
FormV2.FilterFormDesigner = FilterFormDesigner;
FormV2.ReadPrettyDesigner = ReadPrettyFormDesigner;

export { FormV2, DetailsDesigner };
export * from './FormField';
