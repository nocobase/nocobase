:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Komendy

W NocoBase komendy służą do wykonywania operacji związanych z aplikacjami lub wtyczkami w wierszu poleceń. Mogą to być na przykład uruchamianie zadań systemowych, wykonywanie migracji lub synchronizacji, inicjowanie konfiguracji, czy też interakcja z działającymi instancjami aplikacji. Deweloperzy mogą definiować własne komendy dla wtyczek i rejestrować je za pomocą obiektu `app`, a następnie wykonywać je w CLI w formie `nocobase <komenda>`.

## Typy komend

W NocoBase rejestracja komend dzieli się na dwa typy:

| Typ                | Metoda rejestracji                      | Czy wtyczka musi być włączona? | Typowe zastosowania                               |
| :----------------- | :-------------------------------------- | :----------------------------- | :------------------------------------------------ |
| Komenda dynamiczna | `app.command()`                         | ✅ Tak                         | Komendy związane z logiką biznesową wtyczki       |
| Komenda statyczna  | `Application.registerStaticCommand()`   | ❌ Nie                         | Komendy instalacyjne, inicjalizacyjne, konserwacyjne |

## Komendy dynamiczne

Aby zdefiniować komendy wtyczki, użyj metody `app.command()`. Komendy te mogą być wykonywane tylko po włączeniu wtyczki. Pliki z definicjami komend należy umieścić w katalogu wtyczki pod ścieżką `src/server/commands/*.ts`.

Przykład

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Opis

- `app.command('echo')`: Definiuje komendę o nazwie `echo`.
- `.option('-v, --version')`: Dodaje opcję do komendy.
- `.action()`: Definiuje logikę wykonania komendy.
- `app.version.get()`: Pobiera aktualną wersję aplikacji.

Wykonanie komendy

```bash
nocobase echo
nocobase echo -v
```

## Komendy statyczne

Aby zarejestrować komendy statyczne, użyj metody `Application.registerStaticCommand()`. Komendy te mogą być wykonywane bez konieczności włączania wtyczek, co czyni je idealnymi do zadań instalacyjnych, inicjalizacyjnych, migracyjnych lub debugowania. Rejestruje się je w metodzie `staticImport()` klasy wtyczki.

Przykład

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Wykonanie komendy

```bash
nocobase echo
nocobase echo --version
```

Opis

- `Application.registerStaticCommand()` rejestruje komendy przed instancjonowaniem aplikacji.
- Komendy statyczne są zazwyczaj używane do wykonywania globalnych zadań, które nie są związane ze stanem aplikacji ani wtyczki.

## API komend

Obiekty komend udostępniają trzy opcjonalne metody pomocnicze, które służą do kontrolowania kontekstu wykonania komendy:

| Metoda    | Cel                                                              | Przykład                               |
| :-------- | :--------------------------------------------------------------- | :------------------------------------- |
| `ipc()`   | Komunikacja z działającymi instancjami aplikacji (za pomocą IPC) | `app.command('reload').ipc().action()` |
| `auth()`  | Weryfikacja poprawności konfiguracji bazy danych                 | `app.command('seed').auth().action()`  |
| `preload()` | Wstępne ładowanie konfiguracji aplikacji (wykonanie `app.load()`) | `app.command('sync').preload().action()` |

Opis konfiguracji

- **`ipc()`**
  Domyślnie komendy są wykonywane w nowej instancji aplikacji.
  Po włączeniu `ipc()` komendy wchodzą w interakcję z aktualnie działającą instancją aplikacji za pośrednictwem komunikacji międzyprocesowej (IPC). Jest to przydatne w przypadku komend do operacji w czasie rzeczywistym (np. odświeżanie pamięci podręcznej, wysyłanie powiadomień).

- **`auth()`**
  Przed wykonaniem komendy sprawdzana jest dostępność konfiguracji bazy danych.
  Jeśli konfiguracja bazy danych jest nieprawidłowa lub połączenie się nie powiedzie, komenda nie będzie kontynuowana. Często używane w zadaniach wymagających zapisu lub odczytu z bazy danych.

- **`preload()`**
  Wstępnie ładuje konfigurację aplikacji przed wykonaniem komendy, co jest równoważne z wykonaniem `app.load()`.
  Nadaje się do komend, które zależą od konfiguracji lub kontekstu wtyczki.

Więcej metod API znajdą Państwo w [AppCommand](/api/server/app-command).

## Typowe przykłady

Inicjalizacja danych domyślnych

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Zainicjowano domyślnego użytkownika admin.');
  });
```

Ponowne ładowanie pamięci podręcznej dla działającej instancji (tryb IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Wysyłanie żądania do działającej aplikacji o ponowne załadowanie pamięci podręcznej...');
  });
```

Statyczna rejestracja komendy instalacyjnej

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Konfigurowanie środowiska NocoBase...');
    });
});
```