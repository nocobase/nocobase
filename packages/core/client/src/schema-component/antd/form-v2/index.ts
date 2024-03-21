import { Form as FormV2 } from './Form';
import { DetailsDesigner, FormDesigner, ReadPrettyFormDesigner } from './Form.Designer';
import { FilterDesigner } from './Form.FilterDesigner';
import { Templates } from './Templates';
export * from './Form.Settings';

FormV2.Designer = FormDesigner;
FormV2.FilterDesigner = FilterDesigner;
FormV2.ReadPrettyDesigner = ReadPrettyFormDesigner;
FormV2.Templates = Templates;

export * from './FormField';
export * from './Templates';

export { DetailsDesigner, FormV2 };
