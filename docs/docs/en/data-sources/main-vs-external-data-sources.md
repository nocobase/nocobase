# Main vs External Databases

The differences between main databases and external databases in NocoBase are primarily reflected in four aspects: database type support, collection type support, field type support, and backup and migration capabilities.

## 1. Database Type Support

For more details, see: [Data Source Manager](https://docs.nocobase.com/handbook/data-source-manager)

### Database Types

| Database Type | Main Database Support | External Database Support |
|------------------|---------------------------|------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Collection Management

| Collection Management | Main Database Support | External Database Support |
|----------------------|-----------------------------|------------------------------|
| Basic Management | ✅ | ✅ |
| Visual Management | ✅ | ❌ |

## 2. Collection Type Support

For more details, see: [Collections](https://docs.nocobase.com/handbook/data-modeling/collection)

| Collection Type | Main Database | External Database | Description |
|----------------|-------------------|---------------------|-------------|
| General | ✅ | ✅ | Basic collection |
| View | ✅ | ✅ | Data source view |
| Inheritance | ✅ | ❌ | Supports data model inheritance, master data source only |
| File | ✅ | ❌ | Supports file uploads, master data source only |
| Comment | ✅ | ❌ | Built-in comment system, master data source only |
| Calendar | ✅ | ❌ | Collection for calendar views |
| Expression | ✅ | ❌ | Supports formula calculations |
| Tree | ✅ | ❌ | For tree structure data modeling |
| SQL | ✅ | ❌ | Collection defined through SQL |
| External Connection | ✅ | ❌ | Connection collection for external data sources, limited functionality |

## 3. Field Type Support

For more details, see: [Collection Fields](https://docs.nocobase.com/handbook/data-modeling/collection-fields)

### Basic Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Single text | ✅ | ✅ |
| Long text | ✅ | ✅ |
| Phone | ✅ | ✅ |
| Email | ✅ | ✅ |
| URL | ✅ | ✅ |
| Integer | ✅ | ✅ |
| Number | ✅ | ✅ |
| Percent | ✅ | ✅ |
| Password | ✅ | ✅ |
| Color | ✅ | ✅ |
| Icon | ✅ | ✅ |

### Choice Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Checkbox | ✅ | ✅ |
| Single select | ✅ | ✅ |
| Multiple select | ✅ | ✅ |
| Radio group | ✅ | ✅ |
| Checkbox group | ✅ | ✅ |
| China region | ✅ | ❌ |

### Media Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Media | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown(Vditor) | ✅ | ✅ |
| Rich text | ✅ | ✅ |
| Attachment(Association) | ✅ | ❌ |
| Attachment(URL) | ✅ | ✅ |

### Date & Time Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Datetime(with time zone) | ✅ | ✅ |
| Datetime(without time zone) | ✅ | ✅ |
| Unix timestamp | ✅ | ✅ |
| Date(without time) | ✅ | ✅ |
| Time | ✅ | ✅ |

### Geometric Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Point | ✅ | ✅ |
| Line | ✅ | ✅ |
| Circle | ✅ | ✅ |
| Polygon | ✅ | ✅ |

### Advanced Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sort | ✅ | ✅ |
| Formula | ✅ | ✅ |
| Sequence | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Collection select | ✅ | ❌ |
| Encryption | ✅ | ✅ |

### System Info Fields

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| Created at | ✅ | ✅ |
| Last updated at | ✅ | ✅ |
| Created by | ✅ | ❌ |
| Last updated by | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Association Types

| Field Type | Main Database | External Database |
|-----------|----------------|-------------------|
| One-to-one | ✅ | ✅ |
| One-to-many | ✅ | ✅ |
| Many-to-one | ✅ | ✅ |
| Many-to-many | ✅ | ✅ |
| Many-to-many (array) | ✅ | ✅ |

:::info
Attachment fields depend on file collections, which are only supported by main databases. Therefore, external databases do not currently support attachment fields.
:::

## 4. Backup and Migration Support Comparison

| Feature | Main Database | External Database |
|---------|-------------------|---------------------|
| Backup & Restore | ✅ | ❌ (User managed) |
| Migration Management | ✅ | ❌ (User managed) |

:::info
NocoBase provides backup, restore, and structure migration capabilities for main databases. For external databases, these operations need to be completed independently by users according to their own database environments. NocoBase does not provide built-in support.
:::

## Summary Comparison

| Comparison Item | Main Database | External Database |
|----------------|-------------------|---------------------|
| Database Types | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Collection Type Support | All collection types | Only general and view collections |
| Field Type Support | All field types | All field types except attachment fields |
| Backup & Migration | Built-in support | User managed |

## Recommendations

- **If you are using NocoBase to build a new business system**, please use the **main database**, which will allow you to use NocoBase's complete functionality.
- **If you are using NocoBase to connect to other systems' databases for basic CRUD operations**, then use **external databases**.