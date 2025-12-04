:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Dodaj rekord

Służy do dodawania nowego rekordu do kolekcji. Wartości pól dla nowego rekordu mogą wykorzystywać zmienne z kontekstu przepływu pracy. Aby przypisać wartości do pól relacji, można bezpośrednio odwołać się do odpowiednich zmiennych danych w kontekście, które mogą być obiektem lub wartością klucza obcego. Jeśli nie używa się zmiennych, należy ręcznie wprowadzić wartości kluczy obcych. Dla wielu wartości kluczy obcych w relacjach, należy je oddzielić przecinkami.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Dodaj rekord”:

![Dodaj węzeł 'Dodaj rekord'](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Konfiguracja węzła

![Dodaj rekord_Przykład_Konfiguracja węzła](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Kolekcja

Proszę wybrać kolekcję, do której chce Pan/Pani dodać nowy rekord.

### Wartości pól

Proszę przypisać wartości do pól kolekcji. Może Pan/Pani użyć zmiennych z kontekstu przepływu pracy lub ręcznie wprowadzić wartości statyczne.

:::info{title="Uwaga"}
Dane tworzone przez węzeł „Dodaj rekord” w przepływie pracy nie obsługują automatycznie danych użytkownika, takich jak „Utworzone przez” i „Ostatnio zmodyfikowane przez”. Należy samodzielnie skonfigurować wartości dla tych pól, w zależności od potrzeb.
:::

### Wstępne ładowanie danych relacji

Jeśli pola nowego rekordu zawierają pola relacji i chce Pan/Pani użyć odpowiednich danych relacji w kolejnych krokach przepływu pracy, może Pan/Pani zaznaczyć odpowiednie pola relacji w konfiguracji wstępnego ładowania. W ten sposób, po utworzeniu nowego rekordu, odpowiednie dane relacji zostaną automatycznie załadowane i zapisane razem w danych wynikowych węzła.

## Przykład

Na przykład, gdy rekord w kolekcji „Posty” zostanie utworzony lub zaktualizowany, należy automatycznie utworzyć rekord „Wersje Postów”, aby zarejestrować historię zmian dla posta. Można to osiągnąć za pomocą węzła „Dodaj rekord”:

![Dodaj rekord_Przykład_Konfiguracja przepływu pracy](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Dodaj rekord_Przykład_Konfiguracja węzła](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Po włączeniu przepływu pracy z tą konfiguracją, gdy rekord w kolekcji „Posty” zostanie zmieniony, automatycznie zostanie utworzony rekord „Wersje Postów”, aby zarejestrować historię zmian posta.