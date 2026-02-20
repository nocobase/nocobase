:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Napisz swoją pierwszą wtyczkę

Ten przewodnik poprowadzi Panią/Pana przez proces tworzenia wtyczki blokowej, którą można wykorzystać na stronach, od podstaw. Pomoże to Pani/Panu zrozumieć podstawową strukturę i proces tworzenia wtyczek NocoBase.

## Wymagania wstępne

Zanim zaczniemy, proszę upewnić się, że NocoBase zostało pomyślnie zainstalowane. Jeśli jeszcze Pani/Pan tego nie zrobił(a), może Pani/Pan skorzystać z poniższych przewodników instalacji:

- [Instalacja za pomocą create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalacja z kodu źródłowego Git](/get-started/installation/git)

Po zakończeniu instalacji może Pani/Pan oficjalnie rozpocząć swoją przygodę z tworzeniem wtyczek.

## Krok 1: Tworzenie szkieletu wtyczki za pomocą CLI

Proszę wykonać poniższe polecenie w katalogu głównym repozytorium, aby szybko wygenerować pustą wtyczkę:

```bash
yarn pm create @my-project/plugin-hello
```

Po pomyślnym wykonaniu polecenia, w katalogu `packages/plugins/@my-project/plugin-hello` zostaną wygenerowane podstawowe pliki. Domyślna struktura jest następująca:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Domyślny eksport wtyczki po stronie serwera
     ├─ client                   # Lokalizacja kodu po stronie klienta
     │  ├─ index.tsx             # Domyślnie eksportowana klasa wtyczki po stronie klienta
     │  ├─ plugin.tsx            # Punkt wejścia wtyczki (rozszerza @nocobase/client Plugin)
     │  ├─ models                # Opcjonalnie: modele front-end (np. węzły przepływu pracy)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Lokalizacja kodu po stronie serwera
     │  ├─ index.ts              # Domyślnie eksportowana klasa wtyczki po stronie serwera
     │  ├─ plugin.ts             # Punkt wejścia wtyczki (rozszerza @nocobase/server Plugin)
     │  ├─ collections           # Opcjonalnie: kolekcje po stronie serwera
     │  ├─ migrations            # Opcjonalnie: migracje danych
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opcjonalnie: obsługa wielu języków
        ├─ en-US.json
        └─ zh-CN.json
```

Po utworzeniu, może Pani/Pan otworzyć stronę menedżera wtyczek w przeglądarce (domyślny adres URL: http://localhost:13000/admin/settings/plugin-manager), aby sprawdzić, czy wtyczka pojawiła się na liście.

## Krok 2: Implementacja prostego bloku klienckiego

Następnie dodamy do wtyczki niestandardowy model bloku, który wyświetli komunikat powitalny.

1.  **Proszę utworzyć nowy plik modelu bloku** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2.  **Proszę zarejestrować model bloku**. Proszę edytować plik `client/models/index.ts`, aby wyeksportować nowy model do załadowania przez środowisko uruchomieniowe front-endu:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Po zapisaniu kodu, jeśli uruchamia Pani/Pan skrypt deweloperski, powinna Pani/Pan zobaczyć logi szybkiego odświeżania (hot-reload) w terminalu.

## Krok 3: Aktywacja i testowanie wtyczki

Może Pani/Pan włączyć wtyczkę za pomocą wiersza poleceń lub interfejsu:

-   **Wiersz poleceń**

    ```bash
    yarn pm enable @my-project/plugin-hello
    ```

-   **Interfejs zarządzania**: Proszę otworzyć menedżera wtyczek, znaleźć `@my-project/plugin-hello` i kliknąć „Aktywuj”.

Po aktywacji proszę utworzyć nową stronę „Modern page (v2)”. Podczas dodawania bloków zobaczy Pani/Pan „Hello block”. Proszę wstawić go na stronę, aby zobaczyć treść powitalną, którą Pani/Pan właśnie napisał(a).

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Krok 4: Budowanie i pakowanie

Gdy będzie Pani/Pan gotowa/gotowy do dystrybucji wtyczki w innych środowiskach, należy ją najpierw zbudować, a następnie spakować:

```bash
yarn build @my-project/plugin-hello --tar
# Lub wykonać w dwóch krokach
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Wskazówka: Jeśli wtyczka została utworzona w repozytorium kodu źródłowego, pierwsze zbudowanie wywoła pełne sprawdzenie typów w całym repozytorium, co może zająć trochę czasu. Zaleca się upewnienie się, że zależności są zainstalowane, a repozytorium jest w stanie gotowości do zbudowania.

Po zakończeniu budowania, spakowany plik domyślnie znajduje się pod adresem `storage/tar/@my-project/plugin-hello.tar.gz`.

## Krok 5: Przesyłanie do innej aplikacji NocoBase

Proszę przesłać i rozpakować plik do katalogu `./storage/plugins` docelowej aplikacji. Szczegóły znajdzie Pani/Pan w sekcji [Instalacja i aktualizacja wtyczek](../get-started/install-upgrade-plugins.mdx).