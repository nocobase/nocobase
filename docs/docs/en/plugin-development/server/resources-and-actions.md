# Resources and Actions

A Resource is a business entry point exposed by the server, and an Action is a specific behavior performed on a resource. NocoBase builds a unified routing and permission layer in Koa based on `@nocobase/resourcer`, allowing developers to focus solely on resource definition and processing logic.

## Automatically Generated Collection Resources

When you define a Collection or its associations through Collection Configuration, the framework automatically generates the corresponding REST resources.

For example:

```ts
defineCollection({
  name: 'posts',
  fields: [
    {
      type: 'hasMany',
      name: 'comments',
    },
  ],
});
defineCollection({
  name: 'comments',
  fields: [],
});
```

The following example will result in three resources: `posts`, `comments`, and `posts.comments`:

| Request Method | Path | Action |
| -------- | ---- | ---- |
| `GET`    | `/api/posts:list` | `list` (Query list) |
| `GET`    | `/api/posts:get/1` | `get` (Query single) |
| `POST`   | `/api/posts:create` | `create` (Create) |
| `POST`   | `/api/posts:update/1` | `update` (Update) |
| `POST`   | `/api/posts:destroy/1` | `destroy` (Delete) |

| Request Method | Path | Action |
| -------- | ---- | ---- |
| `GET`    | `/api/comments:list` | `list` (Query list) |
| `GET`    | `/api/comments:get/1` | `get` (Query single) |
| `POST`   | `/api/comments:create` | `create` (Create) |
| `POST`   | `/api/comments:update/1` | `update` (Update) |
| `POST`   | `/api/comments:destroy/1` | `destroy` (Delete) |

## Built-in Action Types

NocoBase provides a rich set of built-in action types to meet various business needs:

### Basic CRUD Actions

| Action Name | Description | Applicable Resource Type | Request Method | Example Path |
|--------|------|-------------|----------|----------|
| `list` | Query list data | All | GET/POST | `/api/posts:list` |
| `get` | Query single data | All | GET/POST | `/api/posts:get/1` |
| `create` | Create a new record | All | POST | `/api/posts:create` |
| `update` | Update a record | All | POST | `/api/posts:update/1` |
| `destroy` | Delete a record | All | POST | `/api/posts:destroy/1` |

### Association Actions

| Action Name | Description | Applicable Association Type | Example Path |
|--------|------|-------------|----------|
| `add` | Add associated records to the association | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:add` |
| `remove` | Remove associated records from the association | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:remove` |
| `set` | Replace the current set of associated records | hasMany, belongsToMany, ArrayField | `/api/posts/1/comments:set` |
| `toggle` | Add or remove based on whether it is already associated | belongsToMany | `/api/posts/1/tags:toggle` |

### Advanced Actions

| Action Name | Description | Applicable Scenarios | Example Path |
|--------|------|----------|----------|
| `firstOrCreate` | Find the first record, or create it if it does not exist | Data deduplication | `/api/users:firstOrCreate` |
| `updateOrCreate` | Update a record, or create it if it does not exist | Data synchronization | `/api/users:updateOrCreate` |
| `move` | Move a record's position | Tree structure | `/api/categories:move` |

### Action Parameter Descriptions

Different actions support different parameters. Common parameters include:

- `filter`: Query conditions
- `values`: Values to be set
- `fields`: Specify returned fields
- `appends`: Include associated data
- `except`: Exclude fields
- `sort`: Sorting rules
- `page`, `pageSize`: Pagination parameters
- `paginate`: Whether to enable pagination
- `tree`: Whether to return a tree structure
- `whitelist`, `blacklist`: Field whitelist/blacklist
- `updateAssociationValues`: Whether to update association values

## Register Custom Actions

Plugins can register additional actions for all resources or a specific resource. It is recommended to use the `registerActionHandlers` API:

```ts
// Global action: all resources can call customAction
app.resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});

// Register specific actions for posts and posts.comments
app.resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinCommand(ctx),
});
```

Corresponding request examples:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

The naming convention follows `resourceName:actionName`. When an association is involved, use dot notation (`posts.comments`).

### Middleware and Action Filtering

When defining a resource, you can customize the action behavior through configuration:

```ts
app.resourceManager.define({
  name: 'posts',
  only: ['list', 'get', 'create'], // Expose only specified actions
  actions: {
    review: {
      middlewares: [requireAuth],
      handler: async (ctx) => reviewPost(ctx),
    },
  },
});
```

`middlewares` supports single or array notation and automatically inherits resource-level middleware.

## Resource Configuration Options

Resource definitions support a rich set of configuration options to meet the needs of different business scenarios:

### Basic Configuration

```ts
app.resourceManager.define({
  name: 'posts',                    // Resource name (required)
  type: 'single',                   // Resource type: single | hasOne | hasMany | belongsTo | belongsToMany
  only: ['list', 'get'],           // Expose only specified actions
  except: ['destroy'],             // Exclude specified actions
  middleware: authMiddleware,       // Resource-level middleware
  middlewares: [authMiddleware],    // Resource-level middleware (array form)
  actions: {                       // Custom actions
    // Action configuration
  },
});
```

### Action Configuration Options

Each action can be configured independently:

```ts
app.resourceManager.define({
  name: 'posts',
  actions: {
    customAction: {
      // Action handler function
      handler: async (ctx, next) => {
        // Processing logic
        await next();
      },
      
      // Middleware (will inherit resource-level middleware)
      middlewares: [requireAuth, validateInput],
      
      // Action parameter validation
      params: {
        // Parameter configuration
      },
      
      // Other configuration options
      [key: string]: any,
    },
  },
});
```

### Action Filtering

Control exposed actions through `only` and `except`:

```ts
// Expose only specified actions
app.resourceManager.define({
  name: 'publicPosts',
  only: ['list', 'get'], // Only allow querying, no modifications
});

// Exclude specified actions
app.resourceManager.define({
  name: 'readOnlyPosts',
  except: ['create', 'update', 'destroy'], // Exclude all modification actions
});
```

### Resource Types

Different resource types are suitable for different scenarios:

- `single`: A single resource, such as application configuration
- `hasOne`: One-to-one association resource
- `hasMany`: One-to-many association resource
- `belongsTo`: Many-to-one association resource
- `belongsToMany`: Many-to-many association resource

## Middleware System

NocoBase's middleware system is based on Koa and supports applying middleware at the resource and action levels to implement features like authentication, authorization, and parameter validation.

### Middleware Types

Middleware can be a function, a string (plugin name), or a configuration object:

```ts
// Function form
const authMiddleware = async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.throw(401, 'Unauthorized');
  }
  await next();
};

// String form (plugin name)
const pluginMiddleware = 'auth';

// Configuration object form
const configMiddleware = {
  name: 'auth',
  options: { required: true },
};
```

### Resource-level Middleware

Resource-level middleware is applied to all actions of that resource:

```ts
app.resourceManager.define({
  name: 'posts',
  middlewares: [
    // Authentication middleware
    async (ctx, next) => {
      if (!ctx.state.user) {
        ctx.throw(401, 'Unauthorized');
      }
      await next();
    },
    
    // Logging middleware
    async (ctx, next) => {
      console.log(`Accessing ${ctx.action.resourceName}:${ctx.action.actionName}`);
      await next();
    },
  ],
  actions: {
    // All actions will execute the above middleware first
    list: async (ctx) => {
      // Processing logic
    },
  },
});
```

### Action-level Middleware

Action-level middleware is only applied to specific actions and will inherit resource-level middleware:

```ts
app.resourceManager.define({
  name: 'posts',
  middlewares: [authMiddleware], // Resource-level middleware
  actions: {
    list: async (ctx) => {
      // Inherits authMiddleware
    },
    
    create: {
      middlewares: [
        // Additional permission check
        async (ctx, next) => {
          if (!ctx.state.user.isAdmin) {
            ctx.throw(403, 'Admin required');
          }
          await next();
        },
      ],
      handler: async (ctx) => {
        // Executes authMiddleware first, then the permission check
      },
    },
  },
});
```

### Global Middleware

Use `resourceManager.use()` to register global middleware:

```ts
// Global logging middleware
app.resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});

// Global error handling middleware
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Resource error:', error);
    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});
```

### Middleware Execution Order

Middleware is executed in the following order:

1. Global middleware (in order of registration)
2. Resource-level middleware (in order of definition)
3. Action-level middleware (in order of definition)
4. Action handler function

```ts
app.resourceManager.use(globalMiddleware1); // 1
app.resourceManager.use(globalMiddleware2); // 2

app.resourceManager.define({
  name: 'posts',
  middlewares: [resourceMiddleware1, resourceMiddleware2], // 3, 4
  actions: {
    create: {
      middlewares: [actionMiddleware1, actionMiddleware2], // 5, 6
      handler: async (ctx) => { /* 7 */ },
    },
  },
});
```

### Common Middleware Examples

#### Authentication Middleware

```ts
const requireAuth = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    ctx.throw(401, 'Token required');
  }
  
  try {
    const user = await verifyToken(token);
    ctx.state.user = user;
  } catch (error) {
    ctx.throw(401, 'Invalid token');
  }
  
  await next();
};
```

#### Parameter Validation Middleware

```ts
const validateCreateParams = async (ctx, next) => {
  const { title, content } = ctx.action.params.values;
  
  if (!title || title.length < 3) {
    ctx.throw(400, 'Title must be at least 3 characters');
  }
  
  if (!content || content.length < 10) {
    ctx.throw(400, 'Content must be at least 10 characters');
  }
  
  await next();
};
```

#### Permission Check Middleware

```ts
const requirePermission = (permission) => {
  return async (ctx, next) => {
    if (!ctx.state.user?.permissions?.includes(permission)) {
      ctx.throw(403, `Permission ${permission} required`);
    }
    await next();
  };
};

// Usage
app.resourceManager.define({
  name: 'posts',
  actions: {
    create: {
      middlewares: [requirePermission('posts.create')],
      handler: async (ctx) => { /* ... */ },
    },
  },
});
```

## Custom Non-Collection Resources

If you need to expose capabilities unrelated to collections, you can explicitly define a resource:

```ts
app.resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = {
        version: app.getVersion(),
        plugins: app.pm.getEnabledPlugins(),
      };
    },
  },
});
```

The request method is consistent with automatic resources: `GET /api/app:getInfo` or `POST /api/app:getInfo` (both GET/POST are supported by default).

## Handler Context

The action handler function follows the Koa style `(ctx, next)` and provides rich context information and utility methods.

### Core Context Properties

#### Action Information

```ts
// Resource name
ctx.action.resourceName; // 'posts' or 'posts.comments'

// Action name
ctx.action.actionName; // 'list', 'create', 'customAction', etc.

// Action parameters (merges query parameters, request body, etc.)
ctx.action.params; // { filter: {...}, values: {...}, page: 1, ... }
```

#### Database Access

```ts
// Get the Repository corresponding to the current resource
const repo = ctx.getCurrentRepository();

// Access the database instance directly
const db = ctx.db;

// Access the cache
const cache = ctx.cache;

// Access the application instance
const app = ctx.app;
```

#### Request and Response

```ts
// Set the response body
ctx.body = { message: 'Success', data: result };

// Set the status code
ctx.status = 201;

// Throw an error
ctx.throw(400, 'Invalid parameters');
ctx.throw(404, 'Resource not found');
```

### Detailed Action Parameters

`ctx.action.params` contains all action parameters, and different action types support different parameters:

#### Query Parameters (list, get)

```ts
{
  // Query conditions
  filter: {
    title: { $like: '%keyword%' },
    status: 'published',
    createdAt: { $gte: '2024-01-01' },
  },
  
  // Field selection
  fields: ['id', 'title', 'createdAt'],
  appends: ['author', 'comments'], // Include associated data
  except: ['password', 'secret'],  // Exclude fields
  
  // Sorting
  sort: ['-createdAt', 'title'], // Sort by creation time descending, title ascending
  
  // Pagination
  page: 1,
  pageSize: 20,
  paginate: true, // Whether to enable pagination
  
  // Tree structure
  tree: true, // Return tree-structured data
}
```

#### Create Parameters (create)

```ts
{
  // Data to be created
  values: {
    title: 'New Post',
    content: 'Post content',
    authorId: 1,
  },
  
  // Field filtering
  whitelist: ['title', 'content'], // Allow only these fields
  blacklist: ['id', 'createdAt'],  // Forbid these fields
  
  // Associated data handling
  updateAssociationValues: true, // Whether to update association values
}
```

#### Update Parameters (update)

```ts
{
  // Update conditions
  filterByTk: 1, // Primary key value
  filter: { id: 1 }, // Or use a filter object
  
  // Data to be updated
  values: {
    title: 'Updated Title',
    status: 'published',
  },
  
  // Field filtering
  whitelist: ['title', 'status'],
  blacklist: ['id', 'createdAt'],
  
  // Force update
  forceUpdate: true, // Update even if there are no changes
  
  // Associated data handling
  updateAssociationValues: true,
}
```

#### Association Action Parameters

```ts
// add action
{
  values: [1, 2, 3], // IDs of associated records to add
  filterByTk: 1,     // Main record ID
}

// remove action
{
  values: [1, 2], // IDs of associated records to remove
  filterByTk: 1,  // Main record ID
}

// set action
{
  values: [1, 2, 3], // IDs of associated records to set (replaces existing associations)
  filterByTk: 1,     // Main record ID
}

// toggle action
{
  values: 1, // ID of the associated record to toggle
  filterByTk: 1, // Main record ID
}
```

### Common Utility Methods

#### Repository Operations

```ts
app.resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => {
    const repo = ctx.getCurrentRepository();
    
    // Update record
    const post = await repo.update({
      filterByTk: ctx.action.params.filterByTk,
      values: { status: 'published', publishedAt: new Date() },
    });
    
    // Query record
    const publishedPost = await repo.findOne({
      filterByTk: ctx.action.params.filterByTk,
      appends: ['author', 'comments'],
    });
    
    ctx.body = publishedPost;
  },
});
```

#### Database Queries

```ts
app.resourceManager.registerActionHandlers({
  'posts:statistics': async (ctx) => {
    const db = ctx.db;
    
    // Complex query
    const stats = await db.sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
      FROM posts
      WHERE authorId = :authorId
    `, {
      replacements: { authorId: ctx.action.params.authorId },
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    ctx.body = stats[0];
  },
});
```

#### Cache Operations

```ts
app.resourceManager.registerActionHandlers({
  'posts:cache': async (ctx) => {
    const cache = ctx.cache;
    const cacheKey = `post:${ctx.action.params.id}`;
    
    // Try to get from cache
    let post = await cache.get(cacheKey);
    
    if (!post) {
      // Cache miss, query from the database
      const repo = ctx.getCurrentRepository();
      post = await repo.findOne({
        filterByTk: ctx.action.params.id,
      });
      
      // Store in cache (expires in 5 minutes)
      await cache.set(cacheKey, post, 300);
    }
    
    ctx.body = post;
  },
});
```

### Error Handling

```ts
app.resourceManager.registerActionHandlers({
  'posts:customAction': async (ctx) => {
    try {
      // Business logic
      const result = await processData(ctx.action.params);
      ctx.body = result;
    } catch (error) {
      // Log the error
      ctx.app.logger.error('Custom action error:', error);
      
      // Return different status codes based on the error type
      if (error.name === 'ValidationError') {
        ctx.throw(400, error.message);
      } else if (error.name === 'NotFoundError') {
        ctx.throw(404, 'Resource not found');
      } else {
        ctx.throw(500, 'Internal server error');
      }
    }
  },
});
```

### Response Format

Action handler functions can return responses in various formats:

```ts
// Simple data
ctx.body = { message: 'Success' };

// Paginated data
ctx.body = {
  data: [...],
  meta: {
    count: 100,
    page: 1,
    pageSize: 20,
    totalPage: 5,
  },
};

// Error response
ctx.status = 400;
ctx.body = {
  error: 'Validation failed',
  details: ['Title is required', 'Content is too short'],
};
```

## Practical Usage Examples

### Blog System Example

The following is a complete example of resource definitions for a blog system:

```ts
// Posts resource
app.resourceManager.define({
  name: 'posts',
  middlewares: [requireAuth], // All actions require authentication
  actions: {
    // Publish post (custom action)
    publish: {
      middlewares: [requirePermission('posts.publish')],
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const post = await repo.update({
          filterByTk: ctx.action.params.filterByTk,
          values: { 
            status: 'published',
            publishedAt: new Date(),
          },
        });
        ctx.body = post;
      },
    },
    
    // Get popular posts
    popular: {
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const posts = await repo.find({
          filter: { status: 'published' },
          sort: ['-viewCount', '-createdAt'],
          limit: 10,
          appends: ['author', 'tags'],
        });
        ctx.body = posts;
      },
    },
    
    // Search posts
    search: {
      handler: async (ctx) => {
        const { keyword, category, tags } = ctx.action.params;
        const repo = ctx.getCurrentRepository();
        
        const filter: any = { status: 'published' };
        
        if (keyword) {
          filter.$or = [
            { title: { $like: `%${keyword}%` } },
            { content: { $like: `%${keyword}%` } },
          ];
        }
        
        if (category) {
          filter.categoryId = category;
        }
        
        if (tags && tags.length > 0) {
          filter.tags = { $in: tags };
        }
        
        const posts = await repo.find({
          filter,
          sort: ['-createdAt'],
          appends: ['author', 'category', 'tags'],
        });
        
        ctx.body = posts;
      },
    },
  },
});

// Comments resource
app.resourceManager.define({
  name: 'comments',
  middlewares: [requireAuth],
  actions: {
    // Moderate comments
    moderate: {
      middlewares: [requirePermission('comments.moderate')],
      handler: async (ctx) => {
        const repo = ctx.getCurrentRepository();
        const { action, commentIds } = ctx.action.params;
        
        const values = action === 'approve' 
          ? { status: 'approved' }
          : { status: 'rejected' };
        
        await repo.update({
          filter: { id: { $in: commentIds } },
          values,
        });
        
        ctx.body = { message: 'Comments moderated successfully' };
      },
    },
  },
});

// Tags resource
app.resourceManager.define({
  name: 'tags',
  actions: {
    // Get tag cloud data
    cloud: {
      handler: async (ctx) => {
        const db = ctx.db;
        const tags = await db.sequelize.query(`
          SELECT 
            t.id,
            t.name,
            t.color,
            COUNT(pt.postId) as postCount
          FROM tags t
          LEFT JOIN postTags pt ON t.id = pt.tagId
          GROUP BY t.id, t.name, t.color
          ORDER BY postCount DESC
          LIMIT 50
        `, {
          type: db.sequelize.QueryTypes.SELECT,
        });
        
        ctx.body = tags;
      },
    },
  },
});
```

### File Management Example

```ts
// File upload resource
app.resourceManager.define({
  name: 'uploads',
  middlewares: [requireAuth],
  actions: {
    // Upload file
    upload: {
      middlewares: [validateFileSize, validateFileType],
      handler: async (ctx) => {
        const { file } = ctx.request.files;
        const { category, description } = ctx.action.params;
        
        // Save file to storage
        const fileInfo = await saveFile(file, {
          category,
          description,
          userId: ctx.state.user.id,
        });
        
        // Save file record to the database
        const repo = ctx.getCurrentRepository();
        const upload = await repo.create({
          values: {
            filename: fileInfo.filename,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            path: fileInfo.path,
            category,
            description,
            userId: ctx.state.user.id,
          },
        });
        
        ctx.body = upload;
      },
    },
    
    // Batch upload
    batchUpload: {
      middlewares: [validateFileSize, validateFileType],
      handler: async (ctx) => {
        const { files } = ctx.request.files;
        const { category } = ctx.action.params;
        
        const results = [];
        const repo = ctx.getCurrentRepository();
        
        for (const file of files) {
          try {
            const fileInfo = await saveFile(file, { category });
            const upload = await repo.create({
              values: {
                filename: fileInfo.filename,
                originalName: file.name,
                size: file.size,
                mimeType: file.type,
                path: fileInfo.path,
                category,
                userId: ctx.state.user.id,
              },
            });
            results.push(upload);
          } catch (error) {
            results.push({ error: error.message, filename: file.name });
          }
        }
        
        ctx.body = { results };
      },
    },
  },
});
```

### User Management Example

```ts
// Users resource
app.resourceManager.define({
  name: 'users',
  middlewares: [requireAuth],
  actions: {
    // User registration
    register: {
      middlewares: [validateRegistrationData],
      handler: async (ctx) => {
        const { username, email, password } = ctx.action.params;
        
        // Check if username and email already exist
        const existingUser = await ctx.db.getRepository('users').findOne({
          filter: {
            $or: [{ username }, { email }],
          },
        });
        
        if (existingUser) {
          ctx.throw(400, 'Username or email already exists');
        }
        
        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await ctx.db.getRepository('users').create({
          values: {
            username,
            email,
            password: hashedPassword,
            status: 'active',
          },
        });
        
        // Send welcome email
        await sendWelcomeEmail(email, username);
        
        ctx.body = { message: 'User registered successfully', userId: user.id };
      },
    },
    
    // Reset password
    resetPassword: {
      middlewares: [validateEmail],
      handler: async (ctx) => {
        const { email } = ctx.action.params;
        
        const user = await ctx.db.getRepository('users').findOne({
          filter: { email },
        });
        
        if (!user) {
          ctx.throw(404, 'User not found');
        }
        
        // Generate reset token
        const resetToken = generateResetToken();
        await ctx.cache.set(`reset:${resetToken}`, user.id, 3600); // Expires in 1 hour
        
        // Send password reset email
        await sendPasswordResetEmail(email, resetToken);
        
        ctx.body = { message: 'Password reset email sent' };
      },
    },
    
    // Update user profile
    updateProfile: {
      middlewares: [validateProfileData],
      handler: async (ctx) => {
        const userId = ctx.state.user.id;
        const { nickname, bio, avatar } = ctx.action.params;
        
        const repo = ctx.getCurrentRepository();
        const user = await repo.update({
          filterByTk: userId,
          values: {
            nickname,
            bio,
            avatar,
            updatedAt: new Date(),
          },
        });
        
        ctx.body = user;
      },
    },
  },
});
```

## Best Practices

### 1. Resource Design Principles

- **Single Responsibility**: Each resource should be responsible for only one business domain
- **RESTful Design**: Follow REST principles and use appropriate HTTP methods
- **Resource Naming**: Use plural forms, such as `posts`, `users`, `comments`
- **Action Naming**: Use verb forms, such as `publish`, `approve`, `search`

### 2. Middleware Usage Recommendations

```ts
// Good practice: Middleware has a single responsibility
const validateInput = async (ctx, next) => {
  // Only responsible for parameter validation
  await next();
};

const checkPermission = async (ctx, next) => {
  // Only responsible for permission checking
  await next();
};

// Bad practice: Middleware has too many responsibilities
const validateAndCheckPermission = async (ctx, next) => {
  // Validates parameters and checks permissions, unclear responsibilities
  await next();
};
```

### 3. Error Handling Strategy

```ts
// Unified error handling middleware
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // Log the error
    ctx.app.logger.error('Resource error:', {
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      error: error.message,
      stack: error.stack,
    });
    
    // Return an appropriate response based on the error type
    if (error.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: error.details };
    } else if (error.name === 'NotFoundError') {
      ctx.status = 404;
      ctx.body = { error: 'Resource not found' };
    } else if (error.status) {
      ctx.status = error.status;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }
});
```

### 4. Performance Optimization

```ts
// Use caching to reduce database queries
app.resourceManager.registerActionHandlers({
  'posts:popular': async (ctx) => {
    const cacheKey = 'popular-posts';
    let posts = await ctx.cache.get(cacheKey);
    
    if (!posts) {
      const repo = ctx.getCurrentRepository();
      posts = await repo.find({
        filter: { status: 'published' },
        sort: ['-viewCount'],
        limit: 10,
        appends: ['author'],
      });
      
      // Cache for 5 minutes
      await ctx.cache.set(cacheKey, posts, 300);
    }
    
    ctx.body = posts;
  },
});

// Use pagination to avoid querying large amounts of data
app.resourceManager.registerActionHandlers({
  'posts:list': async (ctx) => {
    const { page = 1, pageSize = 20 } = ctx.action.params;
    
    const repo = ctx.getCurrentRepository();
    const [posts, count] = await repo.findAndCount({
      filter: ctx.action.params.filter,
      sort: ['-createdAt'],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    
    ctx.body = {
      data: posts,
      meta: {
        count,
        page,
        pageSize,
        totalPage: Math.ceil(count / pageSize),
      },
    };
  },
});
```

### 5. Security Considerations

```ts
// Input validation
const validatePostData = async (ctx, next) => {
  const { title, content } = ctx.action.params.values;
  
  if (!title || title.trim().length < 3) {
    ctx.throw(400, 'Title must be at least 3 characters');
  }
  
  if (!content || content.trim().length < 10) {
    ctx.throw(400, 'Content must be at least 10 characters');
  }
  
  // Prevent XSS attacks
  ctx.action.params.values.title = escapeHtml(title);
  ctx.action.params.values.content = escapeHtml(content);
  
  await next();
};

// Permission check
const requireOwnership = async (ctx, next) => {
  const userId = ctx.state.user.id;
  const resourceId = ctx.action.params.filterByTk;
  
  const repo = ctx.getCurrentRepository();
  const resource = await repo.findOne({
    filterByTk: resourceId,
    fields: ['userId'],
  });
  
  if (!resource || resource.userId !== userId) {
    ctx.throw(403, 'Access denied');
  }
  
  await next();
};
```

## Error Handling and Exceptional Cases

### Common Error Types

Various error types that may be encountered in NocoBase resource operations:

#### 1. Parameter Validation Errors

```ts
// Missing required parameter
ctx.throw(400, 'Missing required parameter: title');

// Invalid parameter format
ctx.throw(400, 'Invalid parameter format: page must be a number');

// Parameter out of range
ctx.throw(400, 'Parameter out of range: pageSize must be between 1 and 100');
```

#### 2. Authentication and Authorization Errors

```ts
// Not authenticated
ctx.throw(401, 'Authentication required');

// Authentication failed
ctx.throw(401, 'Invalid token');

// Insufficient permissions
ctx.throw(403, 'Insufficient permissions');

// Access denied to this resource
ctx.throw(403, 'Access denied to this resource');
```

#### 3. Resource Not Found Errors

```ts
// Resource not found
ctx.throw(404, 'Resource not found');

// Related resource not found
ctx.throw(404, 'Related resource not found: user with id 123');

// Action not found
ctx.throw(404, 'Action not found: customAction');
```

#### 4. Business Logic Errors

```ts
// Business rule violation
ctx.throw(422, 'Business rule violation: cannot delete published post');

// Status conflict
ctx.throw(409, 'Status conflict: post is already published');

// Dependency error
ctx.throw(409, 'Cannot delete category with existing posts');
```

#### 5. Server Errors

```ts
// Database connection failed
ctx.throw(500, 'Database connection failed');

// External service unavailable
ctx.throw(502, 'External service unavailable');

// Internal processing error
ctx.throw(500, 'Internal processing error');
```

### Error Handling Best Practices

#### 1. Unified Error Handling Middleware

```ts
// Global error handling middleware
app.resourceManager.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // Log the error
    const errorInfo = {
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      method: ctx.method,
      url: ctx.url,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    };
    
    ctx.app.logger.error('Resource operation error:', errorInfo);
    
    // Return an appropriate response based on the error type
    if (error.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        message: error.message,
        details: error.details || [],
      };
    } else if (error.name === 'SequelizeValidationError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Database validation failed',
        message: 'Invalid data provided',
        details: error.errors?.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })) || [],
      };
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      ctx.status = 409;
      ctx.body = {
        error: 'Duplicate entry',
        message: 'Resource already exists',
        field: error.errors?.[0]?.path,
      };
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      ctx.status = 400;
      ctx.body = {
        error: 'Foreign key constraint failed',
        message: 'Referenced resource does not exist',
      };
    } else if (error.status) {
      // Custom error status code
      ctx.status = error.status;
      ctx.body = {
        error: error.name || 'Error',
        message: error.message,
      };
    } else {
      // Unknown error
      ctx.status = 500;
      ctx.body = {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
      };
    }
  }
});
```

#### 2. Action-level Error Handling

```ts
app.resourceManager.registerActionHandlers({
  'posts:create': async (ctx) => {
    try {
      const { title, content, authorId } = ctx.action.params.values;
      
      // Validate required fields
      if (!title || !content) {
        ctx.throw(400, 'Title and content are required');
      }
      
      // Validate if author exists
      const author = await ctx.db.getRepository('users').findOne({
        filterByTk: authorId,
      });
      
      if (!author) {
        ctx.throw(400, 'Author not found');
      }
      
      // Create post
      const repo = ctx.getCurrentRepository();
      const post = await repo.create({
        values: { title, content, authorId },
      });
      
      ctx.body = post;
      
    } catch (error) {
      // Log action-specific error
      ctx.app.logger.error('Post creation failed:', {
        params: ctx.action.params,
        error: error.message,
      });
      
      // Re-throw the error to be handled by the global error handling middleware
      throw error;
    }
  },
});
```

#### 3. Parameter Validation Middleware

```ts
// Generic parameter validation middleware
const validateParams = (schema) => {
  return async (ctx, next) => {
    try {
      // Use Joi or other validation libraries to validate parameters
      const { error, value } = schema.validate(ctx.action.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
        
        ctx.throw(400, 'Validation failed', { details });
      }
      
      // Update parameters to the validated values
      ctx.action.params = value;
      await next();
      
    } catch (err) {
      if (err.status === 400) {
        throw err;
      }
      throw new Error(`Parameter validation error: ${err.message}`);
    }
  };
};

// Usage example
const postCreateSchema = Joi.object({
  values: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).required(),
    authorId: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).required(),
});

app.resourceManager.define({
  name: 'posts',
  actions: {
    create: {
      middlewares: [validateParams(postCreateSchema)],
      handler: async (ctx) => {
        // Parameters are already validated and can be used directly
        const { values } = ctx.action.params;
        // ...
      },
    },
  },
});
```

#### 4. Business Logic Error Handling

```ts
// Business rule validation middleware
const validateBusinessRules = async (ctx, next) => {
  const { actionName, resourceName } = ctx.action;
  
  if (resourceName === 'posts' && actionName === 'destroy') {
    const postId = ctx.action.params.filterByTk;
    const repo = ctx.getCurrentRepository();
    
    // Check if the post has comments
    const commentCount = await ctx.db.getRepository('comments').count({
      filter: { postId },
    });
    
    if (commentCount > 0) {
      ctx.throw(409, 'Cannot delete post with existing comments');
    }
    
    // Check if the post is published
    const post = await repo.findOne({
      filterByTk: postId,
      fields: ['status'],
    });
    
    if (post?.status === 'published') {
      ctx.throw(409, 'Cannot delete published post');
    }
  }
  
  await next();
};
```

#### 5. Retry Mechanism

```ts
// Retry middleware
const withRetry = (maxRetries = 3, delay = 1000) => {
  return async (ctx, next) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await next();
        return; // Success, exit the retry loop
      } catch (error) {
        lastError = error;
        
        // Only retry for specific errors
        if (error.name === 'SequelizeConnectionError' || 
            error.name === 'TimeoutError') {
          
          if (attempt < maxRetries) {
            ctx.app.logger.warn(`Retry attempt ${attempt}/${maxRetries} for ${ctx.action.resourceName}:${ctx.action.actionName}`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
            continue;
          }
        }
        
        // Do not retry or max retries reached
        throw error;
      }
    }
    
    throw lastError;
  };
};

// Use retry middleware
app.resourceManager.define({
  name: 'externalData',
  actions: {
    sync: {
      middlewares: [withRetry(3, 2000)], // Retry up to 3 times, with a 2-second interval
      handler: async (ctx) => {
        // External API call that might fail
        await syncExternalData();
      },
    },
  },
});
```

#### 6. Error Monitoring and Alerting

```ts
// Error monitoring middleware
const errorMonitoring = async (ctx, next) => {
  const startTime = Date.now();
  
  try {
    await next();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Send error to monitoring system
    await sendErrorToMonitoring({
      resource: ctx.action?.resourceName,
      action: ctx.action?.actionName,
      error: error.message,
      stack: error.stack,
      duration,
      userId: ctx.state.user?.id,
      requestId: ctx.state.requestId,
    });
    
    // Send alert for critical errors
    if (error.status >= 500) {
      await sendAlert({
        level: 'error',
        message: `Server error in ${ctx.action?.resourceName}:${ctx.action?.actionName}`,
        details: {
          error: error.message,
          stack: error.stack,
          duration,
        },
      });
    }
    
    throw error;
  }
};
```

### Error Response Format

All error responses should follow a unified format:

```ts
// Success response
{
  "data": { ... },
  "meta": { ... }
}

// Error response
{
  "error": "Error type",
  "message": "Human readable error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Field specific error message",
      "value": "invalidValue"
    }
  ],
  "requestId": "unique-request-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Debugging Tips

#### 1. Enable Detailed Logging

```ts
// Enable detailed error information in the development environment
if (process.env.NODE_ENV === 'development') {
  app.resourceManager.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Detailed error information:', {
        resource: ctx.action?.resourceName,
        action: ctx.action?.actionName,
        params: ctx.action?.params,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  });
}
```

#### 2. Request Tracing

```ts
// Request tracing middleware
const requestTracing = async (ctx, next) => {
  const requestId = generateRequestId();
  ctx.state.requestId = requestId;
  
  ctx.app.logger.info('Request started:', {
    requestId,
    resource: ctx.action?.resourceName,
    action: ctx.action?.actionName,
    method: ctx.method,
    url: ctx.url,
  });
  
  try {
    await next();
    
    ctx.app.logger.info('Request completed:', {
      requestId,
      status: ctx.status,
      duration: Date.now() - ctx.state.startTime,
    });
  } catch (error) {
    ctx.app.logger.error('Request failed:', {
      requestId,
      error: error.message,
      duration: Date.now() - ctx.state.startTime,
    });
    throw error;
  }
};
```