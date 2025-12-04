:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Struktura katalogów projektu

Niezależnie od tego, czy klonują Państwo kod źródłowy z Git, czy inicjują projekt za pomocą `create-nocobase-app`, każdy wygenerowany projekt NocoBase jest w istocie monorepo opartym na **Yarn Workspace**.

## Przegląd katalogów najwyższego poziomu

Poniższy przykład przedstawia katalog projektu `my-nocobase-app/`. Proszę pamiętać, że w różnych środowiskach mogą występować niewielkie różnice:

```bash
my-nocobase-app/
├── packages/              # Kod źródłowy projektu
│   ├── plugins/           # Wtyczki w trakcie rozwoju (nieskompilowane)
├── storage/               # Dane środowiska uruchomieniowego i dynamicznie generowana zawartość
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Skompilowane wtyczki (w tym te przesłane przez interfejs użytkownika)
│   └── tar/               # Spakowane pliki wtyczek (.tar)
├── scripts/               # Skrypty narzędziowe i polecenia
├── .env*                  # Konfiguracje zmiennych środowiskowych dla różnych środowisk
├── lerna.json             # Konfiguracja obszaru roboczego Lerna
├── package.json           # Konfiguracja pakietu głównego, deklaruje obszar roboczy i skrypty
├── tsconfig*.json         # Konfiguracje TypeScript (frontend, backend, mapowanie ścieżek)
├── vitest.config.mts      # Konfiguracja testów jednostkowych Vitest
└── playwright.config.ts   # Konfiguracja testów E2E Playwright
```

## Opis podkatalogu `packages/`

Katalog `packages/` zawiera podstawowe moduły NocoBase oraz pakiety rozszerzalne. Jego zawartość zależy od sposobu utworzenia projektu:

- **Projekty utworzone za pomocą `create-nocobase-app`**: Domyślnie zawierają jedynie `packages/plugins/`, gdzie przechowywany jest kod źródłowy niestandardowych wtyczek. Każdy podkatalog stanowi niezależny pakiet npm.
- **Sklonowane oficjalne repozytorium źródłowe**: Znajdą Państwo tu więcej podkatalogów, takich jak `core/`, `plugins/`, `pro-plugins/`, `presets/` itd., odpowiadających kolejno rdzeniu frameworka, wbudowanym wtyczkom i oficjalnym predefiniowanym rozwiązaniom.

Niezależnie od wybranej metody, `packages/plugins` jest głównym miejscem do tworzenia i debugowania niestandardowych wtyczek.

## Katalog `storage/` (dane środowiska uruchomieniowego)

Katalog `storage/` przechowuje dane generowane w czasie działania aplikacji oraz wyniki kompilacji. Poniżej przedstawiamy opis typowych podkatalogów:

- `apps/`: Konfiguracja i pamięć podręczna dla scenariuszy z wieloma aplikacjami.
- `logs/`: Logi działania i dane wyjściowe debugowania.
- `uploads/`: Pliki i zasoby multimedialne przesłane przez użytkowników.
- `plugins/`: Spakowane wtyczki przesłane za pośrednictwem interfejsu użytkownika lub zaimportowane przez CLI.
- `tar/`: Skompresowane pakiety wtyczek generowane po wykonaniu `yarn build <plugin> --tar`.

> Zazwyczaj zaleca się dodanie katalogu `storage` do pliku `.gitignore` i traktowanie go oddzielnie podczas wdrażania lub tworzenia kopii zapasowych.

## Konfiguracja środowiska i skrypty projektowe

- `.env`, `.env.test`, `.env.e2e`: Używane odpowiednio do uruchamiania lokalnego, testów jednostkowych/integracyjnych oraz testów end-to-end.
- `scripts/`: Przechowuje często używane skrypty operacyjne (takie jak inicjalizacja bazy danych, narzędzia pomocnicze do publikacji itp.).

## Ścieżki ładowania i priorytet wtyczek

Wtyczki mogą znajdować się w kilku miejscach. NocoBase ładuje je w następującej kolejności priorytetów podczas uruchamiania:

1. Wersja kodu źródłowego w `packages/plugins` (do lokalnego rozwoju i debugowania).
2. Spakowana wersja w `storage/plugins` (przesłana za pośrednictwem interfejsu użytkownika lub zaimportowana przez CLI).
3. Pakiety zależności w `node_modules` (zainstalowane za pomocą npm/yarn lub wbudowane w framework).

Jeśli wtyczka o tej samej nazwie istnieje zarówno w katalogu źródłowym, jak i spakowanym, system priorytetowo załaduje wersję źródłową, co ułatwia lokalne nadpisywanie i debugowanie.

## Szablon katalogu wtyczki

Aby utworzyć wtyczkę za pomocą CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Wygenerowana struktura katalogów wygląda następująco:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Wyniki kompilacji (generowane w razie potrzeby)
├── src/                     # Katalog kodu źródłowego
│   ├── client/              # Kod frontendowy (bloki, strony, modele itp.)
│   │   ├── plugin.ts        # Główna klasa wtyczki po stronie klienta
│   │   └── index.ts         # Punkt wejścia po stronie klienta
│   ├── locale/              # Zasoby wielojęzyczne (wspólne dla frontend i backend)
│   ├── swagger/             # Dokumentacja OpenAPI/Swagger
│   └── server/              # Kod backendowy
│       ├── collections/     # Definicje kolekcji
│       ├── commands/        # Niestandardowe polecenia
│       ├── migrations/      # Skrypty migracji bazy danych
│       ├── plugin.ts        # Główna klasa wtyczki po stronie serwera
│       └── index.ts         # Punkt wejścia po stronie serwera
├── index.ts                 # Eksport pomostowy frontend-backend
├── client.d.ts              # Deklaracje typów frontendowych
├── client.js                # Artefakt kompilacji frontendowej
├── server.d.ts              # Deklaracje typów backendowych
├── server.js                # Artefakt kompilacji backendowej
├── .npmignore               # Konfiguracja ignorowania podczas publikacji
└── package.json
```

> Po zakończeniu kompilacji, katalog `dist/` oraz pliki `client.js` i `server.js` zostaną załadowane po włączeniu wtyczki.
> Na etapie rozwoju wystarczy modyfikować katalog `src/`. Przed publikacją należy wykonać `yarn build <plugin>` lub `yarn build <plugin> --tar`.