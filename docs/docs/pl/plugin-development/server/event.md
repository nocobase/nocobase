:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zdarzenia

Serwer NocoBase wyzwala odpowiednie zdarzenia podczas cyklu życia aplikacji, cyklu życia wtyczek oraz operacji na bazie danych. Deweloperzy wtyczek mogą nasłuchiwać tych zdarzeń, aby implementować logikę rozszerzeń, automatyzować operacje lub tworzyć niestandardowe zachowania.

System zdarzeń NocoBase dzieli się głównie na dwa poziomy:

- **`app.on()` - Zdarzenia na poziomie aplikacji**: Służą do nasłuchiwania zdarzeń cyklu życia aplikacji, takich jak uruchomienie, instalacja, włączanie wtyczek itp.
- **`db.on()` - Zdarzenia na poziomie bazy danych**: Służą do nasłuchiwania zdarzeń operacji na poziomie modelu danych, takich jak tworzenie, aktualizacja, usuwanie rekordów itp.

Oba typy zdarzeń dziedziczą po `EventEmitter` z Node.js, obsługując standardowe interfejsy `.on()`, `.off()` i `.emit()`. NocoBase dodatkowo rozszerza wsparcie o `emitAsync`, służące do asynchronicznego wyzwalania zdarzeń i oczekiwania na zakończenie wykonania wszystkich nasłuchujących.

## Gdzie rejestrować nasłuchujące zdarzeń

Nasłuchujące zdarzeń powinny być zazwyczaj rejestrowane w metodzie `beforeLoad()` wtyczki. Gwarantuje to, że zdarzenia są gotowe już na etapie ładowania wtyczki, a późniejsza logika może na nie prawidłowo reagować.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Nasłuchiwanie zdarzeń aplikacji
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase zostało uruchomione');
    });

    // Nasłuchiwanie zdarzeń bazy danych
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nowy wpis: ${model.get('title')}`);
      }
    });
  }
}
```

## Nasłuchiwanie zdarzeń aplikacji `app.on()`

Zdarzenia aplikacji służą do przechwytywania zmian w cyklu życia aplikacji NocoBase oraz wtyczek. Są one odpowiednie do implementacji logiki inicjalizacyjnej, rejestracji zasobów czy wykrywania zależności wtyczek.

### Typowe zdarzenia

| Nazwa zdarzenia                  | Moment wyzwolenia                 | Typowe zastosowania                               |
| -------------------------------- | --------------------------------- | ------------------------------------------------- |
| `beforeLoad` / `afterLoad`       | Przed / po załadowaniu aplikacji  | Rejestracja zasobów, inicjalizacja konfiguracji   |
| `beforeStart` / `afterStart`     | Przed / po uruchomieniu serwisu   | Uruchamianie zadań, logowanie startu              |
| `beforeInstall` / `afterInstall` | Przed / po instalacji aplikacji   | Inicjalizacja danych, import szablonów            |
| `beforeStop` / `afterStop`       | Przed / po zatrzymaniu serwisu    | Czyszczenie zasobów, zapisywanie stanu            |
| `beforeDestroy` / `afterDestroy` | Przed / po zniszczeniu aplikacji  | Usuwanie pamięci podręcznej, rozłączanie połączeń |
| `beforeLoadPlugin` / `afterLoadPlugin` | Przed / po załadowaniu wtyczki    | Modyfikacja konfiguracji wtyczki lub rozszerzanie funkcjonalności |
| `beforeEnablePlugin` / `afterEnablePlugin` | Przed / po włączeniu wtyczki      | Sprawdzanie zależności, inicjalizacja logiki wtyczki |
| `beforeDisablePlugin` / `afterDisablePlugin` | Przed / po wyłączeniu wtyczki     | Czyszczenie zasobów wtyczki                       |
| `afterUpgrade`                   | Po zakończeniu aktualizacji aplikacji | Wykonywanie migracji danych lub napraw kompatybilności |

Przykład: Nasłuchiwanie zdarzenia uruchomienia aplikacji

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Serwis NocoBase został uruchomiony!');
});
```

Przykład: Nasłuchiwanie zdarzenia załadowania wtyczki

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Wtyczka ${plugin.name} została załadowana`);
});
```

## Nasłuchiwanie zdarzeń bazy danych `db.on()`

Zdarzenia bazy danych umożliwiają przechwytywanie różnych zmian danych na poziomie modelu. Są one odpowiednie do operacji takich jak audyt, synchronizacja czy automatyczne uzupełnianie.

### Typowe zdarzenia

| Nazwa zdarzenia                                     | Moment wyzwolenia                                 |
| --------------------------------------------------- | ------------------------------------------------- |
| `beforeSync` / `afterSync`                          | Przed / po synchronizacji struktury bazy danych   |
| `beforeValidate` / `afterValidate`                  | Przed / po walidacji danych                       |
| `beforeCreate` / `afterCreate`                      | Przed / po utworzeniu rekordu                     |
| `beforeUpdate` / `afterUpdate`                      | Przed / po aktualizacji rekordu                   |
| `beforeSave` / `afterSave`                          | Przed / po zapisie (obejmuje tworzenie i aktualizację) |
| `beforeDestroy` / `afterDestroy`                    | Przed / po usunięciu rekordu                      |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Po operacjach obejmujących dane powiązane         |
| `beforeDefineCollection` / `afterDefineCollection`  | Przed / po zdefiniowaniu kolekcji                 |
| `beforeRemoveCollection` / `afterRemoveCollection`  | Przed / po usunięciu kolekcji                     |

Przykład: Nasłuchiwanie zdarzenia po utworzeniu danych

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Dane zostały utworzone!');
});
```

Przykład: Nasłuchiwanie zdarzenia przed aktualizacją danych

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Dane zostaną zaktualizowane!');
});
```