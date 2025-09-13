/**
 * demos 工具：一次性注册 js-field-model 示例所需的全部模型
 * - 动态引入 @nocobase/client，避免各示例到处 import/注册
 * - 在统一入口里做过滤，规避个别导出在某些构建环境下为 undefined 的问题
 */
export async function registerJsFieldDemoModels(engine: any) {
  if (!engine || !engine.registerModels) return;
  const c = await import('@nocobase/client');
  const all: Record<string, any> = {
    // Table 相关
    TableBlockModel: c.TableBlockModel,
    TableColumnModel: c.TableColumnModel,
    TableActionsColumnModel: c.TableActionsColumnModel,
    ReadPrettyFieldModel: c.ReadPrettyFieldModel,
    JSFieldModel: c.JSFieldModel,
    TableAssociationFieldGroupModel: c.TableAssociationFieldGroupModel,
    TableCustomColumnModel: c.TableCustomColumnModel,
    TableJavaScriptFieldEntryModel: c.TableJavaScriptFieldEntryModel,

    // Form 相关
    CreateFormModel: c.CreateFormModel,
    FormGridModel: c.FormGridModel,
    FormItemModel: c.FormItemModel,
    JSEditableFieldModel: c.JSEditableFieldModel,
    FormSubmitActionModel: c.FormSubmitActionModel,

    // 可编辑字段模型（默认绑定依赖）
    InputFieldModel: c.InputFieldModel,
    NumberFieldModel: c.NumberFieldModel,
    SelectFieldModel: c.SelectFieldModel,
    DateTimeFieldModel: c.DateTimeFieldModel,
    JsonFieldModel: c.JsonFieldModel,
    TextareaFieldModel: c.TextareaFieldModel,
    PasswordFieldModel: c.PasswordFieldModel,
    ColorFieldModel: c.ColorFieldModel,
    TimeFieldModel: c.TimeFieldModel,
    UploadFieldModel: c.UploadFieldModel,

    // 自定义项/入口
    FormCustomItemModel: c.FormCustomItemModel,
    MarkdownItemModel: c.MarkdownItemModel,
    DividerItemModel: c.DividerItemModel,
    FormJavaScriptFieldEntryModel: c.FormJavaScriptFieldEntryModel,

    // Details 相关
    DetailsBlockModel: c.DetailsBlockModel,
    DetailsGridModel: c.DetailsGridModel,
    DetailsItemModel: c.DetailsItemModel,
    DetailsCustomItemModel: c.DetailsCustomItemModel,
    DetailsJavaScriptFieldEntryModel: c.DetailsJavaScriptFieldEntryModel,

    // 显示字段模型（表格/详情默认绑定依赖）
    InputReadPrettyFieldModel: c.InputReadPrettyFieldModel,
    NumberReadPrettyFieldModel: c.NumberReadPrettyFieldModel,
    DateTimeReadPrettyFieldModel: c.DateTimeReadPrettyFieldModel,
    JsonReadPrettyFieldModel: c.JsonReadPrettyFieldModel,
    MarkdownReadPrettyFieldModel: c.MarkdownReadPrettyFieldModel,
  };
  const filtered = Object.fromEntries(Object.entries(all).filter(([, v]) => v != null));
  engine.registerModels(filtered as any);
}
