:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API-sleutel

## Introductie

## Installatie

## Gebruiksaanwijzing

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API-sleutel toevoegen

![](https://static-docs.nocobase.com/46181872fc0ad9a96fa5b14e97fcba12.png)

**Belangrijke opmerkingen**

- De API-sleutel die u toevoegt, is gekoppeld aan de huidige gebruiker en erft de rol van die gebruiker.
- Zorg ervoor dat de omgevingsvariabele `APP_KEY` is geconfigureerd en vertrouwelijk blijft. Als de `APP_KEY` wijzigt, worden alle eerder toegevoegde API-sleutels ongeldig.

### Hoe u de `APP_KEY` configureert

Voor de Docker-versie wijzigt u het `docker-compose.yml`-bestand:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Voor installaties via de broncode of `create-nocobase-app` kunt u de `APP_KEY` direct aanpassen in het `.env`-bestand:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```