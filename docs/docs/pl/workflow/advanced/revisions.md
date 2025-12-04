:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zarządzanie wersjami

Po tym, jak skonfigurowany przepływ pracy zostanie uruchomiony co najmniej raz, jeśli chcą Państwo zmodyfikować jego konfigurację lub węzły, należy najpierw utworzyć nową wersję, a dopiero potem wprowadzić zmiany. Zapewnia to również, że podczas przeglądania historii wykonania wcześniej uruchomionych przepływów pracy, nie będzie ona zmieniana przez przyszłe modyfikacje.

Na stronie konfiguracji przepływu pracy mogą Państwo przeglądać istniejące wersje przepływu pracy w menu wersji, znajdującym się w prawym górnym rogu:

![Wyświetl wersje przepływu pracy](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

W menu Więcej działań („...”) po prawej stronie mogą Państwo wybrać opcję skopiowania aktualnie przeglądanej wersji do nowej wersji:

![Skopiuj przepływ pracy do nowej wersji](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Po skopiowaniu do nowej wersji, należy kliknąć przełącznik „Włącz”/„Wyłącz”, aby przełączyć odpowiednią wersję w stan włączony. Nowa wersja przepływu pracy zacznie wtedy obowiązywać.

Jeśli chcą Państwo ponownie wybrać starszą wersję, należy przełączyć się na nią z menu wersji, a następnie ponownie kliknąć przełącznik „Włącz”/„Wyłącz”, aby przełączyć ją w stan włączony. Aktualnie przeglądana wersja zacznie obowiązywać, a kolejne uruchomienia będą wykonywać proces z tej właśnie wersji.

Gdy zajdzie potrzeba dezaktywacji przepływu pracy, należy kliknąć przełącznik „Włącz”/„Wyłącz”, aby przełączyć go w stan wyłączony. Przepływ pracy nie będzie już wtedy uruchamiany.

:::info{title=Wskazówka}
W odróżnieniu od opcji „Kopiuj” przepływ pracy z listy zarządzania przepływami pracy, przepływ pracy „skopiowany do nowej wersji” nadal pozostaje zgrupowany w tym samym zestawie przepływów pracy, różniąc się jedynie wersją. Natomiast skopiowanie przepływu pracy jest traktowane jako zupełnie nowy przepływ pracy, niezwiązany z wersjami poprzedniego przepływu pracy, a jego licznik wykonań zostanie również zresetowany do zera.
:::