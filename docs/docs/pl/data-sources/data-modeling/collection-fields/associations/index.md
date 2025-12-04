:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pola relacji

W NocoBase pola relacji nie są rzeczywistymi polami, lecz służą do nawiązywania połączeń między **kolekcjami**. Koncepcja ta jest równoważna relacjom w relacyjnych bazach danych.

W relacyjnych bazach danych najczęściej spotykane typy relacji to:

- [Jeden do jednego (One-to-one)](./o2o/index.md): Każdy obiekt w dwóch **kolekcjach** odpowiada tylko jednemu obiektowi w drugiej **kolekcji**. Ten typ relacji jest zazwyczaj wykorzystywany do przechowywania różnych aspektów obiektu w oddzielnych **kolekcjach**, aby zmniejszyć redundancję i poprawić spójność danych.
- [Jeden do wielu (One-to-many)](./o2m/index.md): Każdy obiekt w jednej **kolekcji** może być powiązany z wieloma obiektami w innej **kolekcji**. Jest to jeden z najczęstszych typów relacji. Na przykład, jeden autor może napisać wiele artykułów, ale jeden artykuł może mieć tylko jednego autora.
- [Wiele do jednego (Many-to-one)](./m2o/index.md): Wiele obiektów w jednej **kolekcji** może być powiązanych z jednym obiektem w innej **kolekcji**. Ten typ relacji jest również często spotykany w modelowaniu danych. Na przykład, wielu studentów może należeć do tej samej klasy.
- [Wiele do wielu (Many-to-many)](./m2m/index.md): Wiele obiektów w dwóch **kolekcjach** może być ze sobą powiązanych. Ten typ relacji zazwyczaj wymaga pośredniej **kolekcji** do rejestrowania powiązań między poszczególnymi obiektami. Na przykład, relacja między studentami a kursami — student może zapisać się na wiele kursów, a jeden kurs może mieć wielu studentów.

Te typy relacji odgrywają ważną rolę w projektowaniu baz danych i modelowaniu danych, pomagając opisywać złożone relacje i struktury danych ze świata rzeczywistego.