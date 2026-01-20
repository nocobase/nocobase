:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd tworzenia wtyczek

NocoBase wykorzystuje **architekturę mikrojądra**, gdzie rdzeń odpowiada wyłącznie za harmonogramowanie cyklu życia wtyczek, zarządzanie zależnościami oraz hermetyzację podstawowych funkcji. Wszystkie funkcje biznesowe są dostarczane w formie wtyczek. Z tego powodu, zrozumienie struktury organizacyjnej, cyklu życia i sposobu zarządzania wtyczkami jest pierwszym krokiem w dostosowywaniu NocoBase do Państwa potrzeb.

## Kluczowe koncepcje

- **Plug and Play (Podłącz i używaj)**: Wtyczki można instalować, włączać lub wyłączać w zależności od potrzeb, co umożliwia elastyczne łączenie funkcji biznesowych bez konieczności modyfikowania kodu.
- **Integracja pełnego stosu (Full-stack)**: Wtyczki zazwyczaj zawierają zarówno implementacje po stronie serwera, jak i klienta, co zapewnia spójność między logiką danych a interakcjami interfejsu użytkownika.

## Podstawowa struktura wtyczki

Każda wtyczka jest niezależnym pakietem npm i zazwyczaj zawiera następującą strukturę katalogów:

```bash
plugin-hello/
├─ package.json          # Nazwa wtyczki, zależności i metadane wtyczki NocoBase
├─ client.js             # Wynik kompilacji front-endu, ładowany w czasie działania
├─ server.js             # Wynik kompilacji serwera, ładowany w czasie działania
├─ src/
│  ├─ client/            # Kod źródłowy klienta, może rejestrować bloki, akcje, pola itp.
│  └─ server/            # Kod źródłowy serwera, może rejestrować zasoby, zdarzenia, polecenia itp.
```

## Konwencje katalogów i kolejność ładowania

NocoBase domyślnie skanuje następujące katalogi w celu załadowania wtyczek:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Wtyczki w fazie rozwoju (najwyższy priorytet)
└── storage/
    └── plugins/          # Skompilowane wtyczki, np. przesłane lub opublikowane
```

- `packages/plugins`: Katalog przeznaczony do lokalnego tworzenia wtyczek, obsługujący kompilację i debugowanie w czasie rzeczywistym.
- `storage/plugins`: Przechowuje skompilowane wtyczki, takie jak wersje komercyjne lub wtyczki stron trzecich.

## Cykl życia i stany wtyczki

Wtyczka zazwyczaj przechodzi przez następujące etapy:

1.  **Tworzenie (create)**: Utworzenie szablonu wtyczki za pomocą CLI.
2.  **Pobieranie (pull)**: Pobranie pakietu wtyczki lokalnie, ale bez zapisywania go jeszcze do bazy danych.
3.  **Włączanie (enable)**: Przy pierwszym włączeniu wykonuje się „rejestracja + inicjalizacja”; kolejne włączenia ładują tylko logikę.
4.  **Wyłączanie (disable)**: Zatrzymanie działania wtyczki.
5.  **Usuwanie (remove)**: Całkowite usunięcie wtyczki z systemu.

:::tip

- `pull` odpowiada jedynie za pobranie pakietu wtyczki; faktyczny proces instalacji jest uruchamiany przy pierwszym `enable`.
- Jeśli wtyczka została tylko `pull`nięta, ale nie włączona, nie zostanie załadowana.

:::

### Przykłady poleceń CLI

```bash
# 1. Utwórz szkielet wtyczki
yarn pm create @my-project/plugin-hello

# 2. Pobierz pakiet wtyczki (pobierz lub połącz)
yarn pm pull @my-project/plugin-hello

# 3. Włącz wtyczkę (przy pierwszym włączeniu nastąpi automatyczna instalacja)
yarn pm enable @my-project/plugin-hello

# 4. Wyłącz wtyczkę
yarn pm disable @my-project/plugin-hello

# 5. Usuń wtyczkę
yarn pm remove @my-project/plugin-hello
```

## Interfejs zarządzania wtyczkami

Aby intuicyjnie przeglądać i zarządzać wtyczkami, proszę otworzyć menedżer wtyczek w przeglądarce:

**Domyślny adres URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Menedżer wtyczek](https://static-docs.nocobase.com/20251030195350.png)