:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Często zadawane pytania

## Wybór wykresu
### Jak wybrać odpowiedni wykres?
Odpowiedź: Proszę wybrać wykres w zależności od celu i rodzaju danych:
- Trendy i zmiany: wykres liniowy lub powierzchniowy
- Porównanie wartości: wykres kolumnowy lub słupkowy
- Struktura udziałów: wykres kołowy lub pierścieniowy
- Korelacje i rozkład: wykres punktowy
- Struktura hierarchiczna i postęp etapów: wykres lejkowy

Więcej typów wykresów znajdą Państwo w [przykładach ECharts](https://echarts.apache.org/examples).

### Jakie typy wykresów obsługuje NocoBase?
Odpowiedź: Tryb wizualny zawiera wbudowane, często używane wykresy (liniowy, powierzchniowy, kolumnowy, słupkowy, kołowy, pierścieniowy, lejkowy, punktowy itp.). Tryb niestandardowy pozwala na wykorzystanie wszystkich typów wykresów ECharts.

## Problemy z zapytaniami danych
### Czy tryb wizualny i tryb SQL współdzielą konfiguracje?
Odpowiedź: Nie, konfiguracje są przechowywane niezależnie. Aktywny jest tryb konfiguracji, który został użyty podczas ostatniego zapisu.

## Opcje wykresu
### Jak skonfigurować pola wykresu?
Odpowiedź: W trybie wizualnym proszę wybrać odpowiednie pola danych zgodnie z typem wykresu. Na przykład, wykresy liniowe/kolumnowe wymagają konfiguracji pól osi X i Y, a wykresy kołowe wymagają pola kategorii i pola wartości.
Zalecamy najpierw uruchomić „Uruchom zapytanie”, aby sprawdzić, czy dane są zgodne z oczekiwaniami. Domyślnie pola wykresu zostaną automatycznie dopasowane.

## Podgląd i zapisywanie
### Czy po zmianie konfiguracji muszę ręcznie uruchamiać podgląd?
Odpowiedź: W trybie wizualnym zmiany konfiguracji są automatycznie podglądane. W trybach SQL i niestandardowym, aby uniknąć częstego odświeżania, proszę ręcznie kliknąć „Podgląd” po zakończeniu edycji.

### Dlaczego podgląd wykresu znika po zamknięciu okna dialogowego?
Odpowiedź: Podgląd służy wyłącznie do tymczasowego sprawdzenia. Po wprowadzeniu zmian w konfiguracji proszę najpierw zapisać, a następnie zamknąć okno. Niezapisane zmiany nie zostaną zachowane.