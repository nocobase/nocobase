import { DataBlockInitializerV2 } from '../../application';

// export const DataBlockInitializer = (props) => {
//   const { templateWrap, onCreateBlockSchema, componentType, createBlockSchema, insert, isCusomeizeCreate, ...others } =
//     props;
//   const { getTemplateSchemaByMode } = useSchemaTemplateManager();
//   const { setVisible } = useContext(SchemaInitializerButtonContext);
//   return (
//     <SchemaInitializer.Item
//       icon={<TableOutlined />}
//       {...others}
//       onClick={async ({ item }) => {
//         if (item.template) {
//           const s = await getTemplateSchemaByMode(item);
//           templateWrap ? insert(templateWrap(s, { item })) : insert(s);
//         } else {
//           if (onCreateBlockSchema) {
//             onCreateBlockSchema({ item });
//           } else if (createBlockSchema) {
//             insert(createBlockSchema({ collection: item.name, isCusomeizeCreate }));
//           }
//         }
//         setVisible(false);
//       }}
//       items={useCollectionDataSourceItems(componentType)}
//     />
//   );
// };

export const DataBlockInitializer = DataBlockInitializerV2;
