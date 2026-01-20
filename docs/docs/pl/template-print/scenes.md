
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Korzystanie z funkcji „Drukowanie z szablonu” do generowania przykładowych umów dostawy i zakupu

W scenariuszach łańcucha dostaw lub handlu często pojawia się potrzeba szybkiego generowania ustandaryzowanych „Umów dostawy i zakupu” oraz dynamicznego wypełniania ich treścią na podstawie informacji ze **źródeł danych**, takich jak dane kupujących, sprzedających i szczegóły produktów. Poniżej, na przykładzie uproszczonego przypadku użycia „Umowy”, pokażemy Państwu, jak skonfigurować i używać funkcji „Drukowanie z szablonu”, aby mapować dane do symboli zastępczych w szablonach umów, automatycznie generując w ten sposób ostateczny dokument umowy.

---

## 1. Tło i przegląd struktury danych

W naszym przykładzie istnieją zasadniczo następujące główne **kolekcje** (pomijając inne nieistotne pola):

- **parties**: przechowuje informacje o jednostkach lub osobach (Strona A/Strona B), w tym nazwę, adres, osobę kontaktową, telefon itp.
- **contracts**: przechowuje konkretne rekordy umów, w tym numer umowy, klucze obce kupującego/sprzedającego, informacje o sygnatariuszach, daty rozpoczęcia/zakończenia, konto bankowe itp.
- **contract_line_items**: służy do przechowywania wielu pozycji w ramach umowy (nazwa produktu, specyfikacja, ilość, cena jednostkowa, data dostawy itp.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Ponieważ obecny system obsługuje tylko drukowanie pojedynczych rekordów, klikniemy „Drukuj” na stronie „Szczegóły umowy”, a system automatycznie pobierze odpowiedni rekord z **kolekcji** `contracts` oraz powiązane informacje z **kolekcji** `parties` i wypełni nimi dokumenty Word lub PDF.

## 2. Przygotowanie

### 2.1 Przygotowanie **wtyczki**

Proszę pamiętać, że nasza funkcja „Drukowanie z szablonu” to komercyjna **wtyczka**, którą należy zakupić i aktywować, aby móc wykonywać operacje drukowania.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Potwierdzenie aktywacji wtyczki:**

Na dowolnej stronie proszę utworzyć blok szczegółów (np. dla użytkowników) i sprawdzić, czy w konfiguracji akcji dostępna jest opcja konfiguracji szablonu:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Tworzenie **kolekcji**

Proszę utworzyć zaprojektowane powyżej główne **kolekcje** dla podmiotów, umów i pozycji produktów (wystarczy wybrać kluczowe pola).

#### **Kolekcja** Umowy (`Contracts`)

| Kategoria pola | Nazwa wyświetlana pola | Nazwa pola | Interfejs pola |
|---------|-------------------|------------|-----------------|
| **Pola PK i FK** | | | |
| | ID | id | Liczba całkowita |
| | ID Kupującego | buyer_id | Liczba całkowita |
| | ID Sprzedającego | seller_id | Liczba całkowita |
| **Pola powiązań** | | | |
| | Pozycje umowy | contract_items | Jeden do wielu |
| | Kupujący (Strona A) | buyer | Wiele do jednego |
| | Sprzedający (Strona B) | seller | Wiele do jednego |
| **Pola ogólne** | | | |
| | Numer umowy | contract_no | Tekst jednowierszowy |
| | Data rozpoczęcia dostawy | start_date | Data i czas (ze strefą czasową) |
| | Data zakończenia dostawy | end_date | Data i czas (ze strefą czasową) |
| | Współczynnik zaliczki (%) | deposit_ratio | Procent |
| | Dni płatności po dostawie | payment_days_after | Liczba całkowita |
| | Nazwa konta bankowego (Beneficjent) | bank_account_name | Tekst jednowierszowy |
| | Nazwa banku | bank_name | Tekst jednowierszowy |
| | Numer konta bankowego (Beneficjent) | bank_account_number | Tekst jednowierszowy |
| | Całkowita kwota | total_amount | Liczba |
| | Kody walut | currency_codes | Wybór pojedynczy |
| | Współczynnik salda (%) | balance_ratio | Procent |
| | Dni salda po dostawie | balance_days_after | Liczba całkowita |
| | Miejsce dostawy | delivery_place | Tekst długi |
| | Nazwisko sygnatariusza Strony A | party_a_signatory_name | Tekst jednowierszowy |
| | Tytuł sygnatariusza Strony A | party_a_signatory_title | Tekst jednowierszowy |
| | Nazwisko sygnatariusza Strony B | party_b_signatory_name | Tekst jednowierszowy |
| | Tytuł sygnatariusza Strony B | party_b_signatory_title | Tekst jednowierszowy |
| **Pola systemowe** | | | |
| | Utworzono o | createdAt | Utworzono o |
| | Utworzono przez | createdBy | Utworzono przez |
| | Ostatnia aktualizacja o | updatedAt | Ostatnia aktualizacja o |
| | Ostatnia aktualizacja przez | updatedBy | Ostatnia aktualizacja przez |

#### **Kolekcja** Podmioty (`Parties`)

| Kategoria pola | Nazwa wyświetlana pola | Nazwa pola | Interfejs pola |
|---------|-------------------|------------|-----------------|
| **Pola PK i FK** | | | |
| | ID | id | Liczba całkowita |
| **Pola ogólne** | | | |
| | Nazwa podmiotu | party_name | Tekst jednowierszowy |
| | Adres | address | Tekst jednowierszowy |
| | Osoba kontaktowa | contact_person | Tekst jednowierszowy |
| | Telefon kontaktowy | contact_phone | Telefon |
| | Stanowisko | position | Tekst jednowierszowy |
| | E-mail | email | E-mail |
| | Strona internetowa | website | URL |
| **Pola systemowe** | | | |
| | Utworzono o | createdAt | Utworzono o |
| | Utworzono przez | createdBy | Utworzono przez |
| | Ostatnia aktualizacja o | updatedAt | Ostatnia aktualizacja o |
| | Ostatnia aktualizacja przez | updatedBy | Ostatnia aktualizacja przez |

#### **Kolekcja** Pozycje Umowy (`Contract Line Items`)

| Kategoria pola | Nazwa wyświetlana pola | Nazwa pola | Interfejs pola |
|---------|-------------------|------------|-----------------|
| **Pola PK i FK** | | | |
| | ID | id | Liczba całkowita |
| | ID Umowy | contract_id | Liczba całkowita |
| **Pola powiązań** | | | |
| | Umowa | contract | Wiele do jednego |
| **Pola ogólne** | | | |
| | Nazwa produktu | product_name | Tekst jednowierszowy |
| | Specyfikacja / Model | spec | Tekst jednowierszowy |
| | Ilość | quantity | Liczba całkowita |
| | Cena jednostkowa | unit_price | Liczba |
| | Całkowita kwota | total_amount | Liczba |
| | Data dostawy | delivery_date | Data i czas (ze strefą czasową) |
| | Uwagi | remark | Tekst długi |
| **Pola systemowe** | | | |
| | Utworzono o | createdAt | Utworzono o |
| | Utworzono przez | createdBy | Utworzono przez |
| | Ostatnia aktualizacja o | updatedAt | Ostatnia aktualizacja o |
| | Ostatnia aktualizacja przez | updatedBy | Ostatnia aktualizacja przez |

### 2.3 Konfiguracja interfejsu

**Wprowadzanie przykładowych danych:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Konfiguracja reguł powiązań jest następująca, automatycznie obliczająca cenę całkowitą i płatności końcowe:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Proszę utworzyć blok widoku, po potwierdzeniu danych, włączyć akcję „Drukowanie z szablonu”:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Konfiguracja **wtyczki** „Drukowanie z szablonu”

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Proszę dodać nową konfigurację szablonu, na przykład „Umowa dostawy i zakupu”:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Następnie przejdziemy do zakładki „Lista pól”, gdzie zobaczą Państwo wszystkie pola bieżącego obiektu. Po kliknięciu „Kopiuj” będą Państwo mogli rozpocząć wypełnianie szablonu.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Przygotowanie pliku umowy

**Plik szablonu umowy Word**

Proszę wcześniej przygotować wzór umowy (plik .docx), na przykład: `SUPPLY AND PURCHASE CONTRACT.docx`

W tym przykładzie przedstawiamy uproszczoną wersję „Umowy dostawy i zakupu”, która zawiera przykładowe symbole zastępcze:

- `{d.contract_no}`: numer umowy
- `{d.buyer.party_name}`, `{d.seller.party_name}`: nazwy kupującego i sprzedającego
- `{d.total_amount}`: całkowita kwota umowy
- Oraz inne symbole zastępcze, takie jak „osoba kontaktowa”, „adres”, „telefon” itp.

Następnie mogą Państwo skopiować pola z utworzonej **kolekcji** i wkleić je do dokumentu Word.

---

## 3. Samouczek dotyczący zmiennych szablonu

### 3.1 Wypełnianie podstawowych zmiennych i właściwości powiązanych obiektów

**Wypełnianie podstawowych pól:**

Na przykład numer umowy na górze lub obiekt podmiotu podpisującego umowę. Proszę kliknąć „Kopiuj” i wkleić bezpośrednio w odpowiednie puste miejsce w umowie.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formatowanie danych

#### Formatowanie daty

W szablonach często musimy formatować pola, zwłaszcza pola daty. Bezpośrednio skopiowany format daty jest zazwyczaj długi (np. Wed Jan 01 2025 00:00:00 GMT) i wymaga sformatowania, aby wyświetlić pożądany styl.

Dla pól daty można użyć funkcji `formatD()`, aby określić format wyjściowy:

```
{nazwa_pola:formatD(styl_formatowania)}
```

**Przykład:**

Na przykład, jeśli oryginalne pole, które skopiowaliśmy, to `{d.created_at}`, a chcemy sformatować datę do formatu `2025-01-01`, należy zmodyfikować to pole na:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Wynik: 2025-01-01
```

**Typowe style formatowania daty:**

- `YYYY` - Rok (cztery cyfry)
- `MM` - Miesiąc (dwie cyfry)
- `DD` - Dzień (dwie cyfry)
- `HH` - Godzina (format 24-godzinny)
- `mm` - Minuty
- `ss` - Sekundy

**Przykład 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Wynik: 2025-01-01 14:30:00
```

#### Formatowanie kwot

Załóżmy, że istnieje pole kwoty, takie jak `{d.total_amount}` w umowie. Możemy użyć funkcji `formatN()` do formatowania liczb, określając liczbę miejsc dziesiętnych i separator tysięcy.

**Składnia:**

```
{nazwa_pola:formatN(liczba_miejsc_dziesiętnych, separator_tysięcy)}
```

- **Liczba miejsc dziesiętnych**: Mogą Państwo określić, ile miejsc dziesiętnych ma zostać zachowanych. Na przykład `2` oznacza zachowanie dwóch miejsc dziesiętnych.
- **Separator tysięcy**: Określa, czy używać separatora tysięcy, zazwyczaj `true` lub `false`.

**Przykład 1: Formatowanie kwoty z separatorem tysięcy i dwoma miejscami dziesiętnymi**

```
{d.amount:formatN(2, true)}  // Wynik: 1 234,56
```

Spowoduje to sformatowanie `d.amount` do dwóch miejsc dziesiętnych i dodanie separatora tysięcy.

**Przykład 2: Formatowanie kwoty do liczby całkowitej bez miejsc dziesiętnych**

```
{d.amount:formatN(0, true)}  // Wynik: 1 235
```

Spowoduje to sformatowanie `d.amount` do liczby całkowitej i dodanie separatora tysięcy.

**Przykład 3: Formatowanie kwoty z dwoma miejscami dziesiętnymi, ale bez separatora tysięcy**

```
{d.amount:formatN(2, false)}  // Wynik: 1234.56
```

Tutaj wyłączono separator tysięcy i zachowano tylko dwa miejsca dziesiętne.

**Inne potrzeby formatowania kwot:**

- **Symbol waluty**: Carbone samo w sobie nie oferuje bezpośrednio funkcji formatowania symboli walut, ale mogą Państwo dodać symbole walut bezpośrednio w danych lub szablonach. Na przykład:
  ```
  {d.amount:formatN(2, true)} PLN  // Wynik: 1 234,56 PLN
  ```

#### Formatowanie ciągów znaków

Dla pól tekstowych można użyć `:upperCase`, aby określić format tekstu, na przykład konwersję wielkości liter.

**Składnia:**

```
{nazwa_pola:upperCase:inne_polecenia}
```

**Typowe metody konwersji:**

- `upperCase` - Konwertuje na same wielkie litery
- `lowerCase` - Konwertuje na same małe litery
- `upperCase:ucFirst` - Zmienia pierwszą literę na wielką

**Przykład:**

```
{d.party_a_signatory_name:upperCase}  // Wynik: JOHN DOE
```

### 3.3 Drukowanie w pętli

#### Jak drukować listy obiektów podrzędnych (np. szczegóły produktów)

Gdy musimy wydrukować tabelę zawierającą wiele pozycji podrzędnych (np. szczegóły produktów), zazwyczaj stosujemy drukowanie w pętli. W ten sposób system wygeneruje wiersz treści dla każdej pozycji na liście, aż wszystkie pozycje zostaną przetworzone.

Załóżmy, że mamy listę produktów (na przykład `contract_items`), która zawiera wiele obiektów produktów. Każdy obiekt produktu ma wiele atrybutów, takich jak nazwa produktu, specyfikacja, ilość, cena jednostkowa, całkowita kwota i uwagi.

**Krok 1: Wypełnienie pól w pierwszym wierszu tabeli**

Najpierw, w pierwszym wierszu tabeli (nie w nagłówku), bezpośrednio kopiujemy i wypełniamy zmienne szablonu. Zmienne te zostaną zastąpione odpowiednimi danymi i wyświetlone w wynikach.

Na przykład, pierwszy wiersz tabeli wygląda następująco:

| Nazwa produktu | Specyfikacja / Model | Ilość | Cena jednostkowa | Całkowita kwota | Uwagi |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Tutaj `d.contract_items[i]` reprezentuje i-tą pozycję na liście produktów, a `i` to indeks, który reprezentuje kolejność bieżącego produktu.

**Krok 2: Modyfikacja indeksu w drugim wierszu**

Następnie, w drugim wierszu tabeli, modyfikujemy indeks pola na `i+1` i wypełniamy tylko pierwszy atrybut. Dzieje się tak, ponieważ podczas drukowania w pętli musimy pobrać kolejną pozycję danych z listy i wyświetlić ją w następnym wierszu.

Na przykład, drugi wiersz wypełniamy następująco:

| Nazwa produktu | Specyfikacja / Model | Ilość | Cena jednostkowa | Całkowita kwota | Uwagi |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

W tym przykładzie zmieniliśmy `[i]` na `[i+1]`, dzięki czemu możemy uzyskać dane kolejnego produktu z listy.

**Krok 3: Automatyczne drukowanie w pętli podczas renderowania szablonu**

Gdy system przetwarza ten szablon, będzie działał zgodnie z następującą logiką:

1. Pierwszy wiersz zostanie wypełniony zgodnie z polami, które Państwo ustawili w szablonie.
2. Następnie system automatycznie usunie drugi wiersz i rozpocznie wyodrębnianie danych z `d.contract_items`, wypełniając w pętli każdy wiersz w formacie tabeli, aż wszystkie szczegóły produktów zostaną wydrukowane.

Indeks `i` w każdym wierszu będzie się zwiększał, zapewniając, że każdy wiersz wyświetla inne informacje o produkcie.

---

## 4. Przesyłanie i konfigurowanie szablonu umowy

### 4.1 Przesyłanie szablonu

1. Proszę kliknąć przycisk „Dodaj szablon” i wprowadzić nazwę szablonu, na przykład „Szablon umowy dostawy i zakupu”.
2. Proszę przesłać przygotowany [plik umowy Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx), który zawiera już wszystkie symbole zastępcze.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Po zakończeniu system wyświetli szablon na liście dostępnych szablonów do późniejszego wykorzystania.
4. Proszę kliknąć „Użyj”, aby aktywować ten szablon.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

W tym momencie proszę zamknąć bieżące okno podręczne i kliknąć „Pobierz szablon”, aby uzyskać wygenerowany, kompletny szablon.

**Wskazówki:**

- Jeśli szablon używa formatu `.doc` lub innych, może być konieczna konwersja do `.docx`, w zależności od obsługi **wtyczki**.
- W plikach Word proszę uważać, aby nie dzielić symboli zastępczych na wiele akapitów lub pól tekstowych, aby uniknąć błędów renderowania.

---

Życzymy pomyślnego korzystania! Dzięki funkcji „Drukowanie z szablonu” mogą Państwo znacznie ograniczyć powtarzalne zadania w zarządzaniu umowami, uniknąć błędów wynikających z ręcznego kopiowania i wklejania oraz osiągnąć standaryzację i automatyzację generowania umów.