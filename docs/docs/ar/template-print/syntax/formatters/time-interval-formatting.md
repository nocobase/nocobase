:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/template-print/syntax/formatters/time-interval-formatting).
:::

### تنسيق الفواصل الزمنية

#### 1. :formatI(patternOut, patternIn)

##### شرح الصيغة
تقوم هذه الدالة بتنسيق المدة أو الفاصل الزمني. تتضمن تنسيقات الإخراج المدعومة ما يلي:
- `human+` أو `human` (مناسبة للعرض بشكل سهل القراءة للبشر)
- وحدات مثل `millisecond(s)`، `second(s)`، `minute(s)`، `hour(s)`، `year(s)`، `month(s)`، `week(s)`، `day(s)` (أو اختصاراتها).

المعلمات:
- `patternOut`: تنسيق الإخراج (على سبيل المثال، `'second'` أو `'human+'`).
- `patternIn`: اختياري، وحدة الإدخال (على سبيل المثال، `'milliseconds'` أو `'s'`).

##### أمثلة
```
2000:formatI('second')       // الناتج 2
2000:formatI('seconds')      // الناتج 2
2000:formatI('s')            // الناتج 2
3600000:formatI('minute')    // الناتج 60
3600000:formatI('hour')      // الناتج 1
2419200000:formatI('days')   // الناتج 28

// عرض سهل القراءة للبشر:
2000:formatI('human')        // الناتج "a few seconds"
2000:formatI('human+')       // الناتج "in a few seconds"
-2000:formatI('human+')      // الناتج "a few seconds ago"

// مثال تحويل الوحدات:
60:formatI('ms', 'minute')   // الناتج 3600000
4:formatI('ms', 'weeks')      // الناتج 2419200000
'P1M':formatI('ms')          // الناتج 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // الناتج 10296.085
```

##### النتيجة
يتم عرض الناتج كمدة أو فاصل زمني مطابق بناءً على قيمة الإدخال وتحويل الوحدة.