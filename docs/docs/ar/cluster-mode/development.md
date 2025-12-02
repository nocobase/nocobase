:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تطوير الإضافات

## المشكلة الأساسية

في بيئة العقدة الواحدة، يمكن للإضافات عادةً تلبية المتطلبات من خلال الحالة الداخلية للعملية، الأحداث، أو المهام. ولكن في وضع المجموعات (cluster)، قد تعمل الإضافة نفسها على عدة نُسخ في وقت واحد، مما يواجه المشكلات النموذجية التالية:

- **اتساق الحالة**: إذا تم تخزين بيانات التكوين أو بيانات وقت التشغيل في الذاكرة فقط، يصبح من الصعب مزامنتها بين النُسخ، مما قد يؤدي إلى قراءات غير صحيحة أو تنفيذ مكرر.
- **جدولة المهام**: بدون آلية واضحة للتصنيف والتأكيد، يمكن أن تُنفذ المهام طويلة الأمد بشكل متزامن بواسطة عدة نُسخ.
- **شروط التنافس**: عند التعامل مع تغييرات المخطط (schema) أو تخصيص الموارد، تتطلب العمليات التسلسل لتجنب التعارضات الناتجة عن عمليات الكتابة المتزامنة.

يوفر جوهر NocoBase واجهات برمجية وسيطة متعددة على مستوى التطبيق لمساعدة الإضافات على إعادة استخدام القدرات الموحدة في بيئة المجموعات. ستتناول الأقسام التالية استخدام أفضل الممارسات للتخزين المؤقت (caching)، والرسائل المتزامنة، وقوائم انتظار الرسائل، والأقفال الموزعة، مع الإشارة إلى الشيفرة المصدرية.

## الحلول

### مكون التخزين المؤقت (Cache)

للبيانات التي تحتاج إلى التخزين في الذاكرة، يُنصح باستخدام مكون التخزين المؤقت المدمج في النظام لإدارتها.

- احصل على نسخة التخزين المؤقت الافتراضية عبر `app.cache`.
- يوفر `Cache` عمليات أساسية مثل `set/get/del/reset`، ويدعم أيضًا `wrap` و `wrapWithCondition` لتغليف منطق التخزين المؤقت، بالإضافة إلى طرق الدفعات مثل `mset/mget/mdel`.
- عند النشر في مجموعة، يُنصح بوضع البيانات المشتركة في تخزين دائم (مثل Redis) وتعيين `ttl` مناسب لمنع فقدان التخزين المؤقت عند إعادة تشغيل النُسخ.

مثال: [تهيئة التخزين المؤقت واستخدامه في `إضافة-المصادقة` (`plugin-auth`)](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="إنشاء واستخدام ذاكرة تخزين مؤقت في إضافة"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### مدير الرسائل المتزامنة (SyncMessageManager)

إذا تعذر إدارة الحالة الموجودة في الذاكرة باستخدام تخزين مؤقت موزع (على سبيل المثال، لا يمكن تسلسلها)، فعندما تتغير الحالة بسبب إجراءات المستخدم، يجب بث التغيير إلى نُسخ أخرى عبر إشارة متزامنة للحفاظ على اتساق الحالة.

- لقد طبق الصنف الأساسي للإضافة `sendSyncMessage`، والذي يستدعي داخليًا `app.syncMessageManager.publish` ويضيف تلقائيًا بادئة على مستوى التطبيق للقناة لتجنب التعارضات.
- يمكن لـ `publish` تحديد `transaction`، وسيتم إرسال الرسالة بعد التزام معاملة قاعدة البيانات، مما يضمن مزامنة الحالة والرسالة.
- استخدم `handleSyncMessage` لمعالجة الرسائل الواردة من نُسخ أخرى. الاشتراك خلال مرحلة `beforeLoad` مناسب جدًا لسيناريوهات مثل تغييرات التكوين ومزامنة المخطط (Schema).

مثال: [`إضافة-مصدر-البيانات-الرئيسي` (`plugin-data-source-main`) تستخدم الرسائل المتزامنة للحفاظ على اتساق المخطط (schema) عبر عقد متعددة](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="مزامنة تحديثات المخطط (Schema) داخل إضافة"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automatically calls app.syncMessageManager.publish
  }
}
```

### مدير نشر/اشتراك الرسائل (PubSubManager)

يُعد بث الرسائل المكون الأساسي للإشارات المتزامنة ويمكن استخدامه مباشرةً. عندما تحتاج إلى بث رسائل بين النُسخ، يمكنك استخدام هذا المكون.

- يمكن استخدام `app.pubSubManager.subscribe(channel, handler, { debounce })` للاشتراك في قناة عبر النُسخ؛ يُستخدم خيار `debounce` لمنع الاستدعاءات المتكررة الناتجة عن البث المتكرر.
- يدعم `publish` خياري `skipSelf` (الافتراضي هو true) و `onlySelf` للتحكم فيما إذا كانت الرسالة ستُعاد إرسالها إلى النسخة الحالية.
- يجب تكوين محول (مثل Redis، RabbitMQ، إلخ) قبل بدء تشغيل التطبيق؛ وإلا، فلن يتصل بنظام رسائل خارجي افتراضيًا.

مثال: [`إضافة-مدير-المهام-غير-المتزامنة` (`plugin-async-task-manager`) تستخدم PubSub لبث أحداث إلغاء المهام](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="بث إشارة إلغاء المهمة"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### مكون قائمة انتظار الأحداث (EventQueue)

تُستخدم قائمة انتظار الرسائل لجدولة المهام غير المتزامنة، وهي مناسبة للتعامل مع العمليات طويلة الأمد أو التي يمكن إعادة محاولتها.

- أعلن عن مستهلك باستخدام `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. تعيد `process` كائن `Promise`، ويمكنك استخدام `AbortSignal.timeout` للتحكم في المهلة.
- يضيف `publish` تلقائيًا بادئة اسم التطبيق ويدعم خيارات مثل `timeout` و `maxRetries`. وهو يتكيف افتراضيًا مع قائمة انتظار في الذاكرة، ولكن يمكن التبديل إلى محولات موسعة مثل RabbitMQ حسب الحاجة.
- في المجموعة، تأكد من أن جميع العقد تستخدم نفس المحول لتجنب تجزئة المهام بين العقد.

مثال: [`إضافة-مدير-المهام-غير-المتزامنة` (`plugin-async-task-manager`) تستخدم EventQueue لجدولة المهام](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="توزيع المهام غير المتزامنة في قائمة انتظار"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### مدير الأقفال الموزعة (LockManager)

عندما تحتاج إلى تجنب شروط التنافس، يمكنك استخدام قفل موزع لتسلسل الوصول إلى مورد ما.

- يوفر افتراضيًا محول `local` المستند إلى العملية، ويمكن تسجيل تطبيقات موزعة مثل Redis؛ استخدم `app.lockManager.runExclusive(key, fn, ttl)` أو `acquire`/`tryAcquire` للتحكم في التزامن.
- يُستخدم `ttl` كضمان لتحرير القفل، مما يمنع احتجازه إلى أجل غير مسمى في الحالات الاستثنائية.
- تشمل السيناريوهات الشائعة: تغييرات المخطط (Schema)، ومنع المهام المكررة، وتحديد معدل الطلبات (rate limiting)، وما إلى ذلك.

مثال: [`إضافة-مصدر-البيانات-الرئيسي` (`plugin-data-source-main`) تستخدم قفلًا موزعًا لحماية عملية حذف الحقول](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="تسلسل عملية حذف الحقل"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## توصيات التطوير

- **اتساق حالة الذاكرة**: حاول تجنب استخدام حالة الذاكرة أثناء التطوير. بدلًا من ذلك، استخدم التخزين المؤقت أو الرسائل المتزامنة للحفاظ على اتساق الحالة.
- **إعطاء الأولوية لإعادة استخدام الواجهات المدمجة**: استخدم قدرات موحدة مثل `app.cache` و `app.syncMessageManager` لتجنب إعادة تنفيذ منطق الاتصال عبر العقد في الإضافات.
- **الانتباه إلى حدود المعاملات**: يجب أن تستخدم العمليات التي تتضمن معاملات `transaction.afterCommit` (وهو مدمج في `syncMessageManager.publish`) لضمان اتساق البيانات والرسائل.
- **وضع استراتيجية تراجع**: بالنسبة لمهام قائمة الانتظار والبث، قم بتعيين قيم معقولة لـ `timeout` و `maxRetries` و `debounce` لمنع حدوث ذروات حركة مرور جديدة في الحالات الاستثنائية.
- **المراقبة والتسجيل المصاحبان**: استفد جيدًا من سجلات التطبيق لتسجيل معلومات مثل أسماء القنوات، وحمولات الرسائل، ومفاتيح الأقفال، وما إلى ذلك، لتسهيل استكشاف المشكلات المتقطعة في المجموعة.

من خلال هذه القدرات، يمكن للإضافات مشاركة الحالة بأمان، ومزامنة التكوينات، وجدولة المهام عبر نُسخ مختلفة، مما يلبي متطلبات الاستقرار والاتساق في سيناريوهات نشر المجموعات.