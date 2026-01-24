:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

## संग्रह कॉन्फ़िगरेशन पैरामीटर

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - संग्रह नाम
- **प्रकार**: `string`
- **आवश्यक**: ✅
- **विवरण**: यह संग्रह का एक अद्वितीय पहचानकर्ता है, जो पूरे एप्लिकेशन में अद्वितीय होना चाहिए।
- **उदाहरण**:
```typescript
{
  name: 'users'  // उपयोगकर्ता संग्रह
}
```

### `title` - संग्रह शीर्षक
- **प्रकार**: `string`
- **आवश्यक**: ❌
- **विवरण**: यह संग्रह का प्रदर्शन शीर्षक है, जिसका उपयोग फ्रंटएंड इंटरफ़ेस में दिखाने के लिए किया जाता है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  title: 'उपयोगकर्ता प्रबंधन'  // इंटरफ़ेस में "उपयोगकर्ता प्रबंधन" के रूप में प्रदर्शित होता है
}
```

### `migrationRules` - माइग्रेशन नियम
- **प्र प्रकार**: `MigrationRule[]`
- **आवश्यक**: ❌
- **विवरण**: डेटा माइग्रेशन के लिए प्रोसेसिंग नियम।
- **उदाहरण**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // मौजूदा डेटा को ओवरराइट करें
  fields: [...]
}
```

### `inherits` - संग्रह विरासत
- **प्रकार**: `string[] | string`
- **आवश्यक**: ❌
- **विवरण**: अन्य संग्रहों से फ़ील्ड परिभाषाएँ विरासत में लें। यह एकल या एकाधिक संग्रह विरासत का समर्थन करता है।
- **उदाहरण**:

```typescript
// एकल विरासत
{
  name: 'admin_users',
  inherits: 'users',  // उपयोगकर्ता संग्रह के सभी फ़ील्ड विरासत में लें
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// एकाधिक विरासत
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // कई संग्रहों से विरासत में लें
  fields: [...]
}
```

### `filterTargetKey` - फ़िल्टर लक्ष्य कुंजी
- **प्रकार**: `string | string[]`
- **आवश्यक**: ❌
- **विवरण**: क्वेरीज़ को फ़िल्टर करने के लिए उपयोग की जाने वाली लक्ष्य कुंजी। यह एकल या एकाधिक कुंजियों का समर्थन करता है।
- **उदाहरण**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // उपयोगकर्ता ID द्वारा फ़िल्टर करें
  fields: [...]
}

// एकाधिक फ़िल्टर कुंजियाँ
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // उपयोगकर्ता ID और श्रेणी ID द्वारा फ़िल्टर करें
  fields: [...]
}
```

### `fields` - फ़ील्ड परिभाषाएँ
- **प्रकार**: `FieldOptions[]`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `[]`
- **विवरण**: यह संग्रह के लिए फ़ील्ड परिभाषाओं का एक ऐरे है। प्रत्येक फ़ील्ड में प्रकार, नाम और कॉन्फ़िगरेशन जैसी जानकारी शामिल होती है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'उपयोगकर्ता नाम'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'ईमेल'
    },
    {
      type: 'password',
      name: 'password',
      title: 'पासवर्ड'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'बनाने का समय'
    }
  ]
}
```

### `model` - कस्टम मॉडल
- **प्रकार**: `string | ModelStatic<Model>`
- **आवश्यक**: ❌
- **विवरण**: एक कस्टम Sequelize मॉडल क्लास निर्दिष्ट करें, जो या तो क्लास का नाम हो सकता है या मॉडल क्लास स्वयं।
- **उदाहरण**:
```typescript
// मॉडल क्लास का नाम स्ट्रिंग के रूप में निर्दिष्ट करें
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// मॉडल क्लास का उपयोग करें
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - कस्टम रिपॉजिटरी
- **प्रकार**: `string | RepositoryType`
- **आवश्यक**: ❌
- **विवरण**: डेटा एक्सेस लॉजिक को संभालने के लिए एक कस्टम रिपॉजिटरी क्लास निर्दिष्ट करें।
- **उदाहरण**:
```typescript
// रिपॉजिटरी क्लास का नाम स्ट्रिंग के रूप में निर्दिष्ट करें
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// रिपॉजिटरी क्लास का उपयोग करें
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID स्वतः जनरेट करें
- **प्रकार**: `boolean`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `true`
- **विवरण**: क्या प्राथमिक कुंजी ID को स्वचालित रूप से जनरेट करना है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  autoGenId: true,  // प्राथमिक कुंजी ID स्वचालित रूप से जनरेट करें
  fields: [...]
}

// ID का स्वतः जनरेशन अक्षम करें (मैन्युअल प्राथमिक कुंजी विनिर्देश की आवश्यकता है)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - टाइमस्टैम्प सक्षम करें
- **प्रकार**: `boolean`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `true`
- **विवरण**: क्या `createdAt` और `updatedAt` फ़ील्ड्स को सक्षम करना है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  timestamps: true,  // टाइमस्टैम्प सक्षम करें
  fields: [...]
}
```

### `createdAt` - बनाने का समय फ़ील्ड
- **प्रकार**: `boolean | string`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `true`
- **विवरण**: `createdAt` फ़ील्ड के लिए कॉन्फ़िगरेशन।
- **उदाहरण**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // createdAt फ़ील्ड के लिए कस्टम नाम
  fields: [...]
}
```

### `updatedAt` - अपडेट करने का समय फ़ील्ड
- **प्रकार**: `boolean | string`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `true`
- **विवरण**: `updatedAt` फ़ील्ड के लिए कॉन्फ़िगरेशन।
- **उदाहरण**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // updatedAt फ़ील्ड के लिए कस्टम नाम
  fields: [...]
}
```

### `deletedAt` - सॉफ्ट डिलीट फ़ील्ड
- **प्रकार**: `boolean | string`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: सॉफ्ट डिलीट फ़ील्ड के लिए कॉन्फ़िगरेशन।
- **उदाहरण**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // सॉफ्ट डिलीट सक्षम करें
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - सॉफ्ट डिलीट मोड
- **प्रकार**: `boolean`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: क्या सॉफ्ट डिलीट मोड को सक्षम करना है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  paranoid: true,  // सॉफ्ट डिलीट सक्षम करें
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - अंडरस्कोर नेमिंग
- **प्रकार**: `boolean`
- **आवश्यक**: ❌
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: क्या अंडरस्कोर नेमिंग स्टाइल का उपयोग करना है।
- **उदाहरण**:
```typescript
{
  name: 'users',
  underscored: true,  // अंडरस्कोर नेमिंग स्टाइल का उपयोग करें
  fields: [...]
}
```

### `indexes` - इंडेक्स कॉन्फ़िगरेशन
- **प्रकार**: `ModelIndexesOptions[]`
- **आवश्यक**: ❌
- **विवरण**: डेटाबेस इंडेक्स कॉन्फ़िगरेशन।
- **उदाहरण**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## फ़ील्ड पैरामीटर कॉन्फ़िगरेशन

NocoBase कई फ़ील्ड प्रकारों का समर्थन करता है, ये सभी `FieldOptions` यूनियन टाइप पर आधारित हैं। फ़ील्ड कॉन्फ़िगरेशन में बुनियादी गुण, डेटा प्रकार-विशिष्ट गुण, संबंध गुण और फ्रंटएंड रेंडरिंग गुण शामिल हैं।

### बुनियादी फ़ील्ड विकल्प

सभी फ़ील्ड प्रकार `BaseFieldOptions` से विरासत में मिलते हैं, जो सामान्य फ़ील्ड कॉन्फ़िगरेशन क्षमताएँ प्रदान करते हैं:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // सामान्य पैरामीटर
  name?: string;                    // फ़ील्ड नाम
  hidden?: boolean;                 // क्या छिपाना है
  validation?: ValidationOptions<T>; // सत्यापन नियम

  // सामान्य कॉलम फ़ील्ड गुण
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // फ्रंटएंड संबंधित
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**उदाहरण**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // नल मानों की अनुमति न दें
  unique: true,           // अद्वितीय बाधा
  defaultValue: '',       // डिफ़ॉल्ट रूप से एक खाली स्ट्रिंग
  index: true,            // एक इंडेक्स बनाएँ
  comment: 'उपयोगकर्ता लॉगिन नाम'    // डेटाबेस टिप्पणी
}
```

### `name` - फ़ील्ड नाम

- **प्रकार**: `string`
- **आवश्यक**: ❌
- **विवरण**: डेटाबेस में फ़ील्ड का कॉलम नाम, जो संग्रह के भीतर अद्वितीय होना चाहिए।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'username',  // फ़ील्ड नाम
  title: 'उपयोगकर्ता नाम'
}
```

### `hidden` - फ़ील्ड छिपाएँ

- **प्रकार**: `boolean`
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: क्या इस फ़ील्ड को सूचियों और फ़ॉर्म में डिफ़ॉल्ट रूप से छिपाना है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // आंतरिक ID फ़ील्ड छिपाएँ
  title: 'आंतरिक ID'
}
```

### `validation` - सत्यापन नियम

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // सत्यापन प्रकार
  rules: FieldValidationRule<T>[];  // सत्यापन नियमों का ऐरे
  [key: string]: any;              // अन्य सत्यापन विकल्प
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // नियम कुंजी
  name: FieldValidationRuleName<T>; // नियम नाम
  args?: {                         // नियम तर्क
    [key: string]: any;
  };
  paramsType?: 'object';           // पैरामीटर प्रकार
}
```

- **प्रकार**: `ValidationOptions<T>`
- **विवरण**: सर्वर-साइड सत्यापन नियम परिभाषित करने के लिए Joi का उपयोग करें।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - नल मानों की अनुमति दें

- **प्रकार**: `boolean`
- **डिफ़ॉल्ट मान**: `true`
- **विवरण**: नियंत्रित करता है कि डेटाबेस `NULL` मानों को लिखने की अनुमति देता है या नहीं।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // नल मानों की अनुमति न दें
  title: 'उपयोगकर्ता नाम'
}
```

### `defaultValue` - डिफ़ॉल्ट मान

- **प्रकार**: `any`
- **विवरण**: फ़ील्ड के लिए डिफ़ॉल्ट मान, जिसका उपयोग तब किया जाता है जब इस फ़ील्ड के लिए मान प्रदान किए बिना कोई रिकॉर्ड बनाया जाता है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // डिफ़ॉल्ट रूप से ड्राफ्ट स्थिति
  title: 'स्थिति'
}
```

### `unique` - अद्वितीय बाधा

- **प्रकार**: `boolean | string`
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: क्या मान अद्वितीय होना चाहिए। बाधा का नाम निर्दिष्ट करने के लिए एक स्ट्रिंग का उपयोग किया जा सकता है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // ईमेल अद्वितीय होना चाहिए
  title: 'ईमेल'
}
```

### `primaryKey` - प्राथमिक कुंजी

- **प्रकार**: `boolean`
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: इस फ़ील्ड को प्राथमिक कुंजी के रूप में घोषित करता है।
- **उदाहरण**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // प्राथमिक कुंजी के रूप में सेट करें
  autoIncrement: true
}
```

### `autoIncrement` - स्वतः वृद्धि

- **प्रकार**: `boolean`
- **डिफ़ॉल्ट मान**: `false`
- **विवरण**: स्वतः वृद्धि को सक्षम करता है (केवल संख्यात्मक फ़ील्ड पर लागू)।
- **उदाहरण**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // स्वतः वृद्धि
  primaryKey: true
}
```

### `field` - डेटाबेस कॉलम नाम

- **प्रकार**: `string`
- **विवरण**: वास्तविक डेटाबेस कॉलम नाम निर्दिष्ट करता है (Sequelize के `field` के अनुरूप)।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // डेटाबेस में कॉलम नाम
  title: 'उपयोगकर्ता ID'
}
```

### `comment` - डेटाबेस टिप्पणी

- **प्रकार**: `string`
- **विवरण**: डेटाबेस फ़ील्ड के लिए एक टिप्पणी, जिसका उपयोग दस्तावेज़ीकरण उद्देश्यों के लिए किया जाता है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'उपयोगकर्ता लॉगिन नाम, सिस्टम लॉगिन के लिए उपयोग किया जाता है',  // डेटाबेस टिप्पणी
  title: 'उपयोगकर्ता नाम'
}
```

### `title` - प्रदर्शन शीर्षक

- **प्रकार**: `string`
- **विवरण**: फ़ील्ड के लिए प्रदर्शन शीर्षक, जिसका उपयोग आमतौर पर फ्रंटएंड इंटरफ़ेस में किया जाता है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'उपयोगकर्ता नाम',  // फ्रंटएंड पर प्रदर्शित शीर्षक
  allowNull: false
}
```

### `description` - फ़ील्ड विवरण

- **प्रकार**: `string`
- **विवरण**: फ़ील्ड के बारे में वर्णनात्मक जानकारी, जो उपयोगकर्ताओं को इसके उद्देश्य को समझने में मदद करती है।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'ईमेल',
  description: 'कृपया एक वैध ईमेल पता दर्ज करें',  // फ़ील्ड विवरण
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - इंटरफ़ेस घटक

- **प्रकार**: `string`
- **विवरण**: फ़ील्ड के लिए अनुशंसित फ्रंटएंड इंटरफ़ेस घटक।
- **उदाहरण**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'सामग्री',
  interface: 'textarea',  // टेक्स्टएरिया घटक का उपयोग करने की सलाह दी जाती है
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### फ़ील्ड प्रकार इंटरफ़ेस

### `type: 'string'` - स्ट्रिंग फ़ील्ड

- **विवरण**: छोटे टेक्स्ट डेटा को स्टोर करने के लिए उपयोग किया जाता है। लंबाई सीमा और स्वचालित ट्रिमिंग का समर्थन करता है।
- **डेटाबेस प्रकार**: `VARCHAR`
- **विशिष्ट गुण**:
  - `length`: स्ट्रिंग लंबाई सीमा।
  - `trim`: क्या स्वचालित रूप से आगे और पीछे के रिक्त स्थान हटाने हैं।

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // स्ट्रिंग लंबाई सीमा
  trim?: boolean;     // क्या स्वचालित रूप से आगे और पीछे के रिक्त स्थान हटाने हैं
}
```

**उदाहरण**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'उपयोगकर्ता नाम',
  length: 50,           // अधिकतम 50 वर्ण
  trim: true,           // रिक्त स्थान स्वचालित रूप से हटाएँ
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - टेक्स्ट फ़ील्ड

- **विवरण**: लंबे टेक्स्ट डेटा को स्टोर करने के लिए उपयोग किया जाता है। MySQL में विभिन्न टेक्स्ट प्रकारों का समर्थन करता है।
- **डेटाबेस प्रकार**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **विशिष्ट गुण**:
  - `length`: MySQL टेक्स्ट लंबाई प्रकार (`tiny`/`medium`/`long`)।

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL टेक्स्ट लंबाई प्रकार
}
```

**उदाहरण**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'सामग्री',
  length: 'medium',     // MEDIUMTEXT का उपयोग करें
  allowNull: true
}
```

### संख्यात्मक प्रकार

### `type: 'integer'` - पूर्णांक फ़ील्ड

- **विवरण**: पूर्णांक डेटा को स्टोर करने के लिए उपयोग किया जाता है। स्वतः वृद्धि और प्राथमिक कुंजी का समर्थन करता है।
- **डेटाबेस प्रकार**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Sequelize INTEGER प्रकार के सभी विकल्प विरासत में मिलते हैं
}
```

**उदाहरण**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - बड़ा पूर्णांक फ़ील्ड

- **विवरण**: बड़े पूर्णांक डेटा को स्टोर करने के लिए उपयोग किया जाता है, जिसकी सीमा `integer` से अधिक होती है।
- **डेटाबेस प्रकार**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**उदाहरण**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'उपयोगकर्ता ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - फ़्लोट फ़ील्ड

- **विवरण**: एकल-परिशुद्धता फ़्लोटिंग-पॉइंट संख्याओं को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `FLOAT`
- **विशिष्ट गुण**:
  - `precision`: परिशुद्धता (कुल अंक)।
  - `scale`: दशमलव स्थान।

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // परिशुद्धता
  scale?: number;      // दशमलव स्थान
}
```

**उदाहरण**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'स्कोर',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - डबल-परिशुद्धता फ़्लोट फ़ील्ड

- **विवरण**: डबल-परिशुद्धता फ़्लोटिंग-पॉइंट संख्याओं को स्टोर करने के लिए उपयोग किया जाता है, जिनकी परिशुद्धता `float` से अधिक होती है।
- **डेटाबेस प्रकार**: `DOUBLE`
- **विशिष्ट गुण**:
  - `precision`: परिशुद्धता (कुल अंक)।
  - `scale`: दशमलव स्थान।

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**उदाहरण**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'कीमत',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - वास्तविक फ़ील्ड

- **विवरण**: वास्तविक संख्याओं को स्टोर करने के लिए उपयोग किया जाता है; डेटाबेस-निर्भर।
- **डेटाबेस प्रकार**: `REAL`
- **विशिष्ट गुण**:
  - `precision`: परिशुद्धता (कुल अंक)।
  - `scale`: दशमलव स्थान।

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**उदाहरण**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'दर',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - दशमलव फ़ील्ड

- **विवरण**: सटीक दशमलव संख्याओं को स्टोर करने के लिए उपयोग किया जाता है, वित्तीय गणनाओं के लिए उपयुक्त।
- **डेटाबेस प्रकार**: `DECIMAL`
- **विशिष्ट गुण**:
  - `precision`: परिशुद्धता (कुल अंक)।
  - `scale`: दशमलव स्थान।

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // परिशुद्धता (कुल अंक)
  scale?: number;      // दशमलव स्थान
}
```

**उदाहरण**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'राशि',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### बूलियन प्रकार

### `type: 'boolean'` - बूलियन फ़ील्ड

- **विवरण**: सत्य/असत्य मानों को स्टोर करने के लिए उपयोग किया जाता है, आमतौर पर ऑन/ऑफ स्थितियों के लिए।
- **डेटाबेस प्रकार**: `BOOLEAN` या `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**उदाहरण**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'सक्रिय है',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - रेडियो फ़ील्ड

- **विवरण**: एकल चयनित मान को स्टोर करने के लिए उपयोग किया जाता है, आमतौर पर बाइनरी विकल्पों के लिए।
- **डेटाबेस प्रकार**: `BOOLEAN` या `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**उदाहरण**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'डिफ़ॉल्ट है',
  defaultValue: false,
  allowNull: false
}
```

### दिनांक और समय प्रकार

### `type: 'date'` - दिनांक फ़ील्ड

- **विवरण**: समय की जानकारी के बिना दिनांक डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `DATE`
- **विशिष्ट गुण**:
  - `timezone`: क्या टाइमज़ोन जानकारी शामिल करनी है।

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // क्या टाइमज़ोन जानकारी शामिल करनी है
}
```

**उदाहरण**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'जन्मदिन',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - समय फ़ील्ड

- **विवरण**: दिनांक जानकारी के बिना समय डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `TIME`
- **विशिष्ट गुण**:
  - `timezone`: क्या टाइमज़ोन जानकारी शामिल करनी है।

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'प्रारंभ समय',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - टाइमज़ोन के साथ दिनांक-समय फ़ील्ड

- **विवरण**: टाइमज़ोन जानकारी के साथ दिनांक और समय डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `TIMESTAMP WITH TIME ZONE`
- **विशिष्ट गुण**:
  - `timezone`: क्या टाइमज़ोन जानकारी शामिल करनी है।

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'बनाने का समय',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - टाइमज़ोन के बिना दिनांक-समय फ़ील्ड

- **विवरण**: टाइमज़ोन जानकारी के बिना दिनांक और समय डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `TIMESTAMP` या `DATETIME`
- **विशिष्ट गुण**:
  - `timezone`: क्या टाइमज़ोन जानकारी शामिल करनी है।

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'अपडेट करने का समय',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - केवल दिनांक फ़ील्ड

- **विवरण**: केवल दिनांक वाली डेटा को स्टोर करने के लिए उपयोग किया जाता है, जिसमें समय नहीं होता।
- **डेटाबेस प्रकार**: `DATE`
- **उदाहरण**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'प्रकाशन दिनांक',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - यूनिक्स टाइमस्टैम्प फ़ील्ड

- **विवरण**: यूनिक्स टाइमस्टैम्प डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `BIGINT`
- **विशिष्ट गुण**:
  - `epoch`: युग का समय।

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // युग का समय
}
```

**उदाहरण**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'अंतिम लॉगिन समय',
  allowNull: true,
  epoch: 0
}
```

### JSON प्रकार

### `type: 'json'` - JSON फ़ील्ड

- **विवरण**: JSON प्रारूप में डेटा को स्टोर करने के लिए उपयोग किया जाता है, जो जटिल डेटा संरचनाओं का समर्थन करता है।
- **डेटाबेस प्रकार**: `JSON` या `TEXT`
- **उदाहरण**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'मेटाडेटा',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB फ़ील्ड

- **विवरण**: JSONB प्रारूप में डेटा को स्टोर करने के लिए उपयोग किया जाता है (PostgreSQL-विशिष्ट), जो इंडेक्सिंग और क्वेरींग का समर्थन करता है।
- **डेटाबेस प्रकार**: `JSONB` (PostgreSQL)
- **उदाहरण**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'कॉन्फ़िगरेशन',
  allowNull: true,
  defaultValue: {}
}
```

### ऐरे प्रकार

### `type: 'array'` - ऐरे फ़ील्ड

- **विवरण**: ऐरे डेटा को स्टोर करने के लिए उपयोग किया जाता है, जो विभिन्न तत्व प्रकारों का समर्थन करता है।
- **डेटाबेस प्रकार**: `JSON` या `ARRAY`
- **विशिष्ट गुण**:
  - `dataType`: स्टोरेज प्रकार (`json`/`array`)।
  - `elementType`: तत्व प्रकार (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)।

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // स्टोरेज प्रकार
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // तत्व प्रकार
}
```

**उदाहरण**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'टैग',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - सेट फ़ील्ड

- **विवरण**: सेट डेटा को स्टोर करने के लिए उपयोग किया जाता है, जो ऐरे के समान है लेकिन इसमें अद्वितीयता की बाधा होती है।
- **डेटाबेस प्रकार**: `JSON` या `ARRAY`
- **विशिष्ट गुण**:
  - `dataType`: स्टोरेज प्रकार (`json`/`array`)।
  - `elementType`: तत्व प्रकार (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)।

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**उदाहरण**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'श्रेणियाँ',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### पहचानकर्ता प्रकार

### `type: 'uuid'` - UUID फ़ील्ड

- **विवरण**: UUID प्रारूप में अद्वितीय पहचानकर्ताओं को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `UUID` या `VARCHAR(36)`
- **विशिष्ट गुण**:
  - `autoFill`: मान को स्वचालित रूप से भरता है।

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // स्वचालित रूप से भरें
}
```

**उदाहरण**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - नैनोइड फ़ील्ड

- **विवरण**: नैनोइड प्रारूप में छोटे अद्वितीय पहचानकर्ताओं को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `VARCHAR`
- **विशिष्ट गुण**:
  - `size`: ID की लंबाई।
  - `customAlphabet`: कस्टम वर्ण सेट।
  - `autoFill`: मान को स्वचालित रूप से भरता है।

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID लंबाई
  customAlphabet?: string;  // कस्टम वर्ण सेट
  autoFill?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'लघु ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - कस्टम UID फ़ील्ड

- **विवरण**: कस्टम प्रारूप में अद्वितीय पहचानकर्ताओं को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `VARCHAR`
- **विशिष्ट गुण**:
  - `prefix`: पहचानकर्ता के लिए एक उपसर्ग।
  - `pattern`: एक सत्यापन पैटर्न।

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // उपसर्ग
  pattern?: string; // सत्यापन पैटर्न
}
```

**उदाहरण**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'कोड',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - स्नोफ्लेक ID फ़ील्ड

- **विवरण**: स्नोफ्लेक एल्गोरिथम द्वारा जनरेट किए गए अद्वितीय पहचानकर्ताओं को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `BIGINT`
- **उदाहरण**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'स्नोफ्लेक ID',
  allowNull: false,
  unique: true
}
```

### कार्यात्मक फ़ील्ड

### `type: 'password'` - पासवर्ड फ़ील्ड

- **विवरण**: एन्क्रिप्टेड पासवर्ड डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `VARCHAR`
- **विशिष्ट गुण**:
  - `length`: हैश लंबाई।
  - `randomBytesSize`: रैंडम बाइट्स का आकार।

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // हैश लंबाई
  randomBytesSize?: number;  // रैंडम बाइट्स का आकार
}
```

**उदाहरण**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'पासवर्ड',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - एन्क्रिप्शन फ़ील्ड

- **विवरण**: एन्क्रिप्टेड संवेदनशील डेटा को स्टोर करने के लिए उपयोग किया जाता है।
- **डेटाबेस प्रकार**: `VARCHAR`
- **उदाहरण**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'गुप्त',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - वर्चुअल फ़ील्ड

- **विवरण**: गणना किए गए वर्चुअल डेटा को स्टोर करने के लिए उपयोग किया जाता है जो डेटाबेस में संग्रहीत नहीं होता है।
- **डेटाबेस प्रकार**: कोई नहीं (वर्चुअल फ़ील्ड)
- **उदाहरण**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'पूरा नाम'
}
```

### `type: 'context'` - संदर्भ फ़ील्ड

- **विवरण**: रनटाइम संदर्भ से डेटा पढ़ने के लिए उपयोग किया जाता है (उदाहरण के लिए, वर्तमान उपयोगकर्ता जानकारी)।
- **डेटाबेस प्रकार**: `dataType` द्वारा निर्धारित।
- **विशिष्ट गुण**:
  - `dataIndex`: डेटा इंडेक्स पथ।
  - `dataType`: डेटा प्रकार।
  - `createOnly`: केवल निर्माण पर सेट करें।

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // डेटा इंडेक्स पथ
  dataType?: string;   // डेटा प्रकार
  createOnly?: boolean; // केवल निर्माण पर सेट करें
}
```

**उदाहरण**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'वर्तमान उपयोगकर्ता ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### संबंध फ़ील्ड

### `type: 'belongsTo'` - संबंधित संबंध

- **विवरण**: कई-से-एक संबंध का प्रतिनिधित्व करता है, जहाँ वर्तमान रिकॉर्ड किसी अन्य रिकॉर्ड से संबंधित होता है।
- **डेटाबेस प्रकार**: विदेशी कुंजी फ़ील्ड
- **विशिष्ट गुण**:
  - `target`: लक्ष्य संग्रह नाम।
  - `foreignKey`: विदेशी कुंजी फ़ील्ड नाम।
  - `targetKey`: लक्ष्य संग्रह में लक्ष्य कुंजी फ़ील्ड नाम।
  - `onDelete`: हटाने पर कैस्केड क्रिया।
  - `onUpdate`: अपडेट करने पर कैस्केड क्रिया।
  - `constraints`: क्या विदेशी कुंजी बाधाओं को सक्षम करना है।

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // लक्ष्य संग्रह नाम
  foreignKey?: string;  // विदेशी कुंजी फ़ील्ड नाम
  targetKey?: string;   // लक्ष्य संग्रह में लक्ष्य कुंजी फ़ील्ड नाम
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // क्या विदेशी कुंजी बाधाओं को सक्षम करना है
}
```

**उदाहरण**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'लेखक',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - एक संबंध है

- **विवरण**: एक-से-एक संबंध का प्रतिनिधित्व करता है, जहाँ वर्तमान रिकॉर्ड का एक संबंधित रिकॉर्ड होता है।
- **डेटाबेस प्रकार**: विदेशी कुंजी फ़ील्ड
- **विशिष्ट गुण**:
  - `target`: लक्ष्य संग्रह नाम।
  - `foreignKey`: विदेशी कुंजी फ़ील्ड नाम।
  - `sourceKey`: स्रोत संग्रह में स्रोत कुंजी फ़ील्ड नाम।
  - `onDelete`: हटाने पर कैस्केड क्रिया।
  - `onUpdate`: अपडेट करने पर कैस्केड क्रिया।
  - `constraints`: क्या विदेशी कुंजी बाधाओं को सक्षम करना है।

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // स्रोत कुंजी फ़ील्ड नाम
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'उपयोगकर्ता प्रोफ़ाइल',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - कई संबंध हैं

- **विवरण**: एक-से-कई संबंध का प्रतिनिधित्व करता है, जहाँ वर्तमान रिकॉर्ड के कई संबंधित रिकॉर्ड होते हैं।
- **डेटाबेस प्रकार**: विदेशी कुंजी फ़ील्ड
- **विशिष्ट गुण**:
  - `target`: लक्ष्य संग्रह नाम।
  - `foreignKey`: विदेशी कुंजी फ़ील्ड नाम।
  - `sourceKey`: स्रोत संग्रह में स्रोत कुंजी फ़ील्ड नाम।
  - `sortBy`: सॉर्टिंग फ़ील्ड।
  - `sortable`: क्या फ़ील्ड सॉर्ट करने योग्य है।
  - `onDelete`: हटाने पर कैस्केड क्रिया।
  - `onUpdate`: अपडेट करने पर कैस्केड क्रिया।
  - `constraints`: क्या विदेशी कुंजी बाधाओं को सक्षम करना है।

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // सॉर्टिंग फ़ील्ड
  sortable?: boolean; // क्या सॉर्ट करने योग्य है
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**उदाहरण**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'पोस्ट',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - कई-से-कई संबंध

- **विवरण**: कई-से-कई संबंध का प्रतिनिधित्व करता है, जो एक जंक्शन तालिका के माध्यम से दो संग्रहों को जोड़ता है।
- **डेटाबेस प्रकार**: जंक्शन तालिका
- **विशिष्ट गुण**:
  - `target`: लक्ष्य संग्रह नाम।
  - `through`: जंक्शन तालिका नाम।
  - `foreignKey`: विदेशी कुंजी फ़ील्ड नाम।
  - `otherKey`: जंक्शन तालिका में दूसरी विदेशी कुंजी।
  - `sourceKey`: स्रोत संग्रह में स्रोत कुंजी फ़ील्ड नाम।
  - `targetKey`: लक्ष्य संग्रह में लक्ष्य कुंजी फ़ील्ड नाम।
  - `onDelete`: हटाने पर कैस्केड क्रिया।
  - `onUpdate`: अपडेट करने पर कैस्केड क्रिया।
  - `constraints`: क्या विदेशी कुंजी बाधाओं को सक्षम करना है।

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // जंक्शन तालिका नाम
  foreignKey?: string;
  otherKey?: string;  // जंक्शन तालिका में दूसरी विदेशी कुंजी
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**उदाहरण**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'टैग',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```