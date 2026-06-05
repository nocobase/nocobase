# Using API Keys in NocoBase

This guide demonstrates how to use API Keys in NocoBase to retrieve data through a practical "To-Dos" example. Follow the step-by-step instructions below to understand the complete workflow.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Understanding API Keys

An API Key is a secure token that authenticates API requests from authorized users. It functions as a credential that validates the identity of the requester when accessing the NocoBase system via web applications, mobile apps, or backend scripts.

In the HTTP request header, you'll see a format like:

```txt
Authorization: Bearer {API key}
```

The "Bearer" prefix indicates that the following string is an authenticated API Key used to verify the requester's permissions.

### Common Use Cases

API Keys are typically used in the following scenarios:

1. **Client Application Access**: Web browsers and mobile apps use API Keys to authenticate user identity, ensuring only authorized users can access data.
2. **Automated Task Execution**: Background processes and scheduled tasks use API Keys to securely execute updates, data synchronization, and logging operations.
3. **Development and Testing**: Developers use API Keys during debugging and testing to simulate authenticated requests and verify API responses.

API Keys provide multiple security benefits: identity verification, usage monitoring, request rate limiting, and threat prevention, ensuring the stable and secure operation of NocoBase.

## 2 Creating API Keys in NocoBase

### 2.1 Activate the Auth: API Keys Plugin

Ensure that the built-in [Auth: API Keys](/plugins/@nocobase/plugin-api-keys/) plugin is activated. Once enabled, a new API Keys configuration page will appear in the system settings.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Create a Test Collection

For demonstration purposes, create a collection named `todos` with the following fields:

- `id`
- `title`
- `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Add some sample records to the collection:

- eat food
- sleep
- play games

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Create and Assign a Role

API Keys are bound to user roles, and the system determines request permissions based on the assigned role. Before creating an API Key, you must create a role and configure the appropriate permissions. Create a role named "To Dos API Role" and grant it full access to the `todos` collection.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

If the "To Dos API Role" is not available when creating an API Key, ensure that the current user has been assigned this role:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

After role assignment, refresh the page and navigate to the API Keys management page. Click "Add API Key" to verify that the "To Dos API Role" appears in the role selection.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

For better access control, consider creating a dedicated user account (e.g., "To Dos API User") specifically for API Key management and testing. Assign the "To Dos API Role" to this user.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Generate and Save the API Key

After submitting the form, the system will display a confirmation message with the newly generated API Key. **Important**: Copy and securely store this key immediately, as it will not be displayed again for security reasons.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Example API Key:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Important Notes

- The API Key's validity period is determined by the expiration setting configured during creation.
- API Key generation and verification depend on the `APP_KEY` environment variable. **Do not modify this variable**, as doing so will invalidate all existing API Keys in the system.

## 3 Testing API Key Authentication

### 3.1 Using the API Documentation Plugin

Open the [API Documentation](/plugins/@nocobase/plugin-api-doc/) plugin to view the request methods, URLs, parameters, and headers for each API endpoint.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Understanding Basic CRUD Operations

NocoBase provides standard CRUD (Create, Read, Update, Delete) APIs for data manipulation:

- **List Query (list API):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Request Header:
  - Authorization: Bearer <API key>

  ```
- **Create Record (create API):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Request Header:
  - Authorization: Bearer <API key>

  Request Body (in JSON format), for example:
      {
          "title": "123"
      }
  ```
- **Update Record (update API):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Request Header:
  - Authorization: Bearer <API key>

  Request Body (in JSON format), for example:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Delete Record (delete API):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Request Header:
  - Authorization: Bearer <API key>
  ```

Where:
- `{baseURL}`: Your NocoBase system URL
- `{collectionName}`: The collection name

Example: For a local instance at `localhost:13000` with a collection named `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testing with Postman

Create a GET request in Postman with the following configuration:
- **URL**: The request endpoint (e.g., `http://localhost:13000/api/todos:list`)
- **Headers**: Add `Authorization` header with the value:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Successful Response:**

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

**Error Response (Invalid/Expired API Key):**

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

**Troubleshooting**: Verify role permissions, API Key binding, and token format if authentication fails.

### 3.4 Export Request Code

Postman allows you to export the request in various formats. Example cURL command:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Using API Keys in JS Block

NocoBase 2.0 supports writing native JavaScript code directly in pages using JS blocks. This example demonstrates how to fetch external API data using API Keys.

### Creating a JS Block

In your NocoBase page, add a JS block and use the following code to fetch to-do list data:

```javascript
// Fetch to-do list data using API Key
async function fetchTodos() {
  try {
    // Show loading message
    ctx.message.loading('Fetching data...');

    // Load axios library for HTTP requests
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Failed to load HTTP library');
      return;
    }

    // API Key (replace with your actual API key)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Make API request
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Display results
    console.log('To-Do List:', response.data);
    ctx.message.success(`Successfully fetched ${response.data.data.length} items`);

    // You can process the data here
    // For example: display in a table, update form fields, etc.

  } catch (error) {
    console.error('Error fetching data:', error);
    ctx.message.error('Failed to fetch data: ' + error.message);
  }
}

// Execute the function
fetchTodos();
```

### Key Points

- **ctx.requireAsync()**: Dynamically loads external libraries (like axios) for HTTP requests
- **ctx.message**: Displays user notifications (loading, success, error messages)
- **API Key Authentication**: Pass the API Key in the `Authorization` header with `Bearer` prefix
- **Response Handling**: Process the returned data as needed (display, transform, etc.)

## 5 Summary

This guide covered the complete workflow for using API Keys in NocoBase:

1. **Setup**: Activating the API Keys plugin and creating a test collection
2. **Configuration**: Creating roles with appropriate permissions and generating API Keys
3. **Testing**: Validating API Key authentication using Postman and the API Documentation plugin
4. **Integration**: Using API Keys in JS blocks

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)


**Additional Resources:**
- [API Keys Plugin Documentation](/plugins/@nocobase/plugin-api-keys/)
- [API Documentation Plugin](/plugins/@nocobase/plugin-api-doc/)
