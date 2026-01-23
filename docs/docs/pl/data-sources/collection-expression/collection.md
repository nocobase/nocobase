:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kolekcja wyrażeń

## Tworzenie szablonu "kolekcji wyrażeń"

Zanim zaczną Państwo używać dynamicznych węzłów operacji wyrażeń w przepływie pracy, należy najpierw utworzyć szablon "kolekcji wyrażeń" za pomocą narzędzia do zarządzania kolekcjami. Kolekcja ta służy do przechowywania różnych wyrażeń:

![Tworzenie kolekcji wyrażeń](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Wprowadzanie danych wyrażeń

Następnie mogą Państwo utworzyć blok tabeli i wprowadzić kilka wpisów formuł do szablonu kolekcji. Każdy wiersz w szablonie "kolekcji wyrażeń" można traktować jako regułę obliczeniową zaprojektowaną dla konkretnego modelu danych w kolekcji. Mogą Państwo wykorzystywać różne pola z modeli danych różnych kolekcji jako zmienne, tworząc unikalne wyrażenia jako reguły obliczeniowe. Co więcej, mogą Państwo w razie potrzeby korzystać z różnych silników obliczeniowych.

![Wprowadzanie danych wyrażeń](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Wskazówka}
Po utworzeniu formuł należy je powiązać z danymi biznesowymi. Bezpośrednie wiązanie każdego wiersza danych biznesowych z danymi formuły może być uciążliwe, dlatego często stosuje się kolekcję metadanych, podobną do kolekcji klasyfikacyjnej, aby utworzyć relację wiele-do-jednego (lub jeden-do-jednego) z kolekcją formuł. Następnie dane biznesowe są powiązane z sklasyfikowanymi metadanymi w relacji wiele-do-jednego. Takie podejście pozwala Państwu po prostu określić odpowiednie sklasyfikowane metadane podczas tworzenia danych biznesowych, co ułatwia odnalezienie i wykorzystanie odpowiadających danych formuły za pośrednictwem ustalonej ścieżki powiązania.
:::

## Ładowanie odpowiednich danych do procesu

Na przykład, proszę utworzyć przepływ pracy wyzwalany zdarzeniem kolekcji. Gdy zamówienie zostanie utworzone, wyzwalacz powinien wstępnie załadować powiązane dane produktów wraz z danymi wyrażeń dotyczącymi produktów:

![Zdarzenie kolekcji_Konfiguracja wyzwalacza](https://static-docs.nocobase.com/f181f1b5b10007afd5de068f3458d2e04.png)