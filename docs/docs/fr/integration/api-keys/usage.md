:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Utiliser les clés API dans NocoBase

Ce guide vous montre comment utiliser les clés API dans NocoBase pour récupérer des données, en s'appuyant sur un exemple pratique de "liste de tâches". Suivez les instructions étape par étape ci-dessous pour comprendre le flux de travail complet.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Comprendre les clés API

Une clé API est un jeton de sécurité utilisé pour authentifier les requêtes API provenant d'utilisateurs autorisés. Elle sert de justificatif pour valider l'identité du demandeur lors de l'accès au système NocoBase via des applications web, des applications mobiles ou des scripts backend.

Dans l'en-tête des requêtes HTTP, le format est le suivant :

```txt
Authorization: Bearer {API 密钥}
```

Le préfixe "Bearer" indique que la chaîne de caractères qui suit est une clé API authentifiée, utilisée pour vérifier les permissions du demandeur.

### Cas d'utilisation courants

Les clés API sont généralement utilisées dans les scénarios suivants :

1.  **Accès aux applications clientes** : Les navigateurs web et les applications mobiles utilisent les clés API pour authentifier l'identité des utilisateurs, garantissant ainsi que seuls les utilisateurs autorisés peuvent accéder aux données.
2.  **Exécution de tâches automatisées** : Les processus en arrière-plan et les tâches planifiées utilisent les clés API pour exécuter en toute sécurité des mises à jour, des synchronisations de données et des opérations de journalisation.
3.  **Développement et tests** : Les développeurs utilisent les clés API pendant le débogage et les tests pour simuler des requêtes authentifiées et vérifier les réponses de l'API.

Les clés API offrent de multiples avantages en matière de sécurité : vérification d'identité, surveillance de l'utilisation, limitation du taux de requêtes et prévention des menaces, garantissant ainsi le fonctionnement stable et sécurisé de NocoBase.

## 2 Créer des clés API dans NocoBase

### 2.1 Activer le plugin d'authentification : Clés API

Assurez-vous que le [plugin d'authentification : Clés API](/plugins/@nocobase/plugin-api-keys/) intégré est activé. Une fois activé, une nouvelle page de configuration des clés API apparaîtra dans les paramètres du système.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Créer une collection de test

À des fins de démonstration, créez une **collection** nommée `todos` avec les champs suivants :

-   `id`
-   `titre (title)`
-   `terminé (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Ajoutez quelques enregistrements d'exemple à la **collection** :

-   Manger
-   Dormir
-   Jouer à des jeux

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Créer et attribuer un rôle

Les clés API sont liées aux rôles d'utilisateur, et le système détermine les permissions de requête en fonction du rôle attribué. Avant de créer une clé API, vous devez créer un rôle et configurer les permissions appropriées. Créez un rôle nommé "Rôle API Tâches" et accordez-lui un accès complet à la **collection** `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Si le "Rôle API Tâches" n'est pas disponible lors de la création d'une clé API, assurez-vous que l'utilisateur actuel s'est vu attribuer ce rôle :

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Après l'attribution du rôle, actualisez la page et naviguez vers la page de gestion des clés API. Cliquez sur "Ajouter une clé API" pour vérifier que le "Rôle API Tâches" apparaît dans la sélection des rôles.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Pour un meilleur contrôle d'accès, vous pouvez envisager de créer un compte utilisateur dédié (par exemple, "Utilisateur API Tâches") spécifiquement pour la gestion et le test des clés API. Attribuez le "Rôle API Tâches" à cet utilisateur.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Générer et enregistrer la clé API

Après avoir soumis le formulaire, le système affichera un message de confirmation avec la clé API nouvellement générée. **Important** : Copiez et stockez cette clé en toute sécurité immédiatement, car elle ne sera plus affichée par la suite pour des raisons de sécurité.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Exemple de clé API :

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Notes importantes

-   La période de validité de la clé API est déterminée par le paramètre d'expiration configuré lors de sa création.
-   La génération et la vérification des clés API dépendent de la variable d'environnement `APP_KEY`. **Ne modifiez pas cette variable**, car cela invaliderait toutes les clés API existantes dans le système.

## 3 Tester l'authentification par clé API

### 3.1 Utiliser le plugin de documentation API

Ouvrez le [plugin de documentation API](/plugins/@nocobase/plugin-api-doc/) pour consulter les méthodes de requête, les URL, les paramètres et les en-têtes pour chaque point d'accès API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Comprendre les opérations CRUD de base

NocoBase fournit des API CRUD (Create, Read, Update, Delete) standard pour la manipulation des données :

-   **Requête de liste (API `list`) :**

    ```txt
    GET {baseURL}/{collectionName}:list
    En-tête de requête :
    - Authorization: Bearer <clé API>

    ```
-   **Créer un enregistrement (API `create`) :**

    ```txt
    POST {baseURL}/{collectionName}:create

    En-tête de requête :
    - Authorization: Bearer <clé API>

    Corps de la requête (au format JSON), par exemple :
        {
            "title": "123"
        }
    ```
-   **Modifier un enregistrement (API `update`) :**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    En-tête de requête :
    - Authorization: Bearer <clé API>

    Corps de la requête (au format JSON), par exemple :
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Supprimer un enregistrement (API `destroy`) :**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    En-tête de requête :
    - Authorization: Bearer <clé API>
    ```

Où :
-   `{baseURL}` : L'URL de votre système NocoBase
-   `{collectionName}` : Le nom de la **collection**

Exemple : Pour une instance locale sur `localhost:13000` avec une **collection** nommée `todos` :

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Tester avec Postman

Créez une requête GET dans Postman avec la configuration suivante :
-   **URL** : Le point d'accès de la requête (par exemple, `http://localhost:13000/api/todos:list`)
-   **En-têtes** : Ajoutez l'en-tête `Authorization` avec la valeur :

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Réponse réussie :**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Réponse d'erreur (clé API invalide/expirée) :**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Dépannage** : Si l'authentification échoue, vérifiez les permissions du rôle, la liaison de la clé API et le format du jeton.

### 3.4 Exporter le code de la requête

Postman vous permet d'exporter la requête dans différents formats. Exemple de commande cURL :

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Utiliser les clés API dans un bloc JS

NocoBase 2.0 permet d'écrire du code JavaScript natif directement dans les pages à l'aide de blocs JS. Cet exemple montre comment récupérer des données d'API externes en utilisant des clés API.

### Créer un bloc JS

Dans votre page NocoBase, ajoutez un bloc JS et utilisez le code suivant pour récupérer les données de la liste de tâches :

```javascript
// Récupérer les données de la liste de tâches en utilisant la clé API
async function fetchTodos() {
  try {
    // Afficher le message de chargement
    ctx.message.loading('Récupération des données...');

    // Charger la bibliothèque axios pour les requêtes HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Échec du chargement de la bibliothèque HTTP');
      return;
    }

    // Clé API (à remplacer par votre clé API réelle)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Effectuer la requête API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Afficher les résultats
    console.log('Liste de tâches :', response.data);
    ctx.message.success(`Données récupérées avec succès : ${response.data.data.length} éléments`);

    // Vous pouvez traiter les données ici
    // Par exemple : afficher dans un tableau, mettre à jour les champs de formulaire, etc.

  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    ctx.message.error('Échec de la récupération des données : ' + error.message);
  }
}

// Exécuter la fonction
fetchTodos();
```

### Points clés

-   **ctx.requireAsync()** : Charge dynamiquement des bibliothèques externes (comme axios) pour les requêtes HTTP.
-   **ctx.message** : Affiche les notifications utilisateur (chargement, succès, messages d'erreur).
-   **Authentification par clé API** : Transmet la clé API dans l'en-tête de requête `Authorization`, en utilisant le préfixe `Bearer`.
-   **Gestion de la réponse** : Traite les données retournées selon les besoins (affichage, transformation, etc.).

## 5 Résumé

Ce guide a couvert le flux de travail complet pour l'utilisation des clés API dans NocoBase :

1.  **Configuration** : Activer le plugin de clés API et créer une **collection** de test.
2.  **Mise en place** : Créer des rôles avec les permissions appropriées et générer des clés API.
3.  **Test** : Valider l'authentification par clé API à l'aide de Postman et du plugin de documentation API.
4.  **Intégration** : Utiliser les clés API dans les blocs JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Ressources supplémentaires :**
-   [Documentation du plugin Clés API](/plugins/@nocobase/plugin-api-keys/)
-   [Plugin de documentation API](/plugins/@nocobase/plugin-api-doc/)