---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Skrypt JavaScript

## Wprowadzenie

Węzeł Skrypt JavaScript umożliwia użytkownikom wykonywanie niestandardowego skryptu JavaScript po stronie serwera w ramach przepływu pracy. Skrypt może wykorzystywać zmienne z wcześniejszych etapów przepływu pracy jako parametry, a jego wartość zwracana może być używana przez kolejne węzły.

Skrypt jest wykonywany w wątku roboczym na serwerze aplikacji NocoBase i obsługuje większość funkcji Node.js. Istnieją jednak pewne różnice w stosunku do natywnego środowiska wykonawczego. Szczegóły znajdą Państwo w [Liście funkcji](#lista-funkcji).

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „JavaScript”:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Konfiguracja węzła

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametry

Służą do przekazywania do skryptu zmiennych lub wartości statycznych z kontekstu przepływu pracy, które mogą być wykorzystane w logice kodu. Gdzie `name` to nazwa parametru, która po przekazaniu do skryptu staje się nazwą zmiennej. `value` to wartość parametru, którą można wybrać jako zmienną lub wprowadzić jako stałą.

### Zawartość skryptu

Zawartość skryptu można traktować jako funkcję. Mogą Państwo napisać dowolny kod JavaScript obsługiwany w środowisku Node.js i użyć instrukcji `return`, aby zwrócić wartość jako wynik wykonania węzła, która może być następnie użyta jako zmienna przez kolejne węzły.

Po napisaniu kodu mogą Państwo kliknąć przycisk testowania pod edytorem, aby otworzyć okno dialogowe testowego wykonania. Proszę wypełnić parametry wartościami statycznymi, aby przeprowadzić symulację. Po wykonaniu w oknie dialogowym zobaczą Państwo wartość zwracaną oraz zawartość wyjścia (logów).

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Ustawienie limitu czasu

Jednostką są milisekundy. Wartość `0` oznacza brak ustawionego limitu czasu.

### Kontynuuj po błędzie

Po zaznaczeniu tej opcji, kolejne węzły zostaną wykonane nawet w przypadku błędu skryptu lub przekroczenia limitu czasu.

:::info{title="Wskazówka"}
W przypadku błędu skrypt nie zwróci żadnej wartości, a wynik węzła zostanie wypełniony komunikatem o błędzie. Jeśli kolejne węzły używają zmiennej wynikowej z węzła skryptu, należy zachować ostrożność.
:::

## Lista funkcji

### Wersja Node.js

Taka sama jak wersja Node.js, na której działa główna aplikacja.

### Obsługa modułów

W skrypcie można używać modułów z pewnymi ograniczeniami, zgodnie z CommonJS, importując je za pomocą dyrektywy `require()`.

Obsługiwane są natywne moduły Node.js oraz moduły zainstalowane w `node_modules` (w tym pakiety zależności już używane przez NocoBase). Moduły, które mają być dostępne dla kodu, muszą być zadeklarowane w zmiennej środowiskowej aplikacji `WORKFLOW_SCRIPT_MODULES`. Wiele nazw pakietów należy oddzielić przecinkami, na przykład:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Wskazówka"}
Moduły, które nie zostały zadeklarowane w zmiennej środowiskowej `WORKFLOW_SCRIPT_MODULES`, **nie mogą** być używane w skrypcie, nawet jeśli są natywne dla Node.js lub zainstalowane w `node_modules`. Ta polityka może być wykorzystana na poziomie operacyjnym do kontrolowania listy modułów dostępnych dla użytkowników, zapobiegając nadmiernym uprawnieniom skryptów w niektórych scenariuszach.
:::

W środowisku, gdzie aplikacja nie jest wdrożona ze źródeł, jeśli jakiś moduł nie jest zainstalowany w `node_modules`, mogą Państwo ręcznie zainstalować wymagany pakiet w katalogu `storage`. Na przykład, aby użyć pakietu `exceljs`, proszę wykonać następujące kroki:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Następnie proszę dodać ścieżkę względną (lub absolutną) do tego pakietu, bazującą na bieżącym katalogu roboczym (CWD) aplikacji, do zmiennej środowiskowej `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Wtedy będą Państwo mogli używać pakietu `exceljs` w swoim skrypcie:

```js
const ExcelJS = require('exceljs');
// ...
```

### Zmienne globalne

**Nie są obsługiwane** zmienne globalne takie jak `global`, `process`, `__dirname` i `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parametry wejściowe

Parametry skonfigurowane w węźle stają się zmiennymi globalnymi w skrypcie i mogą być bezpośrednio używane. Parametry przekazywane do skryptu obsługują tylko typy podstawowe, takie jak `boolean`, `number`, `string`, `object` i tablice. Obiekt `Date` po przekazaniu zostanie przekonwertowany na ciąg znaków w formacie ISO. Inne złożone typy, takie jak instancje klas niestandardowych, nie mogą być przekazywane bezpośrednio.

### Wartość zwracana

Za pomocą instrukcji `return` można zwrócić dane typów podstawowych (zgodnie z zasadami parametrów) z powrotem do węzła jako jego wynik. Jeśli w kodzie nie zostanie wywołana instrukcja `return`, wykonanie węzła nie zwróci żadnej wartości.

```js
return 123;
```

### Wyjście (logi)

**Obsługiwane jest** użycie `console` do wyprowadzania logów.

```js
console.log('hello world!');
```

Podczas wykonywania przepływu pracy, wyjście z węzła skryptu jest również rejestrowane w pliku logów odpowiedniego przepływu pracy.

### Asynchroniczność

**Obsługiwane jest** użycie `async` do definiowania funkcji asynchronicznych oraz `await` do ich wywoływania. **Obsługiwany jest** również globalny obiekt `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timery

Aby użyć metod takich jak `setTimeout`, `setInterval` lub `setImmediate`, należy je zaimportować z pakietu `timers` Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```