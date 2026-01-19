:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champs de relation

Dans NocoBase, les champs de relation ne sont pas des champs à proprement parler, mais ils servent à établir des connexions entre les collections. Ce concept est équivalent aux relations que l'on trouve dans les bases de données relationnelles.

Dans les bases de données relationnelles, les types de relations les plus courants sont les suivants :

- [Un à un](./o2o/index.md) : Chaque entité de deux collections ne peut correspondre qu'à une seule entité de l'autre collection. Ce type de relation est généralement utilisé pour stocker différents aspects d'une entité dans des collections distinctes afin de réduire la redondance et d'améliorer la cohérence des données.
- [Un à plusieurs](./o2m/index.md) : Chaque entité d'une collection peut être associée à plusieurs entités d'une autre collection. C'est l'un des types de relations les plus courants. Par exemple, un auteur peut écrire plusieurs articles, mais un article ne peut avoir qu'un seul auteur.
- [Plusieurs à un](./m2o/index.md) : Plusieurs entités d'une collection peuvent être associées à une seule entité d'une autre collection. Ce type de relation est également courant dans la modélisation des données. Par exemple, plusieurs étudiants peuvent appartenir à la même classe.
- [Plusieurs à plusieurs](./m2m/index.md) : Plusieurs entités de deux collections peuvent être associées les unes aux autres. Ce type de relation nécessite généralement une collection intermédiaire pour enregistrer les associations entre les entités. Par exemple, la relation entre les étudiants et les cours : un étudiant peut s'inscrire à plusieurs cours, et un cours peut avoir plusieurs étudiants.

Ces types de relations jouent un rôle important dans la conception de bases de données et la modélisation des données, en aidant à décrire les relations complexes et les structures de données du monde réel.