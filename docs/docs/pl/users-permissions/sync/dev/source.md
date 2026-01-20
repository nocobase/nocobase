:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie zsynchronizowanych źródeł danych

## Przegląd

NocoBase umożliwia rozszerzanie typów źródeł danych do synchronizacji danych użytkowników, zgodnie z Państwa potrzebami.

## Strona serwera

### Interfejs źródła danych

Wbudowana wtyczka do synchronizacji danych użytkowników zapewnia rejestrację i zarządzanie typami źródeł danych. Aby rozszerzyć typ źródła danych, należy dziedziczyć po abstrakcyjnej klasie `SyncSource` dostarczanej przez wtyczkę i zaimplementować odpowiednie standardowe interfejsy.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Klasa `SyncSource` zawiera właściwość `options`, która służy do pobierania niestandardowych konfiguracji dla źródła danych.

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

### Opis pól `UserData`

| Pole         | Opis                                           |
| ------------ | ---------------------------------------------- |
| `dataType`   | Typ danych, dostępne opcje to `user` i `department` |
| `uniqueKey`  | Pole unikalnego identyfikatora                 |
| `records`    | Rekordy danych                                 |
| `sourceName` | Nazwa źródła danych                            |

Jeśli `dataType` to `user`, pole `records` zawiera następujące pola:

| Pole          | Opis                   |
| ------------- | ---------------------- |
| `id`          | ID użytkownika         |
| `nickname`    | Pseudonim użytkownika  |
| `avatar`      | Awatar użytkownika     |
| `email`       | Adres e-mail           |
| `phone`       | Numer telefonu         |
| `departments` | Tablica ID działów     |

Jeśli `dataType` to `department`, pole `records` zawiera następujące pola:

| Pole       | Opis                 |
| ---------- | -------------------- |
| `id`       | ID działu            |
| `name`     | Nazwa działu         |
| `parentId` | ID działu nadrzędnego |

### Przykład implementacji interfejsu źródła danych

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

### Rejestracja typu źródła danych

Rozszerzone źródło danych musi zostać zarejestrowane w module zarządzania danymi.

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

## Strona klienta

Interfejs użytkownika po stronie klienta rejestruje typy źródeł danych za pomocą metody `registerType` dostarczanej przez interfejs klienta wtyczki do synchronizacji danych użytkowników:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formularz zarządzania panelem administracyjnym
      },
    });
  }
}
```

### Formularz zarządzania panelem administracyjnym

![](https://static-docs.nocobase.com/202412041429835.png)

Górna sekcja zawiera ogólną konfigurację źródła danych, natomiast dolna sekcja umożliwia rejestrację niestandardowych formularzy konfiguracji.