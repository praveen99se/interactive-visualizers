# 🎨 Interactive Visualizers

Interactive educational visualizers for cloud concepts, networking, algorithms, and data structures.

## Features

✨ **Interactive Learning** - Play with visualizations to understand complex concepts  
💻 **Live Coding** - See state changes and animations in real-time  
🎯 **Scalable Design** - Easy to add new visualizers  
📱 **Responsive** - Works on all devices  
⚡ **Fast** - Built with Vite and optimized for performance  

## Tech Stack

- **Vite** - Fast build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Recharts** - Charting library

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/interactive-visualizers.git
cd interactive-visualizers
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── pages/                    # Page components
├── components/visualizers/   # Visualizer tab components
├── config/visualizers.ts     # Visualizer registry
├── App.tsx                   # Main router
└── index.css                 # Global styles
```

## Adding a New Visualizer

**Read:** `ARCHITECTURE.md` for detailed guide.

Quick steps:
1. Create `src/pages/visualizers/YourVisualizer.tsx`
2. Create tab components in `src/components/visualizers/your-viz/`
3. Add route to `App.tsx`
4. Add to `src/config/visualizers.ts`

## Available Visualizers

- 🍪 **ALB vs NLB Stickiness** - Load balancer mechanisms

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # TypeScript type checking
npm run lint       # ESLint
```

## Styling

All colors use CSS variables defined in `src/index.css`. Change them once to update the entire project.

```css
--color-text-info: rgb(6, 182, 212);
--color-background-primary: rgb(255, 255, 255);
/* ... and more */
```

## Contributing

Feel free to add more visualizers! Follow the conventions in `ARCHITECTURE.md`.

## License

MIT

## Author

Praveen

---

**Want to add a visualizer? Check out `ARCHITECTURE.md` for the complete guide!**
