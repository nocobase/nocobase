:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Chiave API

## Introduzione

## Installazione

## Istruzioni per l'uso

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Aggiungere una Chiave API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Note**

- La Chiave API che aggiunge appartiene all'utente corrente e ne eredita il ruolo.
- Si assicuri che la variabile d'ambiente `APP_KEY` sia configurata e mantenuta confidenziale. Se `APP_KEY` dovesse cambiare, tutte le Chiavi API precedentemente aggiunte diventeranno non valide.

### Come configurare `APP_KEY`

Per la versione Docker, modifichi il file `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Per l'installazione da codice sorgente o tramite `create-nocobase-app`, può modificare direttamente la `APP_KEY` nel file `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```