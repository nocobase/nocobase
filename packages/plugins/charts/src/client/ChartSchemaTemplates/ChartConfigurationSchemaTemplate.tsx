import {
  CollectionField,
  CollectionFieldOptions, Filter, FormItem, Input, Radio,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaComponentProvider,
  SchemaInitializerContext, Select,
  Tabs,
  useAPIClient,
  useCollection,
  useCollectionManager,
  useFilterOptions,
  useRequest
} from "@nocobase/client";
import React, {useContext, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  createSchemaField,
  observer,
  RecursionField,
  Schema,
  SchemaOptionsContext,
  useField,
  useForm
} from "@formily/react";
import {templates} from "../templates";
import {FormLayout} from "@formily/antd";
import {Field} from "@formily/core";
import {ChartBlockInitializer} from "../ChartBlockInitializer";
import {ChartBlockEngine} from "../ChartBlockEngine";

interface contextInfo {
  collectionFields: CollectionFieldOptions[];
}

const  ChartConfigurationOptions = observer((props: any) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  const collectionFields = props.collectionFields
  const items = useContext(SchemaInitializerContext);
  console.log(collectionFields)
  const computedFields = collectionFields
    ?.filter((field) => (field.type === 'double' || field.type === "bigInt"))
    ?.map((field) => {
      return {
        label: field?.uiSchema?.title,
        value: field.name,
      };
    });
  useEffect(() => {
    const chartType = form.values.chartType
    console.log(form.values)
    const chartConfigurationSchema = templates.find(template => {
      return template.type === chartType
    })?.configurableProperties
    // form.clearFormGraph('options.*');
    console.log(chartConfigurationSchema,"chartConfigurationSchema")
    setSchema(new Schema(chartConfigurationSchema || {})
    )
    ;
  }, [form.values.chartType]);
  return (
    // <FormLayout layout={'vertical'}>
      /*<RecursionField key={form.values.chartType || 'local'} basePath={field.address} onlyRenderProperties/>*/
      <SchemaComponent  schema={s} scope={computedFields} components={
        {Tabs, Select, FormItem, Input , Radio, Filter}
      }/>
    // </FormLayout>
  )
})

const ChartConfigurationSchemaTemplate = (contextInfo: contextInfo) => {
  const {collectionFields} = contextInfo
  const {t} = useTranslation();
  const computedFields = collectionFields
    ?.filter((field) => (field.type === 'double' || field.type === "bigInt"))
    ?.map((field) => {
      return {
        label: field?.uiSchema?.title,
        value: field.name,
      };
    });
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return {
    ChartTab: {
      type: 'object',
      'x-component': ChartConfigurationOptions,
      'x-component-props': {
        collectionFields
      }
    }
  }
}

export {
  ChartConfigurationSchemaTemplate,
  ChartConfigurationOptions
}
