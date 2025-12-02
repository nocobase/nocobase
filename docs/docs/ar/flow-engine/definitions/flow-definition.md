:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# FlowDefinition

`FlowDefinition` يحدد الهيكل الأساسي لـ **سير العمل** وتكوينه، وهو أحد المفاهيم الأساسية لمحرك **سير العمل**. يصف هذا التعريف البيانات الوصفية لـ **سير العمل**، وشروط التشغيل، وخطوات التنفيذ، وغيرها.

## تعريف النوع

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## طريقة التسجيل

```ts
class MyModel extends FlowModel {}

// تسجيل سير عمل عبر فئة النموذج
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## وصف الخصائص

### key

**النوع**: `string`  
**مطلوب**: نعم  
**الوصف**: المعرّف الفريد لـ سير العمل.

نوصي باستخدام نمط تسمية موحد مثل `xxxSettings`، على سبيل المثال:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

يُسهّل هذا النمط من التسمية عملية التعرّف والصيانة، ويُنصح بتطبيقه بشكل موحد على مستوى المشروع.

**مثال**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**النوع**: `string`  
**مطلوب**: لا  
**الوصف**: عنوان سير العمل المقروء للبشر.

نوصي بالحفاظ على نمط تسمية متسق مع المفتاح (`key`)، باستخدام تنسيق `Xxx settings`، على سبيل المثال:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

يُعد هذا النمط من التسمية أكثر وضوحًا وسهولة في الفهم، مما يُسهّل عرضه في واجهة المستخدم والتعاون بين أعضاء الفريق.

**مثال**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**النوع**: `boolean`  
**مطلوب**: لا  
**القيمة الافتراضية**: `false`  
**الوصف**: هل يمكن تنفيذ سير العمل يدويًا فقط؟

- `true`: لا يمكن تشغيل سير العمل إلا يدويًا ولن يتم تنفيذه تلقائيًا.
- `false`: يمكن تنفيذ سير العمل تلقائيًا (يتم تنفيذه تلقائيًا بشكل افتراضي عندما لا تكون خاصية `on` موجودة).

**مثال**:
```ts
manual: true  // تنفيذ يدوي فقط
manual: false // يمكن تنفيذه تلقائيًا
```

### sort

**النوع**: `number`  
**مطلوب**: لا  
**القيمة الافتراضية**: `0`  
**الوصف**: ترتيب تنفيذ سير العمل. كلما كانت القيمة أصغر، زاد التنفيذ أولوية.

يمكن استخدام الأرقام السالبة للتحكم في ترتيب تنفيذ عدة عمليات سير عمل.

**مثال**:
```ts
sort: -1  // تنفيذ بأولوية
sort: 0   // ترتيب افتراضي
sort: 1   // تنفيذ لاحقًا
```

### on

**النوع**: `FlowEvent<TModel>`  
**مطلوب**: لا  
**الوصف**: إعدادات الحدث التي تسمح بتشغيل سير العمل هذا بواسطة `dispatchEvent`.

يُستخدم فقط لتحديد اسم حدث التشغيل (سلسلة نصية أو `{ eventName }`)، ولا يتضمن دالة معالجة.

**أنواع الأحداث المدعومة**:
- `'click'` - حدث النقر
- `'submit'` - حدث الإرسال
- `'reset'` - حدث إعادة الضبط
- `'remove'` - حدث الإزالة
- `'openView'` - حدث فتح العرض
- `'dropdownOpen'` - حدث فتح القائمة المنسدلة
- `'popupScroll'` - حدث تمرير النافذة المنبثقة
- `'search'` - حدث البحث
- `'customRequest'` - حدث طلب مخصص
- `'collapseToggle'` - حدث تبديل الطي
- أو أي سلسلة نصية مخصصة.

**مثال**:
```ts
on: 'click'  // يتم التشغيل عند النقر
on: 'submit' // يتم التشغيل عند الإرسال
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**النوع**: `Record<string, StepDefinition<TModel>>`  
**مطلوب**: نعم  
**الوصف**: تعريف خطوات سير العمل.

يحدد جميع الخطوات المتضمنة في سير العمل، حيث يكون لكل خطوة مفتاح فريد.

**مثال**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**النوع**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**مطلوب**: لا  
**الوصف**: المعلمات الافتراضية على مستوى سير العمل.

عند إنشاء نسخة من النموذج (`createModel`)، يتم تعبئة القيم الأولية لمعلمات خطوات "سير العمل الحالي". يتم فقط ملء القيم المفقودة ولا يتم الكتابة فوق القيم الموجودة. يكون شكل الإرجاع ثابتًا: `{ [stepKey]: params }`

**مثال**:
```ts
// معلمات افتراضية ثابتة
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// معلمات افتراضية ديناميكية
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// معلمات افتراضية غير متزامنة
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## مثال كامل

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```