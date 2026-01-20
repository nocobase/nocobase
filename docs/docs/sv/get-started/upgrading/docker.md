:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Uppgradera en Docker-installation

:::warning Innan ni uppgraderar

- Se till att säkerhetskopiera er databas.

:::

## 1. Gå till katalogen där `docker-compose.yml` finns

Till exempel

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Uppdatera avbildningens versionsnummer

:::tip Om versionsnummer

- Aliasversionsnummer, som `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, behöver vanligtvis inte ändras.
- Numeriska versionsnummer, som `1.7.14`, `1.7.14-full`, måste ändras till det önskade versionsnumret.
- Versionsnummer stöder endast uppgraderingar, inte nedgraderingar!!!
- I en produktionsmiljö rekommenderar vi att ni låser till ett specifikt numeriskt versionsnummer för att undvika oavsiktliga automatiska uppgraderingar. [Se alla versioner](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Rekommenderar att använda Alibaba Cloud-avbildningen (för stabilare nätverk i Kina)
    image: nocobase/nocobase:1.7.14-full
    # Ni kan också använda en aliasversion (kan uppgraderas automatiskt, använd med försiktighet i produktion)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (kan vara långsamt/misslyckas i Kina)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Starta om containern

```bash
# Hämta den senaste avbildningen
docker compose pull app

# Återskapa containern
docker compose up -d app

# Kontrollera status för app-processen
docker compose logs -f app
```

## 4. Uppgradera tredjeparts-plugins

Se [Installera och uppgradera plugins](../install-upgrade-plugins.mdx)

## 5. Instruktioner för återställning

NocoBase stöder inte nedgradering. Om ni behöver återställa, vänligen återställ databasens säkerhetskopia från före uppgraderingen och ändra avbildningens version tillbaka till den ursprungliga versionen.

## 6. Vanliga frågor (FAQ)

**F: Långsam eller misslyckad hämtning av avbildning**

Använd en spegel för att accelerera hämtningen, eller använd Alibaba Cloud-avbildningen `nocobase/nocobase:<tag>`.

**F: Versionen har inte ändrats**

Bekräfta att ni har ändrat `image` till det nya versionsnumret och framgångsrikt kört `docker compose pull app` och `up -d app`.

**F: Nedladdning eller uppdatering av kommersiell plugin misslyckades**

För kommersiella plugins, vänligen verifiera licensnyckeln i systemet och starta sedan om Docker-containern. För mer information, se [Aktiveringsguide för NocoBase kommersiell licens](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).