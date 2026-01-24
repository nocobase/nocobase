:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розширення синхронізованих джерел даних

## Огляд

NocoBase дозволяє розширювати типи джерел даних для синхронізації користувацьких даних за потреби.

## Сторона сервера

### Інтерфейс джерела даних

Вбудований плагін синхронізації користувацьких даних забезпечує реєстрацію та керування типами джерел даних. Щоб розширити тип джерела даних, вам потрібно успадкувати абстрактний клас `SyncSource`, наданий плагіном, та реалізувати відповідні стандартні інтерфейси.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Клас `SyncSource` містить властивість `options` для отримання користувацьких конфігурацій джерела даних.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### Опис полів `UserData`

| Поле         | Опис                                         |
| ------------ | -------------------------------------------- |
| `dataType`   | Тип даних, можливі значення `user` та `department` |
| `uniqueKey`  | Поле унікального ідентифікатора              |
| `records`    | Записи даних                                 |
| `sourceName` | Назва джерела даних                          |

Якщо `dataType` має значення `user`, поле `records` містить такі поля:

| Поле          | Опис                  |
| ------------- | --------------------- |
| `id`          | ID користувача        |
| `nickname`    | Псевдонім користувача |
| `avatar`      | Аватар користувача    |
| `email`       | Електронна пошта      |
| `phone`       | Номер телефону        |
| `departments` | Масив ID відділів     |

Якщо `dataType` має значення `department`, поле `records` містить такі поля:

| Поле       | Опис                 |
| ---------- | -------------------- |
| `id`       | ID відділу           |
| `name`     | Назва відділу        |
| `parentId` | ID батьківського відділу |

### Приклад реалізації інтерфейсу джерела даних

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### Реєстрація типу джерела даних

Розширене джерело даних необхідно зареєструвати в модулі керування даними.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Сторона клієнта

Клієнтський інтерфейс користувача реєструє типи джерел даних за допомогою методу `registerType`, який надається клієнтським інтерфейсом плагіна синхронізації користувацьких даних:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Форма керування бекендом
      },
    });
  }
}
```

### Форма керування бекендом

![](https://static-docs.nocobase.com/202412041429835.png)

Верхня частина надає загальні налаштування джерела даних, тоді як нижня частина дозволяє реєструвати користувацькі форми конфігурації.