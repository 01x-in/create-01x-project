# create-01x-project v2 Plan

## Vision

V2 should evolve `create-01x-project` from a lightweight multi-agent scaffold generator into a **stateful full-stack SDLC orchestration system**.

V1 is a good starting wedge:
- one command setup
- opinionated agent structure
- orchestrator-led workflow
- stack-agnostic scaffolding
- human-gated build loop

V2 should build on that foundation and move the product toward:

**feature-owned worktrees + staged specialist execution + parallel feature delivery**

The key shift is:

- **V1:** install agent scaffolding into a repo
- **V2:** operate a real delivery engine that turns product specs into safe, isolated feature lanes

---

## Core Product Thesis

A product feature should own its own Git worktree.

Inside that feature worktree, specialist agents should work in a controlled delivery sequence, usually:

1. planner / breakdown
2. backend
3. frontend
4. QA / test
5. reviewer
6. human gate
7. merge / cleanup

Parallelism should happen primarily **across independent features**, not through unrestricted concurrent edits inside the same feature lane.

This gives V2:
- safer Git behavior
- better full-stack coordination
- clearer acceptance flow
- easier human review
- easier resumability
- stronger mental model for users

---

## Problem With Staying at V1

V1 likely helps users scaffold the system, but the real delivery runtime is still mostly implicit in docs and prompts.

That means several limitations remain:

### 1. Setup is stronger than execution
The generated structure may be good, but orchestration logic is not yet the center of the product.

### 2. Milestones may still feel linear
Even if planning is parallelized, delivery still risks becoming one broad build lane.

### 3. Git is not yet the primary control surface
V2 should make Git branches and worktrees first-class orchestration primitives.

### 4. Feature-level ownership is under-modeled
V1 is agent-centric.  
V2 should be feature-centric.

### 5. Status and resumability are weak or implicit
A real build engine needs durable execution state.

---

## V2 Goal

Build a **feature-owned worktree orchestration layer** on top of the current multi-agent scaffold.

That means V2 should:
- decompose product specs into feature milestones
- assign each feature to its own branch + worktree
- run specialist agents inside that isolated feature lane
- validate feature completion
- stop at a human gate
- merge and clean up
- continue to the next dependency-safe features

---

## V2 Architecture

## 1. Product Features as First-Class Units

V2 should treat a milestone as a **vertical product feature**, not as a horizontal technical layer.

### Good feature milestones
- user management
- product catalog
- cart
- checkout
- orders
- notifications
- analytics dashboard

### Less ideal top-level milestones
- frontend
- backend
- tests
- infra only

Those may exist as supporting tracks, but they should not be the main delivery unit.

The main delivery unit should be:
- user-visible
- business-meaningful
- reviewable by a human
- mergeable as a cohesive slice

---

## 2. Feature-Owned Worktrees

Each feature gets:
- one branch
- one isolated git worktree
- one delivery lane

### Examples
- `feature/user-mgmt`
- `feature/product-catalog`
- `feature/cart`
- `feature/checkout`

This creates clean isolation between active features and reduces accidental cross-feature interference.

### Why feature-owned worktrees matter
- simplify agent context
- reduce branch pollution
- make PRs cleaner
- improve rollback safety
- make human review easier
- support parallel feature delivery

---

## 3. Staged Specialist Execution Within a Feature

Inside a feature worktree, the default execution model should be staged rather than fully parallel.

### Recommended default sequence
1. planner-agent
2. backend-agent
3. frontend-agent
4. qa/test-agent
5. reviewer-agent
6. human gate

### Why staged by default
Fully parallel FE/BE/QA work inside the same worktree creates:
- contract drift
- shared-file collision risk
- unstable test assumptions
- more orchestration complexity
- harder debugging

A staged model is more production-worthy for V2.

### Controlled overlap
V2 should still allow limited overlap where useful:

- frontend can start once backend contracts are stable enough
- QA can start once the first integrated path exists
- reviewer can prepare checks early

So the flow is not strict waterfall, but it should remain controlled.

---

## 4. Parallelism Across Features

The main concurrency model should be:

**parallel across independent feature worktrees**

Example:

### Worktree A
`feature/user-mgmt`
- backend → frontend → qa → review → gate

### Worktree B
`feature/product-catalog`
- backend → frontend → qa → review → gate

These can run at the same time if dependency-safe.

This gives the system the benefits of multi-agent acceleration without making each feature lane chaotic.

---

## 5. Reviewer-Agent as a First-Class Role

Reviewer should not just “look at code” or “write a PR summary.”

The reviewer-agent should verify:

### Scope completion
- all feature acceptance criteria met
- no obvious missing paths or states

### Full-stack integration
- frontend and backend contracts match
- actual UI flow works against actual backend behavior
- tests reflect the implemented behavior

### Quality checks
- test coverage exists
- edge cases are handled
- no obvious placeholders remain
- no unrelated file churn

### Merge readiness
- feature branch is clean
- summary is understandable
- risk notes are documented
- handoff to human is ready

Reviewer-agent is mandatory in V2.

---

## 6. Human Gate

The human gate remains a core design choice.

The human should review the feature at a product level, not at a low-level Git level.

The human gate should receive:
- feature name
- purpose
- what changed
- acceptance criteria status
- test evidence
- reviewer verdict
- known risks
- recommendation: approve / send back / stop

This makes the system safer and easier to trust.

---

## 7. Durable State Model

V2 should explicitly track feature execution state.

### Proposed states
- planned
- blocked
- ready
- active
- in_review
- waiting_human
- approved
- merged
- failed

This state model is essential for:
- resume support
- status commands
- safe stopping / restarting
- multi-feature scheduling
- human visibility

---

## V2 Execution Model

## Step 1: Product Spec Intake
Input may be:
- seed idea
- product prompt
- PRD
- markdown specification
- app concept entered interactively

The system should normalize this into a structured product plan.

---

## Step 2: Feature Decomposition
The planner breaks the product into vertical feature milestones.

Example for a shopping app:
- auth foundation
- user management
- product catalog
- cart
- checkout
- orders
- admin inventory

For each feature, V2 should define:
- objective
- user value
- dependencies
- backend scope
- frontend scope
- QA scope
- acceptance criteria
- files or directories likely affected

---

## Step 3: Dependency Graph
The planner builds a feature graph.

Example:
- auth foundation → user management
- product catalog → cart
- cart + user/auth → checkout
- checkout → orders

This graph drives what can run in parallel.

---

## Step 4: Worktree Allocation
For each ready feature:
- create branch
- create git worktree
- attach metadata
- mark feature as active

Each active feature becomes a delivery lane.

---

## Step 5: Staged Agent Execution
Inside each feature lane:

### planner-agent
- expands feature scope
- clarifies acceptance criteria
- identifies likely touched areas

### backend-agent
- creates services, APIs, schema, validation, permissions, contracts

### frontend-agent
- creates UI, forms, pages, wiring, visual states

### qa/test-agent
- builds API tests, integration tests, e2e tests, regression cases

### reviewer-agent
- validates completeness and readiness

### human gate
- approves, rejects, or returns for correction

---

## Step 6: Merge and Cleanup
If approved:
- open / finalize PR
- merge feature branch
- clean worktree
- update feature state
- release dependent features to ready state

---

## V2 CLI Direction

V2 should still feel simple from the user side, but should introduce operational commands beyond setup.

## Suggested command family

### `01x init`
Create the project scaffold and initial orchestration structure.

### `01x plan`
Turn a product idea/spec into:
- feature milestones
- dependency graph
- feature docs
- initial state files

### `01x run`
Execute the next ready feature lanes.

### `01x status`
Show:
- planned
- active
- blocked
- waiting review
- waiting human
- merged

### `01x review`
Run reviewer-agent for current active features.

### `01x resume`
Resume from saved state.

### `01x cleanup`
Remove merged / stale worktrees and tidy orchestration state.

---

## Generated Artifacts

V2 should generate durable orchestration files, not just generic agent docs.

## Suggested output structure

```text
agent_docs/
  vision.md
  feature-map.md
  dependency-graph.md
  worktree-plan.md
  status.json
  active/
    feature-user-mgmt.md
    feature-product-catalog.md
  completed/
  blocked/
  review/
````

## Suggested file roles

### `vision.md`

Product-level summary and high-level direction.

### `feature-map.md`

List of planned features with short descriptions.

### `dependency-graph.md`

Dependency explanation across features.

### `worktree-plan.md`

Mapping of feature → branch → worktree → status.

### `status.json`

Machine-readable orchestration state.

### `active/feature-*.md`

Per-feature execution notes, acceptance criteria, current step.

### `review/`

Reviewer outputs and human gate summaries.

---

## Agent Role Model for V2

## planner-agent

Responsible for:

* feature decomposition
* acceptance criteria
* dependency hints
* work sequencing

## backend-agent

Responsible for:

* services
* APIs
* schema changes
* business logic
* validation
* authorization rules

## frontend-agent

Responsible for:

* pages
* screens
* forms
* components
* UX states
* backend wiring

## qa/test-agent

Responsible for:

* API tests
* integration tests
* e2e tests
* regression cases
* acceptance criteria validation artifacts

## reviewer-agent

Responsible for:

* completeness checks
* contract alignment
* quality checks
* PR prep
* recommendation to human gate

## orchestrator-agent

Responsible for:

* scheduling
* worktree lifecycle
* state updates
* dependency-aware progression
* handoff coordination

---

## Default Operating Rules

### 1. One feature owns one worktree

No sharing active worktrees across features.

### 2. One feature should produce one main PR

Keep feature review coherent.

### 3. Specialist agents should use staged handoffs by default

Avoid unrestricted simultaneous edits inside one feature lane.

### 4. Parallelism should be feature-level first

That is where safety and clarity are strongest.

### 5. Reviewer is mandatory before human approval

No direct merge from build agents.

### 6. Human gate remains required by default

This is part of the product value, not an inconvenience.

### 7. Shared foundations should be built early

Examples:

* auth baseline
* design system shell
* testing framework
* CI setup
* base API patterns

This reduces conflicts later.

---

## Recommended V2 MVP Scope

V2 should not try to solve every orchestration problem at once.

## V2 MVP should include

### 1. Feature decomposition

Generate:

* feature list
* dependencies
* acceptance criteria

### 2. Feature-owned worktree support

Create and manage:

* branches
* worktrees
* state metadata

### 3. Staged FE / BE / QA flow

Use the staged model as the default delivery pattern.

### 4. Reviewer flow

Add a real review/validation stage before merge.

### 5. Status + resume

Make the system inspectable and restartable.

### 6. Human gate summaries

Make approvals easy and understandable.

---

## Things V2 Should Defer

These can come later:

### 1. Full unrestricted parallel FE/BE/QA inside the same feature lane

Too much coordination complexity for early V2.

### 2. Complex dynamic re-planning during every feature step

Useful later, but not required first.

### 3. Deep IDE/editor integrations

Not necessary for proving the architecture.

### 4. Cross-repo / monorepo federation

Can come after single-repo feature worktree support is stable.

### 5. Auto-merge without human gate

Keep human approval by default until the system matures.

---

## Proposed Roadmap

## Phase 1 — Product Model Upgrade

Goal: move from scaffold-only to delivery-aware planning

Build:

* feature schema
* dependency graph
* acceptance criteria model
* state file format

## Phase 2 — Worktree Management

Goal: make Git the execution backbone

Build:

* branch naming rules
* worktree creation
* worktree status tracking
* cleanup logic

## Phase 3 — Feature Delivery Lanes

Goal: introduce staged FE / BE / QA execution

Build:

* feature lane docs
* agent handoff flow
* transition states
* per-feature review bundle

## Phase 4 — Reviewer and Human Gate

Goal: make completion safe and inspectable

Build:

* reviewer checklists
* recommendation format
* human approval summaries
* correction loop support

## Phase 5 — Parallel Feature Scheduling

Goal: unlock multi-feature throughput

Build:

* dependency-safe scheduler
* concurrency limits
* active lane dashboard / status report

---

## Positioning for V2

V2 should not be marketed as just:

* more prompts
* more agents
* better scaffolding

It should be positioned as:

**an AI-native feature delivery engine**

Good positioning options:

* Turn product specs into parallel full-stack delivery lanes
* Feature-owned worktree orchestration for AI coding agents
* A full-stack SDLC engine for Claude Code workflows
* An AI-native build orchestrator centered on feature lanes

---

## Success Criteria for V2

V2 is successful if a user can:

1. start from a product idea or spec
2. get a clean feature breakdown
3. see which features are ready / blocked
4. launch isolated feature delivery lanes
5. run backend / frontend / QA in a controlled sequence
6. review feature output through a reviewer summary
7. approve and merge safely
8. resume later without losing system state

---

## Final Summary

V1 proved the wedge:

* easy setup
* agent scaffold generation
* orchestrator-led workflow

V2 should prove the system:

* feature-first planning
* feature-owned Git worktrees
* staged specialist execution
* reviewer validation
* human gate
* stateful orchestration
* dependency-aware parallel delivery

That is the real jump:

**from installer to operator**
**from prompt scaffold to delivery engine**
**from multi-agent setup to full-stack SDLC orchestration**

---

## Recommended V2 Default

If only one sentence defines V2, it should be:

**Each product feature owns an isolated git worktree, progresses through staged backend/frontend/QA execution, and is merged only after reviewer validation and human approval, while multiple dependency-safe features can advance in parallel.**

```

If you want, I can also rewrite this into a tighter founder-style version with less prose and more “build phases / deliverables / commands”.
```
