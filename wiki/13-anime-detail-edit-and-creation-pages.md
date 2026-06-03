# Anime Detail, Edit & Creation Pages

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [src/app/anime/[id]/edit/page.tsx](src/app/anime/[id]/edit/page.tsx)
- [src/app/anime/[id]/page.tsx](src/app/anime/[id]/page.tsx)
- [src/app/anime/new/page.tsx](src/app/anime/new/page.tsx)
- [src/components/TagBadge.tsx](src/components/TagBadge.tsx)
- [src/lib/db.ts](src/lib/db.ts)

</details>



This section covers the core user interface components for managing individual anime entries within the library. These pages facilitate viewing detailed metadata, modifying existing records, and adding new series with integrated tag management.

## Anime Detail Page

The detail page (`src/app/anime/[id]/page.tsx`) serves as the central hub for a specific anime entry. It displays metadata, manages the episode list, and provides entry points for editing or deletion.

### Data Fetching and State
The page uses the `useParams` hook to retrieve the anime ID and performs a client-side fetch to the API [src/app/anime/[id]/page.tsx:59-69](). The `fetchAnime` function populates the `anime` state, which includes nested `tags` and `episodes` [src/app/anime/[id]/page.tsx:29-39]().

### Episode Management
The page includes an inline form for adding episodes without navigating away.
- **State Management**: Controls visibility via `showEpisodeForm` [src/app/anime/[id]/page.tsx:53]().
- **Creation Logic**: Submits a POST request to `/api/animes/[id]/episodes` [src/app/anime/[id]/page.tsx:87-95]().
- **Auto-increment**: The `epNumber` is automatically suggested based on the current episode count [src/app/anime/[id]/page.tsx:67]().

### Visual Components
- **Status Labels**: Maps internal status strings (e.g., `watching`) to human-readable labels [src/app/anime/[id]/page.tsx:41-46]().
- **Cover Image**: Renders the `coverImage` URL or a placeholder gradient if null [src/app/anime/[id]/page.tsx:128-139]().
- **Tag List**: Iterates through `anime.tags` to render `TagBadge` components [src/app/anime/[id]/page.tsx:172-178]().

### Entity Interaction Diagram
The following diagram illustrates how the Detail Page interacts with various API endpoints and state variables.

**Anime Detail Page Data Flow**
```mermaid
graph TD
    subgraph "Client: AnimeDetailPage"
        [params.id] --> fetchAnime["fetchAnime()"]
        fetchAnime -->|GET /api/animes/:id| AnimeState["setAnime(data)"]
        AnimeState --> UI["Render Title, Cover, Tags"]
        
        AddEp["handleAddEpisode()"] -->|POST /api/animes/:id/episodes| API_EP["/api/animes/[id]/episodes"]
        API_EP -->|Success| fetchAnime
        
        DelAnime["handleDeleteAnime()"] -->|DELETE /api/animes/:id| API_ANIME["/api/animes/[id]"]
        API_ANIME -->|Success| RouterPush["router.push('/')"]
    end

    subgraph "Server: API Routes"
        API_ANIME
        API_EP
    end
```
Sources: [src/app/anime/[id]/page.tsx:48-115](), [src/app/anime/[id]/page.tsx:147-159]()

---

## Creation and Edit Forms

The creation (`/anime/new`) and edit (`/anime/[id]/edit`) pages share a similar structure for managing anime metadata and tag associations.

### Inline Tag Management
Both pages implement a robust tag management system:
1.  **Global Tag Fetching**: Fetches all available tags for the user on mount [src/app/anime/new/page.tsx:25-39]().
2.  **Selection**: Uses `selectedTagIds` to track which tags are associated with the anime [src/app/anime/new/page.tsx:20]().
3.  **Inline Creation**: Allows users to create a new `Tag` record immediately via `createTag()`. This performs a POST to `/api/tags` and automatically selects the new tag [src/app/anime/new/page.tsx:41-58]().

### Implementation Differences

| Feature | New Anime (`/anime/new`) | Edit Anime (`/anime/[id]/edit`) |
| :--- | :--- | :--- |
| **Initial State** | Empty/Defaults [src/app/anime/new/page.tsx:15-22]() | Fetched via `Promise.all` [src/app/anime/[id]/edit/page.tsx:28-39]() |
| **HTTP Method** | `POST` to `/api/animes` [src/app/anime/new/page.tsx:71]() | `PUT` to `/api/animes/[id]` [src/app/anime/[id]/edit/page.tsx:66]() |
| **Redirect** | To the new anime's detail page [src/app/anime/new/page.tsx:84]() | Back to the detail page [src/app/anime/[id]/edit/page.tsx:78]() |

### Tag Interaction Logic
The `TagBadge` component is used in a selectable mode. Clicking a badge triggers `toggleTag`, which modifies the `selectedTagIds` array [src/app/anime/new/page.tsx:60-64]().

**Form Submission & Tag Association**
```mermaid
graph LR
    subgraph "Form State"
        T["Title"]
        D["Description"]
        S["Status"]
        STID["selectedTagIds (Array)"]
    end

    subgraph "Tag Management"
        NT["New Tag Input"] -->|createTag()| POST_TAG["POST /api/tags"]
        POST_TAG -->|New ID| STID
    end

    subgraph "Submission"
        T & D & S & STID -->|handleSubmit| PAYLOAD["JSON Body"]
        PAYLOAD -->|fetch| REQ["API Endpoint"]
    end
```
Sources: [src/app/anime/new/page.tsx:41-85](), [src/app/anime/[id]/edit/page.tsx:42-79](), [src/components/TagBadge.tsx:1-47]()

---

## Shared UI Components

### TagBadge Component
The `TagBadge` is a reusable UI element used across all library pages.
- **Dynamic Styling**: Sets `backgroundColor` and `color` based on the tag's hex code, applying a 20% alpha to the background [src/components/TagBadge.tsx:25-30]().
- **Interactivity**: Supports an `active` state (using a ring border) and an optional `removable` close button [src/components/TagBadge.tsx:24-44]().

### Database Integration
All these pages interact with the database via the `PrismaClient` instance exported from `src/lib/db.ts` [src/lib/db.ts:1-7](). While the pages themselves are Client Components, they communicate with Next.js API routes that utilize this client to perform CRUD operations on the `Anime`, `Tag`, and `Episode` models.

Sources: [src/components/TagBadge.tsx:12-47](), [src/lib/db.ts:1-8]()

---
