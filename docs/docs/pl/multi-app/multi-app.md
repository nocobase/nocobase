---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Wiele aplikacji


## Wprowadzenie

**Wtyczka Multi-app** umożliwia dynamiczne tworzenie i zarządzanie wieloma niezależnymi aplikacjami bez konieczności oddzielnego wdrażania. Każda podaplikacja to całkowicie niezależna instancja, posiadająca własną bazę danych, wtyczki i konfigurację.

#### Scenariusze użycia
- **Wielodzierżawność**: Zapewnia niezależne instancje aplikacji, gdzie każdy klient posiada własne dane, konfiguracje wtyczek i system uprawnień.
- **Systemy główne i podrzędne dla różnych domen biznesowych**: Duży system składający się z wielu niezależnie wdrożonych mniejszych aplikacji.


:::warning
Wtyczka Multi-app sama w sobie nie zapewnia możliwości współdzielenia użytkowników.  
Jeśli potrzebują Państwo współdzielić użytkowników między wieloma aplikacjami, można ją połączyć z **[wtyczką Uwierzytelniania](/auth-verification)**.
:::


## Instalacja

W menedżerze wtyczek proszę znaleźć wtyczkę **Multi-app** i ją włączyć.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Instrukcja użytkowania


### Tworzenie podaplikacji

W menu ustawień systemowych proszę kliknąć „Wiele aplikacji”, aby przejść do strony zarządzania wieloma aplikacjami:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Proszę kliknąć przycisk „Dodaj nową”, aby utworzyć nową podaplikację:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Opis pól formularza

* **Nazwa**: Identyfikator podaplikacji, globalnie unikalny.
* **Nazwa wyświetlana**: Nazwa podaplikacji wyświetlana w interfejsie.
* **Tryb uruchamiania**:
  * **Uruchom przy pierwszej wizycie**: Podaplikacja uruchamia się tylko wtedy, gdy użytkownik po raz pierwszy uzyska do niej dostęp za pośrednictwem adresu URL.
  * **Uruchom razem z główną aplikacją**: Podaplikacja uruchamia się jednocześnie z główną aplikacją (spowoduje to wydłużenie czasu uruchamiania głównej aplikacji).
* **Port**: Numer portu używany przez podaplikację podczas działania.
* **Niestandardowa domena**: Konfiguracja niezależnej subdomeny dla podaplikacji.
* **Przypnij do menu**: Przypięcie wpisu podaplikacji do lewej strony górnego paska nawigacyjnego.
* **Połączenie z bazą danych**: Służy do konfiguracji źródła danych dla podaplikacji, obsługując następujące trzy metody:
  * **Nowa baza danych**: Ponowne użycie bieżącej usługi danych w celu utworzenia niezależnej bazy danych.
  * **Nowe połączenie danych**: Konfiguracja całkowicie nowej usługi bazy danych.
  * **Tryb schematu**: Utworzenie niezależnego schematu dla podaplikacji w PostgreSQL.
* **Aktualizacja**: Jeśli podłączona baza danych zawiera starszą wersję struktury danych NocoBase, zostanie ona automatycznie zaktualizowana do bieżącej wersji.


### Uruchamianie i zatrzymywanie podaplikacji

Proszę kliknąć przycisk **Uruchom**, aby uruchomić podaplikację;  
> Jeśli podczas tworzenia zaznaczono opcję *„Uruchom przy pierwszej wizycie”*, podaplikacja uruchomi się automatycznie przy pierwszej wizycie.  

Proszę kliknąć przycisk **Wyświetl**, aby otworzyć podaplikację w nowej karcie.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Stan i logi podaplikacji

Na liście mogą Państwo sprawdzić zużycie pamięci i procesora przez każdą aplikację.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Proszę kliknąć przycisk **Logi**, aby wyświetlić logi działania podaplikacji.  
> Jeśli podaplikacja jest niedostępna po uruchomieniu (np. z powodu uszkodzonej bazy danych), mogą Państwo użyć logów do diagnostyki problemu.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Usuwanie podaplikacji

Proszę kliknąć przycisk **Usuń**, aby usunąć podaplikację.  
> Podczas usuwania mogą Państwo wybrać, czy baza danych również ma zostać usunięta. Proszę postępować ostrożnie, ponieważ tej operacji nie można cofnąć.


### Dostęp do podaplikacji
Domyślnie dostęp do podaplikacji uzyskuje się za pomocą `/_app/:appName/admin/`, na przykład:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Mogą Państwo również skonfigurować niezależną subdomenę dla podaplikacji. Będą Państwo musieli przekierować domenę na bieżący adres IP, a jeśli używają Państwo Nginxa, należy również dodać domenę do konfiguracji Nginxa.


### Zarządzanie podaplikacjami za pomocą wiersza poleceń

W katalogu głównym projektu mogą Państwo używać wiersza poleceń do zarządzania instancjami podaplikacji za pośrednictwem **PM2**:

```bash
yarn nocobase pm2 list              # Wyświetla listę aktualnie uruchomionych instancji
yarn nocobase pm2 stop [appname]    # Zatrzymuje proces konkretnej podaplikacji
yarn nocobase pm2 delete [appname]  # Usuwa proces konkretnej podaplikacji
yarn nocobase pm2 kill              # Wymusza zakończenie wszystkich uruchomionych procesów (może to obejmować instancję głównej aplikacji)
```

### Migracja danych ze starszej wersji wtyczki Multi-app

Proszę przejść do starej strony zarządzania wieloma aplikacjami i kliknąć przycisk **Migruj dane do nowej wersji Multi-app**, aby przeprowadzić migrację danych.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Często zadawane pytania

#### 1. Zarządzanie wtyczkami
Podaplikacje mogą używać tych samych wtyczek co główna aplikacja (włącznie z wersjami), ale mogą być konfigurowane i używane niezależnie.

#### 2. Izolacja baz danych
Podaplikacje mogą być konfigurowane z niezależnymi bazami danych. Jeśli chcą Państwo współdzielić dane między aplikacjami, można to zrobić za pośrednictwem zewnętrznych źródeł danych.

#### 3. Tworzenie kopii zapasowych i migracja danych
Obecnie kopie zapasowe danych w głównej aplikacji nie obejmują danych podaplikacji (tylko podstawowe informacje o podaplikacji). Muszą Państwo ręcznie tworzyć kopie zapasowe i migrować dane w każdej podaplikacji.

#### 4. Wdrożenie i aktualizacje
Wersja podaplikacji zostanie automatycznie zaktualizowana wraz z główną aplikacją, zapewniając spójność wersji między aplikacją główną a podaplikacjami.

#### 5. Zarządzanie zasobami
Zużycie zasobów przez każdą podaplikację jest zasadniczo takie samo jak w przypadku głównej aplikacji. Obecnie pojedyncza aplikacja zużywa około 500-600 MB pamięci.