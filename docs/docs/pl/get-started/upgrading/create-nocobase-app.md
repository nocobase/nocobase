:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Aktualizacja instalacji `create-nocobase-app`

:::warning Przygotowanie przed aktualizacją

- Proszę koniecznie najpierw wykonać kopię zapasową bazy danych.
- Proszę zatrzymać działającą instancję NocoBase.

:::

## 1. Zatrzymanie działającej instancji NocoBase

Jeśli proces nie działa w tle, można go zatrzymać za pomocą `Ctrl + C`. W środowisku produkcyjnym proszę użyć polecenia `pm2-stop`.

```bash
yarn nocobase pm2-stop
```

## 2. Wykonanie polecenia aktualizacji

Wystarczy wykonać polecenie aktualizacji `yarn nocobase upgrade`.

```bash
# Proszę przejść do odpowiedniego katalogu
cd my-nocobase-app
# Proszę wykonać polecenie aktualizacji
yarn nocobase upgrade
# Proszę uruchomić
yarn dev
```

### Aktualizacja do konkretnej wersji

Proszę zmodyfikować plik `package.json` w katalogu głównym projektu, zmieniając numery wersji dla `@nocobase/cli` i `@nocobase/devtools`. Proszę pamiętać, że możliwa jest tylko aktualizacja, a nie obniżenie wersji. Na przykład:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Następnie proszę wykonać polecenie aktualizacji:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```