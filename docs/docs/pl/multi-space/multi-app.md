---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/multi-space/multi-app).
:::

# Wiele aplikacji (Multi-app)


## Wprowadzenie

**Wtyczka Multi-app** umożliwia dynamiczne tworzenie i zarządzanie wieloma niezależnymi aplikacjami bez konieczności osobnego wdrażania każdej z nich. Każda podaplikacja jest całkowicie niezależną instancją, posiadającą własną bazę danych, wtyczki i konfiguracje.

#### Scenariusze użycia
- **Multi-tenancy (Wielonajemność)**: Dostarczanie niezależnych instancji aplikacji, w których każdy klient posiada własne dane, konfiguracje wtyczek i system uprawnień.
- **Systemy główne i podsystemy dla różnych obszarów biznesowych**: Duży system złożony z kilku niezależnie wdrożonych mniejszych aplikacji.


:::warning
Wtyczka Multi-app sama w sobie nie zapewnia możliwości współdzielenia użytkowników.  
Aby umożliwić integrację użytkowników między wieloma aplikacjami, można jej użyć w połączeniu z **[Wtyczką Authentication](/auth-verification)**.
:::


## Instalacja

Znajdź wtyczkę **Multi-app** w menedżerze wtyczek i włącz ją.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Instrukcja obsługi


### Tworzenie podaplikacji

W menu ustawień systemowych kliknij „Multi-app”, aby przejść do strony zarządzania wieloma aplikacjami:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Kliknij przycisk „Dodaj nową”, aby utworzyć nową podaplikację:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Opis pól formularza

* **Nazwa**: Identyfikator podaplikacji, unikalny w skali globalnej.
* **Nazwa wyświetlana**: Nazwa podaplikacji wyświetlana w interfejsie.
* **Tryb uruchamiania**:
  * **Uruchom przy pierwszym dostępie**: Podaplikacja uruchamia się dopiero wtedy, gdy użytkownik odwiedzi ją po raz pierwszy przez adres URL.
  * **Uruchom wraz z aplikacją główną**: Podaplikacja uruchamia się jednocześnie z aplikacją główną (zwiększa to czas uruchamiania aplikacji głównej).
* **Port**: Numer portu używany przez podaplikację podczas pracy.
* **Własna domena**: Konfiguracja niezależnej subdomeny dla podaplikacji.
* **Przypnij do menu**: Przypina skrót do podaplikacji po lewej stronie górnego paska nawigacyjnego.
* **Połączenie z bazą danych**: Służy do konfiguracji źródła danych dla podaplikacji, obsługując trzy metody:
  * **Nowa baza danych**: Ponowne wykorzystanie bieżącej usługi danych do utworzenia niezależnej bazy danych.
  * **Nowe połączenie danych**: Konfiguracja zupełnie nowej usługi bazy danych.
  * **Tryb schematu (Schema)**: Tworzy niezależny schemat (Schema) dla podaplikacji w bazie PostgreSQL.
* **Aktualizacja**: Jeśli podłączona baza danych zawiera starszą wersję struktury danych NocoBase, zostanie ona automatycznie zaktualizowana do bieżącej wersji.


### Uruchamianie i zatrzymywanie podaplikacji

Kliknij przycisk **Uruchom**, aby uruchomić podaplikację.  
> Jeśli podczas tworzenia zaznaczono opcję *„Uruchom przy pierwszym dostępie”*, aplikacja uruchomi się automatycznie przy pierwszej wizycie.  

Kliknij przycisk **Widok**, aby otworzyć podaplikację w nowej karcie.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Status pracy i logi podaplikacji

Na liście można sprawdzić zużycie pamięci RAM i procesora (CPU) przez każdą aplikację.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Kliknij przycisk **Logi**, aby wyświetlić logi uruchomieniowe podaplikacji.  
> Jeśli podaplikacja jest niedostępna po uruchomieniu (np. z powodu uszkodzenia bazy danych), można zdiagnozować problem za pomocą logów.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Usuwanie podaplikacji

Kliknij przycisk **Usuń**, aby usunąć podaplikację.  
> Podczas usuwania można wybrać, czy usunąć również bazę danych. Prosimy o zachowanie ostrożności, ponieważ ta operacja jest nieodwracalna.


### Dostęp do podaplikacji
Domyślnie do podaplikacji uzyskuje się dostęp przez `/_app/:appName/admin/`, na przykład:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Dodatkowo można skonfigurować niezależne subdomeny dla podaplikacji. Należy skierować domenę na bieżący adres IP. W przypadku korzystania z Nginx, domenę należy również dodać do konfiguracji Nginx.


### Zarządzanie podaplikacjami przez CLI

W katalogu głównym projektu można zarządzać instancjami podaplikacji za pomocą linii poleceń i **PM2**:

```bash
yarn nocobase pm2 list              # Wyświetla listę aktualnie uruchomionych instancji
yarn nocobase pm2 stop [appname]    # Zatrzymuje proces konkretnej podaplikacji
yarn nocobase pm2 delete [appname]  # Usuwa proces konkretnej podaplikacji
yarn nocobase pm2 kill              # Wymusza zakończenie wszystkich uruchomionych procesów (może obejmować instancję aplikacji głównej)
```

### Migracja danych ze starszej wersji Multi-app

Przejdź do strony zarządzania starszą wersją Multi-app i kliknij przycisk **Migruj dane do nowej wersji Multi-app**, aby przeprowadzić migrację.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## FAQ

#### 1. Zarządzanie wtyczkami
Podaplikacje mogą korzystać z tych samych wtyczek co aplikacja główna (w tym samym wersjach), ale wtyczki mogą być konfigurowane i używane niezależnie w każdej z nich.

#### 2. Izolacja bazy danych
Podaplikacje mogą mieć skonfigurowane niezależne bazy danych. Jeśli chcą Państwo współdzielić dane między aplikacjami, można to osiągnąć poprzez zewnętrzne źródło danych.

#### 3. Kopia zapasowa i migracja danych
Obecnie kopia zapasowa danych w aplikacji głównej nie obejmuje danych podaplikacji (zawiera jedynie podstawowe informacje o nich). Kopie zapasowe i migracje muszą być wykonywane ręcznie wewnątrz każdej podaplikacji.

#### 4. Wdrażanie i aktualizacje
Wersje podaplikacji będą automatycznie podążać za aktualizacjami aplikacji głównej, co zapewnia spójność wersji między aplikacją główną a podaplikacjami.

#### 5. Zarządzanie zasobami
Zużycie zasobów przez każdą podaplikację jest zasadniczo takie samo jak w przypadku aplikacji głównej. Obecnie zużycie pamięci przez pojedynczą aplikację wynosi około 500-600 MB.