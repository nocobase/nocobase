// const FieldComponent: React.FC<{
//   fields: FieldOption[];
//   component: React.FC<{
//     allFields: FieldOption[];
//   }>;
// }> = (props) => {
//   const { fields } = props;
//   return (
//     <FormConsumer>
//       {(form) => {
//         // When field alias is set, appends it to the field list
//         const getAliasFields = (selectedFields: { field: string; aggregation: string; alias?: string }[]) => {
//           return selectedFields
//             .filter((selectedField) => selectedField.alias)
//             .map((selectedField) => {
//               const fieldProps = fields.find((field) => field.name === selectedField.field);
//               if (selectedField.aggregation) {
//                 // If aggregation is set, set the field type to number
//                 fieldProps.type = 'number';
//                 fieldProps.interface = 'number';
//               }
//               return {
//                 ...fieldProps,
//                 key: selectedField.alias,
//                 label: selectedField.alias,
//                 value: selectedField.alias,
//               };
//             });
//         };
//         const query = form.values.query || {};
//         const measures = query.measures || [];
//         const dimensions = query.dimensions || [];
//         const aliasFields = [...getAliasFields(measures), ...getAliasFields(dimensions)];
//         // unique
//         const map = new Map([...fields, ...aliasFields].map((item) => [item.value, item]));
//         const allFields = [...map.values()];
//         return props.component({ ...props, allFields });
//       }}
//     </FormConsumer>
//   );
// };

// const FieldSelect: React.FC<{
//   fields: FieldOption[];
// }> = (props) => {
//   return (
//     <FieldComponent
//       fields={props.fields}
//       component={(props) => {
//         return <Select {...props} options={props.allFields} />;
//       }}
//     />
//   );
// };

// const FieldFilter: React.FC<{
//   fields: FieldOption[];
// }> = (props) => {
//   const F = (props: { allFields: FieldOption[] }) => {
//     const options = useFilterOptions(props.allFields);
//     return <Filter {...props} options={options} />;
//   };
//   return <FieldComponent fields={props.fields} component={(props) => <F {...props} />} />;
// };
