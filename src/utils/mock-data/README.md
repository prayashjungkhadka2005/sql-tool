# Mock Data System

A well-structured, realistic mock data generation system for the SQL Query Builder.

## 📁 **File Structure**

```
mock-data/
├── constants.ts     # Data pools (names, cities, etc.)
├── generators.ts    # Random data generators
├── factories.ts     # Table-specific factories
├── index.ts         # Main exports & query functions
└── README.md        # This file
```

---

## 🎯 **Features**

✅ **7 Tables** with 50-100 realistic rows each
✅ **High Variation** - unique, realistic data
✅ **Relationships** - foreign keys, linked data
✅ **Business Logic** - realistic constraints
✅ **Caching** - generate once, reuse
✅ **Type-Safe** - full TypeScript support

---

## 📊 **Available Tables**

| Table | Rows | Key Features |
|-------|------|--------------|
| `users` | 100 | Names, emails, roles, locations, subscriptions |
| `products` | 100 | SKUs, prices, stock, ratings, categories |
| `orders` | 100 | Order status, payments, shipping, tracking |
| `posts` | 100 | Titles, slugs, views, likes, publishing |
| `comments` | 100 | Thread support, likes, moderation |
| `categories` | 20 | Hierarchical, icons, product counts |
| `employees` | 50 | Departments, salaries, managers, performance |

---

## 🚀 **Usage**

### **Basic Usage**

```typescript
import { getMockData } from '@/utils/mock-data';

// Get all users
const users = getMockData('users');
console.log(users.length); // 100

// Get all products
const products = getMockData('products');
```

### **With Filtering**

```typescript
import { getMockData, applyWhere } from '@/utils/mock-data';

const users = getMockData('users');

const activeUsers = applyWhere(users, [
  { column: 'status', operator: '=', value: 'active', conjunction: 'AND' }
]);
```

### **With Sorting**

```typescript
import { getMockData, applyOrderBy } from '@/utils/mock-data';

const products = getMockData('products');

const sortedByPrice = applyOrderBy(products, [
  { column: 'price', direction: 'DESC' }
]);
```

### **Full Query**

```typescript
import { executeQuery } from '@/utils/mock-data';

const result = executeQuery({
  table: 'users',
  columns: ['id', 'name', 'email'],
  where: [
    { column: 'status', operator: '=', value: 'active', conjunction: 'AND' },
    { column: 'age', operator: '>', value: '25', conjunction: 'AND' }
  ],
  orderBy: [{ column: 'created_at', direction: 'DESC' }],
  limit: 10,
  offset: 0
});

console.log(result.data);   // Filtered & sorted data
console.log(result.total);  // Total matching rows
console.log(result.count);  // Rows returned
```

---

## 🏭 **Factories**

Each table has a dedicated factory function:

```typescript
import * as factories from '@/utils/mock-data/factories';

// Create a single user
const user = factories.createUser(1);

// Create a single product
const product = factories.createProduct(1);

// Create an order (needs user context)
const order = factories.createOrder(1, 100); // id, totalUsers
```

---

## 🎲 **Generators**

Reusable utilities for random data:

```typescript
import * as G from '@/utils/mock-data/generators';

// Random name
const name = G.generateName.full();  // "John Smith"

// Random email
const email = G.generateEmail.fromName(name);  // "john.smith@gmail.com"

// Random number
const age = G.random.int(18, 65);  // Random age

// Random boolean with 70% true
const isActive = G.random.bool(0.7);

// Random date (30 days ago)
const date = G.random.date(30);
```

---

## 📚 **Constants**

Centralized data pools:

```typescript
import * as C from '@/utils/mock-data/constants';

C.FIRST_NAMES.male      // ["James", "John", ...]
C.LAST_NAMES            // ["Smith", "Johnson", ...]
C.CITIES                // [{ name: "New York", state: "NY" }, ...]
C.PRODUCT_CATEGORIES    // ["Electronics", "Computers", ...]
C.TECHNOLOGIES          // ["React", "Node.js", ...]
```

---

## 💾 **Caching**

Data is cached on first generation:

```typescript
import { getMockData, clearCache } from '@/utils/mock-data';

// First call: generates data
const users1 = getMockData('users'); // Slow (generation)

// Second call: returns cached
const users2 = getMockData('users'); // Fast (cached)

// Clear cache
clearCache('users');  // Clear specific table
clearCache();         // Clear all tables
```

---

## 🎨 **Data Variations**

### **Realistic Distributions**

```typescript
// User roles: More users than admins
role: random.pick(['admin', 'user', 'user', 'user', 'moderator'])

// Product ratings: Bell curve around 4.0
rating: random.float(3.0, 5.0)

// Order status: Most are delivered
status: weighted(['delivered', 'shipped', 'pending', 'cancelled'])
```

### **Logical Constraints**

```typescript
// If product is out of stock, mark inactive
const stock = random.int(0, 200);
const isActive = stock > 0 && random.bool(0.85);

// Payment status matches order status
const isPaid = ['confirmed', 'shipped', 'delivered'].includes(status);

// Views determine likes
const views = random.int(0, 10000);
const likes = Math.floor(views * random.float(0.01, 0.1));
```

### **Relationships**

```typescript
// Order references user
user_id: random.int(1, totalUsers)

// Comment can be a reply
parent_id: random.bool(0.2) ? random.int(1, id - 1) : null

// Employee has manager
manager_id: id > 10 ? random.int(1, 10) : null
```

---

## 🔧 **Extending**

### **Add New Table**

1. **Create factory in `factories.ts`:**

```typescript
export function createInvoice(id: number): any {
  return {
    id,
    invoice_number: `INV-${random.int(10000, 99999)}`,
    amount: random.float(100, 5000),
    status: random.pick(['paid', 'pending', 'overdue']),
    created_at: random.date(90).toISOString(),
  };
}
```

2. **Add to `index.ts`:**

```typescript
case 'invoices':
  data = Array.from({ length: 100 }, (_, i) => factories.createInvoice(i + 1));
  break;
```

### **Add New Generator**

Add to `generators.ts`:

```typescript
export const generateInvoice = {
  number: (): string => `INV-${random.int(10000, 99999)}`,
  dueDate: (daysFromNow: number = 30): Date => {
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  }
};
```

### **Add New Constants**

Add to `constants.ts`:

```typescript
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
export const PAYMENT_TERMS = ['net_15', 'net_30', 'net_60', 'due_on_receipt'];
```

---

## 📊 **Data Examples**

### **User**
```json
{
  "id": 1,
  "name": "James Smith",
  "email": "james.smith@gmail.com",
  "username": "jamessmith42",
  "age": 32,
  "status": "active",
  "role": "user",
  "city": "New York",
  "state": "NY",
  "phone": "(555) 123-4567",
  "is_premium": true,
  "subscription_tier": "pro",
  "created_at": "2024-03-15T10:30:00Z"
}
```

### **Product**
```json
{
  "id": 1,
  "name": "Apple Premium Laptop",
  "sku": "AP-5432",
  "price": 1299.99,
  "stock": 45,
  "category": "Electronics",
  "brand": "Apple",
  "rating": 4.7,
  "is_active": true,
  "on_sale": false
}
```

### **Order**
```json
{
  "id": 1,
  "order_number": "ORD-1704123456-789",
  "user_id": 23,
  "status": "delivered",
  "subtotal": 249.99,
  "tax": 20.00,
  "shipping": 9.99,
  "total": 279.98,
  "payment_method": "credit_card",
  "payment_status": "paid"
}
```

---

## ✅ **Best Practices**

1. ✅ **Use caching** - Don't clear cache unnecessarily
2. ✅ **Apply filters first** - Then sort, then paginate
3. ✅ **Use executeQuery()** - For complex operations
4. ✅ **Keep factories pure** - No side effects
5. ✅ **Test with real queries** - Ensure data makes sense

---

## 🎯 **Benefits**

| Before | After |
|--------|-------|
| 1 large file (275 lines) | 4 focused files (well-organized) |
| Hardcoded data | Randomized with variations |
| Basic names | Realistic full variations |
| Simple logic | Business rules & constraints |
| No relationships | Foreign keys & links |
| Limited variation | Thousands of combinations |

---

## 📝 **Notes**

- Data is generated **client-side** in the browser
- No database or backend required
- Perfect for demos, prototypes, and learning
- All data is **fake** and randomly generated

---

**Built for the SQL Query Builder by Prayash Jung Khadka**

