---
pkg: '@nocobase/plugin-acl'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zastosowanie w interfejsie użytkownika

## Uprawnienia bloków danych

Widoczność bloków danych w kolekcji jest kontrolowana przez uprawnienia do operacji "Podgląd". Konfiguracje indywidualne mają wyższy priorytet niż ustawienia globalne.

Na przykład, jak pokazano poniżej: w ramach uprawnień globalnych rola "admin" ma pełny dostęp, ale dla kolekcji "Zamówienia" skonfigurowano indywidualne uprawnienia (niewidoczna).

Konfiguracja uprawnień globalnych:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Konfiguracja indywidualnych uprawnień dla kolekcji "Zamówienia":

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

W interfejsie użytkownika wszystkie bloki w kolekcji "Zamówienia" nie są wyświetlane.

Pełny proces konfiguracji przedstawiono poniżej:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Uprawnienia pól

**Podgląd**: Określa, czy konkretne pola są widoczne na poziomie pola. Pozwala to na kontrolowanie, które pola są widoczne dla określonych ról w kolekcji "Zamówienia".

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

W interfejsie użytkownika w bloku kolekcji "Zamówienia" widoczne są tylko pola, dla których skonfigurowano uprawnienia. Pola systemowe (Id, CreatedAt, LastUpdatedAt) zachowują uprawnienia do podglądu nawet bez specjalnej konfiguracji.

![](https://static-docs.nocobase.com/40cc43b517efe701147fd2e799e79dcc.png)

- **Edycja**: Kontroluje, czy pola mogą być edytowane i zapisywane (aktualizowane).

  Jak pokazano, skonfiguruj uprawnienia do edycji dla pól kolekcji "Zamówienia" (pola "Ilość" i "Powiązane produkty" mają uprawnienia do edycji).

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  W interfejsie użytkownika w bloku formularza operacji edycji w kolekcji "Zamówienia" wyświetlane są tylko pola z uprawnieniami do edycji.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Pełny proces konfiguracji przedstawiono poniżej:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Dodawanie**: Określa, czy pola mogą być dodawane (tworzone).

  Jak pokazano, skonfiguruj uprawnienia do dodawania dla pól kolekcji "Zamówienia" (pola "Numer zamówienia", "Ilość", "Produkty" i "Przesyłka" mają uprawnienia do dodawania).

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  W interfejsie użytkownika w bloku formularza operacji dodawania w kolekcji "Zamówienia" wyświetlane są tylko pola z uprawnieniami do dodawania.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Eksport**: Kontroluje, czy pola mogą być eksportowane.
- **Import**: Kontroluje, czy pola obsługują import.

## Uprawnienia operacji

Indywidualnie skonfigurowane uprawnienia mają najwyższy priorytet. Jeśli istnieją konkretne uprawnienia, zastępują one ustawienia globalne; w przeciwnym razie stosowane są ustawienia globalne.

- **Dodawanie**: Kontroluje, czy przycisk operacji "Dodaj" jest widoczny w bloku.

  Jak pokazano, skonfiguruj indywidualne uprawnienia operacji dla kolekcji "Zamówienia", aby zezwolić na dodawanie:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  W interfejsie użytkownika, gdy operacja dodawania jest dozwolona, przycisk "Dodaj" pojawia się w obszarze operacji bloku kolekcji "Zamówienia".

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Podgląd**: Kontroluje, czy blok danych jest wyświetlany.

  Jak pokazano, konfiguracja uprawnień globalnych (brak uprawnień do podglądu):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Indywidualna konfiguracja uprawnień dla kolekcji "Zamówienia":

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  W interfejsie użytkownika bloki danych dla wszystkich innych kolekcji pozostają ukryte, ale blok kolekcji "Zamówienia" jest wyświetlany.

  Pełny przykładowy proces konfiguracji przedstawiono poniżej:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Edycja**: Kontroluje, czy przycisk operacji edycji w bloku jest wyświetlany.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Uprawnienia do operacji można dodatkowo doprecyzować, ustawiając zakres danych.

  Na przykład, jak pokazano, skonfiguruj kolekcję "Zamówienia" tak, aby użytkownicy mogli edytować tylko swoje własne dane:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Usuwanie**: Kontroluje wyświetlanie przycisku operacji usuwania w bloku.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Eksport**: Kontroluje wyświetlanie przycisku operacji eksportu w bloku.

- **Import**: Kontroluje wyświetlanie przycisku operacji importu w bloku.

## Uprawnienia relacji

### Jako pole

- Uprawnienia pola relacji są kontrolowane przez uprawnienia pól kolekcji źródłowej. Kontroluje to, czy cały komponent pola relacji jest wyświetlany.

Na przykład, w kolekcji "Zamówienia" pole relacji "Klient" ma tylko uprawnienia do podglądu, importu i eksportu.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

W interfejsie użytkownika oznacza to, że pole relacji "Klient" nie będzie wyświetlane w blokach operacji dodawania i edycji w kolekcji "Zamówienia".

Pełny przykładowy proces konfiguracji przedstawiono poniżej:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Uprawnienia dla pól w komponencie pola relacji (takim jak podtabela/podformularz) są określane przez uprawnienia kolekcji docelowej.

Gdy komponent pola relacji jest podformularzem:

Jak pokazano poniżej, pole relacji "Klient" w kolekcji "Zamówienia" ma wszystkie uprawnienia, podczas gdy sama kolekcja "Klienci" jest ustawiona jako tylko do odczytu.

Indywidualna konfiguracja uprawnień dla kolekcji "Zamówienia", gdzie pole relacji "Klient" ma wszystkie uprawnienia pól:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Indywidualna konfiguracja uprawnień dla kolekcji "Klienci", gdzie pola mają uprawnienia tylko do podglądu:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

W interfejsie użytkownika pole relacji "Klient" jest widoczne w bloku kolekcji "Zamówienia". Jednak po przełączeniu na podformularz, pola w podformularzu są widoczne w widoku szczegółów, ale nie są wyświetlane w operacjach dodawania i edycji.

Pełny przykładowy proces konfiguracji przedstawiono poniżej:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Aby dodatkowo kontrolować uprawnienia dla pól w podformularzu, można nadać uprawnienia poszczególnym polom.

Jak pokazano, kolekcja "Klienci" jest skonfigurowana z indywidualnymi uprawnieniami pól (pole "Nazwa klienta" jest niewidoczne i nieedytowalne).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Pełny przykładowy proces konfiguracji przedstawiono poniżej:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Gdy komponent pola relacji jest podtabelą, sytuacja jest zgodna z tą dla podformularza:

Jak pokazano, w kolekcji "Zamówienia" znajduje się pole relacji "Przesyłka". Pole relacji "Przesyłka" w zamówieniach ma wszystkie uprawnienia, podczas gdy kolekcja "Przesyłki" jest ustawiona jako tylko do odczytu.

W interfejsie użytkownika to pole relacji jest widoczne. Jednak po przełączeniu na podtabelę, pola w podtabeli są widoczne w operacji podglądu, ale nie w operacjach dodawania i edycji.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Aby dodatkowo kontrolować uprawnienia dla pól w podtabeli, można nadać uprawnienia poszczególnym polom:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Jako blok

- Widoczność bloku relacji jest kontrolowana przez uprawnienia kolekcji docelowej odpowiadającego pola relacji i jest niezależna od uprawnień samego pola relacji.

Na przykład, to, czy blok relacji "Klient" jest wyświetlany, jest kontrolowane przez uprawnienia kolekcji "Klienci".

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Pola w bloku relacji są kontrolowane przez uprawnienia pól w kolekcji docelowej.

Jak pokazano, można ustawić uprawnienia do podglądu dla poszczególnych pól w kolekcji "Klienci".

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)