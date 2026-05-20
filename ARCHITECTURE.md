# 🏗️ Interactive Visualizers - Architecture & Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Core Concepts](#core-concepts)
4. [How to Add a New Visualizer](#how-to-add-a-new-visualizer)
5. [Converting HTML/CSS/JS to React](#converting-htmlcssjs-to-react)
6. [Styling Guidelines](#styling-guidelines)
7. [Best Practices](#best-practices)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

**interactive-visualizers** is a scalable platform for creating interactive educational visualizations. It's designed to:

✅ Scale to 50+ visualizers without code bloat  
✅ Make it easy for ANY developer (or LLM) to add new visualizers  
✅ Maintain consistent UI/UX across all visualizers  
✅ Keep bundle size small through lazy loading  

**Tech Stack:**
- Vite (fast build)
- React 18 (component framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- React Router (page navigation)
- Framer Motion (animations)

---

## Directory Structure

```
src/
├── pages/
│   ├── Home.tsx                           # Landing page with visualizer grid
│   ├── NotFound.tsx                       # 404 page
│   └── visualizers/
│       ├── ALBNLBVisualizer.tsx          # ALB/NLB visualizer page
│       └── [NEW_VISUALIZER_NAME].tsx     # Future visualizers
│
├── components/
│   └── visualizers/
│       ├── alb-nlb/
│       │   ├── ALBTab.tsx                # ALB content
│       │   ├── NLBTab.tsx                # NLB content
│       │   ├── SimulationTab.tsx         # Simulation content
│       │   ├── ConfigTab.tsx             # Configuration examples
│       │   ├── ComparisonTab.tsx         # Comparison table
│       │   └── README.md                 # Tab-specific docs
│       └── [OTHER_VISUALIZERS]/
│
├── config/
│   └── visualizers.ts                    # Visualizer registry (add all visualizers here)
│
├── hooks/                                 # (Ready for future hooks)
│
├── App.tsx                               # Main router component
├── main.tsx                              # React entry point
└── index.css                             # Global styles + CSS variables
```

---

## Core Concepts

### 1. **Tab-Based Architecture**
Each visualizer is typically divided into tabs:
- **Explanation tab**: Theory and concepts
- **Simulation tab**: Interactive demonstrations
- **Config tab**: Code examples (Terraform, AWS CLI, etc.)
- **Comparison tab**: Side-by-side comparisons

### 2. **CSS Variables**
All colors defined in `src/index.css` can be referenced anywhere:
```css
--color-text-info: rgb(6, 182, 212);        /* Primary action color */
--color-text-secondary: rgb(107, 114, 128); /* Secondary text */
--color-background-primary: rgb(255, 255, 255); /* Main background */
```

### 3. **Scalable State Management**
Each visualizer manages its own state using React hooks. No Redux/Context needed for simple visualizers.

### 4. **Responsive Design**
All components use Tailwind CSS. Mobile-first approach ensures works on all devices.

---

## How to Add a New Visualizer

### Step 1: Create Visualizer Entry Point

**File:** `src/pages/visualizers/YourVisualizerName.tsx`

```typescript
import React, { useState } from 'react';
import Tab1 from '../../components/visualizers/your-viz/Tab1';
import Tab2 from '../../components/visualizers/your-viz/Tab2';
// ... import more tabs

type TabType = 'tab1' | 'tab2' | 'tab3';

const tabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'tab1', label: 'Concept', emoji: '📖' },
  { id: 'tab2', label: 'Simulation', emoji: '🎮' },
  { id: 'tab3', label: 'Details', emoji: '📋' },
];

export default function YourVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('tab1');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Your Visualizer Title
      </h1>

      <div className="tab-bar mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'tab1' && <Tab1 />}
        {activeTab === 'tab2' && <Tab2 />}
        {activeTab === 'tab3' && <Tab3 />}
      </div>
    </div>
  );
}
```

### Step 2: Create Tab Components

**File:** `src/components/visualizers/your-viz/Tab1.tsx`

```typescript
import React from 'react';

export default function Tab1() {
  return (
    <div>
      <div className="info-banner">
        Your explanation here. Use <strong>bold</strong> for emphasis.
      </div>

      <div className="card">
        <div className="section-label">📊 Section Title</div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Content here...
        </p>
      </div>
    </div>
  );
}
```

### Step 3: Add Route to App.tsx

```typescript
import YourVisualizer from './pages/visualizers/YourVisualizerName';

// In the <Routes> component:
<Route path="/visualizers/your-viz" element={<YourVisualizer />} />
```

### Step 4: Add to Visualizer Registry

**File:** `src/config/visualizers.ts`

```typescript
{
  id: 'your-viz',
  title: 'Your Visualizer Title',
  description: 'What this visualizer teaches',
  category: 'cloud', // or 'networking', 'algorithms', 'data-structures'
  tags: ['Tag1', 'Tag2'],
  path: '/visualizers/your-viz',
  icon: '📊',
  lastUpdated: '2025-01-20',
},
```

### Step 5: Update Home.tsx

The home page automatically reads from the registry. No changes needed!

---

## Converting HTML/CSS/JS to React

When you paste HTML from a chat message, here's how to convert it:

### Example: Converting a Simple Interactive Element

**Original HTML:**
```html
<div class="wrap">
  <div class="tab-bar">
    <div class="tab active" onclick="switchTab('alb')">🍪 ALB</div>
    <div class="tab" onclick="switchTab('nlb')">⚡ NLB</div>
  </div>
  <div id="tab-alb">ALB content</div>
  <div id="tab-nlb" style="display:none;">NLB content</div>
</div>

<script>
function switchTab(name) {
  // Hide all tabs
  document.getElementById('tab-alb').style.display = 'none';
  document.getElementById('tab-nlb').style.display = 'none';
  // Show selected
  document.getElementById('tab-' + name).style.display = '';
}
</script>
```

**Converted React:**
```typescript
import React, { useState } from 'react';

export default function Tabs() {
  const [activeTab, setActiveTab] = useState('alb');

  return (
    <div>
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'alb' ? 'active' : ''}`}
          onClick={() => setActiveTab('alb')}
        >
          🍪 ALB
        </button>
        <button
          className={`tab ${activeTab === 'nlb' ? 'active' : ''}`}
          onClick={() => setActiveTab('nlb')}
        >
          ⚡ NLB
        </button>
      </div>

      {activeTab === 'alb' && <div>ALB content</div>}
      {activeTab === 'nlb' && <div>NLB content</div>}
    </div>
  );
}
```

### Key Conversions

| Original | React |
|----------|-------|
| `onclick="func()"` | `onClick={() => func()}` |
| `style="display:none;"` | Conditional rendering: `{condition && <div>...</div>}` |
| `document.getElementById().style.X` | `useState()` + conditional rendering |
| Global CSS classes | Keep as `.class-name` in JSX |
| Inline styles | Use `style={{}}` object in JSX |
| `<div class="x">` | `<div className="x">` |

---

## Styling Guidelines

### 1. **Use CSS Variables for Colors**

❌ **Don't hardcode colors:**
```typescript
<div style={{ color: '#1d4ed8' }}>Text</div>
```

✅ **Do use CSS variables:**
```typescript
<div style={{ color: 'var(--color-text-info)' }}>Text</div>
```

### 2. **Use Tailwind for Layout**

❌ **Don't:**
```typescript
<div style={{ display: 'flex', gap: '16px', padding: '20px' }}>
```

✅ **Do:**
```typescript
<div className="flex gap-4 p-5">
```

### 3. **Badge System**

Use predefined badge styles for labels:
```typescript
<span className="badge badge-blue">Label</span>
```

Available: `badge-blue`, `badge-teal`, `badge-amber`, `badge-coral`, `badge-purple`, `badge-green`

### 4. **Card Containers**

```typescript
<div className="card">
  <div className="section-label">📊 Section</div>
  <p>Content here...</p>
</div>
```

### 5. **Info Banners**

```typescript
<div className="info-banner">
  Important info. Use <strong>bold</strong> for emphasis.
</div>
```

---

## Best Practices

### 1. **Component Composition**
Keep each tab as a separate component. Don't put everything in one file.

### 2. **State Isolation**
Each visualizer manages its own state. Don't use global state unless absolutely necessary.

### 3. **Reusable Utilities**
If you create a utility function used by multiple visualizers, put it in `src/hooks/`.

### 4. **TypeScript**
Always use TypeScript. Define types for props and state:

```typescript
interface ClientState {
  id: string;
  name: string;
  ip: string;
}

interface SimulationProps {
  clients: ClientState[];
  onSimulate: (clientId: string) => void;
}

export default function Simulation({ clients, onSimulate }: SimulationProps) {
  // ...
}
```

### 5. **Accessibility**
- Use semantic HTML (`<button>`, `<section>`, etc.)
- Add `aria-labels` for icon-only buttons
- Ensure sufficient color contrast

### 6. **Performance**
- Use `React.memo()` for components that don't change often
- Lazy-load heavy visualizations with `React.lazy()`
- Keep component re-renders minimal with proper state placement

---

## Common Tasks

### Task: Add Animation to Elements

```typescript
import { motion } from 'framer-motion';

export default function AnimatedBox() {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.5, repeat: Infinity }}
      className="w-20 h-20 bg-blue-500"
    />
  );
}
```

### Task: Display Code Blocks

```typescript
<div className="code-block">
  <span className="kw">const</span> x = <span className="str">"value"</span>;
  <br />
  <span className="cm">// This is a comment</span>
</div>
```

### Task: Create Responsive Grid

```typescript
<div className="grid2">
  <div>Left column</div>
  <div>Right column</div>
</div>

<!-- On mobile, becomes single column -->
```

### Task: Add Comparison Tables

Use the `.vs-row` system:
```typescript
<div className="vs-row">
  <div className="vs-label">Feature</div>
  <div className="vs-alb">ALB: ...</div>
  <div className="vs-nlb">NLB: ...</div>
</div>
```

---

## Troubleshooting

### Issue: Styles not applying

**Solution:** Check if you're using `className` (correct) vs `class` (wrong) in React.

### Issue: State not updating

**Solution:** Make sure you're using `setState()` correctly. State is immutable in React.

```typescript
// ❌ Wrong
state.items.push(newItem);

// ✅ Correct
setState([...state.items, newItem]);
```

### Issue: Component not rendering

**Solution:** Check if imports are correct and component is default exported.

```typescript
// In parent:
import Tab1 from '../../components/visualizers/your-viz/Tab1';

// In Tab1.tsx:
export default function Tab1() { ... }  // ✅ Correct
```

### Issue: TypeScript errors

**Solution:** Ensure all props are typed and functions return correct types.

```typescript
interface Props {
  title: string;
  onClose: () => void;
}

export default function Modal({ title, onClose }: Props) {
  // ...
}
```

---

## Adding Visualizers from Chat Messages

When you paste HTML/CSS/JS code from ChatGPT or Claude:

1. **Identify the structure:** How many tabs/sections?
2. **Create components:** One file per tab
3. **Convert styling:** Inline styles → CSS variables or Tailwind
4. **Convert interactivity:** `onclick` → `onClick`, `document.getElementById()` → `useState()`
5. **Add to registry:** Update `visualizers.ts`
6. **Test:** `npm run dev` and verify

---

## Quick Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build locally
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## Directory Naming Conventions

- Pages: `PascalCase.tsx` (e.g., `ALBNLBVisualizer.tsx`)
- Components: `PascalCase.tsx` (e.g., `SimulationTab.tsx`)
- Utilities/Hooks: `camelCase.ts` (e.g., `useSimulation.ts`)
- Folders: `kebab-case` (e.g., `alb-nlb/`, `sorting-algorithms/`)

---

## Future Expansion

As you add more visualizers, consider:
- **Search/Filter** on home page
- **Tags** and categories
- **Difficulty levels** (beginner, intermediate, advanced)
- **Dark mode** toggle (Tailwind supports this out of the box)
- **Sharing** visualizer links
- **Analytics** to track which visualizers are most popular

---

**Happy visualizing! 🎨**
