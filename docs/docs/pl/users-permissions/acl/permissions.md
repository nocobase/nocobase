---
pkg: '@nocobase/plugin-acl'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Konfigurowanie uprawnień

## Ogólne ustawienia uprawnień

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Uprawnienia konfiguracyjne

1.  **Pozwala konfigurować interfejs:** To uprawnienie decyduje o tym, czy użytkownik może konfigurować interfejs. Aktywowanie go dodaje przycisk konfiguracji interfejsu użytkownika. Rola "admin" ma to uprawnienie domyślnie włączone.
2.  **Pozwala instalować, aktywować, wyłączać wtyczki:** To uprawnienie określa, czy użytkownik może włączać lub wyłączać wtyczki. Po aktywacji użytkownik uzyskuje dostęp do interfejsu menedżera wtyczek. Rola "admin" ma to uprawnienie domyślnie włączone.
3.  **Pozwala konfigurować wtyczki:** To uprawnienie umożliwia użytkownikowi konfigurowanie parametrów wtyczek lub zarządzanie danymi zaplecza wtyczek. Rola "admin" ma to uprawnienie domyślnie włączone.
4.  **Pozwala czyścić pamięć podręczną, restartować aplikację:** To uprawnienie jest związane z zadaniami konserwacji systemu, takimi jak czyszczenie pamięci podręcznej i ponowne uruchamianie aplikacji. Po aktywacji odpowiednie przyciski operacji pojawią się w centrum osobistym. To uprawnienie jest domyślnie wyłączone.
5.  **Nowe elementy menu są domyślnie dostępne:** Nowo utworzone menu są domyślnie dostępne, a to ustawienie jest domyślnie włączone.

### Globalne uprawnienia do operacji

Globalne uprawnienia do operacji mają zastosowanie uniwersalnie do wszystkich kolekcji i są kategoryzowane według typu operacji. Uprawnienia te można konfigurować w oparciu o zakres danych: wszystkie dane lub własne dane użytkownika. Pierwsza opcja pozwala na wykonywanie operacji na całej kolekcji, natomiast druga ogranicza operacje tylko do danych związanych z użytkownikiem.

## Uprawnienia do operacji na kolekcjach

![](https://static-docs.nocobase.com/6a6e028139cecdea5b71210121d0d3a435d.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Uprawnienia do operacji na kolekcjach pozwalają na precyzyjne dostosowanie globalnych uprawnień do operacji poprzez konfigurowanie dostępu do zasobów w ramach każdej kolekcji. Uprawnienia te dzielą się na dwa aspekty:

1.  **Uprawnienia do operacji:** Obejmują one operacje dodawania, przeglądania, edytowania, usuwania, eksportowania i importowania. Uprawnienia są ustawiane w oparciu o zakres danych:
    -   **Wszystkie rekordy:** Udziela użytkownikowi możliwości wykonywania operacji na wszystkich rekordach w kolekcji.
    -   **Własne rekordy:** Ogranicza użytkownika do wykonywania operacji tylko na rekordach, które sam utworzył.

2.  **Uprawnienia do pól:** Uprawnienia do pól umożliwiają ustawienie specyficznych uprawnień dla każdego pola podczas różnych operacji. Na przykład, niektóre pola można skonfigurować jako tylko do odczytu, bez możliwości edycji.

## Uprawnienia dostępu do menu

Uprawnienia dostępu do menu kontrolują dostęp w oparciu o elementy menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Uprawnienia do konfiguracji wtyczek

Uprawnienia do konfiguracji wtyczek kontrolują możliwość konfigurowania specyficznych parametrów wtyczek. Po włączeniu, w centrum administracyjnym pojawi się odpowiedni interfejs zarządzania wtyczkami.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)