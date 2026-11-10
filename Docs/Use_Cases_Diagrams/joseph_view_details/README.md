# View Application Details — Design Diagrams (Joseph)

Feature: a logged-in student opens one of their applications from the list, sees its details, and goes back.
Issue: #2 (View Applications Dashboard).

PNG copies of each diagram are in this folder for the Wiki.

Layers: **UI** (React) → **Application** (business logic) → **Persistence** (repository + Supabase/PostgreSQL). Dependencies only point down.

## 1. Conceptual Class Diagram

Real-world things the feature is about (no implementation details).

```mermaid
classDiagram
    direction LR
    class Student {
        email
    }
    class InternshipApplication {
        company
        position
        status
        deadline
        notes
        jobLink
        resumeVersion
    }
    class ApplicationStatus {
        Applied
        Interviewing
        Offer
        Rejected
    }
    Student "1" --> "0..*" InternshipApplication : owns
    InternshipApplication --> ApplicationStatus : has
```

## 2. Detailed Class Diagram (layered)

```mermaid
classDiagram
    direction TB

    namespace UILayer {
        class DetailsRoute {
            -result: DetailsResult
            +render() JSX
        }
        class ApplicationDetails {
            +application: Application
            +onBack() void
            +render() JSX
        }
    }

    namespace ApplicationLayer {
        class ApplicationService {
            -repository: ApplicationRepository
            +getMyApplications() Promise~Application[]~
            +getApplicationDetails(id: string) Promise~DetailsResult~
        }
        class DetailsResult {
            +outcome: DetailsOutcome
            +application: Application
            +message: string
        }
        class Application {
            +id: string
            +company: string
            +position: string
            +status: ApplicationStatus
            +deadline: string
            +notes: string
            +jobLink: string
            +resumeVersion: string
            +getSafeJobLink() string
        }
    }

    namespace PersistenceLayer {
        class ApplicationRepository {
            <<abstract>>
            +findAll() Promise~Application[]~
            +findById(id: string) Promise~Application~
        }
        class SupabaseApplicationRepository {
            -client: SupabaseClient
            +findAll() Promise~Application[]~
            +findById(id: string) Promise~Application~
            -toApplication(row: object) Application
        }
    }

    DetailsRoute --> ApplicationService : calls
    DetailsRoute --> ApplicationDetails : renders
    ApplicationService --> ApplicationRepository : depends on abstraction
    ApplicationService ..> DetailsResult : returns
    ApplicationDetails ..> Application : displays
    SupabaseApplicationRepository --|> ApplicationRepository
    SupabaseApplicationRepository ..> Application : creates
```

`findById` returns `null` when no row is visible to the student.
`DetailsOutcome` is `FOUND | NOT_FOUND | ERROR`.

## 3. Sequence Diagram — Before (reverse-engineered from Sprint 1/2 code)

```mermaid
sequenceDiagram
    actor Student
    participant List as ListRoute
    participant Route as DetailsRoute (UI)
    participant Svc as applicationService.js
    participant DB as Supabase + PostgreSQL (RLS)

    Student->>List: click application row
    List->>Route: navigate(/applications/:id)
    Route->>Svc: getApplicationById(id)
    Svc->>DB: select ... where id = :id
    DB-->>Svc: { data: raw row, error }
    Svc-->>Route: { data: raw row, error }
    Note over Route: UI checks Postgres error code 22P02,<br/>decides "not found" vs error,<br/>page reads job_link / resume_version<br/>and sanitizes the link itself
    Route-->>Student: details, "not found", or error
```

Problems: database details (error codes, column names) leak into the UI, the link-safety rule lives in a display component, and the service depends directly on Supabase.

## 4. Sequence Diagram — After (layered)

```mermaid
sequenceDiagram
    actor Student
    participant Route as DetailsRoute (UI)
    participant Svc as ApplicationService (Application)
    participant Repo as SupabaseApplicationRepository (Persistence)
    participant DB as PostgreSQL + RLS

    Student->>Route: open /applications/:id
    Route->>Svc: getApplicationDetails(id)
    alt id is blank
        Svc-->>Route: NOT_FOUND
        Route-->>Student: "Application not found"
    else id given
        Svc->>Repo: findById(id)
        Repo->>DB: select where id = :id
        DB-->>Repo: own row, nothing (other student / missing), or error
        alt row found
            Repo-->>Svc: Application
            Svc-->>Route: FOUND + Application
            Route-->>Student: show details (safe job link)
        else no row or malformed id
            Repo-->>Svc: null
            Svc-->>Route: NOT_FOUND
            Route-->>Student: "Application not found"
        else query failed
            Repo-->>Svc: throws Error
            Svc-->>Route: ERROR + message
            Route-->>Student: error message
        end
    end
    Student->>Route: click "Back to Applications"
    Route-->>Student: navigate to /applications
```
