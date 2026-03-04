---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/multi-app/multi-app/index).
:::

# Zarządzanie wieloma aplikacjami

## Przegląd funkcji

Zarządzanie wieloma aplikacjami to ujednolicone rozwiązanie do zarządzania aplikacjami dostarczane przez NocoBase, służące do tworzenia i zarządzania wieloma fizycznie odizolowanymi instancjami aplikacji NocoBase w jednym lub wielu środowiskach wykonawczych. Poprzez regulator aplikacji (AppSupervisor), mogą Państwo tworzyć i utrzymywać wiele aplikacji z poziomu ujednoliconego punktu wejścia, co pozwala zaspokoić potrzeby różnych obszarów biznesowych i etapów rozwoju skali projektu.

## Pojedyncza aplikacja

Na wczesnym etapie projektu większość z Państwa zacznie od pojedynczej aplikacji.

W tym trybie system wymaga wdrożenia tylko jednej instancji NocoBase, a wszystkie funkcje biznesowe, dane i użytkownicy działają w ramach tej samej aplikacji. Wdrożenie jest proste, a koszty konfiguracji niskie, co czyni to rozwiązanie idealnym do weryfikacji prototypów, małych projektów lub narzędzi wewnętrznych.

Jednak wraz ze wzrostem złożoności biznesu, pojedyncza aplikacja napotyka naturalne ograniczenia:

- Funkcje stale się nakładają, przez co system staje się ociężały.
- Trudno jest odizolować od siebie różne obszary biznesowe.
- Koszty rozbudowy i utrzymania aplikacji stale rosną.

W takim momencie mogą Państwo chcieć podzielić różne obszary biznesowe na wiele aplikacji, aby poprawić łatwość utrzymania i skalowalność systemu.

## Wiele aplikacji w pamięci współdzielonej

Gdy chcą Państwo dokonać podziału biznesowego, ale nie chcą wprowadzać złożonej architektury wdrażania i utrzymania, mogą Państwo przejść na tryb wielu aplikacji w pamięci współdzielonej.

W tym trybie w ramach jednej instancji NocoBase może jednocześnie działać wiele aplikacji. Każda aplikacja jest niezależna, może łączyć się z osobnym źródłem danych, może być oddzielnie tworzona, uruchamiana i zatrzymywana, ale współdzielą one ten sam proces i przestrzeń pamięci. Nadal muszą Państwo utrzymywać tylko jedną instancję NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

To podejście przynosi wyraźne korzyści:

- Biznes można podzielić według wymiaru aplikacji.
- Funkcje i konfiguracje między aplikacjami stają się bardziej przejrzyste.
- Niższe zużycie zasobów w porównaniu z rozwiązaniami wieloprocesowymi lub wielokontenerowymi.

Ponieważ jednak wszystkie aplikacje działają w tym samym procesie, współdzielą one zasoby takie jak procesor i pamięć. Awaria lub wysokie obciążenie w jednej aplikacji może wpłynąć na stabilność pozostałych aplikacji.

Gdy liczba aplikacji stale rośnie lub gdy pojawiają się wyższe wymagania dotyczące izolacji i stabilności, konieczna jest dalsza rozbudowa architektury.

## Hybrydowe wdrażanie w wielu środowiskach

Gdy skala i złożoność biznesu osiągną poziom, przy którym liczba aplikacji musi być zwiększana masowo, tryb wielu aplikacji w pamięci współdzielonej może napotkać wyzwania związane z rywalizacją o zasoby, stabilnością i bezpieczeństwem. Na etapie skalowania mogą Państwo rozważyć zastosowanie hybrydowego wdrażania w wielu środowiskach, aby wspierać bardziej złożone scenariusze biznesowe.

Rdzeniem tej architektury jest wprowadzenie aplikacji wejściowej, czyli wdrożenie jednej instancji NocoBase jako ujednoliconego centrum zarządzania, przy jednoczesnym wdrożeniu wielu instancji NocoBase jako środowisk wykonawczych, służących do faktycznego uruchamiania aplikacji biznesowych.

Aplikacja wejściowa odpowiada za:

- Tworzenie, konfigurację i zarządzanie cyklem życia aplikacji.
- Wydawanie poleceń zarządzania i podsumowywanie statusów.

Środowisko instancji aplikacji odpowiada za:

- Faktyczne hostowanie i uruchamianie aplikacji biznesowych poprzez tryb wielu aplikacji w pamięci współdzielonej.

Z Państwa perspektywy wiele aplikacji nadal można tworzyć i zarządzać nimi poprzez jeden punkt wejścia, ale wewnętrznie:

- Różne aplikacje mogą działać na różnych węzłach lub klastrach.
- Każda aplikacja może korzystać z niezależnych baz danych i oprogramowania pośredniczącego.
- Można dowolnie skalować lub izolować aplikacje o wysokim obciążeniu.

![](https://static-docs.nocobase.com/202512231215186.png)

To podejście jest odpowiednie dla platform SaaS, dużej liczby środowisk demonstracyjnych lub scenariuszy wielonajemczych, zapewniając elastyczność przy jednoczesnym zwiększeniu stabilności i łatwości utrzymania systemu.