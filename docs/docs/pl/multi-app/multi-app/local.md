---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/multi-app/multi-app/local).
:::

# Tryb pamięci współdzielonej

## Wprowadzenie

Gdy użytkownicy chcą podzielić obszary biznesowe na poziomie aplikacji bez wprowadzania złożonej architektury wdrażania i operacji, można skorzystać z trybu wielu aplikacji w pamięci współdzielonej.

W tym trybie w ramach jednej instancji NocoBase może działać jednocześnie wiele aplikacji. Każda aplikacja jest niezależna, może łączyć się z osobną bazą danych, może być oddzielnie tworzona, uruchamiana i zatrzymywana, ale współdzielą one ten sam proces i przestrzeń pamięci, dzięki czemu użytkownik nadal musi utrzymywać tylko jedną instancję NocoBase.

## Podręcznik użytkownika

### Konfiguracja zmiennych środowiskowych

Przed skorzystaniem z funkcji wielu aplikacji należy upewnić się, że podczas uruchamiania NocoBase ustawiono następujące zmienne środowiskowe:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Tworzenie aplikacji

W menu ustawień systemowych należy kliknąć „App Supervisor”, aby przejść do strony zarządzania aplikacjami.

![](https://static-docs.nocobase.com/202512291056215.png)

Należy kliknąć przycisk „Dodaj nową”, aby utworzyć nową aplikację.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Opis opcji konfiguracji

| Opcja konfiguracji | Opis |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nazwa aplikacji** | Nazwa wyświetlana aplikacji w interfejsie |
| **Identyfikator aplikacji** | Identyfikator aplikacji, unikalny w skali globalnej |
| **Tryb uruchamiania** | - Uruchom przy pierwszej wizycie: aplikacja podrzędna zostanie uruchomiona dopiero wtedy, gdy użytkownik po raz pierwszy uzyska do niej dostęp przez adres URL<br>- Uruchom razem z aplikacją główną: aplikacja podrzędna zostanie uruchomiona jednocześnie z aplikacją główną (wydłuży to czas uruchamiania aplikacji głównej) |
| **Środowisko** | W trybie pamięci współdzielonej dostępne jest tylko środowisko lokalne, czyli `local` |
| **Połączenie z bazą danych** | Służy do konfiguracji głównego źródła danych aplikacji, obsługuje trzy następujące sposoby:<br>- Nowa baza danych: ponowne wykorzystanie bieżącej usługi bazy danych i utworzenie niezależnej bazy danych<br>- Nowe połączenie z danymi: połączenie z inną usługą bazy danych<br>- Tryb Schema: gdy bieżącym głównym źródłem danych jest PostgreSQL, tworzony jest niezależny schemat (Schema) dla aplikacji |
| **Aktualizacja** | Czy zezwolić na automatyczną aktualizację do bieżącej wersji aplikacji, jeśli w połączonej bazie danych istnieją dane aplikacji NocoBase w niższej wersji |
| **Klucz JWT** | Automatyczne generowanie niezależnego klucza JWT dla aplikacji, zapewniając niezależność sesji aplikacji od aplikacji głównej i innych aplikacji |
| **Własna domena** | Konfiguracja niezależnej domeny dostępu dla aplikacji |

### Uruchamianie aplikacji

Należy kliknąć przycisk **Uruchom**, aby uruchomić aplikację podrzędną.

> Jeśli podczas tworzenia zaznaczono opcję _„Uruchom przy pierwszej wizycie”_, aplikacja zostanie uruchomiona automatycznie przy pierwszym dostępie.

![](https://static-docs.nocobase.com/202512291121065.png)

### Dostęp do aplikacji

Należy kliknąć przycisk **Odwiedź**, aby otworzyć aplikację podrzędną w nowej karcie.

Domyślnie dostęp do aplikacji podrzędnej odbywa się przez `/apps/:appName/admin/`, na przykład:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Jednocześnie można skonfigurować niezależną domenę dla aplikacji podrzędnej; należy skierować domenę na bieżący adres IP, a jeśli używany jest Nginx, należy również dodać domenę w konfiguracji Nginx.

### Zatrzymywanie aplikacji

Należy kliknąć przycisk **Zatrzymaj**, aby zatrzymać aplikację podrzędną.

![](https://static-docs.nocobase.com/202512291122113.png)

### Status aplikacji

Na liście można sprawdzić bieżący status każdej aplikacji.

![](https://static-docs.nocobase.com/202512291122339.png)

### Usuwanie aplikacji

Należy kliknąć przycisk **Usuń**, aby usunąć aplikację.

![](https://static-docs.nocobase.com/202512291122178.png)

## Często zadawane pytania

### 1. Zarządzanie wtyczkami

Inne aplikacje mogą korzystać z tych samych wtyczek, co aplikacja główna (w tej samej wersji), ale wtyczki można konfigurować i używać niezależnie.

### 2. Izolacja bazy danych

Inne aplikacje mogą konfigurować niezależne bazy danych; jeśli chce się współdzielić dane między aplikacjami, można to zrealizować poprzez zewnętrzne źródła danych.

### 3. Kopia zapasowa i migracja danych

Obecnie kopia zapasowa danych w aplikacji głównej nie obsługuje danych z innych aplikacji (zawiera tylko podstawowe informacje o aplikacji); kopię zapasową i migrację należy wykonać ręcznie wewnątrz innych aplikacji.

### 4. Wdrażanie i aktualizacja

W trybie pamięci współdzielonej wersje innych aplikacji będą automatycznie podążać za aplikacją główną, co zapewnia spójność wersji aplikacji.

### 5. Sesja aplikacji

- Jeśli aplikacja używa niezależnego klucza JWT, sesja aplikacji jest niezależna od aplikacji głównej i innych aplikacji. Jeśli dostęp do różnych aplikacji odbywa się przez podścieżki tej samej domeny, ze względu na przechowywanie tokenów aplikacji w LocalStorage, przy przełączaniu się między różnymi aplikacjami wymagane jest ponowne zalogowanie. Zaleca się skonfigurowanie niezależnych domen dla różnych aplikacji, aby uzyskać lepszą izolację sesji.
- Jeśli aplikacja nie używa niezależnego klucza JWT, będzie współdzielić sesję aplikacji głównej; po uzyskaniu dostępu do innych aplikacji w tej samej przeglądarce powrót do aplikacji głównej nie wymaga ponownego logowania. Istnieje jednak ryzyko bezpieczeństwa: jeśli identyfikatory użytkowników w różnych aplikacjach powtarzają się, może to prowadzić do nieautoryzowanego dostępu użytkowników do danych w innych aplikacjach.