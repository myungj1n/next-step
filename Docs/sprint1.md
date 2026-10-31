# Next Step – Sprint 1

## Sprint Goal

Build a working GUI for the **View Applications** feature that matches our storyboard. Students see a list of sample internship applications, click one to view its details, and go back to the list.

No backend, database, or business logic this sprint. The data is hardcoded sample data.

## Tasks


| ID | Task | Scope | Deps | Assignee | Done |
|---|---|---|---|---|---|
| Task 1 | **Project setup & integration:** Set up the React project (Vite + React Router), the main layout, and the routes. Merge everyone's code and test the full flow against the storyboard. | M | — | Quan | Done |
| Task 2 | **Applications List page:** Create the sample data file (4–6 applications) and the list page showing Company, Position, and Status, laid out like the storyboard. | M | Task 1 | Quan | Done |
| Task 3 | **Application Details page:** Show the selected application's company, position, status, deadline, and notes, with a "Back to Applications" button, laid out like the storyboard. | M | Task 1 | Member 2 | – |
| Task 4 | **Page interactions:** Clicking an application opens its details page, Back returns to the list, and an invalid id shows "Application not found". | S | Task 2, 3 | Member 3 | – |
| Task 5 | **GitHub & planning:** Create the issues and sub-issues, keep the project timeline and issue states accurate, and write the next-sprint plan. | S | — | Member 3 | – |
| Task 6 | **Use Case Diagram & Implementation Summary:** Revise the Sprint 1 use case diagram to highlight View Applications and add it to the Wiki with an explanation and issue links. Write the Wiki Implementation Summary. | M | Task 4 | Member 4 | – |
| Task 7 | **Wiki: Challenges:** Describe this sprint's challenges and how the team handled them. | S | Task 1 | Quan | Done |

Also:
- Each member submits an individual contribution statement on Gradescope.
- The team submission and the GTA meeting notes still need owners.

### Definition of Done

- `npm run dev` starts the app.
- The list matches the storyboard.
- Clicking an application opens its details page.
- "Back to Applications" returns to the list.
- All code is merged into `dev` through PRs that reference their issues ("Closes #N").
- Every GitHub issue's status matches real progress.
- The Wiki has the Challenges, Implementation Summary, and Revised Use Case Diagram sections, all matching the MVP.


## Git Workflow

> **Rule: Never commit or push directly to `dev` or `main`.**
> All work happens on your own feature branch. Changes reach `dev` **only** through a pull request.

1. Start from the latest `dev`:
   ```
   git checkout dev
   git pull
   ```
2. Create a feature branch for your task:
   ```
   git checkout -b yourname/feat/task-name
   ```
3. Commit with the issue number:
   ```
   git commit -m "Add applications list page (#2)"
   ```
4. Push **your feature branch** (not `dev`):
   ```
   git push -u origin yourname/feat/task-name
   ```
5. On GitHub, open a pull request from your feature branch **into `dev`**, with `Closes #N` in the description.
6. Another member reviews the PR before it is merged.
7. Move the issue to Done only after the PR is merged.

`main` is only updated from `dev` when the sprint is finished and tested.

### Running the app

Use Node 24 (npm 12). npm 10 crashes during `npm install` on this project. Update with `npm install -g npm@latest`.

```
cd frontend
npm install
npm run dev
```

## Architecture

### Overall

Next Step is a three-part web app:

```
┌──────────────────┐     HTTP / JSON     ┌──────────────────┐      SQL      ┌──────────────────┐
│     Frontend     │ ──────────────────▶ │     Backend      │ ────────────▶ │     Database     │
│  React + Vite    │ ◀────────────────── │   Spring Boot    │ ◀──────────── │    PostgreSQL    │
│  (Vercel)        │                     │   (Render)       │               │    (Supabase)    │
└──────────────────┘                     └──────────────────┘               └──────────────────┘
   Sprint 1 ✔                               Next sprint                        Next sprint
```

| Layer | Tech | Responsibility | Status |
|---|---|---|---|
| Frontend | React, Vite, React Router | Screens, navigation, and user interaction | Sprint 1 |
| Backend | Spring Boot (Java) | REST API and business logic, such as validating applications | Next sprint |
| Database | PostgreSQL on Supabase | Stores users and applications | Next sprint |
| Deployment | Vercel (frontend), Render (backend), Supabase (DB) | Hosting | Later |

### Sprint 1 Frontend

In Sprint 1 the frontend reads from a local sample data file instead of the backend:

```
applications.js (sample data)
        │
        ▼
  Route components ──── navigation (useNavigate / useParams)
        │
        ▼
   Page components ──── display only
```

**Routes:**

| URL | Screen |
|---|---|
| `/` | Applications List |
| `/applications/:id` | Application Details for one application |

**Folder structure:**

```
frontend/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx                     entry point
    App.jsx                      routes                      (Task 1)
    index.css                    global styles               (Task 1)
    components/Layout.jsx        "Next Step" header + page   (Task 1)
    data/applications.js         sample data                 (Task 2)
    pages/ApplicationsList.jsx   list screen                 (Task 2)
    pages/ApplicationDetails.jsx details screen              (Task 3)
    routes/ListRoute.jsx         list → details navigation   (Task 4)
    routes/DetailsRoute.jsx      details → back navigation   (Task 4)
```

**Component contracts.** Pages only display data. The route components pass in the data and the navigation behavior:

- `ApplicationsList` receives `{ applications, onSelect(id) }`
- `ApplicationDetails` receives `{ application, onBack() }`

**Sample data shape:**

```js
{
  id: 1,
  company: "Google",
  position: "SWE Intern",
  status: "Applied",          // Applied | Interviewing | Offer | Rejected
  deadline: "October 1",
  notes: "Applied through company website"
}
```

