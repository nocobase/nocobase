:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# AuditManager

## Genel Bakış

`AuditManager`, NocoBase'de denetlenmesi gereken kaynak arayüzlerini kaydetmek için kullanılan kaynak denetim yönetim modülüdür.

### Temel Kullanım

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Sınıf Metotları

### `setLogger()`

Denetim günlüklerinin çıktı yöntemini ayarlar.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### İmza

- `setLogger(logger: AuditLogger)`

#### Tip

```ts
export interface AuditLog {
  uuid: string;
  dataSource: string;
  resource: string;
  action: string;
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
  userId: string;
  roleName: string;
  ip: string;
  ua: string;
  status: number;
  metadata?: Record<string, any>;
}

export interface AuditLogger {
  log(auditLog: AuditLog): Promise<void>;
}
```

### `registerAction()`

Denetlenecek bir kaynak eylemini kaydeder.

#### İmza

- `registerAction(action: Action)`

#### Tip

```ts
export interface UserInfo {
  userId?: string;
  roleName?: string;
}

export interface SourceAndTarget {
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
}

type Action =
  | string
  | {
      name: string;
      getMetaData?: (ctx: Context) => Promise<Record<string, any>>;
      getUserInfo?: (ctx: Context) => Promise<UserInfo>;
      getSourceAndTarget?: (ctx: Context) => Promise<SourceAndTarget>;
    };
```

#### Detaylar

Birkaç farklı yazım şekli desteklenmektedir:

1. Tüm kaynaklar için geçerlidir

```ts
registerActions(['create']);
```

2. Belirli bir kaynağın tüm eylemleri için geçerlidir `resource:*`

```ts
registerActions(['app:*']);
```

3. Belirli bir kaynağın belirli bir eylemi için geçerlidir `resource:action`

```ts
registerAction(['pm:update']);
```

4. Eylem için özel `getMetaData`, `getUserInfo` ve `getSourceAndTarget` metotlarının geçirilmesini destekler

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Kaydedilen arayüzler çakıştığında, daha spesifik kayıt yöntemi daha yüksek önceliğe sahiptir. Örneğin:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

`user:create` arayüzü için `3` numaralı kayıt geçerli olacaktır.

### `registerActions()`

Denetlenecek birden fazla kaynak eylemini kaydeder.

#### İmza

- `registerActions(actions: Action[])`