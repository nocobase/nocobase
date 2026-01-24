:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Migracje

Podczas tworzenia i aktualizowania wtyczek NocoBase, struktura bazy danych lub konfiguracja wtyczki może ulec niekompatybilnym zmianom. Aby zapewnić płynne aktualizacje, NocoBase oferuje mechanizm **migracji**, który pozwala zarządzać tymi zmianami poprzez tworzenie plików migracji. W tym artykule przedstawimy Państwu systematyczne podejście do korzystania z migracji i ich procesu tworzenia.

## Koncepcja migracji

Migracja to skrypt, który jest automatycznie wykonywany podczas aktualizacji wtyczki, służący do rozwiązywania następujących problemów:

-   Dostosowania struktury tabel danych (np. dodawanie pól, modyfikacja typów pól).
-   Migracja danych (np. masowa aktualizacja wartości pól).
-   Aktualizacje konfiguracji wtyczki lub logiki wewnętrznej.

Czas wykonania migracji dzieli się na trzy kategorie:

| Typ        | Moment wyzwolenia                                                                 | Scenariusz wykonania |
| :--------- | :-------------------------------------------------------------------------------- | :------------------- |
| `beforeLoad` | Przed załadowaniem wszystkich konfiguracji wtyczek                                |                      |
| `afterSync`  | Po synchronizacji konfiguracji kolekcji z bazą danych (struktura kolekcji została już zmieniona) |                      |
| `afterLoad`  | Po załadowaniu wszystkich konfiguracji wtyczek                                    |                      |

## Tworzenie plików migracji

Pliki migracji powinny znajdować się w katalogu wtyczki, w ścieżce `src/server/migrations/*.ts`. NocoBase udostępnia polecenie `create-migration` do szybkiego generowania plików migracji.

```bash
yarn nocobase create-migration [options] <name>
```

Parametry opcjonalne

| Parametr      | Opis                                                                 |
| :------------ | :------------------------------------------------------------------- |
| `--pkg <pkg>` | Określa nazwę pakietu wtyczki                                        |
| `--on [on]`   | Określa moment wykonania; dostępne opcje: `beforeLoad`, `afterSync`, `afterLoad` |

Przykład

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Wygenerowana ścieżka pliku migracji wygląda następująco:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Początkowa zawartość pliku:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Tutaj proszę napisać logikę aktualizacji
  }
}
```

> ⚠️ `appVersion` służy do identyfikacji wersji, której dotyczy aktualizacja. Migracja zostanie wykonana w środowiskach o wersji niższej niż określona.

## Pisanie migracji

W plikach migracji mogą Państwo uzyskać dostęp do następujących często używanych właściwości i API za pośrednictwem `this`, co ułatwia operowanie na bazie danych, wtyczkach i instancjach aplikacji:

Często używane właściwości

-   **`this.app`**  
    Bieżąca instancja aplikacji NocoBase. Może być używana do dostępu do globalnych usług, wtyczek lub konfiguracji.  
    ```ts
    const config = this.app.config.get('database');
    ```

-   **`this.db`**  
    Instancja usługi bazy danych, udostępniająca interfejsy do operowania na modelach (kolekcjach).  
    ```ts
    const users = await this.db.getRepository('users').findAll();
    ```

-   **`this.plugin`**  
    Bieżąca instancja wtyczki, może być używana do dostępu do niestandardowych metod wtyczki.  
    ```ts
    const settings = this.plugin.customMethod();
    ```

-   **`this.sequelize`**  
    Instancja Sequelize, umożliwiająca bezpośrednie wykonywanie surowych zapytań SQL lub operacji transakcyjnych.  
    ```ts
    await this.sequelize.transaction(async (transaction) => {
      await this.sequelize.query('UPDATE users SET active = 1', { transaction });
    });
    ```

-   **`this.queryInterface`**  
    QueryInterface Sequelize, często używany do modyfikowania struktur tabel, np. dodawania pól, usuwania tabel itp.  
    ```ts
    await this.queryInterface.addColumn('users', 'age', {
      type: this.sequelize.Sequelize.INTEGER,
      allowNull: true,
    });
    ```

Przykład pisania migracji

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Użycie queryInterface do dodania pola
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Użycie db do dostępu do modeli danych
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Wykonanie niestandardowej metody wtyczki
    await this.plugin.customMethod();
  }
}
```

Oprócz wymienionych powyżej często używanych właściwości, migracje oferują również bogate API. Szczegółową dokumentację znajdą Państwo w [API migracji](/api/server/migration).

## Wyzwalanie migracji

Wykonanie migracji jest wyzwalane przez polecenie `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Podczas aktualizacji system określa kolejność wykonania na podstawie typu migracji i `appVersion`.

## Testowanie migracji

Podczas tworzenia wtyczek zaleca się użycie **Mock Servera** do testowania, czy migracja wykonuje się poprawnie, aby uniknąć uszkodzenia rzeczywistych danych.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nazwa wtyczki
      version: '0.18.0-alpha.5', // Wersja przed aktualizacją
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Proszę napisać logikę weryfikacji, np. sprawdzenie, czy pole istnieje, czy migracja danych zakończyła się sukcesem
  });
});
```

> Wskazówka: Użycie Mock Servera pozwala szybko symulować scenariusze aktualizacji oraz weryfikować kolejność wykonania migracji i zmiany danych.

## Zalecenia dotyczące praktyk deweloperskich

1.  **Dzielenie migracji**  
    W miarę możliwości, dla każdej aktualizacji należy generować jeden plik migracji, aby zachować atomowość i ułatwić rozwiązywanie problemów.
2.  **Określanie momentu wykonania**  
    Wybieraj `beforeLoad`, `afterSync` lub `afterLoad` w zależności od obiektu operacji, aby uniknąć zależności od niezładowanych modułów.
3.  **Kontrola wersji**  
    Używaj `appVersion` do jednoznacznego określania wersji, dla której migracja jest przeznaczona, aby zapobiec jej wielokrotnemu wykonaniu.
4.  **Pokrycie testami**  
    Po zweryfikowaniu migracji na Mock Serverze, należy wykonać aktualizację w rzeczywistym środowisku.