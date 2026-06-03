# Animeverse — Project Overview

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [AGENTS.md](AGENTS.md)
- [README.md](README.md)
- [implementation_plan.md](implementation_plan.md)
- [package-lock.json](package-lock.json)
- [package.json](package.json)
- [src/app/layout.tsx](src/app/layout.tsx)

</details>



Animeverse is a premium personal anime indexing and storytelling platform. It allows users to catalog their watch history, create detailed episode-by-episode story breakdowns (including images and video clips), and organize their library using a robust tagging system [AGENTS.md:7-8](). The application is designed with a "premium aesthetic" and integrates with the Jikan API for real-time anime metadata [src/app/layout.tsx:16-19,37]().

## System Purpose & Core Features

The application serves as a comprehensive hub for anime enthusiasts to manage their personal collections while offering discovery tools for the broader anime ecosystem.

*   **Personal Library**: Catalog anime with custom status, tags, and detailed story notes [AGENTS.md:7-8]().
*   **Multi-Modal Authentication**: Secure access via Email/Password, OTP magic links, and WebAuthn Passkeys [implementation_plan.md:3]().
*   **Media Management**: Attach images and video clips to specific episodes for visual journaling [AGENTS.md:7-8]().
*   **Public Sharing**: Users can toggle a "Shared Dashboard" to showcase their personal metrics via a unique public token [implementation_plan.md:25-28]().
*   **Discovery & News**: Integration with the Jikan API to browse seasonal anime, search global databases, and view live news [src/app/layout.tsx:37]().

## Tech Stack

Animeverse is built on a modern, type-safe web stack centered around the Next.js ecosystem.

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) [AGENTS.md:11]() |
| **Language** | TypeScript [AGENTS.md:12]() |
| **Database** | PostgreSQL (via Prisma ORM) [implementation_plan.md:102]() |
| **Styling** | Tailwind CSS v4 [AGENTS.md:13]() |
| **Authentication** | Custom implementation with `@simplewebauthn` [package.json:14-15]() |
| **External API** | Jikan API (MyAnimeList wrapper) [src/app/layout.tsx:37]() |

**Sources:** [package.json:12-32](), [AGENTS.md:9-16](), [implementation_plan.md:102]()

## System Architecture

The following diagram illustrates how high-level user features map to specific code entities and data models within the Animeverse ecosystem.

### Feature to Code Entity Mapping
```mermaid
graph TD
    subgraph "Natural Language Space"
        A["Personal Library"]
        B["Authentication"]
        C["Discovery"]
    end

    subgraph "Code Entity Space"
        A --> "src/app/api/animes/route.ts"
        A --> "src/app/organize/page.tsx"
        
        B --> "src/lib/auth.ts"
        B --> "src/app/api/auth/passkey/route.ts"
        
        C --> "src/app/discover/page.tsx"
        C --> "src/app/news/page.tsx"
    end

    subgraph "Persistence Layer"
        "src/app/api/animes/route.ts" --> "Prisma.Anime"
        "src/lib/auth.ts" --> "Prisma.User"
        "src/lib/auth.ts" --> "Prisma.Session"
    end
```
**Sources:** [implementation_plan.md:65-87](), [AGENTS.md:41-48]()

### Data Flow & Subsystems
The system is divided into four major subsystems: Authentication, Library Management, Media/Episodes, and External Discovery.

```mermaid
graph LR
    subgraph "Auth Subsystem"
        "User" -- "WebAuthn/OTP" --> "src/lib/auth.ts"
        "src/lib/auth.ts" -- "manages" --> "SessionModel"
    end

    subgraph "Library Subsystem"
        "src/app/page.tsx" -- "fetches" --> "AnimeModel"
        "AnimeModel" -- "has many" --> "TagModel"
    end

    subgraph "External Integration"
        "Jikan API" -- "populates" --> "src/app/discover/page.tsx"
        "Jikan API" -- "populates" --> "src/app/news/page.tsx"
    end

    "SessionModel" -- "authorizes" --> "Library Subsystem"
```
**Sources:** [implementation_plan.md:9-55](), [src/app/layout.tsx:32-38]()

## Child Pages

For detailed technical documentation on specific areas of the codebase, refer to the following sections:

*   **[Getting Started — Setup & Configuration](#1.1)**: Instructions for environment setup, `DATABASE_URL` configuration, and running the development server.
*   **[Application Layout & Navigation](#1.2)**: Details on the `RootLayout`, global styling with Tailwind CSS v4, and the shared `Navbar` component.

---
**Sources:**
* [package.json:1-33]()
* [src/app/layout.tsx:1-42]()
* [implementation_plan.md:1-105]()
* [AGENTS.md:1-58]()

---
