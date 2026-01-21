:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Procedury utrzymania

## Pierwsze uruchomienie aplikacji

Przy pierwszym uruchomieniu aplikacji należy najpierw uruchomić jeden węzeł. Po zakończeniu instalacji i aktywacji wtyczek można uruchomić pozostałe węzły.

## Aktualizacja wersji

Gdy zajdzie potrzeba aktualizacji wersji NocoBase, proszę postępować zgodnie z poniższą procedurą.

:::warning{title=Uwaga}
W środowisku produkcyjnym klastra funkcje takie jak zarządzanie wtyczkami i aktualizacje wersji powinny być używane z ostrożnością lub całkowicie zabronione.

NocoBase tymczasowo nie obsługuje aktualizacji online dla wersji klastrowych. Aby zapewnić spójność danych, podczas procesu aktualizacji należy zawiesić usługi zewnętrzne.
:::

Kroki postępowania:

1.  Zatrzymanie bieżącej usługi

    Proszę zatrzymać wszystkie instancje aplikacji NocoBase i przekierować ruch z load balancera na stronę statusu 503.

2.  Tworzenie kopii zapasowej danych

    Przed aktualizacją zdecydowanie zaleca się wykonanie kopii zapasowej bazy danych, aby zapobiec ewentualnym problemom podczas procesu aktualizacji.

3.  Aktualizacja wersji

    Proszę zapoznać się z dokumentacją [Aktualizacja Docker](../get-started/upgrading/docker), aby zaktualizować wersję obrazu aplikacji NocoBase.

4.  Uruchomienie usługi

    1.  Proszę uruchomić jeden węzeł w klastrze i poczekać na zakończenie aktualizacji oraz pomyślne uruchomienie węzła.
    2.  Proszę zweryfikować poprawność działania. W przypadku wystąpienia problemów, których nie uda się rozwiązać poprzez diagnostykę, można przywrócić poprzednią wersję.
    3.  Proszę uruchomić pozostałe węzły.
    4.  Proszę przekierować ruch z load balancera do klastra aplikacji.

## Konserwacja wewnątrz aplikacji

Konserwacja wewnątrz aplikacji odnosi się do wykonywania operacji związanych z utrzymaniem, gdy aplikacja jest uruchomiona, w tym:

*   Zarządzanie wtyczkami (instalowanie, aktywowanie, dezaktywowanie wtyczek itp.)
*   Kopia zapasowa i przywracanie
*   Zarządzanie migracją środowiska

Kroki postępowania:

1.  Skalowanie w dół węzłów

    Proszę zmniejszyć liczbę uruchomionych węzłów aplikacji w klastrze do jednego, a pozostałe węzły zatrzymać.

2.  Proszę wykonać operacje konserwacji wewnątrz aplikacji, takie jak instalowanie i aktywowanie wtyczek, tworzenie kopii zapasowych danych itp.

3.  Przywracanie węzłów

    Po zakończeniu operacji konserwacji i zweryfikowaniu poprawności działania, proszę uruchomić pozostałe węzły. Po pomyślnym uruchomieniu węzłów, proszę przywrócić stan operacyjny klastra.