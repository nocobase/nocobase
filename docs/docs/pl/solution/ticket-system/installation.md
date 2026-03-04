:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/solution/ticket-system/installation).
:::

# Jak zainstalować

> Obecna wersja wykorzystuje formę **kopii zapasowej i przywracania** do wdrażania. W kolejnych wersjach możemy zmienić ją na formę **migracji przyrostowej**, aby ułatwić integrację rozwiązania z Państwa istniejącymi systemami.

Aby umożliwić Państwu szybkie i sprawne wdrożenie rozwiązania zgłoszeń do własnego środowiska NocoBase, udostępniamy dwie metody przywracania. Prosimy o wybór tej, która najlepiej odpowiada Państwa wersji użytkownika i zapleczu technicznemu.

Zanim Państwo zaczną, prosimy upewnić się, że:

- Posiadają Państwo podstawowe środowisko uruchomieniowe NocoBase. W sprawie instalacji głównego systemu prosimy zapoznać się z bardziej szczegółową [oficjalną dokumentacją instalacji](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Wersja NocoBase **2.0.0-beta.5 i nowsze**
- Pobrali Państwo odpowiednie pliki systemu zgłoszeń:
  - **Plik kopii zapasowej**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - dotyczy metody pierwszej
  - **Plik SQL**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - dotyczy metody drugiej

**Ważne uwagi**:
- Niniejsze rozwiązanie zostało przygotowane w oparciu o bazę danych **PostgreSQL 16**, prosimy upewnić się, że Państwa środowisko korzysta z PostgreSQL 16.
- **DB_UNDERSCORED nie może mieć wartości true**: Prosimy sprawdzić plik `docker-compose.yml` i upewnić się, że zmienna środowiskowa `DB_UNDERSCORED` nie jest ustawiona na `true`, w przeciwnym razie wystąpi konflikt z kopią zapasową rozwiązania, co doprowadzi do niepowodzenia przywracania.

---

## Metoda 1: Przywracanie za pomocą Menedżera kopii zapasowych (zalecane dla użytkowników wersji Pro/Enterprise)

Ta metoda wykorzystuje wbudowaną w NocoBase wtyczkę "[Menedżer kopii zapasowych](https://docs-cn.nocobase.com/handbook/backups)" (wersja Pro/Enterprise) do przywracania jednym kliknięciem, co jest najprostszym sposobem. Ma ona jednak pewne wymagania dotyczące środowiska i wersji użytkownika.

### Kluczowe cechy

* **Zalety**:
  1. **Wygoda obsługi**: Można to zrobić w interfejsie użytkownika (UI), co pozwala na pełne przywrócenie wszystkich konfiguracji, w tym wtyczek.
  2. **Kompletne przywracanie**: **Możliwość przywrócenia wszystkich plików systemowych**, w tym plików szablonów wydruku, plików przesłanych w polach plików w tabelach itp., zapewniając pełną funkcjonalność.
* **Ograniczenia**:
  1. **Tylko dla wersji Pro/Enterprise**: "Menedżer kopii zapasowych" to wtyczka klasy korporacyjnej, dostępna tylko dla użytkowników wersji Pro/Enterprise.
  2. **Rygorystyczne wymagania środowiskowe**: Wymaga, aby Państwa środowisko bazy danych (wersja, zestaw znaków i ustawienia wielkości liter itp.) było wysoce kompatybilne ze środowiskiem, w którym utworzono kopię zapasową.
  3. **Zależność od wtyczek**: Jeśli rozwiązanie zawiera wtyczki komercyjne, których nie ma w Państwa lokalnym środowisku, przywracanie zakończy się niepowodzeniem.

### Kroki operacyjne

**Krok 1: [Zdecydowanie zalecane] Uruchomienie aplikacji przy użyciu obrazu `full`**

Aby uniknąć niepowodzenia przywracania z powodu braku klienta bazy danych, zdecydowanie zalecamy korzystanie z wersji `full` obrazu Docker. Zawiera ona wszystkie niezbędne programy towarzyszące, dzięki czemu nie trzeba przeprowadzać dodatkowej konfiguracji.

Przykład polecenia do pobrania obrazu:

```bash
docker pull nocobase/nocobase:beta-full
```

Następnie należy użyć tego obrazu do uruchomienia usługi NocoBase.

> **Uwaga**: Jeśli nie użyją Państwo obrazu `full`, może być konieczne ręczne zainstalowanie klienta bazy danych `pg_dump` wewnątrz kontenera, co jest procesem uciążliwym i niestabilnym.

**Krok 2: Włączenie wtyczki "Menedżer kopii zapasowych"**

1. Zalogować się do systemu NocoBase.
2. Przejść do **`Zarządzanie wtyczkami`**.
3. Znaleźć i włączyć wtyczkę **`Menedżer kopii zapasowych`**.

**Krok 3: Przywracanie z lokalnego pliku kopii zapasowej**

1. Po włączeniu wtyczki odświeżyć stronę.
2. Przejść do menu po lewej stronie: **`Administracja systemem`** -> **`Menedżer kopii zapasowych`**.
3. Kliknąć przycisk **`Przywróć z lokalnej kopii zapasowej`** w prawym górnym rogu.
4. Przeciągnąć pobrany plik kopii zapasowej do obszaru przesyłania.
5. Kliknąć **`Prześlij`** i cierpliwie czekać na zakończenie przywracania przez system; proces ten może potrwać od kilkudziesięciu sekund do kilku minut.

### Uwagi

* **Kompatybilność bazy danych**: Jest to najważniejszy punkt tej metody. **Wersja, zestaw znaków i ustawienia wielkości liter** Państwa bazy danych PostgreSQL muszą być zgodne z plikiem źródłowym kopii zapasowej. W szczególności nazwa `schema` musi być identyczna.
* **Dopasowanie wtyczek komercyjnych**: Prosimy upewnić się, że posiadają Państwo i włączyli wszystkie wtyczki komercyjne wymagane przez rozwiązanie, w przeciwnym razie przywracanie zostanie przerwane.

---

## Metoda 2: Bezpośredni import pliku SQL (uniwersalna, bardziej odpowiednia dla wersji Community)

Ta metoda przywraca dane poprzez bezpośrednie operacje na bazie danych, omijając wtyczkę "Menedżer kopii zapasowych", dzięki czemu nie ma ograniczeń dotyczących wtyczek wersji Pro/Enterprise.

### Kluczowe cechy

* **Zalety**:
  1. **Brak ograniczeń wersji**: Dotyczy wszystkich użytkowników NocoBase, w tym wersji Community.
  2. **Wysoka kompatybilność**: Nie zależy od narzędzia `dump` wewnątrz aplikacji; działa tak długo, jak można połączyć się z bazą danych.
  3. **Wysoka odporność na błędy**: Jeśli rozwiązanie zawiera wtyczki komercyjne, których Państwo nie posiadają, powiązane funkcje nie zostaną włączone, ale nie wpłynie to na normalne korzystanie z innych funkcji, a aplikacja uruchomi się pomyślnie.
* **Ograniczenia**:
  1. **Wymaga umiejętności obsługi bazy danych**: Użytkownik musi posiadać podstawowe umiejętności obsługi bazy danych, np. jak wykonać plik `.sql`.
  2. **Utrata plików systemowych**: **Ta metoda spowoduje utratę wszystkich plików systemowych**, w tym plików szablonów wydruku, plików przesłanych w polach plików w tabelach itp.

### Kroki operacyjne

**Krok 1: Przygotowanie czystej bazy danych**

Przygotować zupełnie nową, pustą bazę danych dla danych, które zostaną zaimportowane.

**Krok 2: Import pliku `.sql` do bazy danych**

Pobrać plik bazy danych (zazwyczaj w formacie `.sql`) i zaimportować jego zawartość do bazy danych przygotowanej w poprzednim kroku. Istnieje wiele sposobów wykonania tego zadania, w zależności od środowiska:

* **Opcja A: Przez linię komend serwera (na przykładzie Dockera)**
  Jeśli używają Państwo Dockera do instalacji NocoBase i bazy danych, można przesłać plik `.sql` na serwer, a następnie użyć polecenia `docker exec` do wykonania importu. Zakładając, że Państwa kontener PostgreSQL nazywa się `my-nocobase-db`, a plik to `ticket_system.sql`:

  ```bash
  # Skopiowanie pliku sql do wnętrza kontenera
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Wejście do kontenera i wykonanie polecenia importu
  docker exec -it my-nocobase-db psql -U twoja_nazwa_użytkownika -d twoja_nazwa_bazy_danych -f /tmp/ticket_system.sql
  ```
* **Opcja B: Przez zdalnego klienta bazy danych**
  Jeśli port bazy danych jest wystawiony, można użyć dowolnego graficznego klienta bazy danych (takiego jak DBeaver, Navicat, pgAdmin itp.), aby połączyć się z bazą danych, otworzyć nowe okno zapytania, wkleić całą zawartość pliku `.sql` i ją wykonać.

**Krok 3: Połączenie z bazą danych i uruchomienie aplikacji**

Skonfigurować parametry uruchomieniowe NocoBase (takie jak zmienne środowiskowe `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` itp.), aby wskazywały na bazę danych, do której właśnie zaimportowano dane. Następnie normalnie uruchomić usługę NocoBase.

### Uwagi

* **Uprawnienia bazy danych**: Ta metoda wymaga posiadania konta i hasła z uprawnieniami do bezpośredniego operowania na bazie danych.
* **Status wtyczek**: Po pomyślnym imporcie, mimo że dane wtyczek komercyjnych istnieją w systemie, jeśli nie zainstalowali i nie włączyli Państwo odpowiednich wtyczek lokalnie, powiązane funkcje nie będą wyświetlane ani dostępne, ale nie spowoduje to awarii aplikacji.

---

## Podsumowanie i porównanie

| Cecha | Metoda 1: Menedżer kopii zapasowych | Metoda 2: Bezpośredni import SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Docelowi użytkownicy** | Użytkownicy wersji **Pro/Enterprise** | **Wszyscy użytkownicy** (w tym Community) |
| **Łatwość obsługi** | ⭐⭐⭐⭐⭐ (Bardzo prosta, operacje w UI) | ⭐⭐⭐ (Wymaga podstawowej wiedzy o bazach danych) |
| **Wymagania środowiskowe** | **Rygorystyczne**, wersje bazy danych i systemu muszą być wysoce kompatybilne | **Ogólne**, wymagana kompatybilność bazy danych |
| **Zależność od wtyczek** | **Silna zależność**, wtyczki są weryfikowane podczas przywracania; brak jakiejkolwiek wtyczki spowoduje **niepowodzenie przywracania**. | **Funkcje silnie zależą od wtyczek**. Dane można importować niezależnie, system posiada podstawowe funkcje. Jednak w przypadku braku odpowiednich wtyczek, powiązane funkcje będą **całkowicie bezużyteczne**. |
| **Pliki systemowe** | **W pełni zachowane** (szablony wydruku, przesłane pliki itp.) | **Zostaną utracone** (szablony wydruku, przesłane pliki itp.) |
| **Zalecane scenariusze** | Użytkownicy korporacyjni, ze środowiskiem kontrolowanym i spójnym, potrzebujący pełnej funkcjonalności | Brak niektórych wtyczek, dążenie do wysokiej kompatybilności i elastyczności, użytkownicy wersji innej niż Pro/Enterprise, akceptacja braku funkcji plikowych |

Mamy nadzieję, że ten samouczek pomoże Państwu pomyślnie wdrożyć system zgłoszeń. Jeśli napotkają Państwo jakiekolwiek problemy podczas operacji, prosimy o kontakt w dowolnym momencie!