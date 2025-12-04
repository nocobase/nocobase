:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Podstawowe pojęcia


W NocoBase znajdą Państwo kilka kluczowych pojęć, które pomogą Państwu zrozumieć, jak działa system i jak go efektywnie wykorzystywać.

## Kolekcja (Collection)

Kolekcja to podstawowa jednostka przechowywania danych w NocoBase. Można ją traktować jako tabelę w tradycyjnej bazie danych. Każda kolekcja zawiera zestaw pól, które definiują strukturę danych. Na przykład, jeśli tworzą Państwo system zarządzania klientami, mogą Państwo mieć kolekcję „Klienci” z polami takimi jak „Imię”, „Nazwisko”, „Email” i „Telefon”.

## Przepływ pracy (Workflow)

Przepływ pracy to sekwencja kroków lub działań, które są wykonywane w określonej kolejności w celu osiągnięcia konkretnego celu. W NocoBase przepływy pracy służą do automatyzacji procesów biznesowych. Mogą Państwo na przykład stworzyć przepływ pracy, który automatycznie wysyła e-mail powitalny do nowego klienta po jego zarejestrowaniu się w systemie.

## Źródło danych (Data Source)

Źródło danych to miejsce, z którego NocoBase pobiera lub do którego zapisuje dane. NocoBase może łączyć się z różnymi typami źródeł danych, takimi jak bazy danych (np. MySQL, PostgreSQL), API zewnętrzne czy inne usługi. Dzięki temu mogą Państwo integrować NocoBase z istniejącymi systemami i danymi.

## Wtyczka (Plugin)

Wtyczka to rozszerzenie, które dodaje nowe funkcje lub możliwości do NocoBase. NocoBase jest zaprojektowane jako system modułowy, co oznacza, że jego funkcjonalność można łatwo rozszerzać za pomocą wtyczek. Mogą Państwo instalować wtyczki z oficjalnego repozytorium NocoBase lub tworzyć własne, aby dostosować system do swoich unikalnych potrzeb. Na przykład, wtyczka może dodawać nowe typy pól, integracje z zewnętrznymi usługami lub zaawansowane raporty.

## Użytkownik i Rola

### Użytkownik

Użytkownik to osoba, która ma dostęp do systemu NocoBase. Każdy użytkownik ma unikalny identyfikator i może być przypisany do jednej lub wielu ról.

### Rola

Rola to zestaw uprawnień, które określają, co użytkownik może robić w systemie. Na przykład, rola „Administrator” może mieć pełny dostęp do wszystkich funkcji, podczas gdy rola „Gość” może mieć tylko uprawnienia do przeglądania niektórych danych. Przypisując użytkowników do ról, mogą Państwo łatwo zarządzać ich dostępem i uprawnieniami.

## Blok

Blok to komponent interfejsu użytkownika, który wyświetla dane lub umożliwia interakcję z nimi. Bloki są podstawowymi elementami budującymi strony w NocoBase. Mogą Państwo na przykład mieć blok tabeli, który wyświetla listę klientów, blok formularza do dodawania nowych klientów lub blok wykresu, który wizualizuje dane.

## Pole

Pole to pojedynczy element danych w kolekcji. Każde pole ma nazwę, typ danych (np. tekst, liczba, data) i opcjonalne walidacje. Na przykład, w kolekcji „Klienci” pole „Imię” będzie typu tekstowego, a pole „Wiek” typu liczbowego.

## Widok

Widok to niestandardowy sposób wyświetlania danych z kolekcji. Mogą Państwo tworzyć różne widoki tej samej kolekcji, aby prezentować dane w różny sposób, na przykład filtrować je, sortować lub grupować. Widoki są przydatne do tworzenia spersonalizowanych interfejsów dla różnych użytkowników lub celów.

## Strona

Strona to główny element nawigacyjny w NocoBase, który zawiera jeden lub więcej bloków. Strony służą do organizowania interfejsu użytkownika i prezentowania danych w logiczny sposób. Mogą Państwo tworzyć strony dla różnych sekcji aplikacji, takich jak „Dashboard”, „Klienci” czy „Ustawienia”.