# NAATAL - Agent Development Guide

This file provides essential information for AI agents working on this codebase.

## 🚀 Development Commands

### Development
```bash
npm run dev
```
Starts the Vite development server on port 3000 with auto-open.

### Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` directory.

### Preview
```bash
npm run preview
```
Previews the production build locally.

### Lint
```bash
npm run lint
```
Runs ESLint on all JS/JSX files.
**Note:** ESLint is not installed. Install with: `npm install -D eslint`

### Testing
```bash
# No test runner currently configured
# To add testing:
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run single test file (once vitest is configured):
npm test -- path/to/test.test.js

# Run tests in watch mode:
npm test -- --watch

# Run tests with coverage:
npm test -- --coverage
```

## 📁 Project Structure

```
Naatal/
├── src/
│   ├── components/
│   │   ├── Audiovisuel.jsx & .css    # Audiovisual production section
│   │   ├── Cinema.jsx & .css          # Cinema/feature film section
│   │   ├── Contact.jsx & .css         # Contact form section
│   │   ├── Footer.jsx & .css          # Site footer
│   │   ├── Header.jsx & .css          # Navigation header
│   │   └── Hero.jsx & .css            # Hero landing section
│   ├── App.jsx & App.css              # Main app component
│   ├── index.css                      # Global styles
│   └── main.jsx                       # React entry point
├── public/
│   ├── videos/                        # Video assets
│   └── img/                           # Image assets
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Code Style Guidelines

### Imports
- React imports first
- Third-party libraries second
- Local components last
- Use named imports when possible

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import './Header.css'
```

### Components
- Functional components only (no class components)
- Use `export default function ComponentName()`
- Hooks at the top of the component
- Props destructuring

```jsx
export default function Component({ prop1, prop2 }) {
  const [state, setState] = useState(null)

  return <div>...</div>
}
```

### Naming Conventions
- **Components:** PascalCase (Hero, Cinema, Audiovisuel)
- **Variables/Functions:** camelCase (isOpen, handleClick)
- **Constants:** camelCase or UPPER_SNAKE_CASE (menuItems, API_URL)
- **CSS Classes:** kebab-case (service-card, hero-title)
- **Files:** ComponentName.jsx, ComponentName.css

### Formatting
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays
- Max line length: 100 characters

```jsx
const obj = {
  key1: 'value1',
  key2: 'value2',
}
```

### TypeScript/PropTypes
- Project uses vanilla JavaScript (no TypeScript)
- Consider adding PropTypes for component validation

```bash
npm install prop-types
```

### Error Handling
- Use try-catch for async operations
- Validate props before rendering  
- Handle video loading errors gracefully
- Return early from components on error conditions

```jsx
const handleVideoError = (e) => {
  e.target.style.display = 'none'
}

// Async example
const fetchData = async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    console.error('Data fetch error:', error)
    return null
  }
}
```

### Comments
- Minimal comments (code should be self-documenting)
- Only comment complex logic or workarounds
- French comments for UI content
- English comments for code logic

## 🎯 Component Patterns

### Animation Components
Use Framer Motion for all animations:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### Video Components
All videos must have these attributes:

```jsx
<video
  autoPlay
  muted
  loop
  playsInline
  onError={handleVideoError}
>
  <source src="/path/to/video.mp4" type="video/mp4" />
</video>
```

### Scroll Animations
Use `whileInView` and `viewport={{ once: true }}` for scroll-triggered animations.

### Container/Item Variants
Use staggered animations for lists:

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}
```

## 🎨 Design System

### Colors
- **Background:** `#000000` (Black)
- **Text:** `#ffffff` (White)
- **Accent 1:** `#b0b0b0` (Light Gray)
- **Accent 2:** `#808080` (Dark Gray)
- **Overlay:** `rgba(255, 255, 255, 0.05)`

### Typography
- **Headings:** Font weight 700-900, letter-spacing -1px to -5px
- **Body:** Font weight 300-400, letter-spacing 0-2px
- **Sizes:** 12px (small) to 120px (hero title)

### Spacing
- **Section padding:** 80px-120px vertical, 20px-40px horizontal
- **Gap:** 20px-60px depending on layout
- **Border radius:** 8px-20px

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px
- **Large:** > 1400px

## 🌐 Language & Content

### UI Text
- **Primary:** French (FR)
- **User-facing content:** French
- **Code comments:** English (minimal)

### File Paths
- Videos: `/videos/` (public folder)
- Images: `/img/` (public folder)
- Relative imports for components

## ⚡ Performance Best Practices

### Images
- Use WebP format when possible
- Lazy load images below the fold
- Optimize file size before adding

### Videos
- Keep files under 8MB
- Use H.264 codec for MP4
- Optimize bitrate (2-6 Mbps)
- Ensure seamless loops

### Code
- Lazy load components if needed
- Minimize re-renders with React.memo
- Use useMemo/useCallback for expensive operations

## 🔍 Common Tasks

### Adding a New Section
1. Create `ComponentName.jsx` and `ComponentName.css`
2. Add to `App.jsx` imports and routes
3. Add navigation link to `Header.jsx` menuItems
4. Add quick link to `Footer.jsx`
5. Test responsive behavior

### Updating Content
1. Find the data array in the component
2. Update the data objects
3. Test with `npm run dev`

### Adding Videos
1. Place video in `public/videos/`
2. Add video path to component data
3. Add error handling for video loading
4. Test on slow connections

## 🐛 Debugging Tips

### Videos Not Loading
- Check video path is correct
- Verify file is in `public/videos/`
- Check browser console for errors
- Ensure video format is MP4 with H.264

### Animations Not Working
- Check Framer Motion imports
- Verify viewport configuration
- Check for conflicting CSS
- Test with viewport disabled

### Responsive Issues
- Check media queries in CSS
- Test on actual devices
- Use browser dev tools
- Check for fixed widths

## 📦 Dependencies

### Core
- react@18.2.0
- react-dom@18.2.0
- react-router-dom@6.20.0

### Animation
- framer-motion@10.16.4
- gsap@3.12.2

### Build
- vite@5.0.2
- @vitejs/plugin-react@4.2.0

### Types
- @types/react@18.2.37
- @types/react-dom@18.2.15

## 🔐 Security Considerations

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Sanitize user inputs (forms)
- Validate file uploads
- Use HTTPS in production

## 📝 Commit Conventions

Follow conventional commits:

```
feat: add new feature
fix: fix bug
style: formatting changes
refactor: code refactoring
docs: documentation changes
perf: performance improvements
test: add/update tests
chore: maintenance tasks
```

Example: `feat: add cinema section with film showcase`

---

**Last Updated:** 2026-01-14
**Project Version:** 1.0.0
