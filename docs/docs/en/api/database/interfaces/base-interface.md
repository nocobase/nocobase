# BaseInterface

## Overview

BaseInterface is the base class for all Interface types. Users can inherit this class to implement custom Interface logic.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Custom toValue logic
  }

  toString(value: any, ctx?: any) {
    // Custom toString logic
  }
}
// Register the Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Converts an external string to the actual value of the interface. The value can be directly passed to the Repository for write operations.

### toString(value: any, ctx?: any)

Converts the actual value of the interface to a string type. The string type can be used for exporting or display purposes.