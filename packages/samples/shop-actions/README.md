# Modeling for simple shop scenario

## Add package

Add dependency to `packages/app/server/package.json`:

```json
{
  "dependencies": {
    "@nocobase/plugin-sample-shop-actions": "*"
  }
}
```

## Register

```ts
yarn pm add sample-shop-actions
```

## Activate

```bash
yarn pm enable sample-shop-actions
```

## Launch the app

```bash
# for development
yarn dev --db-sync

# for production
yarn build samples/shop-actions
yarn start
```

## Connect to the API

### Products API

```bash
# create a product
curl -X POST -H "Content-Type: application/json" -d '{"title": "iPhone 14 Pro", "price": 7999, "enabled": true, "inventory": 1}' "http://localhost:13000/api/products"
```

### Orders API

```bash
# create a order
curl -X POST -H "Content-Type: application/json" -d '{"productId": 1, "quantity": 1, "totalPrice": 0, "userId": 2}' 'http://localhost:13000/api/orders'
# {"id": <id>, "status": 0, "productId": 1, "quantity": 1, "totalPrice": 7999, "userId": 1}

# list orders which userId=1 with product
curl 'http://localhost:13000/api/orders?filter={"status":2}&appends=product'
```
