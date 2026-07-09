# Network Routes Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Console network route page behavior that can be verified without a working cluster.

**Architecture:** Keep `/networks/routes` as an authenticated Console page backed by `SimpleResourceCrud`. Add front-end validation in the route page before calling Core, and prove the API contract through Playwright mocks.

**Tech Stack:** React, TanStack Router, React Query, Arco Design, Playwright, Core OpenAPI typed client.

## Global Constraints

- Do not edit frozen product spec documents.
- Use Arco components and existing Console CRUD patterns.
- Verification must not require a live cluster.

---

### Task 1: Route Create Validation And Offline Verification

**Files:**
- Modify: `frontends/console/src/routes/_authenticated/networks/routes/index.tsx`
- Modify: `frontends/console/e2e/networks.spec.ts`
- Modify: `frontends/console/docs/sprints/SPRINT-SCB-06-networks.md`

**Interfaces:**
- Consumes: `coreApi.GET('/networks/routes')`, `coreApi.POST('/networks/routes')`, `coreApi.GET('/networks/routes/{route_id}')`, `coreApi.DELETE('/networks/routes/{route_id}')`.
- Produces: A create form that refuses empty `vpc_id` and `next_hop_id`, validates `destination_cidr`, and submits the official Core request body with `idempotency_key`.

- [x] Write a failing Playwright test proving an empty route form does not POST and shows field errors.
- [x] Run the targeted test and confirm it fails against the current implementation.
- [x] Add route page validation state for VPC, destination CIDR, and next hop ID.
- [x] Add a Playwright test proving a valid create submits the expected POST body.
- [x] Run targeted Playwright route tests using mocks.
- [x] Run typecheck, unit tests, build, and document cluster-independent verification.
