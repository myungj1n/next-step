# UI Layer Design Diagrams
 
Design diagrams for Project Deliverable 04 (Business Logic Mini-Sprint). All four describe the **UI layer** of the app and are derived from three source files:
 
| File | Role |
|---|---|
| `main.jsx` | Entry point. Creates the React root and renders `App` |
| `App.jsx` | Sets up the router and the route table |
| `index.css` | Global styles, sidebar nav, and responsive layout |
 
| # | Diagram | Type | Source file(s) |
|---|---|---|---|
| 1 | Component hierarchy | Static (structure) | `main.jsx`, `App.jsx` |
| 2 | Application bootstrap | Dynamic (sequence) | `main.jsx`, `App.jsx` |
| 3 | Nav item states | Dynamic (state machine) | `index.css` |
| 4 | Responsive layout modes | Static (layout) | `index.css` |
 
**Author:** _<team member name>_
**Reviewed and approved by:** _<teammate name>_ (date: _<date>_)
 
---
 
## 1. Component hierarchy
 
Shows how the UI components are nested, from the entry point down to the two routes.
 
- `main.jsx` imports `index.css` and renders `StrictMode` > `App`.
- `App` wraps everything in `BrowserRouter` > `Routes`.
- `Layout` is the shared wrapper route. `ListRoute` (`/`) and `DetailsRoute` (`/applications/:id`) render inside it.
## 2. Application bootstrap
 
Shows the order of events when the page loads, before any user interaction.
 
1. `index.html` loads the `main.jsx` module.
2. `main.jsx` imports `index.css`.
3. `main.jsx` calls `createRoot()` on the `#root` element.
4. `main.jsx` renders `<App />` inside `StrictMode`.
5. `react-dom` mounts `App`.
6. `App` sets up `BrowserRouter` and `Routes`.
## 3. Nav item states
 
Shows the visual states of a sidebar nav item, based on the CSS rules in `index.css`.
 
| State | CSS rule | Appearance | Trigger |
|---|---|---|---|
| Default | `.nav-item` | Dark text, no fill | Initial state |
| Hover | `a.nav-item:hover` | Light blue background | Pointer over the item |
| Keyboard focus | `a.nav-item:focus-visible` | 2px accent outline | Tab key |
| Active | `.nav-item-active` | Accent text, blue fill | Item is the current page |
| Disabled | `.nav-item-disabled`, `.nav-soon` | Muted text, not-allowed cursor, "Soon" badge | Not a link, so no hover or focus |
 
The Active transition assumes the `Layout` component applies `.nav-item-active` to the current page's link.
 
## 4. Responsive layout modes
 
Shows the two layout modes and the breakpoint that switches between them (`@media (max-width: 720px)`).
 
| | Above 720px | 720px and below |
|---|---|---|
| Navigation | Sticky sidebar, 240px wide | Top bar with a scrolling nav row |
| Page content | Beside the sidebar, max 960px, centered | Below the top bar, less padding |
