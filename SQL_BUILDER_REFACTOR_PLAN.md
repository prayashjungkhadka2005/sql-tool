# 🔧 SQL Builder Refactoring Plan

## 🚨 Current Issues

### ❌ Problems Found:

1. **QueryPreview.tsx is TOO BIG (456 lines)**
   - Doing too many things
   - Export logic mixed with UI
   - Hard to maintain

2. **Page.tsx has repetitive update functions**
   - 8 similar `update*` functions
   - Should be in a custom hook

3. **Business logic in components**
   - Should be in utils or hooks

---

## ✅ Recommended Refactoring

### 1. Extract Custom Hook: `useQueryBuilder`

**Current (page.tsx):**
```typescript
// 8 separate update functions 😫
const updateQueryType = (type) => { ... }
const updateTable = (table) => { ... }
const updateColumns = (columns) => { ... }
// ... 5 more
```

**After (create hook):**
```typescript
// src/features/sql-builder/hooks/useQueryBuilder.ts
export function useQueryBuilder(initialState?: Partial<QueryState>) {
  const [queryState, setQueryState] = useState<QueryState>({
    queryType: "SELECT",
    table: "",
    columns: [],
    whereConditions: [],
    joins: [],
    orderBy: [],
    limit: null,
    offset: null,
    ...initialState,
  });

  const updateField = useCallback(<K extends keyof QueryState>(
    field: K,
    value: QueryState[K]
  ) => {
    setQueryState(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateTable = useCallback((table: string) => {
    setQueryState(prev => ({ ...prev, table, columns: [] }));
  }, []);

  const reset = useCallback(() => {
    setQueryState({
      queryType: "SELECT",
      table: "",
      columns: [],
      whereConditions: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
    });
  }, []);

  const loadTemplate = useCallback((template: Partial<QueryState>) => {
    setQueryState(prev => ({ ...prev, ...template }));
  }, []);

  return {
    queryState,
    updateField,
    updateTable,
    reset,
    loadTemplate,
  };
}
```

**Usage in page.tsx:**
```typescript
const { queryState, updateField, updateTable, reset, loadTemplate } = useQueryBuilder();

// Clean and simple!
<QueryTypeSelector 
  value={queryState.queryType} 
  onChange={(type) => updateField('queryType', type)} 
/>
```

---

### 2. Break Down QueryPreview Component

**Current:** 1 massive component (456 lines)

**After:** Split into smaller components:

```
src/features/sql-builder/components/
├── QueryPreview/
│   ├── index.tsx                    # Main container (50 lines)
│   ├── SqlDisplay.tsx              # SQL code display (80 lines)
│   ├── QueryExplanation.tsx        # Explanation panel (60 lines)
│   ├── ResultsTable.tsx            # Data table (100 lines)
│   └── ExportMenu.tsx              # Export buttons (80 lines)
```

**Benefits:**
- Each component < 100 lines ✅
- Easier to test
- Easier to maintain
- Reusable components

---

### 3. Extract Export Logic to Hook

**Create:** `src/features/sql-builder/hooks/useExport.ts`

```typescript
export function useExport() {
  const exportToCSV = useCallback((data, filename) => { ... }, []);
  const exportToJSON = useCallback((data, filename) => { ... }, []);
  const exportToSQL = useCallback((query, filename) => { ... }, []);
  const copyToClipboard = useCallback((text) => { ... }, []);
  
  return {
    exportToCSV,
    exportToJSON,
    exportToSQL,
    copyToClipboard,
  };
}
```

---

### 4. Suggested File Structure (After Refactoring)

```
src/features/sql-builder/
├── components/
│   ├── QueryPreview/              # 🆕 Split into sub-components
│   │   ├── index.tsx
│   │   ├── SqlDisplay.tsx
│   │   ├── QueryExplanation.tsx
│   │   ├── ResultsTable.tsx
│   │   └── ExportMenu.tsx
│   ├── QueryTypeSelector.tsx      # ✅ Already good
│   ├── TableSelector.tsx          # ✅ Already good
│   ├── ColumnsSelector.tsx        # ✅ Already good
│   ├── WhereClauseBuilder.tsx     # ⚠️  Could be smaller
│   ├── OrderByBuilder.tsx         # ✅ Already good
│   ├── QuickTemplates.tsx         # ✅ Already good
│   ├── HelpTooltip.tsx           # ✅ Already good
│   └── ui/
│       └── Toast.tsx              # ✅ Already good
│
├── hooks/
│   ├── useQueryBuilder.ts         # 🆕 State management
│   ├── useExport.ts               # 🆕 Export functionality
│   ├── useSqlGeneration.ts        # 🆕 SQL generation logic
│   └── useToast.ts                # ✅ Already exists
│
├── utils/
│   ├── sql-generator.ts           # ✅ Already good
│   ├── export-utils.ts            # ✅ Already good
│   ├── mock-data-generator.ts     # ✅ Already good
│   └── mock-data/                 # ✅ Already good
│
└── types/
    └── index.ts                   # ✅ Already good
```

---

## 📊 Metrics Comparison

### Before:
| Metric | Current |
|--------|---------|
| Largest component | 456 lines 🔴 |
| Page.tsx complexity | 8 update functions 🔴 |
| Reusability | Low 🔴 |
| Testability | Hard 🔴 |

### After:
| Metric | Target |
|--------|--------|
| Largest component | < 150 lines ✅ |
| Page.tsx complexity | 1 hook call ✅ |
| Reusability | High ✅ |
| Testability | Easy ✅ |

---

## 🎯 Priority Refactoring Steps

### High Priority (Do First):

1. **Create `useQueryBuilder` hook** ⭐⭐⭐
   - Reduces page.tsx from 90 lines to ~40 lines
   - Makes state management reusable
   - Easy to test

2. **Split QueryPreview component** ⭐⭐⭐
   - Biggest file (456 lines)
   - Hardest to maintain
   - Split into 5 smaller components

### Medium Priority (Do Later):

3. **Create `useExport` hook** ⭐⭐
   - Extract export logic
   - Make it reusable

4. **Simplify WhereClauseBuilder** ⭐⭐
   - 172 lines, could be smaller
   - Extract condition logic

### Low Priority (Optional):

5. **Add unit tests** ⭐
   - Test hooks
   - Test utils

---

## 🚀 Implementation Strategy

### Option 1: Refactor Now (Recommended)
- Better code quality
- Easier to add features
- More maintainable
- **Time:** 2-3 hours

### Option 2: Keep As-Is
- Works fine currently
- Add features first
- Refactor later when needed
- **Risk:** Code becomes harder to maintain

---

## 💡 Recommendation

**I recommend doing Priority 1 & 2:**

1. Create `useQueryBuilder` hook (30 min)
2. Split QueryPreview into smaller components (1-2 hours)

**Benefits:**
- Much cleaner code
- Easier to add features
- Better performance (smaller components)
- Industry best practices

**Your call!** Want me to implement these refactorings?

---

Last Updated: November 3, 2025
