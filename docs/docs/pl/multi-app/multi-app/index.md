---
pkg: '@nocobase/plugin-app-supervisor'
---

# Zarządzanie wieloma aplikacjami

## Przegląd

NocoBase pozwala zarządzać wieloma odizolowanymi aplikacjami z jednego punktu wejścia przez AppSupervisor.


Na początku wystarcza jedna aplikacja. Wraz ze wzrostem rosną koszty, złożoność i potrzeba izolacji.


W tym trybie wiele aplikacji działa w jednej instancji NocoBase; baza może być osobna, ale proces i pamięć są współdzielone.

![](https://static-docs.nocobase.com/202512231055907.png)


Dla większej skali stosuj model hybrydowy: Supervisor + wiele środowisk Worker.

![](https://static-docs.nocobase.com/202512231215186.png)
