:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Utiliser les variables de contexte

Avec les variables de contexte, vous pouvez réutiliser des informations telles que la page actuelle, l'utilisateur, l'heure ou les conditions de filtrage. Cela vous permet d'afficher des graphiques et d'activer des interactions en fonction du contexte.

## Domaines d'application
- Pour les requêtes de données en mode Constructeur (Builder), sélectionnez les variables à utiliser dans les conditions de filtrage.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Pour les requêtes de données en mode SQL, lors de la rédaction de vos instructions, choisissez les variables et insérez des expressions (par exemple, `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Dans les options de graphique en mode Personnalisé (Custom), écrivez directement des expressions JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Pour les événements d'interaction (par exemple, cliquer pour explorer et ouvrir une boîte de dialogue afin de transmettre des données), écrivez directement des expressions JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Remarque :**
- N'ajoutez pas de guillemets simples ou doubles autour de `{{ ... }}` ; le système gère la liaison en toute sécurité en fonction du type de variable (chaîne de caractères, nombre, date, NULL).
- Lorsqu'une variable est `NULL` ou non définie, traitez explicitement les valeurs nulles en SQL en utilisant `COALESCE(...)` ou `IS NULL`.