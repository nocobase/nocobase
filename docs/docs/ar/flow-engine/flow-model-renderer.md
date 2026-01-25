:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# عرض FlowModel

`FlowModelRenderer` هو مكون React الأساسي لعرض `FlowModel`. يتولى هذا المكون مسؤولية تحويل كائن `FlowModel` إلى مكون React مرئي.

## الاستخدام الأساسي

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// الاستخدام الأساسي
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

لعرض نماذج الحقول (Field Models) المتحكَّم بها، استخدم `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// عرض الحقول المتحكَّم بها
<FieldModelRenderer model={fieldModel} />
```

## خصائص المكون (Props)

### FlowModelRendererProps

| الخاصية | النوع | القيمة الافتراضية | الوصف |
|------|------|--------|------|
| `model` | `FlowModel` | - | كائن `FlowModel` المراد عرضه |
| `uid` | `string` | - | المعرّف الفريد لنموذج سير العمل |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | المحتوى البديل الذي يظهر عند فشل العرض |
| `showFlowSettings` | `boolean \| object` | `false` | هل يجب إظهار مدخل إعدادات سير العمل |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | نمط التفاعل لإعدادات سير العمل |
| `hideRemoveInSettings` | `boolean` | `false` | هل يجب إخفاء زر الإزالة في الإعدادات |
| `showTitle` | `boolean` | `false` | هل يجب عرض عنوان النموذج في الزاوية العلوية اليسرى من الإطار |
| `skipApplyAutoFlows` | `boolean` | `false` | هل يجب تخطي تطبيق سير العمل التلقائي |
| `inputArgs` | `Record<string, any>` | - | سياق إضافي يتم تمريره إلى `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | هل يجب تغليف الطبقة الخارجية بمكون `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | مستوى قائمة الإعدادات: 1=النموذج الحالي فقط، 2=يشمل النماذج الفرعية |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | عناصر شريط الأدوات الإضافية |

### إعدادات `showFlowSettings` التفصيلية

عندما تكون `showFlowSettings` كائنًا، يتم دعم الإعدادات التالية:

```tsx pure
showFlowSettings={{
  showBackground: true,    // إظهار الخلفية
  showBorder: true,        // إظهار الحدود
  showDragHandle: true,    // إظهار مقبض السحب
  style: {},              // نمط شريط الأدوات المخصص
  toolbarPosition: 'inside' // موضع شريط الأدوات: 'inside' | 'above' | 'below'
}}
```

## دورة حياة العرض

تستدعي دورة العرض الكاملة الطرق التالية بالترتيب:

1.  **model.dispatchEvent('beforeRender')** - حدث ما قبل العرض
2.  **model.render()** - ينفذ طريقة عرض النموذج
3.  **model.onMount()** - خطاف تحميل المكون (Component mount hook)
4.  **model.onUnmount()** - خطاف إلغاء تحميل المكون (Component unmount hook)

## أمثلة الاستخدام

### العرض الأساسي

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>جاري التحميل...</div>}
    />
  );
}
```

### العرض مع إعدادات سير العمل

```tsx pure
// إظهار الإعدادات ولكن إخفاء زر الإزالة
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// إظهار الإعدادات والعنوان
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// استخدام وضع قائمة السياق (context menu)
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### شريط أدوات مخصص

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'إجراء مخصص',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('إجراء مخصص');
      }
    }
  ]}
/>
```

### تخطي سير العمل التلقائي

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### عرض نموذج الحقل

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## معالجة الأخطاء

يتضمن `FlowModelRenderer` آلية شاملة لمعالجة الأخطاء:

-   **حدود الأخطاء التلقائية**: يتم تمكين `showErrorFallback={true}` افتراضيًا.
-   **أخطاء سير العمل التلقائي**: يلتقط ويعالج الأخطاء أثناء تنفيذ سير العمل التلقائي.
-   **أخطاء العرض**: يعرض محتوى بديلًا عند فشل عرض النموذج.

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>فشل العرض، يرجى المحاولة مرة أخرى</div>}
/>
```

## تحسين الأداء

### تخطي سير العمل التلقائي

في السيناريوهات التي لا تتطلب سير عمل تلقائيًا، يمكنك تخطيها لتحسين الأداء:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### التحديثات التفاعلية

يستخدم `FlowModelRenderer` مراقب (`observer`) من `@formily/reactive-react` لإجراء تحديثات تفاعلية، مما يضمن إعادة عرض المكون تلقائيًا عند تغير حالة النموذج.

## ملاحظات هامة

1.  **التحقق من صحة النموذج**: تأكد من أن النموذج (`model`) المُمرَّر يحتوي على طريقة `render` صالحة.
2.  **إدارة دورة الحياة**: يتم استدعاء خطافات دورة حياة النموذج في الأوقات المناسبة.
3.  **حدود الأخطاء**: يُنصح بتمكين حدود الأخطاء في بيئة الإنتاج لتوفير تجربة مستخدم أفضل.
4.  **اعتبارات الأداء**: في السيناريوهات التي تتضمن عرض عدد كبير من النماذج، فكر في استخدام خيار `skipApplyAutoFlows`.