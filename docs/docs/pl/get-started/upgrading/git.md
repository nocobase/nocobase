:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Aktualizacja NocoBase zainstalowanego z kodu źródłowego Git

:::warning Przygotowanie przed aktualizacją

- Proszę pamiętać o wykonaniu kopii zapasowej bazy danych.
- Proszę zatrzymać działającą instancję NocoBase (`Ctrl + C`).

:::

## 1. Przejście do katalogu projektu NocoBase

```bash
cd my-nocobase-app
```

## 2. Pobieranie najnowszego kodu

```bash
git pull
```

## 3. Usuwanie pamięci podręcznej i starych zależności (opcjonalnie)

Jeśli standardowy proces aktualizacji zakończy się niepowodzeniem, mogą Państwo spróbować wyczyścić pamięć podręczną i zależności, a następnie pobrać je ponownie.

```bash
# Wyczyść pamięć podręczną NocoBase
yarn nocobase clean
# Usuń zależności
yarn rimraf -rf node_modules # równoważne z rm -rf node_modules
```

## 4. Aktualizacja zależności

📢 Ze względu na czynniki takie jak środowisko sieciowe i konfiguracja systemu, ten krok może zająć kilkanaście minut.

```bash
yarn install
```

## 5. Wykonanie polecenia aktualizacji

```bash
yarn nocobase upgrade
```

## 6. Uruchamianie NocoBase

```bash
yarn dev
```

:::tip Wskazówka dotycząca środowiska produkcyjnego

Nie zaleca się bezpośredniego wdrażania NocoBase zainstalowanego z kodu źródłowego w środowisku produkcyjnym (w kwestii środowisk produkcyjnych proszę zapoznać się z [Wdrożeniem produkcyjnym](../deployment/production.md)).

:::

## 7. Aktualizacja wtyczek innych firm

Proszę zapoznać się z [Instalacja i aktualizacja wtyczek](../install-upgrade-plugins.mdx).