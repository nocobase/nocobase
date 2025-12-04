---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Zmienne i klucze tajne

## Wprowadzenie

Centralne zarządzanie zmiennymi środowiskowymi i kluczami tajnymi, służące do przechowywania wrażliwych danych, ponownego wykorzystywania danych konfiguracyjnych oraz izolacji konfiguracji środowisk.

## Różnice w stosunku do `.env`

| **Cecha**                  | **Plik `.env`**                                                                                                    | **Dynamicznie konfigurowane zmienne i klucze tajne**                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lokalizacja przechowywania** | Przechowywane w pliku `.env` w katalogu głównym projektu.                                                          | Przechowywane w tabeli `environmentVariables` w bazie danych.                                                                                                                     |
| **Metoda ładowania**       | Ładowane do `process.env` za pomocą narzędzi takich jak `dotenv` podczas uruchamiania aplikacji.                   | Dynamicznie odczytywane i ładowane do `app.environment` podczas uruchamiania aplikacji.                                                                                           |
| **Metoda modyfikacji**     | Wymaga bezpośredniej edycji pliku, a zmiany wchodzą w życie dopiero po ponownym uruchomieniu aplikacji.            | Obsługuje modyfikację w czasie działania; zmiany wchodzą w życie natychmiast po ponownym załadowaniu konfiguracji aplikacji.                                                       |
| **Izolacja środowisk**     | Każde środowisko (rozwojowe, testowe, produkcyjne) wymaga oddzielnego zarządzania plikami `.env`.                   | Każde środowisko (rozwojowe, testowe, produkcyjne) wymaga oddzielnego zarządzania danymi w tabeli `environmentVariables`.                                                        |
| **Scenariusze zastosowania** | Odpowiednie dla stałych, statycznych konfiguracji, takich jak główne informacje o bazie danych aplikacji.            | Odpowiednie dla dynamicznych konfiguracji, które wymagają częstych zmian lub są powiązane z logiką biznesową, np. informacje o zewnętrznych bazach danych, przechowywaniu plików itp. |

## Instalacja

Wbudowana wtyczka, nie wymaga osobnej instalacji.

## Zastosowanie

### Ponowne wykorzystanie danych konfiguracyjnych

Na przykład, jeśli wiele miejsc w przepływie pracy wymaga węzłów e-mail i konfiguracji SMTP, wspólną konfigurację SMTP można przechowywać w zmiennych środowiskowych.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Przechowywanie wrażliwych danych

Przechowywanie różnych informacji konfiguracyjnych zewnętrznych baz danych, kluczy do przechowywania plików w chmurze itp.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Izolacja konfiguracji środowisk

W różnych środowiskach, takich jak deweloperskie, testowe i produkcyjne, stosuje się niezależne strategie zarządzania konfiguracją, aby zapewnić, że konfiguracje i dane każdego środowiska nie kolidują ze sobą. Każde środowisko ma własne niezależne ustawienia, zmienne i zasoby, co pozwala uniknąć konfliktów między środowiskami deweloperskim, testowym i produkcyjnym, a jednocześnie zapewnia, że system działa zgodnie z oczekiwaniami w każdym środowisku.

Na przykład, konfiguracja usług przechowywania plików może różnić się między środowiskiem deweloperskim a produkcyjnym, jak pokazano poniżej:

Środowisko deweloperskie

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Środowisko produkcyjne

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Zarządzanie zmiennymi środowiskowymi

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Dodawanie zmiennych środowiskowych

- Obsługuje dodawanie pojedyncze i masowe.
- Obsługuje przechowywanie w postaci jawnej i zaszyfrowanej.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Dodawanie pojedyncze

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Dodawanie masowe

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Uwagi

### Ponowne uruchamianie aplikacji

Po zmodyfikowaniu lub usunięciu zmiennych środowiskowych na górze pojawi się monit o ponowne uruchomienie aplikacji. Zmiany w zmiennych środowiskowych zaczną obowiązywać dopiero po ponownym uruchomieniu aplikacji.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Szyfrowane przechowywanie

Zaszyfrowane dane zmiennych środowiskowych wykorzystują szyfrowanie symetryczne AES. PRYWATNY KLUCZ do szyfrowania i deszyfrowania jest przechowywany w katalogu `storage`. Prosimy o jego bezpieczne przechowywanie; w przypadku utraty lub nadpisania, zaszyfrowane dane nie będą mogły zostać odszyfrowane.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Wtyczki obsługujące zmienne środowiskowe

### Akcja: Niestandardowe żądanie

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Uwierzytelnianie: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Uwierzytelnianie: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Uwierzytelnianie: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Uwierzytelnianie: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Uwierzytelnianie: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Uwierzytelnianie: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Źródło danych: Zewnętrzny MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Źródło danych: Zewnętrzny MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Źródło danych: Zewnętrzny Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Źródło danych: Zewnętrzny PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Źródło danych: Zewnętrzny SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Źródło danych: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Źródło danych: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Przechowywanie plików: Lokalne

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Przechowywanie plików: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Przechowywanie plików: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Przechowywanie plików: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Przechowywanie plików: S3 Pro

Nieprzystosowane

### Mapa: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Mapa: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Ustawienia e-mail

Nieprzystosowane

### Powiadomienia: E-mail

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Formularze publiczne

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Ustawienia systemowe

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Weryfikacja: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Weryfikacja: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Przepływ pracy

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)