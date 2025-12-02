:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# FlowModel: تدفق الأحداث والتهيئة

يقدم FlowModel نهجًا يعتمد على "تدفق الأحداث (Flow)" لتطبيق منطق تهيئة المكونات، مما يجعل سلوك المكونات وتهيئتها أكثر قابلية للتوسع والوضوح.

## نموذج مخصص

يمكنك إنشاء نموذج مكون مخصص عن طريق وراثة `FlowModel`. يجب أن يقوم النموذج بتطبيق التابع `render()` لتحديد منطق عرض المكون.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## تسجيل تدفق (Flow)

يمكن لكل نموذج تسجيل تدفق واحد أو أكثر (**Flow**) لوصف منطق تهيئة المكون وخطوات التفاعل.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'إعدادات الزر',
  steps: {
    general: {
      title: 'التهيئة العامة',
      uiSchema: {
        title: {
          type: 'string',
          title: 'عنوان الزر',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

الوصف

-   `key`: المعرف الفريد للتدفق (Flow).
-   `title`: اسم التدفق (Flow)، يُستخدم للعرض في واجهة المستخدم.
-   `steps`: يحدد خطوات التهيئة (Step). تتضمن كل خطوة:
    -   `title`: عنوان الخطوة.
    -   `uiSchema`: هيكل نموذج التهيئة (متوافق مع Formily Schema).
    -   `defaultParams`: المعلمات الافتراضية.
    -   `handler(ctx, params)`: يتم تشغيله عند الحفظ لتحديث حالة النموذج.

## عرض النموذج

عند عرض نموذج مكون، يمكنك استخدام المعلمة `showFlowSettings` للتحكم فيما إذا كنت تريد تمكين ميزة التهيئة. إذا تم تمكين `showFlowSettings`، سيظهر مدخل التهيئة تلقائيًا في الزاوية العلوية اليمنى من المكون (مثل أيقونة الإعدادات أو زر).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## فتح نموذج التهيئة يدويًا باستخدام `openFlowSettings`

بالإضافة إلى فتح نموذج التهيئة عبر مدخل التفاعل المدمج، يمكنك أيضًا استدعاء `openFlowSettings()` يدويًا في التعليمات البرمجية.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### تعريف المعلمات

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // مطلوب، مثيل النموذج الذي ينتمي إليه
  preset?: boolean;               // يعرض فقط الخطوات التي تم وضع علامة preset=true عليها (الافتراضي false)
  flowKey?: string;               // يحدد تدفقًا واحدًا (Flow)
  flowKeys?: string[];            // يحدد عدة تدفقات (Flows) (يتم تجاهله إذا تم توفير flowKey أيضًا)
  stepKey?: string;               // يحدد خطوة واحدة (عادة ما يستخدم مع flowKey)
  uiMode?: 'dialog' | 'drawer';   // حاوية عرض النموذج، الافتراضي هو 'dialog'
  onCancel?: () => void;          // دالة استدعاء عند النقر على إلغاء
  onSaved?: () => void;           // دالة استدعاء بعد حفظ التهيئة بنجاح
}
```

### مثال: فتح نموذج تهيئة تدفق (Flow) معين في وضع الدرج (Drawer)

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('تم حفظ إعدادات الزر');
  },
});
```