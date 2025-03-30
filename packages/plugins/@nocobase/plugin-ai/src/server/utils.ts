/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 将Formily的uiSchema转换成标准的JSON Schema
 * 支持嵌套结构和VoidField
 * @param {Object} uiSchema - Formily的表单uiSchema
 * @returns {Object} 标准的JSON Schema
 */
export function convertUiSchemaToJsonSchema(uiSchema) {
  // 创建基础的JSON Schema结构
  const jsonSchema = {
    type: 'object',
    properties: {},
    required: [],
  };

  // 递归处理UI Schema，提取数据字段
  function extractDataFields(schema, targetSchema) {
    // 如果当前节点是数据字段（非void类型）
    if (schema.type && schema.type !== 'void' && schema.name) {
      const fieldSchema = createFieldSchema(schema);
      targetSchema.properties[schema.name] = fieldSchema;

      // 如果字段是必填的
      if (schema.required) {
        targetSchema.required.push(schema.name);
      }

      return;
    }

    // 如果是嵌套的properties对象
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const field = schema.properties[key];

        // 如果字段有自己的name属性，使用它
        const fieldName = field.name || key;

        // 处理数据字段
        if (field.type && field.type !== 'void') {
          const fieldSchema = createFieldSchema(field);
          targetSchema.properties[fieldName] = fieldSchema;

          // 如果字段是必填的
          if (field.required) {
            targetSchema.required.push(fieldName);
          }
        }
        // 递归处理嵌套的void字段
        else if (field.properties) {
          extractDataFields(field, targetSchema);
        }
        // 特殊处理CollectionField类型
        else if (field['x-component'] === 'CollectionField' && field['x-collection-field']) {
          // 从x-collection-field中提取字段名
          const collectionParts = field['x-collection-field'].split('.');
          const fieldType = field.type || 'string';

          const fieldSchema = {
            type: fieldType,
            title: field.title || collectionParts[collectionParts.length - 1],
          };

          targetSchema.properties[fieldName] = fieldSchema;
        }
      });
    }
  }

  // 创建字段Schema的辅助函数
  function createFieldSchema(field) {
    const fieldSchema = {
      title: field.title || field.name,
    };

    // 设置字段类型
    if (field.type) {
      fieldSchema.type = field.type;
    } else {
      // 根据组件类型推断数据类型
      fieldSchema.type = inferTypeFromComponent(field['x-component']);
    }

    // 处理字段验证和约束
    if (field['x-validator']) {
      processValidator(field['x-validator'], fieldSchema);
    }

    // 处理字段描述
    if (field.description) {
      fieldSchema.description = field.description;
    }

    // 处理枚举值
    if (field.enum) {
      fieldSchema.enum = field.enum.map((item) => (typeof item === 'object' ? item.value : item));
    }

    // 处理默认值
    if (field.default !== undefined) {
      fieldSchema.default = field.default;
    }

    // 处理特定格式
    if (field.format) {
      fieldSchema.format = field.format;
    }

    // 处理CollectionField
    if (field['x-component'] === 'CollectionField' && field['x-collection-field']) {
      // 从x-collection-field中提取字段信息
      const collectionParts = field['x-collection-field'].split('.');
      fieldSchema.title = fieldSchema.title || collectionParts[collectionParts.length - 1];
    }

    return fieldSchema;
  }

  // 根据组件类型推断数据类型
  function inferTypeFromComponent(component) {
    if (!component) return 'string';

    switch (component) {
      case 'Input':
      case 'Input.TextArea':
      case 'Select':
      case 'Radio':
      case 'DatePicker':
      case 'TimePicker':
        return 'string';
      case 'NumberPicker':
        return 'number';
      case 'Switch':
      case 'Checkbox':
        return 'boolean';
      case 'Upload':
        return 'array';
      case 'CollectionField':
        return 'string'; // 默认为string，实际类型应取决于collection字段类型
      default:
        return 'string';
    }
  }

  // 处理字段验证器
  function processValidator(validator, fieldSchema) {
    if (Array.isArray(validator)) {
      validator.forEach((rule) => applyValidationRule(rule, fieldSchema));
    } else if (typeof validator === 'object') {
      applyValidationRule(validator, fieldSchema);
    }
  }

  // 应用验证规则到字段schema
  function applyValidationRule(rule, fieldSchema) {
    if (rule.min !== undefined) fieldSchema.minimum = rule.min;
    if (rule.max !== undefined) fieldSchema.maximum = rule.max;
    if (rule.minLength !== undefined) fieldSchema.minLength = rule.minLength;
    if (rule.maxLength !== undefined) fieldSchema.maxLength = rule.maxLength;
    if (rule.pattern) fieldSchema.pattern = rule.pattern;
    if (rule.format) fieldSchema.format = rule.format;
    if (rule.required) fieldSchema.required = true;
  }

  // 开始转换
  extractDataFields(uiSchema, jsonSchema);

  // 如果没有必填字段，删除required数组
  if (jsonSchema.required.length === 0) {
    delete jsonSchema.required;
  }

  return jsonSchema;
}
