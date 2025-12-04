---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Ręczne przetwarzanie

## Wprowadzenie

Kiedy proces biznesowy nie może być w pełni zautomatyzowany w zakresie podejmowania decyzji, można wykorzystać węzeł ręczny, aby przekazać część uprawnień decyzyjnych osobie.

Po uruchomieniu węzeł ręczny przerywa wykonanie całego przepływu pracy i generuje zadanie do wykonania dla odpowiedniego użytkownika. Po przesłaniu zadania przez użytkownika, przepływ pracy będzie kontynuowany, pozostanie w oczekiwaniu lub zostanie zakończony, w zależności od wybranego statusu. Jest to niezwykle przydatne w scenariuszach wymagających procesów zatwierdzania.

## Instalacja

Wbudowana wtyczka, nie wymaga instalacji.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie pracy, aby dodać węzeł „Ręczne przetwarzanie”:

![Tworzenie węzła ręcznego](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Konfiguracja węzła

### Osoba odpowiedzialna

Węzeł ręczny wymaga przypisania użytkownika jako wykonawcy zadania do wykonania. Listę zadań do wykonania można dodać jako blok na stronie, a zawartość wyskakującego okna zadania dla każdego węzła musi być skonfigurowana w interfejsie węzła.

Proszę wybrać użytkownika lub wybrać klucz podstawowy bądź klucz obcy danych użytkownika z kontekstu za pomocą zmiennej.

![Węzeł ręczny_Konfiguracja_Osoba odpowiedzialna_Wybór zmiennej](https://static-docs.nocobase.com/22fbca3b8e21fda3b825abb4b257df909.png)

:::info{title=Uwaga}
Obecnie opcja osoby odpowiedzialnej dla węzłów ręcznych nie obsługuje wielu użytkowników. Funkcjonalność ta zostanie dodana w przyszłych wersjach.
:::

### Konfiguracja interfejsu użytkownika

Konfiguracja interfejsu dla zadania do wykonania jest kluczowym elementem węzła ręcznego. Mogą Państwo otworzyć niezależną konfigurację, klikając przycisk „Konfiguruj interfejs użytkownika”, który otwiera wyskakujące okno. Konfiguracja odbywa się w trybie „co widzisz, to dostajesz” (WYSIWYG), podobnie jak w przypadku zwykłej strony:

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Zakładki

Zakładki mogą służyć do rozróżniania różnych treści. Na przykład, jedna zakładka może być przeznaczona do zatwierdzonych formularzy, inna do odrzuconych, a jeszcze inna do wyświetlania szczegółów powiązanych danych. Mogą Państwo je swobodnie konfigurować.

#### Bloki

Obsługiwane typy bloków dzielą się głównie na dwie kategorie: bloki danych i bloki formularzy. Dodatkowo, Markdown jest używany przede wszystkim do treści statycznych, takich jak komunikaty informacyjne.

##### Blok danych

Bloki danych mogą wyświetlać dane wyzwalające lub wyniki przetwarzania dowolnego węzła, dostarczając osobie odpowiedzialnej za zadanie odpowiednie informacje kontekstowe. Na przykład, jeśli przepływ pracy jest wyzwalany przez zdarzenie formularza, można utworzyć blok szczegółów dla danych wyzwalających. Jest to zgodne z konfiguracją szczegółów zwykłej strony, umożliwiając Państwu wybór dowolnego pola z danych wyzwalających do wyświetlenia:

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Blok danych_Wyzwalacz](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Bloki danych węzłów działają podobnie; mogą Państwo wybrać wynik danych z węzła poprzedzającego, aby wyświetlić go jako szczegóły. Na przykład, wynik węzła obliczeniowego znajdującego się wyżej w przepływie pracy może służyć jako kontekstowa informacja referencyjna dla zadania osoby odpowiedzialnej:

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Blok danych_Dane węzła](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Uwaga}
Ponieważ podczas konfiguracji interfejsu przepływ pracy znajduje się w stanie niewykonanym, w blokach danych nie są wyświetlane żadne konkretne dane. Odpowiednie dane dla konkretnej instancji przepływu pracy będą widoczne w wyskakującym oknie zadania do wykonania dopiero po uruchomieniu i wykonaniu przepływu pracy.
:::

##### Blok formularza

W interfejsie zadań do wykonania należy skonfigurować co najmniej jeden blok formularza, który będzie służył do podejmowania ostatecznej decyzji o kontynuacji przepływu pracy. Brak konfiguracji formularza uniemożliwi kontynuację przepływu po jego przerwaniu. Istnieją trzy typy bloków formularzy:

- Formularz niestandardowy
- Formularz tworzenia rekordu
- Formularz aktualizacji rekordu

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Typy formularzy](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formularze tworzenia rekordu i aktualizacji rekordu wymagają wybrania bazowej kolekcji. Po przesłaniu formularza przez użytkownika, wartości w formularzu zostaną użyte do utworzenia lub aktualizacji danych w określonej kolekcji. Formularz niestandardowy pozwala swobodnie zdefiniować tymczasowy formularz, który nie jest powiązany z żadną kolekcją. Wartości pól przesłane przez użytkownika mogą być wykorzystane w kolejnych węzłach.

Przyciski przesyłania formularza można skonfigurować w trzech typach:

- Prześlij i kontynuuj przepływ pracy
- Prześlij i zakończ przepływ pracy
- Tylko zapisz wartości formularza

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Przyciski formularza](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Te trzy przyciski reprezentują trzy statusy węzła w procesie przepływu pracy. Po przesłaniu, status węzła zmienia się na „Zakończony”, „Odrzucony” lub pozostaje w stanie „Oczekujący”. Formularz musi mieć skonfigurowany co najmniej jeden z dwóch pierwszych przycisków, aby określić dalszy kierunek całego przepływu pracy.

Na przycisku „Kontynuuj przepływ pracy” mogą Państwo skonfigurować przypisania dla pól formularza:

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Przycisk formularza_Ustaw wartości formularza](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Węzeł ręczny_Konfiguracja węzła_Konfiguracja interfejsu_Przycisk formularza_Wyskakujące okno ustawiania wartości formularza](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Po otwarciu wyskakującego okna mogą Państwo przypisać wartości do dowolnego pola formularza. Po przesłaniu formularza, ta wartość będzie ostateczną wartością pola. Jest to szczególnie przydatne podczas przeglądania danych. Mogą Państwo użyć wielu różnych przycisków „Kontynuuj przepływ pracy” w formularzu, przy czym każdy przycisk ustawia różne wartości wyliczeniowe dla pól, takich jak status, co pozwala na kontynuowanie dalszego wykonania przepływu pracy z różnymi wartościami danych.

## Blok zadań do wykonania

W przypadku ręcznego przetwarzania, należy również dodać listę zadań do wykonania na stronie, aby wyświetlać zadania. Dzięki temu odpowiedni personel będzie mógł uzyskać dostęp do konkretnych zadań węzła ręcznego i je obsłużyć.

### Dodawanie bloku

Mogą Państwo wybrać „Zadania do wykonania przepływu pracy” z dostępnych bloków na stronie, aby dodać blok listy zadań do wykonania:

![Węzeł ręczny_Dodaj blok zadań do wykonania](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Przykład bloku listy zadań do wykonania:

![Węzeł ręczny_Lista zadań do wykonania](https://static-docs.nocobase.com/cfefb054cd73b704267bf30fe5e647.png)

### Szczegóły zadania do wykonania

Następnie, odpowiedni personel może kliknąć na odpowiednie zadanie do wykonania, aby otworzyć wyskakujące okno zadania i przeprowadzić ręczne przetwarzanie:

![Węzeł ręczny_Szczegóły zadania do wykonania](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Przykład

### Recenzja artykułu

Załóżmy, że artykuł przesłany przez zwykłego użytkownika musi zostać zatwierdzony przez administratora, zanim będzie mógł zostać zaktualizowany do statusu „opublikowany”. W przeciwnym razie, jeśli przepływ pracy zostanie odrzucony, artykuł pozostanie w stanie roboczym (niepublicznym). Proces ten można zrealizować za pomocą formularza aktualizacji w węźle ręcznym.

Proszę utworzyć przepływ pracy wyzwalany przez „Dodaj artykuł” i dodać węzeł ręczny:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Orkiestracja przepływu pracy" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

W węźle ręcznym proszę skonfigurować administratora jako osobę odpowiedzialną. W konfiguracji interfejsu proszę dodać blok oparty na danych wyzwalających, aby wyświetlić szczegóły nowego artykułu:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Blok szczegółów" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

W konfiguracji interfejsu proszę dodać blok oparty na formularzu aktualizacji rekordu, wybrać kolekcję artykułów, aby administrator mógł zdecydować, czy zatwierdzić. Po zatwierdzeniu, odpowiedni artykuł zostanie zaktualizowany zgodnie z innymi późniejszymi konfiguracjami. Po dodaniu formularza, domyślnie pojawi się przycisk „Kontynuuj przepływ pracy”, który można traktować jako „Zatwierdź”. Następnie proszę dodać przycisk „Zakończ przepływ pracy”, który będzie używany w przypadku odrzucenia:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Formularz i działania" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Kontynuując przepływ pracy, musimy zaktualizować status artykułu. Istnieją dwa sposoby konfiguracji. Pierwszy to bezpośrednie wyświetlenie pola statusu artykułu w formularzu, aby operator mógł je wybrać. Ta metoda jest bardziej odpowiednia w sytuacjach wymagających aktywnego wypełniania formularza, np. w przypadku opinii zwrotnych:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Pola formularza" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Aby uprościć zadanie operatora, inną metodą jest skonfigurowanie przypisania wartości formularza na przycisku „Kontynuuj przepływ pracy”. W przypisaniu proszę dodać pole „Status” z wartością „Opublikowany”. Oznacza to, że po kliknięciu przycisku przez operatora, artykuł zostanie zaktualizowany do statusu „opublikowany”:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Przypisanie formularza" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Następnie, z menu konfiguracji w prawym górnym rogu bloku formularza, proszę wybrać warunek filtrowania dla danych do zaktualizowania. Tutaj proszę wybrać kolekcję „Artykuły”, a warunek filtrowania to „ID `równa się` zmienna wyzwalająca / dane wyzwalające / ID”:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Warunek formularza" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Na koniec, mogą Państwo zmodyfikować tytuły poszczególnych bloków, tekst odpowiednich przycisków oraz tekst podpowiedzi pól formularza, aby interfejs był bardziej przyjazny dla użytkownika:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Konfiguracja węzła_Ostateczny formularz" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Po zamknięciu panelu konfiguracji i kliknięciu przycisku „Prześlij”, aby zapisać konfigurację węzła, przepływ pracy jest gotowy. Po włączeniu tego przepływu pracy, zostanie on automatycznie wyzwolony podczas dodawania nowego artykułu. Administrator może zobaczyć, że ten przepływ pracy wymaga przetworzenia na liście zadań do wykonania. Kliknięcie w celu wyświetlenia pokaże szczegóły zadania do wykonania:

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Lista zadań do wykonania" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Węzeł ręczny_Przykład_Recenzja artykułu_Szczegóły zadania do wykonania" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Administrator może ręcznie ocenić na podstawie szczegółów artykułu, czy może on zostać opublikowany. Jeśli tak, kliknięcie przycisku „Zatwierdź” zaktualizuje artykuł do statusu „opublikowany”. Jeśli nie, kliknięcie przycisku „Odrzuć” spowoduje, że artykuł pozostanie w stanie roboczym.

## Zatwierdzanie wniosku o urlop

Załóżmy, że pracownik potrzebuje urlopu, który musi zostać zatwierdzony przez przełożonego, aby wszedł w życie, a dane dotyczące urlopu pracownika muszą zostać odjęte. Niezależnie od zatwierdzenia lub odrzucenia, węzeł żądania HTTP zostanie użyty do wywołania interfejsu API SMS w celu wysłania odpowiedniej wiadomości SMS z powiadomieniem do pracownika (patrz sekcja [Żądanie HTTP](#_HTTP_请求)). Ten scenariusz można zrealizować za pomocą formularza niestandardowego w węźle ręcznym.

Proszę utworzyć przepływ pracy wyzwalany przez „Utwórz wniosek o urlop” i dodać węzeł ręczny. Jest to podobne do poprzedniego procesu recenzji artykułu, z tą różnicą, że tutaj osobą odpowiedzialną jest przełożony. W konfiguracji interfejsu proszę dodać blok oparty na danych wyzwalających, aby wyświetlić szczegóły nowego wniosku o urlop. Następnie proszę dodać kolejny blok oparty na formularzu niestandardowym, aby przełożony mógł zdecydować, czy zatwierdzić wniosek. W formularzu niestandardowym proszę dodać pole statusu zatwierdzenia oraz pole powodu odrzucenia:

<figure>
  <img alt="Węzeł ręczny_Przykład_Zatwierdzanie wniosku o urlop_Konfiguracja węzła" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

W odróżnieniu od procesu recenzji artykułu, ponieważ musimy kontynuować dalszy przepływ pracy w oparciu o wynik zatwierdzenia przez przełożonego, konfigurujemy tutaj tylko przycisk „Kontynuuj przepływ pracy” do przesyłania, nie używając przycisku „Zakończ przepływ pracy”.

Jednocześnie, po węźle ręcznym, możemy użyć węzła warunkowego, aby określić, czy przełożony zatwierdził wniosek o urlop. W gałęzi zatwierdzenia proszę dodać przetwarzanie danych w celu odjęcia urlopu, a po połączeniu gałęzi proszę dodać węzeł żądania, aby wysłać powiadomienie SMS do pracownika. W ten sposób uzyskujemy następujący kompletny przepływ pracy:

<figure>
  <img alt="Węzeł ręczny_Przykład_Zatwierdzanie wniosku o urlop_Orkiestracja przepływu pracy" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Warunek w węźle warunkowym jest skonfigurowany jako „Węzeł ręczny / Dane formularza niestandardowego / Wartość pola zatwierdzenia `jest równa` ‘Zatwierdzony’”:

<figure>
  <img alt="Węzeł ręczny_Przykład_Zatwierdzanie wniosku o urlop_Warunek" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Dane w węźle wysyłania żądania mogą również wykorzystywać odpowiednie zmienne formularza z węzła ręcznego, aby rozróżnić treść wiadomości SMS dla zatwierdzenia i odrzucenia. W ten sposób zakończono konfigurację całego przepływu pracy. Po włączeniu przepływu pracy, gdy pracownik prześle formularz wniosku o urlop, przełożony może przetworzyć zatwierdzenie w swoich zadaniach do wykonania. Operacja jest zasadniczo podobna do procesu recenzji artykułu.