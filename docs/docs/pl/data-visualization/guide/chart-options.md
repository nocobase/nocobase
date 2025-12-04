:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Opcje wykresów

Skonfiguruj sposób wyświetlania wykresów. Dostępne są dwa tryby: Basic (wizualny) i Custom (niestandardowy JS). Tryb Basic jest idealny do szybkiego mapowania i konfiguracji podstawowych właściwości; tryb Custom sprawdzi się w złożonych scenariuszach i zaawansowanej personalizacji.

## Układ panelu

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Wskazówka: Aby ułatwić konfigurację bieżącej zawartości, można najpierw zwinąć inne panele.

Na samej górze znajduje się pasek akcji.
Wybór trybu:
- Basic: Konfiguracja wizualna. Wybierz typ i uzupełnij mapowanie pól; dostosuj typowe właściwości za pomocą przełączników.
- Custom: Napisz kod JavaScript w edytorze i zwróć obiekt `option` ECharts.

## Tryb Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Wybór typu wykresu
- Obsługiwane typy: wykres liniowy, warstwowy, kolumnowy, słupkowy, kołowy, pierścieniowy, lejkowy, punktowy itp.
- Wymagane pola różnią się w zależności od typu wykresu. Najpierw proszę sprawdzić nazwy i typy kolumn w sekcji „Zapytanie danych → Wyświetl dane”.

### Mapowanie pól
- Wykres liniowy/warstwowy/kolumnowy/słupkowy:
  - `xField`: wymiar (np. data, kategoria, region)
  - `yField`: miara (zagregowana wartość liczbowa)
  - `seriesField` (opcjonalnie): grupowanie serii (dla wielu linii/grup słupków)
- Wykres kołowy/pierścieniowy:
  - `Category`: wymiar kategoryczny
  - `Value`: miara
- Wykres lejkowy:
  - `Category`: etap/kategoria
  - `Value`: wartość (zazwyczaj liczba lub procent)
- Wykres punktowy:
  - `xField`, `yField`: dwie miary lub wymiary dla osi współrzędnych

> Więcej opcji konfiguracji wykresów znajdą Państwo w dokumentacji ECharts: [Oś](https://echarts.apache.org/handbook/en/concepts/axis) i [Przykłady](https://echarts.apache.org/examples/en/index.html).

**Uwagi:**
- Po zmianie wymiarów lub miar proszę ponownie sprawdzić mapowanie, aby uniknąć pustych lub źle wyrównanych wykresów.
- Wykresy kołowe/pierścieniowe i lejowe muszą zawierać kombinację „kategoria + wartość”.

### Typowe właściwości

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Składanie, wygładzanie (wykres liniowy/warstwowy)
- Etykiety, podpowiedzi (tooltip), legenda
- Obrót etykiet osi, linie podziału
- Promień i promień wewnętrzny wykresu kołowego/pierścieniowego, kolejność sortowania wykresu lejkowego

**Zalecenia:**
- Dla szeregów czasowych proszę używać wykresów liniowych/warstwowych z umiarkowanym wygładzaniem; do porównywania kategorii proszę stosować wykresy kolumnowe/słupkowe.
- W przypadku gęstych danych nie ma potrzeby wyświetlania wszystkich etykiet, aby uniknąć ich nakładania się.

## Tryb Custom

Służy do zwracania pełnego obiektu `option` ECharts. Jest odpowiedni do zaawansowanej personalizacji, takiej jak łączenie wielu serii, złożone podpowiedzi i dynamiczne style.
Zalecane podejście: skonsoliduj dane w `dataset.source`. Szczegółowe informacje znajdą Państwo w dokumentacji ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series).

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Kontekst danych
- `ctx.data.objects`: tablica obiektów (każdy wiersz jako obiekt, zalecane)
- `ctx.data.rows`: tablica dwuwymiarowa (z nagłówkiem)
- `ctx.data.columns`: tablica dwuwymiarowa pogrupowana według kolumn

### Przykład: wykres liniowy miesięcznych zamówień
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Podgląd i zapis
- W trybie Custom, po zakończeniu edycji, mogą Państwo kliknąć przycisk „Podgląd” po prawej stronie, aby zaktualizować podgląd wykresu.
- Na dole proszę kliknąć „Zapisz”, aby zastosować i utrwalić konfigurację; proszę kliknąć „Anuluj”, aby cofnąć wszystkie wprowadzone zmiany.

![20251026192816](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> [!TIP]
> Więcej informacji na temat opcji wykresów znajdą Państwo w sekcji Zaawansowane — Niestandardowa konfiguracja wykresów.