---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/workflow/triggers/approval).
:::

# Zatwierdzanie

## Wprowadzenie

Zatwierdzanie to rodzaj procesu zaprojektowanego specjalnie do ręcznego inicjowania i przetwarzania zadań przez ludzi w celu podjęcia decyzji o statusie powiązanych danych. Jest powszechnie stosowany w automatyzacji biura lub innych procesach decyzyjnych wymagających udziału człowieka, takich jak tworzenie i zarządzanie ręcznymi przepływami pracy dla scenariuszy takich jak „wnioski urlopowe”, „zatwierdzanie zwrotów kosztów” i „zatwierdzanie zakupu surowców”.

Wtyczka Zatwierdzanie udostępnia dedykowany typ przepływu pracy (wyzwalacz) „Zatwierdzanie (zdarzenie)” oraz dedykowany węzeł „Zatwierdzanie” dla tego procesu. W połączeniu z unikalnymi dla NocoBase niestandardowymi kolekcjami i blokami, mogą Państwo szybko i elastycznie tworzyć oraz zarządzać różnymi scenariuszami zatwierdzania.

## Tworzenie przepływu pracy

Podczas tworzenia przepływu pracy proszę wybrać typ „Zatwierdzanie”, aby utworzyć przepływ pracy zatwierdzania:

![Wyzwalacz zatwierdzania_Tworzenie przepływu pracy zatwierdzania](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Następnie, w interfejsie konfiguracji przepływu pracy, proszę kliknąć wyzwalacz, aby otworzyć okno dialogowe w celu dokonania dalszej konfiguracji.

## Konfiguracja wyzwalacza

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Wiązanie kolekcji

Wtyczka Zatwierdzanie w NocoBase została zaprojektowana z myślą o elastyczności i może być używana z dowolną niestandardową kolekcją. Oznacza to, że konfiguracja zatwierdzania nie wymaga ponownego konfigurowania modelu danych, lecz bezpośrednio wykorzystuje już utworzoną kolekcję. Dlatego po wejściu do konfiguracji wyzwalacza, w pierwszej kolejności należy wybrać kolekcję, aby określić, dla której kolekcji danych proces będzie prowadzony:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Wybór kolekcji](https://static-docs.nocobase.com/20251226103223.png)

### Sposób wyzwalania

Podczas inicjowania zatwierdzenia dla danych biznesowych, mogą Państwo wybrać jeden z dwóch poniższych sposobów wyzwalania:

*   **Przed zapisaniem danych**

    Inicjuje zatwierdzanie przed zapisaniem przesłanych danych. Jest to odpowiednie dla scenariuszy, w których dane powinny zostać zapisane dopiero po uzyskaniu zgody. W tym trybie dane w momencie inicjowania są danymi tymczasowymi i zostaną formalnie zapisane w odpowiedniej kolekcji dopiero po zatwierdzeniu.

*   **Po zapisaniu danych**

    Inicjuje zatwierdzanie po zapisaniu przesłanych danych. Jest to odpowiednie dla scenariuszy, w których dane mogą zostać najpierw zapisane, a następnie zatwierdzone. W tym trybie dane są już zapisane w kolekcji w momencie rozpoczęcia zatwierdzania, a wszelkie modyfikacje dokonane podczas procesu zatwierdzania również zostaną zapisane.

### Miejsce inicjowania zatwierdzania

Mogą Państwo wybrać miejsce w systemie, w którym można zainicjować zatwierdzanie:

*   **Tylko w blokach danych**

    Mogą Państwo powiązać akcję dowolnego bloku formularza tej tabeli z tym przepływem pracy w celu inicjowania zatwierdzeń, a następnie przetwarzać i śledzić proces zatwierdzania w bloku zatwierdzania pojedynczego rekordu. Jest to zazwyczaj odpowiednie dla danych biznesowych.

*   **Zarówno w blokach danych, jak i w Centrum zadań**

    Oprócz bloków danych, zatwierdzenia można również inicjować i przetwarzać w globalnym Centrum zadań. Jest to zazwyczaj odpowiednie dla danych administracyjnych.

### Kto może inicjować zatwierdzanie

Mogą Państwo skonfigurować uprawnienia oparte na zakresie użytkowników, aby zdecydować, którzy użytkownicy mogą inicjować dane zatwierdzanie:

*   **Wszyscy użytkownicy**

    Wszyscy użytkownicy w systemie mogą inicjować to zatwierdzanie.

*   **Tylko wybrani użytkownicy**

    Tylko użytkownicy w określonym zakresie mogą inicjować to zatwierdzanie. Obsługiwany jest wybór wielokrotny.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfiguracja interfejsu formularza inicjatora

Na koniec należy skonfigurować interfejs formularza inicjatora. Interfejs ten będzie używany do operacji przesyłania podczas inicjowania z bloku centrum zatwierdzania oraz podczas ponownego inicjowania po wycofaniu przez użytkownika. Proszę kliknąć przycisk konfiguracji, aby otworzyć okno dialogowe:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora](https://static-docs.nocobase.com/20251226130239.png)

Mogą Państwo dodać do interfejsu inicjatora formularz do wypełnienia oparty na powiązanej kolekcji lub tekst opisowy (Markdown) służący do wyświetlania podpowiedzi i instrukcji. Dodanie bloku formularza jest obowiązkowe; w przeciwnym razie inicjator nie będzie mógł wykonać żadnej operacji po wejściu do tego interfejsu.

Po dodaniu bloku formularza, podobnie jak w zwykłym interfejsie konfiguracji formularza, mogą Państwo dodawać komponenty pól z odpowiedniej kolekcji i dowolnie je rozmieszczać, aby zorganizować treść do wypełnienia:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora_Konfiguracja pól](https://static-docs.nocobase.com/20251226130339.png)

W odróżnieniu od przycisku bezpośredniego przesyłania, mogą Państwo również dodać przycisk akcji „Zapisz szkic”, aby umożliwić obsługę procesów tymczasowego przechowywania:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Formularz inicjatora_Konfiguracja akcji_Zapisz](https://static-docs.nocobase.com/20251226130512.png)

Jeśli przepływ pracy zatwierdzania pozwala inicjatorowi na wycofanie, należy w konfiguracji interfejsu inicjatora włączyć przycisk „Wycofaj”:

![Wyzwalacz zatwierdzania_Konfiguracja wyzwalacza_Zezwalaj na wycofanie](https://static-docs.nocobase.com/20251226130637.png)

Po włączeniu tej opcji, zatwierdzenie zainicjowane przez ten przepływ pracy może zostać wycofane przez inicjatora, zanim jakakolwiek osoba zatwierdzająca je przetworzy. Jednak po przetworzeniu przez osobę zatwierdzającą w jakimkolwiek kolejnym węźle zatwierdzania, wycofanie nie będzie już możliwe.

:::info{title=Wskazówka}
Po włączeniu lub usunięciu przycisku wycofania, należy kliknąć przycisk zapisu w oknie konfiguracji wyzwalacza, aby zmiany weszły w życie.
:::

### Karta „Moje zgłoszenia” <Badge>2.0+</Badge>

Może być używana do konfigurowania kart zadań na liście „Moje zgłoszenia” w Centrum zadań.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Na karcie można dowolnie konfigurować pola biznesowe (z wyjątkiem pól relacji) lub informacje związane z zatwierdzaniem, które mają być wyświetlane.

Po utworzeniu wniosku o zatwierdzenie, na liście w Centrum zadań będzie widoczna spersonalizowana karta zadania:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Tryb wyświetlania rekordów w przepływie

*   **Migawka**

    W procesie zatwierdzania wnioskodawca i osoby zatwierdzające widzą stan rekordu z momentu wejścia do procesu, a po przesłaniu widzą tylko rekordy zmodyfikowane przez siebie — nie widzą aktualizacji dokonanych później przez inne osoby.

*   **Najnowszy**

    W procesie zatwierdzania wnioskodawca i osoby zatwierdzające zawsze widzą najnowszą wersję rekordu przez cały czas trwania procesu, niezależnie od stanu rekordu przed ich działaniem. Po zakończeniu procesu zobaczą ostateczną wersję rekordu.

## Węzeł zatwierdzania

W przepływie pracy zatwierdzania należy użyć dedykowanego węzła „Zatwierdzanie”, aby skonfigurować logikę operacyjną dla osób zatwierdzających w celu przetwarzania (zatwierdzania, odrzucania lub zwracania) zainicjowanego zatwierdzenia. Węzeł „Zatwierdzanie” może być używany wyłącznie w przepływach pracy zatwierdzania. Proszę zapoznać się z [Węzłem zatwierdzania](../nodes/approval.md), aby uzyskać szczegółowe informacje.

:::info{title=Wskazówka}
Jeśli przepływ pracy zatwierdzania nie zawiera żadnych węzłów „Zatwierdzanie”, przepływ ten zostanie automatycznie zatwierdzony.
:::

## Konfiguracja inicjowania zatwierdzania

Po skonfigurowaniu i włączeniu przepływu pracy zatwierdzania, mogą Państwo powiązać ten przepływ pracy z przyciskiem przesyłania formularza odpowiedniej kolekcji, aby użytkownicy mogli inicjować zatwierdzanie podczas przesyłania:

![Inicjowanie zatwierdzania_Wiązanie przepływu pracy](https://static-docs.nocobase.com/20251226110710