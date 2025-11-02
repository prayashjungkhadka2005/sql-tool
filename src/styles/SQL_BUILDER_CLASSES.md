# SQL Query Builder - Reusable CSS Classes

**Location:** `src/styles/sql-builder.css`

All classes follow the **strong backend developer aesthetic** with monochrome colors, technical fonts, and clean design.

---

## 🎯 **WHY USE THESE CLASSES?**

### **Benefits:**
```
✅ Consistency - Same design everywhere
✅ Maintainability - Change once, update everywhere
✅ Shorter code - sql-panel vs 5 Tailwind classes
✅ Centralized - One file to rule them all
✅ Performance - Smaller bundle size
✅ Team-friendly - Clear naming conventions
```

### **Before & After:**
```tsx
// Before: Inline Tailwind (long, repetitive)
<div className="bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-5 sm:p-6">

// After: Reusable class (clean, semantic)
<div className="sql-panel sql-section">
```

---

## 📚 **AVAILABLE CLASSES:**

### **CONTAINERS**

#### **`.sql-panel`**
Main panel container
```css
bg-white (light) / #1a1a1a (dark)
border: foreground/10
rounded-lg
```

**Usage:**
```tsx
<div className="sql-panel sql-section">
  <h2 className="sql-title">Section Title</h2>
  <p className="sql-subtitle">Description here</p>
</div>
```

#### **`.sql-section`**
Padding wrapper (responsive)
```css
p-5 (mobile) / p-6 (desktop)
```

#### **`.sql-card`**
Nested card component
```css
bg-#fafafa (light) / black/40 (dark)
border: foreground/10
rounded
p-3
```

**Usage:**
```tsx
<div className="sql-card">
  <p className="sql-mono">Card content</p>
</div>
```

---

### **HEADERS & LABELS**

#### **`.sql-header`**
Section header with divider
```css
mb-5 pb-4 border-b
```

#### **`.sql-title`**
Main heading (14px, uppercase, bold)
```tsx
<h2 className="sql-title">QUERY RESULTS</h2>
```

#### **`.sql-subtitle`**
Subheading (12px, mono, muted)
```tsx
<p className="sql-subtitle">→ description text</p>
```

#### **`.sql-label`**
Form label (12px, mono, uppercase)
```tsx
<label className="sql-label">
  SELECT TABLE
</label>
```

---

### **TEXT UTILITIES**

#### **`.sql-mono`**
Monospace font
```tsx
<span className="sql-mono">technical text</span>
```

#### **`.sql-arrow`**
Arrow indicator (→)
```tsx
<span className="sql-arrow">→</span> next step
```

#### **`.sql-icon`**
Icon color (foreground/60)
```tsx
<svg className="sql-icon w-4 h-4" />
```

---

### **HELPERS**

#### **`.sql-hover`**
Hover background effect
```tsx
<div className="sql-card sql-hover">
  // Hover to see bg change
</div>
```

#### **`.sql-divider`**
Horizontal separator line
```tsx
<div className="sql-divider"></div>
```

#### **`.sql-pulse`**
Pulse animation
```tsx
<span className="sql-pulse">●</span>
```

#### **`.sql-grid-pattern`**
Subtle grid background
```tsx
<div className="sql-grid-pattern opacity-[0.02]">
  // Background with grid
</div>
```

---

## 🔄 **MIGRATION EXAMPLES:**

### **Example 1: Panel Container**

**Before:**
```tsx
<div className="relative backdrop-blur-sm bg-white/50 dark:bg-warm-dark/50 border border-white/70 dark:border-secondary/30 rounded-3xl p-5 sm:p-8 shadow-2xl hover:shadow-3xl transition-all group">
  <h2 className="text-base sm:text-xl font-bold text-foreground">Title</h2>
</div>
```

**After:**
```tsx
<div className="sql-panel sql-section">
  <h2 className="sql-title">TITLE</h2>
</div>
```

**Saved:** ~100 characters! ✅

---

### **Example 2: Input Field**

**Before:**
```tsx
<input 
  className="w-full px-3 py-2 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 hover:border-foreground/20 focus:border-foreground/30 rounded text-sm text-foreground focus:outline-none transition-all font-mono"
/>
```

**After:**
```tsx
<input className="sql-input" />
```

**Saved:** ~150 characters! ✅

---

### **Example 3: Card Grid**

**Before:**
```tsx
<div className="p-3 bg-[#fafafa] dark:bg-black/40 border border-foreground/10 rounded">
  <p className="text-xs text-foreground/40 font-mono">Info</p>
</div>
```

**After:**
```tsx
<div className="sql-card">
  <p className="sql-subtitle">Info</p>
</div>
```

---

## 🎨 **DESIGN SYSTEM:**

All classes follow these principles:

```
✅ Monochrome (blacks, whites, grays)
✅ Opacity-based (foreground/10, foreground/60)
✅ Technical (font-mono where appropriate)
✅ Minimal (no gradients, no fancy effects)
✅ Professional (like database admin tools)
✅ Consistent (same spacing, borders everywhere)
```

---

## 📝 **NAMING CONVENTION:**

```
sql-[component]-[variant]

Examples:
- sql-panel (base panel)
- sql-btn (base button)
- sql-btn-sm (small variant)
- sql-table-header (table component)
- sql-dropdown-item (dropdown component)
```

**Pattern:**
- `sql-` prefix (scoped to SQL builder)
- Component name (panel, btn, table)
- Optional variant (sm, active, outline)

---

## 🚀 **HOW TO USE:**

### **1. Import in Layout** ✅
Already imported in `/src/app/tools/sql-builder/layout.tsx`:
```tsx
import "@/styles/sql-builder.css";
```

### **2. Use in Components**
Replace long Tailwind classes with semantic SQL classes:

```tsx
// Old way
<div className="bg-white dark:bg-[#1a1a1a] border border-foreground/10 rounded-lg p-6">

// New way
<div className="sql-panel sql-section">
```

### **3. Combine with Tailwind**
You can still mix Tailwind for specific needs:

```tsx
<div className="sql-panel sql-section mt-8"> {/* mt-8 from Tailwind */}
  <h2 className="sql-title mb-4"> {/* mb-4 from Tailwind */}
    MY TITLE
  </h2>
</div>
```

---

## 🎯 **CURRENT STATUS:**

✅ **CSS file created** - `/src/styles/sql-builder.css`  
✅ **Imported in layout** - Auto-loaded for all SQL builder pages  
✅ **Variables defined** - `--foreground-rgb` added to globals.css  
✅ **Build passing** - All components compile correctly  

**Components can now use:** `sql-panel`, `sql-card`, `sql-title`, etc.

---

## 📊 **CODE REDUCTION:**

| Component | Before (chars) | After (chars) | Saved |
|-----------|----------------|---------------|-------|
| Panel | ~120 | ~20 | -83% |
| Input | ~150 | ~10 | -93% |
| Button | ~80 | ~10 | -87% |
| Label | ~70 | ~10 | -85% |

**Average reduction: ~87%!** 🎉

---

## 🔧 **EXTENDING:**

### **Add New Class:**

1. Open `/src/styles/sql-builder.css`
2. Add your class:
```css
.sql-my-custom-class {
  /* Your styles */
  background-color: white;
  border: 1px solid rgb(var(--foreground-rgb) / 0.1);
}

.dark .sql-my-custom-class {
  background-color: #1a1a1a;
}
```
3. Use it: `<div className="sql-my-custom-class">`

---

## ✅ **BEST PRACTICES:**

1. ✅ Use `sql-` prefix for all SQL builder classes
2. ✅ Keep classes semantic (sql-panel, not sql-container-1)
3. ✅ Use CSS variables for colors (`rgb(var(--foreground-rgb) / 0.1)`)
4. ✅ Support dark mode (add `.dark` variant)
5. ✅ Make responsive with media queries
6. ✅ Document new classes in this file

---

**Ready to refactor components?** We can now replace long Tailwind strings with clean, reusable `sql-*` classes! 🚀
