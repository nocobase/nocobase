:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Uaktualnianie instalacji Docker

:::warning Przed uaktualnieniem

- Proszę koniecznie wykonać kopię zapasową bazy danych.

:::

## 1. Przejście do katalogu z plikiem `docker-compose.yml`

Na przykład:

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Aktualizacja numeru wersji obrazu

:::tip Informacje o numerach wersji

- Wersje aliasowe, takie jak `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, zazwyczaj nie wymagają modyfikacji.
- Numeryczne wersje, takie jak `1.7.14`, `1.7.14-full`, należy zmienić na docelowy numer wersji.
- Obsługiwane są tylko uaktualnienia; obniżanie wersji nie jest możliwe!!!
- W środowisku produkcyjnym zalecamy przypisanie konkretnego numeru wersji, aby uniknąć nieumyślnych automatycznych uaktualnień. [Zobacz wszystkie wersje](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Zalecamy użycie obrazu z Alibaba Cloud (dla stabilniejszej sieci)
    image: nocobase/nocobase:1.7.14-full
    # Można również użyć wersji aliasowej (może automatycznie się uaktualnić, używać ostrożnie w środowisku produkcyjnym)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (w Polsce może być wolniej/niepowodzenie)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Ponowne uruchomienie kontenera

```bash
# Pobranie najnowszego obrazu
docker compose pull app

# Ponowne utworzenie kontenera
docker compose up -d app

# Sprawdzenie statusu procesu aplikacji
docker compose logs -f app
```

## 4. Uaktualnianie wtyczek (pluginów) innych firm

Proszę zapoznać się z [Instalacja i uaktualnianie wtyczek](../install-upgrade-plugins.mdx).

## 5. Instrukcje dotyczące wycofywania zmian

NocoBase nie obsługuje obniżania wersji. Jeśli zajdzie potrzeba wycofania zmian, proszę przywrócić kopię zapasową bazy danych sprzed uaktualnienia i zmienić wersję obrazu z powrotem na oryginalną.

## 6. Często zadawane pytania (FAQ)

**P: Wolne lub nieudane pobieranie obrazu**

Może to być spowodowane problemami z siecią. Proszę spróbować skonfigurować przyspieszenie pobierania obrazów Docker lub użyć obrazu z Alibaba Cloud: `nocobase/nocobase:<tag>`. Można też spróbować ponownie później.

**P: Wersja nie uległa zmianie**

Proszę potwierdzić, że zmienili Państwo `image` na nowy numer wersji oraz pomyślnie wykonali polecenia `docker compose pull app` i `up -d app`.

**P: Nieudane pobieranie lub aktualizacja wtyczki komercyjnej**

W przypadku wtyczek komercyjnych proszę zweryfikować klucz licencyjny w systemie, a następnie ponownie uruchomić kontener Docker. Szczegóły znajdą Państwo w [Przewodniku aktywacji licencji komercyjnej NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).