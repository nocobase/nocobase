---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API-sleutels

## Introductie

## Gebruiksaanwijzing

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API-sleutel toevoegen

![](https://static-docs.nocobase.com/461872fc0ad9a96fa5b14e97fcba12.png)

**Belangrijke opmerkingen**

- De API-sleutel wordt aangemaakt voor de huidige gebruiker en neemt de rol van die gebruiker over.
- Zorg ervoor dat de omgevingsvariabele `APP_KEY` is geconfigureerd en vertrouwelijk blijft. Als de APP_KEY wijzigt, worden alle eerder toegevoegde API-sleutels ongeldig.

### Hoe configureert u de APP_KEY

Voor de Docker-versie, wijzig het `docker-compose.yml` bestand:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Bij een installatie via de broncode of met `create-nocobase-app`, kunt u de `APP_KEY` direct aanpassen in het `.env` bestand:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```