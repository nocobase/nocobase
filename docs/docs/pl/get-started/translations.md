:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/get-started/translations).
:::

# Wkład w tłumaczenie

Domyślnym językiem NocoBase jest angielski. Obecnie główna aplikacja obsługuje język angielski, włoski, holenderski, chiński uproszczony i japoński. Serdecznie zapraszamy Państwa do współtworzenia tłumaczeń na inne języki, aby użytkownicy na całym świecie mogli cieszyć się jeszcze wygodniejszym korzystaniem z NocoBase.

---

## I. Lokalizacja systemu

### 1. Tłumaczenie interfejsu systemu i wtyczek

#### 1.1 Zakres tłumaczenia
Dotyczy wyłącznie lokalizacji interfejsu systemu NocoBase i wtyczek, nie obejmuje innych treści niestandardowych (takich jak tabele danych czy bloki Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Przegląd treści lokalizacyjnych
NocoBase używa systemu Git do zarządzania treściami lokalizacyjnymi. Głównym repozytorium jest:
https://github.com/nocobase/nocobase/tree/main/locales

Każdy język jest reprezentowany przez plik JSON nazwany zgodnie z kodem języka (np. de-DE.json, fr-FR.json). Struktura pliku jest zorganizowana według modułów wtyczek, wykorzystując pary klucz-wartość do przechowywania tłumaczeń. Na przykład:

```json
{
  // Wtyczka klienta
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...inne pary klucz-wartość
  },
  "@nocobase/plugin-acl": {
    // Pary klucz-wartość dla tej wtyczki
  }
  // ...inne moduły wtyczek
}
```

Podczas tłumaczenia prosimy o stopniowe przekształcanie go w strukturę podobną do poniższej:

```json
{
  // Wtyczka klienta
  "@nocobase/client": {
    "(Fields only)": "(Tylko pola - przetłumaczone)",
    "12 hour": "12-godzinny",
    "24 hour": "24-godzinny"
    // ...inne pary klucz-wartość
  },
  "@nocobase/plugin-acl": {
    // Pary klucz-wartość dla tej wtyczki
  }
  // ...inne moduły wtyczek
}
```

#### 1.3 Testowanie i synchronizacja tłumaczenia
- Po zakończeniu tłumaczenia prosimy o przetestowanie i zweryfikowanie, czy wszystkie teksty wyświetlają się poprawnie.
Udostępniliśmy również wtyczkę do weryfikacji tłumaczeń – wystarczy wyszukać `Locale tester` w sklepie z wtyczkami.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Po zainstalowaniu należy skopiować zawartość JSON z odpowiedniego pliku lokalizacyjnego w repozytorium git, wkleić ją do środka i kliknąć OK, aby sprawdzić, czy tłumaczenie działa.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Po przesłaniu skrypty systemowe automatycznie zsynchronizują treści lokalizacyjne z repozytorium kodu.

#### 1.4 Wtyczka lokalizacyjna NocoBase 2.0

> **Uwaga:** Ta sekcja jest w trakcie przygotowania. Wtyczka lokalizacyjna dla NocoBase 2.0 różni się nieco od wersji 1.x. Szczegółowe informacje zostaną podane w przyszłej aktualizacji.

<!-- TODO: Dodaj szczegóły dotyczące różnic we wtyczce lokalizacyjnej 2.0 -->

## II. Lokalizacja dokumentacji (NocoBase 2.0)

Dokumentacja NocoBase 2.0 jest zarządzana w nowej strukturze. Pliki źródłowe dokumentacji znajdują się w głównym repozytorium NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Struktura dokumentacji

Dokumentacja wykorzystuje [Rspress](https://rspress.dev/) jako generator statycznych stron i obsługuje 22 języki. Struktura jest zorganizowana w następujący sposób:

```
docs/
├── docs/
│   ├── en/                    # Angielski (język źródłowy)
│   ├── cn/                    # Chiński uproszczony
│   ├── ja/                    # Japoński
│   ├── ko/                    # Koreański
│   ├── de/                    # Niemiecki
│   ├── fr/                    # Francuski
│   ├── es/                    # Hiszpański
│   ├── pt/                    # Portugalski
│   ├── ru/                    # Rosyjski
│   ├── it/                    # Włoski
│   ├── tr/                    # Turecki
│   ├── uk/                    # Ukraiński
│   ├── vi/                    # Wietnamski
│   ├── id/                    # Indonezyjski
│   ├── th/                    # Tajski
│   ├── pl/                    # Polski
│   ├── nl/                    # Holenderski
│   ├── cs/                    # Czeski
│   ├── ar/                    # Arabski
│   ├── he/                    # Hebrajski
│   ├── hi/                    # Hindi
│   ├── sv/                    # Szwedzki
│   └── public/                # Współdzielone zasoby (obrazy itp.)
├── theme/                     # Niestandardowy motyw
├── rspress.config.ts          # Konfiguracja Rspress
└── package.json
```

### 2.2 Przepływ pracy tłumaczenia

1. **Synchronizacja z angielskim źródłem**: Wszystkie tłumaczenia powinny opierać się na dokumentacji angielskiej (`docs/en/`). Gdy dokumentacja angielska zostanie zaktualizowana, tłumaczenia powinny zostać odpowiednio uaktualnione.

2. **Strategia gałęzi**:
   - Użyj gałęzi `develop` lub `next` jako odniesienia dla najnowszej treści w języku angielskim
   - Utwórz swoją gałąź tłumaczeniową z gałęzi docelowej

3. **Struktura plików**: Każdy katalog językowy powinien odzwierciedlać strukturę katalogu angielskiego. Na przykład:
   ```
   docs/en/get-started/index.md    →    docs/pl/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/pl/api/acl/acl.md
   ```

### 2.3 Współpraca przy tłumaczeniu

1. Wykonaj Fork repozytorium: https://github.com/nocobase/nocobase
2. Sklonuj swój fork i przełącz się na gałąź `develop` lub `next`
3. Przejdź do katalogu `docs/docs/`
4. Znajdź katalog języka, w który chcesz wnieść wkład (np. `pl/` dla polskiego)
5. Przetłumacz pliki markdown, zachowując tę samą strukturę plików, co w wersji angielskiej
6. Przetestuj zmiany lokalnie:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Prześlij Pull Request do głównego repozytorium

### 2.4 Wytyczne dotyczące tłumaczenia

- **Zachowanie spójności formatowania**: Utrzymuj tę samą strukturę markdown, nagłówki, bloki kodu i linki co w oryginale.
- **Zachowanie frontmatter**: Pozostaw wszelkie dane YAML frontmatter na górze plików bez zmian, chyba że zawierają one treści do przetłumaczenia.
- **Odnośniki do obrazów**: Używaj tych samych ścieżek do obrazów z `docs/public/` – obrazy są współdzielone przez wszystkie języki.
- **Linki wewnętrzne**: Zaktualizuj linki wewnętrzne, aby wskazywały na poprawną ścieżkę językową.
- **Przykłady kodu**: Zazwyczaj przykłady kodu nie powinny być tłumaczone, ale komentarze wewnątrz kodu mogą zostać przetłumaczone.

### 2.5 Konfiguracja nawigacji

Struktura nawigacji dla każdego języka jest zdefiniowana w plikach `_nav.json` i `_meta.json` w każdym katalogu językowym. Dodając nowe strony lub sekcje, należy pamiętać o zaktualizowaniu tych plików konfiguracyjnych.

## III. Lokalizacja strony internetowej

Strony internetowe i cała zawartość są przechowywane pod adresem:
https://github.com/nocobase/website

### 3.1 Zasoby na start i referencje

Przy dodawaniu nowego języka prosimy o zapoznanie się z istniejącymi stronami językowymi:
- Angielski: https://github.com/nocobase/website/tree/main/src/pages/en
- Chiński: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japoński: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagram lokalizacji strony](https://static-docs.nocobase.com/20250319121600.png)

Globalne modyfikacje stylów znajdują się w:
- Angielski: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chiński: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japoński: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagram stylów globalnych](https://static-docs.nocobase.com/20250319121501.png)

Lokalizacja globalnych komponentów strony jest dostępna pod adresem:
https://github.com/nocobase/website/tree/main/src/components

![Diagram komponentów strony](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Struktura treści i metoda lokalizacji

Stosujemy mieszane podejście do zarządzania treścią. Treści i zasoby w języku angielskim, chińskim i japońskim są regularnie synchronizowane z systemu CMS i nadpisywane, podczas gdy inne języki mogą być edytowane bezpośrednio w plikach lokalnych. Treści lokalne są przechowywane w katalogu `content`, zorganizowanym w następujący sposób:

```
/content
  /articles        # Artykuły na blogu
    /article-slug
      index.md     # Treść angielska (domyślna)
      index.cn.md  # Treść chińska
      index.ja.md  # Treść japońska
      metadata.json # Metadane i inne właściwości lokalizacyjne
  /tutorials       # Samouczki
  /releases        # Informacje o wydaniach
  /pages           # Niektóre strony statyczne
  /categories      # Informacje o kategoriach
    /article-categories.json  # Lista kategorii artykułów
    /category-slug            # Szczegóły pojedynczej kategorii
      /category.json
  /tags            # Informacje o tagach
    /article-tags.json        # Lista tagów artykułów
    /release-tags.json        # Lista tagów wydań
    /tag-slug                 # Szczegóły pojedynczego tagu
      /tag.json
  /help-center     # Treść centrum pomocy
    /help-center-tree.json    # Struktura nawigacji centrum pomocy
  ....
```

### 3.3 Wytyczne dotyczące tłumaczenia treści

- **Tłumaczenie treści Markdown**

1. Utwórz nowy plik językowy na podstawie pliku domyślnego (np. `index.md` na `index.pl.md`)
2. Dodaj zlokalizowane właściwości w odpowiednich polach w pliku JSON
3. Zachowaj spójność struktury plików, linków i odniesień do obrazów

- **Tłumaczenie treści JSON**
Wiele metadanych treści jest przechowywanych w plikach JSON, które zazwyczaj zawierają pola wielojęzyczne:

```json
{
  "id": 123,
  "title": "English Title",       // Angielski tytuł (domyślny)
  "title_cn": "中文标题",          // Chiński tytuł
  "title_ja": "日本語タイトル",    // Japoński tytuł
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Ścieżka URL (zazwyczaj nie jest tłumaczona)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Uwagi dotyczące tłumaczenia:**

1. **Konwencja nazewnictwa pól**: Pola tłumaczeń zazwyczaj używają formatu `{oryginalne_pole}_{kod_języka}`
   - Na przykład: title_pl (polski tytuł), description_pl (polski opis)

2. **Przy dodawaniu nowego języka**:
   - Dodaj odpowiednią wersję z sufiksem języka dla każdego pola wymagającego tłumaczenia
   - Nie modyfikuj oryginalnych wartości pól (takich jak title, description itp.), ponieważ służą one jako treść w języku domyślnym (angielskim)

3. **Mechanizm synchronizacji CMS**:
   - System CMS okresowo aktualizuje treści w języku angielskim, chińskim i japońskim
   - System będzie aktualizować/nadpisywać treści tylko dla tych trzech języków (niektóre właściwości w JSON) i **nie usunie** pól językowych dodanych przez innych współtwórców
   - Na przykład: jeśli dodali Państwo polskie tłumaczenie (title_pl), synchronizacja CMS nie wpłynie na to pole


### 3.4 Konfigurowanie obsługi nowego języka

Aby dodać obsługę nowego języka, należy zmodyfikować konfigurację `SUPPORTED_LANGUAGES` w pliku `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Przykład dodania nowego języka:
  pl: {
    code: 'pl',
    locale: 'pl-PL',
    name: 'Polish'
  }
};
```

### 3.5 Pliki układu i style

Każdy język wymaga odpowiednich plików układu (layout):

1. Utwórz nowy plik układu (np. dla języka polskiego utwórz `src/layouts/BasePL.astro`)
2. Możesz skopiować istniejący plik układu (taki jak `BaseEN.astro`) i go przetłumaczyć
3. Plik układu zawiera tłumaczenia elementów globalnych, takich jak menu nawigacyjne, stopki itp.
4. Pamiętaj o zaktualizowaniu konfiguracji przełącznika języków, aby poprawnie przełączał się na nowo dodany język

### 3.6 Tworzenie katalogów stron językowych

Utwórz niezależne katalogi stron dla nowego języka:

1. Utwórz folder nazwany kodem języka w katalogu `src` (np. `src/pl/`)
2. Skopiuj strukturę stron z innych katalogów językowych (np. `src/en/`)
3. Zaktualizuj treść stron, tłumacząc tytuły, opisy i teksty na język docelowy
4. Upewnij się, że strony używają poprawnego komponentu układu (np. `.layout: '@/layouts/BasePL.astro'`)

### 3.7 Lokalizacja komponentów

Niektóre wspólne komponenty również wymagają tłumaczenia:

1. Sprawdź komponenty w katalogu `src/components/`
2. Zwróć szczególną uwagę na komponenty ze stałym tekstem (takie jak paski nawigacyjne, stopki itp.)
3. Komponenty mogą używać renderowania warunkowego do wyświetlania treści w różnych językach:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/pl') && <p>Polska treść</p>}
```

### 3.8 Testowanie i weryfikacja

Po zakończeniu tłumaczenia należy przeprowadzić dokładne testy:

1. Uruchom stronę lokalnie (zazwyczaj za pomocą `yarn dev`)
2. Sprawdź, jak wszystkie strony wyświetlają się w nowym języku
3. Zweryfikuj, czy funkcja przełączania języków działa poprawnie
4. Upewnij się, że wszystkie linki prowadzą do stron w poprawnej wersji językowej
5. Sprawdź układy responsywne, aby upewnić się, że przetłumaczony tekst nie psuje wyglądu strony

## IV. Jak zacząć tłumaczenie

Jeśli chcą Państwo pomóc w tłumaczeniu NocoBase na nowy język, prosimy o wykonanie poniższych kroków:

| Komponent | Repozytorium | Gałąź | Uwagi |
|-----------|--------------|-------|-------|
| Interfejs systemu | https://github.com/nocobase/nocobase/tree/main/locales | main | Pliki lokalizacyjne JSON |
| Dokumentacja (2.0) | https://github.com/nocobase/nocobase | develop / next | Katalog `docs/docs/<lang>/` |
| Strona internetowa | https://github.com/nocobase/website | main | Patrz sekcja III |

Po zakończeniu tłumaczenia prosimy o przesłanie Pull Request do NocoBase. Nowe języki pojawią się w konfiguracji systemu, umożliwiając wybór języka do wyświetlania.

![Diagram włączonych języków](https://static-docs.nocobase.com/20250319123452.png)

## Dokumentacja NocoBase 1.x

Przewodnik po tłumaczeniu NocoBase 1.x znajduje się pod adresem:

https://docs-cn.nocobase.com/welcome/community/translations