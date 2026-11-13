# UI Layer Design Diagrams
 
Design diagrams for Project Deliverable 04 (Business Logic Mini-Sprint). All four describe the **UI layer** of the app and are derived from three source files:
---
 
## 1. Component Hierarchy
 
Shows how the UI components are nested, from the entry point down to the two routes.
 
- `main.jsx` imports `index.css` and renders `StrictMode` > `App`.
- `App` wraps everything in `BrowserRouter` > `Routes`.
- `Layout` is the shared wrapper route. `ListRoute` (`/`) and `DetailsRoute` (`/applications/:id`) render inside it.
## 2. Startup Sequence
 
Shows the order of events when the page loads, before any user interaction.
 
1. `index.html` loads the `main.jsx` module.
2. `main.jsx` imports `index.css`.
3. `main.jsx` calls `createRoot()` on the `#root` element.
4. `main.jsx` renders `<App />` inside `StrictMode`.
5. `react-dom` mounts `App`.
6. `App` sets up `BrowserRouter` and `Routes`.
## 3. Sidebar Navigation
 
Shows the visual states of a sidebar nav item, based on the CSS rules in `index.css`.
 
| State | CSS rule | Appearance | Trigger |
|---|---|---|---|
| Default | `.nav-item` | Dark text, no fill | Initial state |
| Hover | `a.nav-item:hover` | Light blue background | Pointer over the item |
| Keyboard focus | `a.nav-item:focus-visible` | 2px accent outline | Tab key |
| Active | `.nav-item-active` | Accent text, blue fill | Item is the current page |
| Disabled | `.nav-item-disabled`, `.nav-soon` | Muted text, not-allowed cursor, "Soon" badge | Not a link, so no hover or focus |
 
The Active transition assumes the `Layout` component applies `.nav-item-active` to the current page's link.
 
## 4. Screen Layouts
 
Shows the two layout modes and the breakpoint that switches between them (`@media (max-width: 720px)`).
 
| | Above 720px | 720px and below |
|---|---|---|
| Navigation | Sticky sidebar, 240px wide | Top bar with a scrolling nav row |
| Page content | Beside the sidebar, max 960px, centered | Below the top bar, less padding |
