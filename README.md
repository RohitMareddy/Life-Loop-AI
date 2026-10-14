# LIFELOOP AI — Community Resource Redistribution Platform
> **Give Every Useful Resource Another Chance.**

LIFELOOP AI is an intelligent community resource coordination, redistribution, and waste reduction platform. It bridges the gap between surplus resource donors (bookstores, schools, businesses, community foundations) and recipient organizations (learning centers, public libraries, schools, shelters) using:

1. **Generative AI Intake:** Powered by Google Gemini 3.8 Flash to extract structured, multi-item resource lots from free-form natural language and photographs.
2. **Deterministic Constraint & Matching Engine:** 6-factor compatibility scoring (0–100) that rigorously enforces hard eligibility, condition, and timing constraints.
3. **Impact Optimizer:** A signature multi-objective bipartite network solver calculating mathematically feasible allocations under strict capacity non-exceedance.
4. **Interactive What-If Simulator:** Real-time scenario recalculation demonstrating the impact of supply shocks, urgency shifts, and fairness policies.
5. **Impact Observatory:** 4-pillar verifiable metrics (Proposed, Approved, Recorded, Verified) with transparent physical kilogram waste accounting.
6. **Loop Assistant:** A grounded operational copilot that reasons strictly over actual platform state.

---

## 1. Core Architecture

```
                    ┌───────────────────────────────┐
                    │  Natural Language / Photo     │
                    │  Donation Description         │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Gemini 3.8 Flash Intake      │
                    │  Multi-Lot Extraction         │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Human-in-the-Loop Review     │
                    │  & Inventory Ingestion        │
                    └───────────────┬───────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐
        │ Active Inventory Lots   │   │ Community Requests      │
        └────────────┬────────────┘   └────────────┬────────────┘
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Deterministic Compatibility   │
                    │ & Hard-Constraint Filter      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Constraint-Aware Optimizer    │
                    │ (Volume, Urgency, Fairness)   │
                    └───────────────┬───────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐
        │ Approved Reservations   │   │ Unmet Demands Diagnostic│
        └────────────┬────────────┘   └─────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Distribution Planner &  │
        │ Physical Proof Receipt  │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Impact Observatory      │
        │ (4-Stage Verifiable Kg) │
        └─────────────────────────┘
```

---

## 2. Optimization Methodology & Mathematical Invariants

The **Impact Optimizer** formulates resource allocation as a generalized bipartite capacity network:

### Mathematical Invariants:
1. **Inventory Non-Exceedance:**
   $$\sum_{j} x_{i,j} \le \text{availableQuantity}_i \quad \forall \text{ resource lot } i$$
2. **Demand Non-Exceedance:**
   $$\sum_{i} x_{i,j} \le \text{outstandingQuantity}_j \quad \forall \text{ request } j$$
3. **Hard Constraint Satisfaction:**
   $$x_{i,j} = 0 \quad \text{if } \text{condition}_i = \text{'unsuitable'} \lor \text{condition}_i < \text{minCondition}_j \lor \text{expired}_i$$
4. **Zero Double-Commitment:**
   Approved plans immediately deduct allocated quantities from `availableQuantity` and lock them into `committedQuantity`.
5. **Discrepancy Invariant:**
   If a partial delivery is recorded in the Distribution Planner, the shortfall is restored to both `availableQuantity` and the recipient's outstanding demand.

### Configurable Objective Strategies:
- **Strategy A (Maximize Volume):** Maximizes aggregate units delivered across feasible pairs.
- **Strategy B (Prioritize Urgency):** Heavily weights imminent term deadlines and emergency educational needs.
- **Strategy C (Balanced Fairness):** Executes multi-round fair-share spreading to prevent single-organization starvation.
- **Strategy D (Logistics Optimized):** Incorporates Haversine transit distance penalties.

---

## 3. Greenfield Community Network Demonstration Dataset

The application comes pre-loaded with an internally consistent, realistic dataset:
- **8 Resource Lots:** Surplus spiral notebooks, young adult readers, wooden desks, pen kits, refurbished Android tablets, classroom chairs, uninspected STEM glassware, and unsuitable moisture-damaged books.
- **8 Community Requests:** Ranging from urgent primary school literacy drives to library lending shelves and refugee orientation centers.
- **Distribution Records:** Live examples across scheduled, delivered, and verified status with signed voucher receipts.

---

## 4. Evaluator Quick Start (2-Minute Walkthrough)

Click **"See in Action"** in the top navigation bar to launch the guided walkthrough:
1. **The Dilemma:** Inspect the supply vs. demand mismatch in the Overview dashboard.
2. **AI Intake:** Test one-click sample extraction with Gemini 3.8 Flash.
3. **Smart Matching:** Inspect deterministic 6-factor compatibility and AI-grounded explanations.
4. **Impact Optimizer:** Solve multi-request allocation and compare Strategy A vs. B.
5. **What-If Simulator:** Adjust supply sliders to witness genuine mathematical recalculations.
6. **Verifiable Impact:** View the 4-pillar separation and avoided landfill waste calculations.

---

## 5. Security, Privacy & Responsible AI

- **Server-Side API Key Protection:** The Gemini API key is strictly maintained on the server via `process.env.GEMINI_API_KEY` and never exposed to client-side bundles.
- **Grounded Provenance:** Every displayed metric and status includes explicit provenance tags (`USER_PROVIDED`, `AI_EXTRACTED`, `CALCULATED`, `REQUIRES_VERIFICATION`).
- **Resilient Fallback:** The application functions with full deterministic optimization and demo workflows even when the external Gemini API is unreachable or unconfigured.
