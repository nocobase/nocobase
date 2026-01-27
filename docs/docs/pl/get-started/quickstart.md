---
versions:
  - label: Najnowsza (Stabilna)
    features: Stabilne funkcje, gruntownie przetestowana, tylko poprawki błędów.
    audience: Użytkownicy oczekujący stabilnego działania oraz wdrożenia produkcyjne.
    stability: ★★★★★
    production_recommendation: Zalecana
  - label: Beta (Testowa)
    features: Zawiera nadchodzące funkcje, wstępnie przetestowana, może zawierać drobne problemy.
    audience: Użytkownicy, którzy chcą wypróbować nowe funkcje przed ich wydaniem i przekazać opinię.
    stability: ★★★★☆
    production_recommendation: Używać ostrożnie
  - label: Alpha (Deweloperska)
    features: Wersja w trakcie rozwoju, z najnowszymi funkcjami, ale może być niekompletna lub niestabilna.
    audience: Użytkownicy techniczni i współtwórcy zainteresowani najnowszymi osiągnięciami w rozwoju.
    stability: ★★☆☆☆
    production_recommendation: Używać ostrożnie

install_methods:
  - label: Instalacja Docker (Zalecana)
    features: Nie wymaga pisania kodu, prosta instalacja, idealna do szybkiego wypróbowania.
    scenarios: Użytkownicy bez kodu, użytkownicy chcący szybko wdrożyć na serwer.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Pobierz najnowszy obraz i uruchom ponownie kontener.
  - label: Instalacja create-nocobase-app
    features: Niezależny kod aplikacji, obsługuje rozszerzenia wtyczek i dostosowywanie interfejsu.
    scenarios: Programiści front-end/full-stack, projekty zespołowe, rozwój low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Zaktualizuj zależności za pomocą yarn.
  - label: Instalacja z kodu źródłowego Git
    features: Bezpośredni dostęp do najnowszego kodu źródłowego, możliwość współtworzenia i debugowania.
    scenarios: Deweloperzy techniczni, użytkownicy chcący wypróbować niewydane wersje.
    technical_requirement: ★★★★★
    upgrade_method: Synchronizuj aktualizacje poprzez proces Git.
---

:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Porównanie metod instalacji i wersji

NocoBase można zainstalować na kilka sposobów.

## Porównanie wersji

| Element | **Najnowsza (Stabilna)** | **Beta (Testowa)** | **Alpha (Deweloperska)** |
|------|------------------------|----------------------|-----------------------|
| **Cechy** | Stabilne funkcje, gruntownie przetestowana, tylko poprawki błędów. | Zawiera nadchodzące funkcje, wstępnie przetestowana, może zawierać drobne problemy. | Wersja w trakcie rozwoju, z najnowszymi funkcjami, ale może być niekompletna lub niestabilna. |
| **Dla kogo** | Użytkownicy oczekujący stabilnego działania oraz wdrożenia produkcyjne. | Użytkownicy, którzy chcą wypróbować nowe funkcje przed ich wydaniem i przekazać opinię. | Użytkownicy techniczni i współtwórcy zainteresowani najnowszymi osiągnięciami w rozwoju. |
| **Stabilność** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Zalecana do użytku produkcyjnego** | Zalecana | Używać ostrożnie | Używać ostrożnie |

## Porównanie metod instalacji

| Element | **Instalacja Docker (Zalecana)** | **Instalacja create-nocobase-app** | **Instalacja z kodu źródłowego Git** |
|------|--------------------------|------------------------------|------------------|
| **Cechy** | Nie wymaga pisania kodu, prosta instalacja, idealna do szybkiego wypróbowania. | Niezależny kod aplikacji, obsługuje rozszerzenia wtyczek i dostosowywanie interfejsu. | Bezpośredni dostęp do najnowszego kodu źródłowego, możliwość współtworzenia i debugowania. |
| **Scenariusze użycia** | Użytkownicy bez kodu, użytkownicy chcący szybko wdrożyć na serwer. | Programiści front-end/full-stack, projekty zespołowe, rozwój low-code. | Deweloperzy techniczni, użytkownicy chcący wypróbować niewydane wersje. |
| **Wymagania techniczne** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Metoda aktualizacji** | Pobierz najnowszy obraz i uruchom ponownie kontener. | Zaktualizuj zależności za pomocą yarn. | Synchronizuj aktualizacje poprzez proces Git. |