// const FieldFilter: React.FC<{
//   fields: FieldOption[];
// }> = (props) => {
//   const F = (props: { allFields: FieldOption[] }) => {
//     const options = useFilterOptions(props.allFields);
//     return <Filter {...props} options={options} />;
//   };
//   return <FieldComponent fields={props.fields} component={(props) => <F {...props} />} />;
// };

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
//         /**
//          * chartFields is used for configuring chart fields
//          * since the default alias is field display name, we need to set the option values to field display name
//          * see also: 'appendAliasToQuery' function in this file
//          */
//         const chartFields = fields.map((field) => ({
//           ...field,
//           value: field.label,
//         }));
//         // When field alias is set, appends it to the field list
//         const getAliasFields = (selectedFields: SelectedField[]) => {
//           return selectedFields
//             .filter((selectedField) => selectedField.alias)
//             .map((selectedField) => ({
//               key: selectedField.alias,
//               label: selectedField.alias,
//               value: selectedField.alias,
//             }));
//         };
//         const query = form.values.query || {};
//         const measures = query.measures || [];
//         const dimensions = query.dimensions || [];
//         const aliasFields = [...getAliasFields(measures), ...getAliasFields(dimensions)];
//         // unique
//         const map = new Map([...chartFields, ...aliasFields].map((item) => [item.value, item]));
//         const allFields = [...map.values()];
//         return props.component({ ...props, allFields });
//       }}
//     </FormConsumer>
//   );
// };

// const FieldSelect: React.FC = (props) => {
//   const { t } = useChartsTranslation();
//   const fields = useFields();
//   return (
//     <FieldComponent
//       {...props}
//       fields={fields}
//       component={(props) => {
//         return <Select placeholder={t('Field')} {...props} options={props.allFields} />;
//       }}
//     />
//   );
// };
