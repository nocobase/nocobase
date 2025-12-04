:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Reguły powiązań

## Wprowadzenie

W NocoBase, reguły powiązań to mechanizm służący do kontrolowania interaktywnego zachowania elementów interfejsu użytkownika (frontendu). Pozwalają one użytkownikom dostosowywać wyświetlanie i logikę działania bloków, pól oraz akcji w interfejsie na podstawie różnych warunków, co umożliwia elastyczne i niskokodowe doświadczenie interaktywne. Funkcja ta jest stale rozwijana i optymalizowana.

Konfigurując reguły powiązań, można osiągnąć na przykład:

- Ukrywanie/wyświetlanie określonych bloków w zależności od bieżącej roli użytkownika. Różne role mogą widzieć bloki z różnym zakresem danych, np. administratorzy widzą bloki z pełnymi informacjami, podczas gdy zwykli użytkownicy widzą tylko bloki z podstawowymi informacjami.
- Automatyczne wypełnianie lub resetowanie wartości innych pól po wybraniu opcji w formularzu.
- Wyłączanie niektórych pól wejściowych po wybraniu opcji w formularzu.
- Ustawianie niektórych pól wejściowych jako wymaganych po wybraniu opcji w formularzu.
- Kontrolowanie widoczności lub możliwości kliknięcia przycisków akcji w określonych warunkach.

## Konfiguracja warunków

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Zmienna po lewej stronie

Zmienna po lewej stronie warunku służy do zdefiniowania „obiektu oceny” w regule powiązań. Warunek jest oceniany na podstawie wartości tej zmiennej, aby określić, czy należy wywołać akcję powiązania.

Dostępne zmienne to:

- Pola w kontekście, takie jak `Bieżący formularz/xxx`, `Bieżący rekord/xxx`, `Bieżący rekord z wyskakującego okna/xxx` itp.
- Globalne zmienne systemowe, takie jak `Bieżący użytkownik`, `Bieżąca rola` itp., odpowiednie do dynamicznego sterowania na podstawie tożsamości użytkownika, uprawnień i innych informacji.
  > ✅ Dostępne opcje dla zmiennej po lewej stronie są określane przez kontekst bloku. Proszę używać zmiennej po lewej stronie w sposób rozsądny, zgodnie z potrzebami biznesowymi:
  >
  > - `Bieżący użytkownik` reprezentuje informacje o aktualnie zalogowanym użytkowniku.
  > - `Bieżący formularz` reprezentuje wartości wprowadzane w czasie rzeczywistym w formularzu.
  > - `Bieżący rekord` reprezentuje zapisaną wartość rekordu, taką jak rekord wiersza w tabeli.

### Operator

Operator służy do ustawienia logiki oceny warunku, czyli sposobu porównywania zmiennej po lewej stronie z wartością po prawej stronie. Różne typy zmiennych po lewej stronie obsługują różne operatory. Typowe operatory to:

- **Typ tekstowy**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty` itp.
- **Typ liczbowy**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte` itp.
- **Typ logiczny**: `$isTruly`, `$isFalsy`
- **Typ tablicowy**: `$match`, `$anyOf`, `$empty`, `$notEmpty` itp.

> ✅ System automatycznie zasugeruje listę dostępnych operatorów na podstawie typu zmiennej po lewej stronie, aby zapewnić spójność logiki konfiguracji.

### Wartość po prawej stronie

Służy do porównania ze zmienną po lewej stronie i jest wartością referencyjną do określenia, czy warunek jest spełniony.

Obsługiwane treści to:

- Wartości stałe: Wprowadzanie stałych liczb, tekstu, dat itp.
- Zmienne kontekstowe: takie jak inne pola w bieżącym formularzu, bieżący rekord itp.
- Zmienne systemowe: takie jak bieżący użytkownik, bieżąca data/czas, bieżąca rola itp.

> ✅ System automatycznie dostosuje metodę wprowadzania wartości po prawej stronie na podstawie typu zmiennej po lewej stronie, na przykład:
>
> - Gdy po lewej stronie znajduje się „pole wyboru”, zostanie wyświetlony odpowiedni selektor opcji.
> - Gdy po lewej stronie znajduje się „pole daty”, zostanie wyświetlony selektor daty.
> - Gdy po lewej stronie znajduje się „pole tekstowe”, zostanie wyświetlone pole wprowadzania tekstu.

> 💡 Elastyczne użycie wartości po prawej stronie (zwłaszcza zmiennych dynamicznych) pozwala budować logikę powiązań w oparciu o bieżącego użytkownika, bieżący stan danych i kontekst, co zapewnia potężniejsze doświadczenie interaktywne.

## Logika wykonywania reguł

### Wyzwalanie warunku

Gdy warunek w regule jest spełniony (opcjonalnie), akcja modyfikacji właściwości poniżej zostanie wykonana automatycznie. Jeśli warunek nie jest ustawiony, reguła jest domyślnie zawsze spełniona, a akcja modyfikacji właściwości zostanie wykonana automatycznie.

### Wiele reguł

Można skonfigurować wiele reguł powiązań dla jednego formularza. Gdy warunki wielu reguł są spełnione jednocześnie, system wykona je w kolejności od pierwszej do ostatniej, co oznacza, że ostatni wynik będzie ostatecznym standardem wykonania.
Przykład: Reguła 1 ustawia pole jako „Wyłączone”, a Reguła 2 ustawia pole jako „Edytowalne”. Jeśli warunki obu reguł są spełnione, pole stanie się „Edytowalne”.

> Kolejność wykonywania wielu reguł jest kluczowa. Projektując reguły, proszę jasno określić ich priorytety i wzajemne zależności, aby uniknąć konfliktów.

## Zarządzanie regułami

Na każdej regule można wykonać następujące operacje:

- Niestandardowe nazewnictwo: Proszę nadać regule łatwą do zrozumienia nazwę w celu zarządzania i identyfikacji.
- Sortowanie: Proszę dostosować kolejność na podstawie priorytetu wykonania reguł, aby system przetwarzał je w prawidłowej sekwencji.
- Usuwanie: Proszę usunąć reguły, które nie są już potrzebne.
- Włączanie/Wyłączanie: Proszę tymczasowo wyłączyć regułę bez jej usuwania, co jest przydatne w scenariuszach, gdy reguła musi być tymczasowo dezaktywowana.
- Kopiowanie reguły: Proszę utworzyć nową regułę, kopiując istniejącą, aby uniknąć powtarzalnej konfiguracji.

## O zmiennych

W przypisywaniu wartości pól i konfiguracji warunków obsługiwane są zarówno stałe, jak i zmienne. Lista zmiennych będzie się różnić w zależności od lokalizacji bloku. Rozsądny wybór i użycie zmiennych może bardziej elastycznie zaspokoić potrzeby biznesowe. Więcej informacji na temat zmiennych znajdą Państwo w [Zmienne](/interface-builder/variables).

## Reguły powiązań bloków

Reguły powiązań bloków umożliwiają dynamiczne sterowanie wyświetlaniem bloku na podstawie zmiennych systemowych (takich jak bieżący użytkownik, rola) lub zmiennych kontekstowych (takich jak bieżący rekord z wyskakującego okna). Na przykład, administrator może przeglądać pełne informacje o zamówieniu, podczas gdy rola obsługi klienta może przeglądać tylko określone dane zamówienia. Za pomocą reguł powiązań bloków można konfigurować odpowiednie bloki w oparciu o role oraz ustawiać w nich różne pola, przyciski akcji i zakresy danych. Gdy zalogowana rola jest rolą docelową, system wyświetli odpowiedni blok. Należy pamiętać, że bloki są domyślnie wyświetlane, więc zazwyczaj trzeba zdefiniować logikę ukrywania bloku.

👉 Szczegóły znajdą Państwo w: [Blok/Reguły powiązań bloków](/interface-builder/blocks/block-settings/block-linkage-rule)

## Reguły powiązań pól

Reguły powiązań pól służą do dynamicznego dostosowywania stanu pól w formularzu lub bloku szczegółów na podstawie działań użytkownika, głównie obejmując:

- Kontrolowanie stanu **Wyświetl/Ukryj** pola
- Ustawianie, czy pole jest **Wymagane**
- **Przypisywanie wartości**
- Wykonywanie kodu JavaScript do obsługi niestandardowej logiki biznesowej

👉 Szczegóły znajdą Państwo w: [Blok/Reguły powiązań pól](/interface-builder/blocks/block-settings/field-linkage-rule)

## Reguły powiązań akcji

Reguły powiązań akcji obecnie obsługują sterowanie zachowaniami akcji, takimi jak ukrywanie/wyłączanie, na podstawie zmiennych kontekstowych, takich jak wartość bieżącego rekordu i bieżący formularz, a także zmiennych globalnych.

👉 Szczegóły znajdą Państwo w: [Akcja/Reguły powiązań](/interface-builder/actions/action-settings/linkage-rule)