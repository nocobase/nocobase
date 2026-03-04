:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/solution/crm/installation).
:::

# Jak zainstalować

> Obecna wersja wykorzystuje formę **kopii zapasowej i przywracania** do wdrażania. W kolejnych wersjach możemy zmienić ją na formę **migracji przyrostowej**, aby ułatwić integrację rozwiązania z Państwa istniejącymi systemami.

Aby umożliwić Państwu szybkie i sprawne wdrożenie rozwiązania CRM 2.0 we własnym środowisku NocoBase, udostępniliśmy dwie metody przywracania. Prosimy o wybór tej, która najlepiej odpowiada Państwa wersji użytkownika i zapleczu technicznemu.

Przed rozpoczęciem prosimy upewnić się, że:

- Posiadają Państwo już podstawowe środowisko uruchomieniowe NocoBase. Informacje na temat instalacji systemu głównego można znaleźć w szczegółowej [oficjalnej dokumentacji instalacji](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Wersja NocoBase to **v2.1.0-beta.2 lub nowsza**.
- Pobrali Państwo odpowiednie pliki systemu CRM:
  - **Plik kopii zapasowej**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - odpowiedni dla Metody pierwszej
  - **Plik SQL**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - odpowiedni dla Metody drugiej

**Ważne uwagi**:
- Niniejsze rozwiązanie zostało przygotowane w oparciu o bazę danych **PostgreSQL 16**, prosimy upewnić się, że Państwa środowisko korzysta z PostgreSQL 16.
- **DB_UNDERSCORED nie może mieć wartości true**: Prosimy o sprawdzenie pliku `docker-compose.yml` i upewnienie się, że zmienna środowiskowa `DB_UNDERSCORED` nie jest ustawiona na `true`, w przeciwnym razie wystąpi konflikt z kopią zapasową rozwiązania, co doprowadzi do niepowodzenia przywracania.

---

## Metoda 1: Przywracanie za pomocą Menedżera kopii zapasowych (zalecane dla użytkowników wersji Pro/Enterprise)

Ta metoda wykorzystuje wbudowaną w NocoBase wtyczkę „[Menedżer kopii zapasowych](https://docs-cn.nocobase.com/handbook/backups)” (wersja Pro/Enterprise) do przywracania jednym kliknięciem, co jest najprostszym rozwiązaniem. Nakłada ona jednak pewne wymagania dotyczące środowiska i wersji użytkownika.

### Główne cechy

* **Zalety**:
  1. **Wygoda obsługi**: Operację można wykonać w interfejsie UI, co pozwala na pełne przywrócenie wszystkich konfiguracji, w tym wtyczek.
  2. **Pełne przywracanie**: **Możliwość przywrócenia wszystkich plików systemowych**, w tym plików szablonów wydruku, plików przesłanych w polach plików w tabelach itp., zapewniając pełną integralność funkcji.
* **Ograniczenia**:
  1. **Tylko dla wersji Pro/Enterprise**: „Menedżer kopii zapasowych” to wtyczka klasy korporacyjnej, dostępna tylko dla użytkowników wersji Pro/Enterprise.
  2. **Surowe wymagania środowiskowe**: Wymaga, aby Państwa środowisko bazy danych (wersja, ustawienia wielkości liter itp.) było wysoce kompatybilne ze środowiskiem, w którym utworzono kopię zapasową.
  3. **Zależność od wtyczek**: Jeśli rozwiązanie zawiera komercyjne wtyczki, których nie ma w Państwa lokalnym środowisku, przywracanie zakończy się niepowodzeniem.

### Kroki operacyjne

**Krok 1: 【Gorąco zalecane】 Uruchomienie aplikacji przy użyciu obrazu `full`**

Aby uniknąć niepowodzenia przywracania z powodu braku klienta bazy danych, zdecydowanie zalecamy korzystanie z wersji `full` obrazu Docker. Zawiera ona wszystkie niezbędne programy towarzyszące, dzięki czemu nie muszą Państwo przeprowadzać dodatkowej konfiguracji.

Przykład polecenia pobrania obrazu:

```bash
docker pull nocobase/nocobase:beta-full
```

Następnie należy użyć tego obrazu do uruchomienia usługi NocoBase.

> **Uwaga**: Jeśli nie użyją Państwo obrazu `full`, może być konieczne ręczne zainstalowanie klienta bazy danych `pg_dump` wewnątrz kontenera, co jest procesem uciążliwym i niestabilnym.

**Krok 2: Włączenie wtyczki „Menedżer kopii zapasowych”**

1. Zalogować się do systemu NocoBase.
2. Wejść w **`Zarządzanie wtyczkami`**.
3. Znaleźć i włączyć wtyczkę **`Menedżer kopii zapasowych`**.

**Krok 3: Przywracanie z lokalnego pliku kopii zapasowej**

1. Po włączeniu wtyczki odświeżyć stronę.
2. Wejść w menu po lewej stronie: **`Zarządzanie systemem`** -> **`Menedżer kopii zapasowych`**.
3. Kliknąć przycisk **`Przywróć z lokalnej kopii zapasowej`** w prawym górnym rogu.
4. Przeciągnąć pobrany plik kopii zapasowej do obszaru przesyłania.
5. Kliknąć **`Prześlij`** i cierpliwie czekać na zakończenie przywracania przez system; proces ten może potrwać od kilkudziesięciu sekund do kilku minut.

### Uwagi

* **Kompatybilność bazy danych**: To najważniejszy punkt tej metody. **Wersja, zestaw znaków i ustawienia wielkości liter** Państwa bazy danych PostgreSQL muszą być zgodne z plikiem źródłowym kopii zapasowej. W szczególności nazwa `schema` musi być identyczna.
* **Dopasowanie wtyczek komercyjnych**: Prosimy upewnić się, że posiadają Państwo i włączyli wszystkie wtyczki komercyjne wymagane przez rozwiązanie, w przeciwnym razie przywracanie zostanie przerwane.

---

## Metoda 2: Bezpośredni import pliku SQL (uniwersalna, bardziej odpowiednia dla wersji Community)

Ta metoda polega na przywracaniu danych poprzez bezpośrednie operacje na bazie danych, omijając wtyczkę „Menedżer kopii zapasowych”, dzięki czemu nie ma ograniczeń wersji Pro/Enterprise.

### Główne cechy

* **Zalety**:
  1. **Brak ograniczeń wersji**: Odpowiednia dla wszystkich użytkowników NocoBase, w tym wersji Community.
  2. **Wysoka kompatybilność**: Nie zależy od narzędzia `dump` wewnątrz aplikacji; wystarczy możliwość połączenia z bazą danych.
  3. **Wysoka odporność na błędy**: Jeśli rozwiązanie zawiera wtyczki komercyjne, których Państwo nie posiadają, powiązane funkcje nie zostaną włączone, ale nie wpłynie to na normalne korzystanie z innych funkcji, a aplikacja uruchomi się pomyślnie.
* **Ograniczenia**:
  1. **Wymagana umiejętność obsługi bazy danych**: Użytkownik musi posiadać podstawowe umiejętności obsługi bazy danych, np. wiedzieć, jak wykonać plik `.sql`.
  2. **Utrata plików systemowych**: **Ta metoda spowoduje utratę wszystkich plików systemowych**, w tym plików szablonów wydruku, plików przesłanych w polach plików w tabelach itp.

### Kroki operacyjne

**Krok 1: Przygotowanie czystej bazy danych**

Przygotować zupełnie nową, pustą bazę danych dla danych, które zostaną zaimportowane.

**Krok 2: Import pliku `.sql` do bazy danych**

Pobrać plik bazy danych (zazwyczaj w formacie `.sql`) i zaimportować jego zawartość do bazy danych przygotowanej w poprzednim kroku. Istnieje wiele sposobów wykonania tego zadania, zależnie od środowiska:

* **Opcja A: Przez wiersz poleceń serwera (na przykładzie Dockera)**
  Jeśli używają Państwo Dockera do instalacji NocoBase i bazy danych, można przesłać plik `.sql` na serwer, a następnie użyć polecenia `docker exec` do wykonania importu. Zakładając, że kontener PostgreSQL nazywa się `my-nocobase-db`, a nazwa pliku to `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Skopiowanie pliku sql do wnętrza kontenera
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Wejście do kontenera i wykonanie polecenia importu
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Opcja B: Przez zdalnego klienta bazy danych (Navicat itp.)**
  Jeśli port bazy danych jest udostępniony, można użyć dowolnego graficznego klienta bazy danych (takiego jak Navicat, DBeaver, pgAdmin itp.), aby połączyć się z bazą danych, a następnie:
  1. Kliknąć prawym przyciskiem myszy docelową bazę danych
  2. Wybrać „Uruchom plik SQL” lub „Wykonaj skrypt SQL”
  3. Wybrać pobrany plik `.sql` i go wykonać

**Krok 3: Połączenie z bazą danych i uruchomienie aplikacji**

Skonfigurować parametry uruchamiania NocoBase (takie jak zmienne środowiskowe `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` itp.), aby wskazywały na bazę danych, do której właśnie zaimportowano dane. Następnie normalnie uruchomić usługę NocoBase.

### Uwagi

* **Uprawnienia bazy danych**: Ta metoda wymaga posiadania konta i hasła umożliwiającego bezpośrednie operacje na bazie danych.
* **Status wtyczek**: Po pomyślnym imporcie dane wtyczek komercyjnych zawartych w systemie będą istnieć, ale jeśli nie zainstalowali Państwo i nie włączyli lokalnie odpowiednich wtyczek, powiązane funkcje nie będą wyświetlane ani dostępne, jednak nie spowoduje to awarii aplikacji.

---

## Podsumowanie i porównanie

| Cecha | Metoda 1: Menedżer kopii zapasowych | Metoda 2: Bezpośredni import SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Docelowi użytkownicy** | Użytkownicy wersji **Pro/Enterprise** | **Wszyscy użytkownicy** (w tym Community) |
| **Łatwość obsługi** | ⭐⭐⭐⭐⭐ (Bardzo prosta, operacje w UI) | ⭐⭐⭐ (Wymaga podstawowej wiedzy o bazach danych) |
| **Wymagania środowiskowe** | **Surowe**, baza danych i wersja systemu muszą być wysoce kompatybilne | **Ogólne**, wymaga kompatybilności bazy danych |
| **Zależność od wtyczek** | **Silna zależność**, wtyczki są weryfikowane podczas przywracania; brak jakiejkolwiek wtyczki spowoduje **niepowodzenie przywracania**. | **Funkcje silnie zależą od wtyczek**. Dane można zaimportować niezależnie, system posiada podstawowe funkcje. Jednak w przypadku braku odpowiednich wtyczek, powiązane funkcje będą **całkowicie bezużyteczne**. |
| **Pliki systemowe** | **W pełni zachowane** (szablony wydruku, przesłane pliki itp.) | **Zostaną utracone** (szablony wydruku, przesłane pliki itp.) |
| **Zalecane scenariusze** | Użytkownicy korporacyjni, środowisko kontrolowane i spójne, potrzeba pełnej funkcjonalności | Brak niektórych wtyczek, dążenie do wysokiej kompatybilności i elastyczności, użytkownicy wersji innej niż Pro/Enterprise, akceptacja braku funkcji plików |

Mamy nadzieję, że ten samouczek pomoże Państwu pomyślnie wdrożyć system CRM 2.0. Jeśli podczas operacji napotkają Państwo jakiekolwiek problemy, prosimy o kontakt!