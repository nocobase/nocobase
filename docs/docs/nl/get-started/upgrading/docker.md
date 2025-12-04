:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Upgraden van een Docker-installatie

:::warning Voor u begint met upgraden

- Zorg ervoor dat u eerst een back-up van uw database maakt.

:::

## 1. Navigeer naar de map met docker-compose.yml

Bijvoorbeeld

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Werk het versienummer van de image bij

:::tip Over versienummers

- Aliasversies, zoals `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, hoeft u meestal niet te wijzigen.
- Numerieke versienummers, zoals `1.7.14`, `1.7.14-full`, moeten worden gewijzigd naar het doelversienummer.
- Alleen upgrades worden ondersteund; downgrades zijn NIET mogelijk!!!
- In een productieomgeving raden we aan om een specifiek numeriek versienummer te gebruiken om onbedoelde automatische upgrades te voorkomen. [Bekijk alle versies](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Aanbevolen om een specifiek versienummer te gebruiken voor productie
    image: nocobase/nocobase:1.7.14-full
    # U kunt ook een aliasversie gebruiken (kan automatisch upgraden, voorzichtig in productie)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
# ...
```

## 3. Herstart de container

```bash
# Haal de nieuwste image op
docker compose pull app

# Herbouw de container
docker compose up -d app

# Controleer de status van het app-proces
docker compose logs -f app
```

## 4. Upgraden van externe plugins

Raadpleeg [Plugins installeren en upgraden](../install-upgrade-plugins.mdx)

## 5. Instructies voor terugdraaien

NocoBase ondersteunt geen downgrades. Als u wilt terugdraaien, herstel dan de databaseback-up van vóór de upgrade en wijzig het image-versienummer terug naar de oorspronkelijke versie.

## 6. Veelgestelde vragen (FAQ)

**V: Trage of mislukte image-pull**

Dit komt vaak door netwerkproblemen. U kunt proberen een Docker-mirror te configureren om downloads te versnellen, of het later opnieuw proberen.

**V: Versie is niet gewijzigd**

Controleer of u de `image` heeft gewijzigd naar het nieuwe versienummer en of u `docker compose pull app` en `up -d app` succesvol heeft uitgevoerd.

**V: Download of update van commerciële plugin mislukt**

Voor commerciële plugins, verifieer de licentiesleutel in het systeem en herstart vervolgens de Docker-container. Voor meer details, zie de [NocoBase Commerciële Licentie Activeringsgids](https://www.nocobase.com/blog/nocobase-commercial-license-activation-guide).