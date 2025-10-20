# Research Request: Selecting a Model Context Protocol (MCP) Framework

## 1. Background

**Project:** Jules Control Room

**Current Situation:** We have two distinct prototypes:
1.  A **Frontend Prototype** (`JulesControlRoomUI`) that represents our desired product vision, with a rich user experience and ambitious features (Analytics, Timelines, etc.). However, it is architecturally based on incorrect assumptions of a simple, stateless API.
2.  A **Backend Prototype** (`jules-control-room-backend`) that serves as a proof-of-concept for the correct technical foundation. It is a custom-built, stateful server designed to adhere to the principles of the **Model Context Protocol (MCP)** for managing the Jules AI agent.

**Strategic Decision:** We have decided to unify these two prototypes. The agreed-upon strategy is to refactor both the frontend and backend to use a **standard, off-the-shelf MCP framework for TypeScript**. Our current custom backend implementation is considered a liability due to the high long-term maintenance burden of keeping it compliant with the evolving MCP standard.

## 2. Goal of this Research

The objective of this research is to evaluate the available TypeScript-native MCP frameworks and recommend the best path forward for our project. 

The ideal solution should be robust and production-ready, but with a strong preference for a framework that is **community-driven, agile, and prioritizes developer experience**. We are explicitly cautious of the official MCP SDK, as it is perceived to be potentially slow-moving and "designed by committee," which may hinder our rapid development goals.

## 3. Primary Candidates for Evaluation

The research should focus on the following TypeScript-native frameworks:

1.  **EasyMCP:**
    *   **Initial Analysis:** Appears to be a leading community-driven option. It advertises an "Express-like" API, which could offer an intuitive and fast learning curve for our team.

2.  **MCP-Framework:**
    *   **Initial Analysis:** The other major TypeScript alternative. It appears to be more focused on project scaffolding and a structured, CLI-driven setup.

## 4. Alternative Strategies to Investigate

In addition to a direct framework comparison, this research should investigate the viability of an incremental adoption path:

*   **MCP Gateway:** Evaluate the pros and cons of using a standalone MCP Gateway tool. Could this allow us to make the frontend MCP-compliant immediately by placing a translation layer in front of our existing backend, giving us more time to refactor the backend itself?

## 5. Key Research Questions & Evaluation Criteria

For each primary candidate (EasyMCP, MCP-Framework), please answer the following questions:

*   **Developer Experience & API Design:**
    *   How intuitive is the API? Does it deliver on the promise of simplicity?
    *   Which API style (e.g., EasyMCP's "Express-like" vs. MCP-Framework's CLI-driven approach) is a better fit for our team's existing skills and preferences?
    *   How good is the TypeScript support and type inference?

*   **Maturity & Community:**
    *   How active is the open-source community (GitHub activity, Discord/Slack channels, etc.)?
    *   How comprehensive and clear is the documentation? Are there sufficient tutorials and real-world examples?

*   **Feature Set & Completeness:**
    *   **Client SDK:** How robust is the client-side SDK for React? Does it provide simple hooks (`useMcpResource`, etc.) that abstract away WebSocket and delta-update complexity?
    *   **Authentication:** What are the built-in mechanisms for authentication? How easily can it handle our specific requirement of passing a bearer token via the `sec-websocket-protocol` header?
    *   **Extensibility:** How easy is it to extend the framework with custom logic or integrate it with other tools like job queues (BullMQ) or databases?

*   **Migration Effort:**
    *   Provide a rough estimate of the effort required to refactor our existing backend to use this framework. How much of our current business logic (e.g., in `julesClient.ts`) can be preserved?

## 6. Deliverable

The output of this research should be a concise document that includes:

1.  A clear recommendation for one primary path forward (e.g., "Adopt EasyMCP," "Use MCP Gateway," etc.).
2.  A justification for the recommendation, weighed against the evaluation criteria above.
3.  A brief summary of the pros and cons of the other evaluated options.
4.  A small, practical proof-of-concept code example (both server and client-side) for the **recommended** framework, demonstrating how a simple `Tool` and `Resource` would be defined and consumed.
