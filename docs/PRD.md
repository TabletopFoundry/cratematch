# Gap Analysis

| Area | Gap in original PRD | Why it blocks implementation | Resolution in this version |
|---|---|---|---|
| Scope definition | Original PRD mixes long-term vision, beta plan, and launch features without a clear v1 boundary. | Engineering and ops cannot tell what must ship first. | This PRD defines explicit v1, out-of-scope, and v2+ boundaries. |
| User stories | Features are listed, but no explicit user stories tie them to user outcomes. | Teams cannot validate whether requirements solve concrete user needs. | Every functional requirement includes a user story. |
| Acceptance criteria | No Given/When/Then acceptance criteria are defined. | QA cannot verify completion consistently. | Each requirement includes testable acceptance criteria. |
| Edge cases | Failures such as BGG import errors, low-confidence recommendations, failed payments, and out-of-stock items are not defined. | The highest-risk operational scenarios are left to ad hoc decisions. | Edge cases are specified per requirement and in user flows. |
| Prioritization | All features are presented as equally important. | Teams risk overbuilding and delaying launch. | MoSCoW priority is assigned to every requirement. |
| Contradictions | The original document says limited launch is Discovery-only, but also describes all tiers, mobile app, community, and try-before-you-buy as if launch-ready. | Teams could build the wrong thing first. | v1 is narrowed to a responsive web MVP; advanced logistics and community features move to v2+. |
| Operational workflow | Recommendation generation, merchandiser approval, inventory reservation, and shipment handoff are not fully defined. | The core monthly subscription cycle cannot be implemented safely. | This PRD defines the end-to-end curation and fulfillment workflow. |
| Non-functional requirements | Performance, availability, accessibility, security, browser support, and retention policies are missing. | Architecture decisions cannot be made responsibly. | Explicit NFRs with numeric targets are included. |
| Data model | Core entities and relationships are implied but not described. | Backend and analytics work cannot start cleanly. | A conceptual data model with PII flags is included. |
| Integrations | BGG, payments, 3PL, notifications, and analytics are referenced, but contracts and failure handling are undefined. | Integration work is high-risk and difficult to estimate. | Integration points and fallback behavior are listed. |
| Metrics | Original success metrics are mostly lagging business metrics. | Product teams need leading indicators for onboarding and recommendation quality. | This PRD adds launch, onboarding, recommendation, and operational KPIs. |
| Open questions | Important decisions are implicit, not surfaced. | Teams may unknowingly make product-defining assumptions. | Unknowns are called out as [NEEDS INPUT] with proposed defaults. |

# Enhanced PRD: CrateMatch — Personalized Board Game Subscription

## 1. Overview

**Product name:** CrateMatch  
**One-liner:** A personalized board game subscription that matches each subscriber with a monthly game tailored to their taste profile and existing collection.  
**Problem:** Board gamers struggle to discover games that fit their taste, group size, and collection. Existing subscription boxes fail because they send the same game to everyone, ignore owned games, and create disappointment-driven churn.  
**Solution:** CrateMatch uses an onboarding taste quiz, BoardGameGeek (BGG) collection import, catalog metadata, and inventory-aware recommendation logic to select one monthly game per subscriber, explain why it was chosen, and learn from post-delivery feedback. Human merchandisers can review low-confidence matches in v1 [INFERRED].

### KPI Targets

| KPI | Beta exit target | 12-month target | Notes |
|---|---:|---:|---|
| Onboarding completion rate | >=70% | >=80% | % of signups who complete quiz + billing |
| BGG import success rate | >=85% | >=92% | Successful import among users who attempt import |
| Recommendation fit rate | >=60% | >=72% | % of delivered games rated 4/5 or 5/5 |
| Monthly subscriber churn | <=8% | <=6% | Original intent preserved; improved by better matching |
| Shipment creation SLA | >=95% within 24h of monthly batch | >=98% | Paid subscriptions only |
| Support tickets per 100 shipments | <=12 | <=8 | Operational quality signal [INFERRED] |
| Gross margin | >=22% | >=26% | Based on Discovery plan economics [INFERRED] |
| Merchandiser override rate | <=35% | <=20% | Measures algorithm confidence maturation [INFERRED] |

## 2. Users & Personas

### Persona A: Gateway Graduate (Primary)
- **Profile:** Owns 5-30 games, plays 2-4 times per month.
- **Goals:** Discover games they are likely to love without spending hours researching.
- **Pain points:** Overwhelmed by BGG lists and YouTube reviews; fears buying duplicates or “table misses.”
- **Tech comfort:** Medium-high; comfortable with web onboarding and account dashboards.

### Persona B: Busy Hobbyist (Secondary)
- **Profile:** Owns 30-100 games, has defined taste, but limited time to research.
- **Goals:** Find high-fit games outside their usual bubble.
- **Pain points:** Already owns many popular titles; generic recommendations are often redundant.
- **Tech comfort:** High; likely to connect BGG and provide detailed feedback.

### Persona C: Gift Buyer (Future-facing)
- **Profile:** Buying for someone else and may not know the hobby well.
- **Goals:** Give a board game gift with low risk of duplication.
- **Pain points:** Limited confidence in choosing games and limited knowledge of recipient’s collection.
- **Tech comfort:** Medium; wants a simple guided flow.
- **Note:** Gift purchase flow is out of scope for v1 and retained for v2+ [INFERRED].

## 3. Scope

### In Scope for v1
1. Responsive web app for subscriber onboarding and account management.
2. One paid plan at launch: **Discovery** at **$34.99/month** for one curated game [INFERRED from original pricing].
3. Email/password authentication and verified account creation.
4. Taste quiz with 15-20 known games and preference capture.
5. Optional BGG collection + ratings import using public BGG username.
6. Monthly recommendation batch that respects ownership, prior shipments, plan budget, player count, play time, and inventory constraints.
7. Human merchandiser review queue for low-confidence or exception cases [INFERRED].
8. Personalized “Why this game?” explanation shown before/with shipment.
9. Stripe-based recurring billing, pause, skip, and cancel controls.
10. 3PL order handoff, shipment tracking, and basic delivery notifications.
11. Post-delivery rating and feedback capture to improve future recommendations.
12. Internal admin tooling for catalog, inventory, monthly batch monitoring, and overrides.
13. US-only shipping for launch [INFERRED].

### Out of Scope for v1
1. Explorer, Collector, and Gift tiers.
2. Try-before-you-buy / return-for-swap workflow.
3. Household profiles and multi-user taste merging.
4. Native iOS or Android apps.
5. Subscriber community, forum, or Discord integration.
6. International shipping.
7. Publisher-funded exclusive promos as a systemized capability.
8. Automated experimentation platform beyond basic analytics dashboards.

### Future v2+
1. Gift subscriptions and recipient onboarding.
2. Try-before-you-buy with returns, swap pool, and grading workflow.
3. Household/couple/family profiles.
4. Explorer and Collector plans.
5. Native mobile app experiences.
6. Community features and social proof loops.
7. Canada/UK expansion.
8. Expansion recommendations and exclusive publisher content.

## 4. Functional Requirements

### FR-01 — Account Creation and Authentication
- **User story:** As a prospective subscriber, I want to create an account securely so I can start my personalized subscription.
- **Description:** Users can create an account with email and password, verify their email address, log in, log out, and reset their password.
- **Acceptance criteria:**
  - **Given** a new user enters a valid email, password, and display name, **when** they submit signup, **then** the system creates an unverified account and sends a verification email within 1 minute.
  - **Given** an unverified user clicks a valid verification link, **when** the link is opened, **then** the account becomes verified and the user is redirected into onboarding.
  - **Given** a returning user enters valid credentials, **when** they sign in, **then** they land on their dashboard or the next incomplete onboarding step.
  - **Given** a user requests password reset, **when** they submit a valid email, **then** they receive a reset link without revealing whether the email exists.
- **Edge cases:** Duplicate email, expired verification link, repeated failed login attempts, password reset requested for social-only accounts [N/A in v1].
- **Priority:** Must
- **Dependencies:** Email provider, auth service, user profile store.

### FR-02 — Plan Selection and Recurring Billing
- **User story:** As a subscriber, I want to purchase and manage my monthly subscription so I know what I am paying for and when I will be billed.
- **Description:** Users can subscribe to the Discovery plan, add a payment method, view their next billing date, and manage pause/skip/cancel actions subject to cutoff rules.
- **Acceptance criteria:**
  - **Given** a verified user completes onboarding and enters valid payment details, **when** they confirm checkout, **then** a recurring subscription is created in Stripe and the dashboard shows plan, price, and next billing date.
  - **Given** a subscriber chooses to skip the next month before the monthly cutoff, **when** they confirm skip, **then** the next shipment is not generated and the next bill date advances by one cycle [INFERRED].
  - **Given** a subscriber pauses or cancels after the monthly cutoff, **when** the request is saved, **then** it applies to the next ungenerated cycle and the UI explains that the current cycle may still ship.
  - **Given** an automatic payment fails, **when** Stripe sends a failure webhook, **then** the subscription enters `payment_action_required`, shipment generation is blocked, and the user is notified.
- **Edge cases:** Expired card, tax handling by state [NEEDS INPUT], address mismatch, multiple retries on failed payment, coupon support out of scope.
- **Priority:** Must
- **Dependencies:** Stripe Billing, webhook processing, subscription service, notification service.

### FR-03 — Taste Quiz Onboarding
- **User story:** As a new subscriber, I want to quickly teach CrateMatch my taste so it can send me games I’m more likely to enjoy.
- **Description:** The onboarding quiz asks the user to rate 15-20 recognizable games and specify preferences for complexity, theme, mechanics, player count, and play time.
- **Acceptance criteria:**
  - **Given** a user starts onboarding, **when** they reach the quiz, **then** they are shown 15-20 games with options: Loved, Liked, Neutral, Disliked, Haven’t Played.
  - **Given** a user answers at least 12 game prompts and the required preference questions, **when** they submit, **then** a taste profile is created and marked `ready_for_curation` if billing is complete.
  - **Given** a user leaves onboarding before finishing, **when** they return, **then** prior responses are restored.
  - **Given** a user has not completed the minimum quiz by the monthly curation cutoff, **when** the batch job runs, **then** no shipment is created and the user remains in onboarding hold until completion [INFERRED].
- **Edge cases:** User has played very few anchor games, user skips most questions, accessibility for rating controls, quiz content drift as titles age [INFERRED].
- **Priority:** Must
- **Dependencies:** Seed game list, profile service, onboarding state management.

### FR-04 — BGG Collection and Ratings Import
- **User story:** As a board gamer with an existing BGG account, I want to import my collection and ratings so CrateMatch avoids duplicates and learns my taste faster.
- **Description:** Users can connect by entering their public BGG username. The system imports owned games, wishlist entries, and ratings where available.
- **Acceptance criteria:**
  - **Given** a user enters a valid BGG username, **when** the import job succeeds, **then** owned games, ratings, and wishlist status are attached to the user profile and visible in a review screen.
  - **Given** imported titles cannot be matched confidently to CrateMatch catalog records, **when** the import completes, **then** unmatched entries are excluded from hard duplicate prevention and surfaced for admin review [INFERRED].
  - **Given** the BGG service times out or rate limits, **when** import fails, **then** the user sees a retry option and can continue onboarding without import.
  - **Given** a user re-runs import, **when** new data is available, **then** the system updates ownership and ratings without duplicating records.
- **Edge cases:** Private or empty BGG profile, BGG XML downtime, title normalization mismatches, users with very large collections (>500 games).
- **Priority:** Must
- **Dependencies:** BGG integration, catalog normalization service, async job processing.

### FR-05 — Recommendation Generation and Constraint Filtering
- **User story:** As a subscriber, I want each month’s pick to fit my taste and collection so the subscription feels genuinely personalized.
- **Description:** On a monthly schedule, the system scores catalog games for each eligible subscriber using taste signals and hard constraints. Hard constraints include: already owned, previously shipped, out of stock, price beyond plan budget, unsupported player count, and explicit dislikes.
- **Acceptance criteria:**
  - **Given** a subscriber is active, paid, and onboarding-complete, **when** the monthly batch runs, **then** the system produces a ranked candidate list with a confidence score and at least one backup candidate where possible.
  - **Given** a game violates a hard constraint, **when** candidate scoring is computed, **then** that game is excluded from final consideration.
  - **Given** no candidate exceeds the confidence threshold of **0.60** [INFERRED], **when** the batch finishes, **then** the subscriber is routed to a merchandiser review queue instead of auto-finalization.
  - **Given** inventory changes before order creation, **when** the selected game becomes unavailable, **then** the next valid backup candidate is used automatically or routed for review if none exists.
- **Edge cases:** Cold-start users with no BGG data, all high-scoring games already owned, sparse catalog metadata, plan-budget conflicts, publisher embargo dates [NEEDS INPUT].
- **Priority:** Must
- **Dependencies:** Taste profile, catalog service, inventory service, recommendation model, monthly scheduler.

### FR-06 — Personalized Recommendation Explanation
- **User story:** As a subscriber, I want to understand why a game was selected so I can trust the curation.
- **Description:** Each finalized recommendation includes a concise explanation tied to profile signals, such as mechanics, complexity, player count, or similarity to rated games.
- **Acceptance criteria:**
  - **Given** a recommendation is finalized, **when** the user opens the monthly pick detail, **then** they see a “Why this game?” explanation with at least three personalized reasons.
  - **Given** the model has insufficient confidence to reference specific prior games, **when** the explanation is generated, **then** the system falls back to profile-level reasons (e.g., preferred weight, play time, theme).
  - **Given** an admin overrides a recommendation, **when** the explanation is shown, **then** the explanation reflects the final chosen game, not the originally auto-ranked one.
- **Edge cases:** Inaccurate or hallucinatory explanation content, missing metadata, user has no prior ratings, explanation length on mobile web.
- **Priority:** Should
- **Dependencies:** Recommendation service, game metadata, explanation template/generation service.

### FR-07 — Fulfillment and Shipment Tracking
- **User story:** As a subscriber, I want my monthly game shipped reliably with status visibility so I know when to expect it.
- **Description:** Finalized recommendations create orders in the warehouse/3PL system. Tracking data is synced back into the user dashboard and notification system.
- **Acceptance criteria:**
  - **Given** a paid and finalized monthly recommendation, **when** order export runs, **then** the order is created in the 3PL with item, address, and shipment metadata.
  - **Given** the carrier returns a tracking number, **when** tracking is available, **then** the dashboard and shipment email show the tracking link and status.
  - **Given** a shipping address is invalid or undeliverable, **when** order creation fails validation, **then** the order is held and the user is prompted to correct the address before release.
  - **Given** a shipment is marked delivered, **when** the event is received, **then** the feedback request workflow is triggered.
- **Edge cases:** Partial warehouse outage, carrier delays, address changes after cutoff, item damaged in warehouse [NEEDS INPUT], oversold stock.
- **Priority:** Must
- **Dependencies:** 3PL/WMS integration, shipping carrier/tracking integration, notification service.

### FR-08 — Post-Delivery Feedback and Learning Loop
- **User story:** As a subscriber, I want to rate my monthly pick so future boxes become more accurate.
- **Description:** Users can rate each delivered game on a 1-5 scale and optionally provide structured reasons and free text.
- **Acceptance criteria:**
  - **Given** a delivered shipment, **when** the user opens the dashboard or reminder email, **then** they can submit a 1-5 rating plus optional tags such as “too complex,” “great at 2 players,” or “theme didn’t land.”
  - **Given** a rating is submitted, **when** the save succeeds, **then** the taste profile is updated for the next recommendation cycle and the feedback is timestamped.
  - **Given** the user has not submitted feedback within 7 days of delivery, **when** reminder logic runs, **then** up to two reminders are sent and then suppressed.
  - **Given** a user edits a prior rating, **when** the update is submitted before the next monthly batch cutoff, **then** the latest rating is used by the recommendation system.
- **Edge cases:** User has not played the game yet, duplicate submissions, abusive free-text feedback, late rating after next cycle finalized.
- **Priority:** Must
- **Dependencies:** Shipment status, profile service, notification service, moderation policy for free text [INFERRED].

### FR-09 — Subscription Self-Serve Management
- **User story:** As a subscriber, I want to control my subscription without contacting support so I can adapt it to my schedule and budget.
- **Description:** Subscribers can update shipping address, payment method, skip next month, pause, or cancel through the dashboard.
- **Acceptance criteria:**
  - **Given** a subscriber updates their shipping address before the monthly cutoff, **when** they save changes, **then** the new address is used for the next shipment.
  - **Given** a subscriber pauses the subscription, **when** the pause is confirmed, **then** billing and recommendation generation stop until reactivation.
  - **Given** a subscriber cancels, **when** cancellation succeeds, **then** the dashboard shows cancellation effective date and reactivation option.
  - **Given** a subscriber attempts to modify a cycle already locked for fulfillment, **when** they save, **then** the UI explains that the change applies to the following cycle.
- **Edge cases:** Mid-cycle cancellation disputes, existing unpaid invoice, reactivation after long pause, address validation failures.
- **Priority:** Must
- **Dependencies:** Subscription service, billing provider, address validation service [INFERRED].

### FR-10 — Admin Catalog, Inventory, and Monthly Batch Operations
- **User story:** As an operations or merchandising manager, I want to manage the game catalog, stock, and monthly batch exceptions so we can fulfill high-quality recommendations reliably.
- **Description:** Internal admins can create and update catalog records, manage inventory availability, review low-confidence recommendations, override selections, and monitor batch health.
- **Acceptance criteria:**
  - **Given** an admin uploads or edits a catalog item, **when** required metadata is valid, **then** the item is searchable and eligible for recommendation.
  - **Given** inventory counts are updated, **when** stock falls below the recommendation safety threshold, **then** the item is excluded from future auto-selection [INFERRED].
  - **Given** the monthly batch produces exceptions, **when** a merchandiser reviews a subscriber, **then** they can choose a final game, record a rationale, and release the order.
  - **Given** an admin changes a final selection, **when** the change is saved, **then** the system updates explanation content, reservation records, and downstream fulfillment payloads.
- **Edge cases:** Two admins editing same subscriber simultaneously, stale inventory feeds, auditability of overrides, rollback after accidental override.
- **Priority:** Must
- **Dependencies:** Admin RBAC, catalog service, inventory service, recommendation outputs, audit log.

### FR-11 — Notifications and Monthly Lifecycle Messaging
- **User story:** As a subscriber, I want timely updates about my subscription status so I know what action is needed and what is happening next.
- **Description:** The system sends lifecycle emails for verification, billing issues, monthly pick readiness, shipment, delivery, and feedback reminders.
- **Acceptance criteria:**
  - **Given** a lifecycle event occurs, **when** messaging rules are satisfied, **then** the correct email template is sent with subscriber-specific context.
  - **Given** a payment failure occurs, **when** the first notification is sent, **then** follow-up reminders stop once the invoice is paid or the cycle expires.
  - **Given** a user has unsubscribed from marketing emails, **when** operational events occur, **then** transactional emails still send.
- **Edge cases:** Duplicate event delivery, bounced email address, localization readiness for future markets.
- **Priority:** Should
- **Dependencies:** Email provider, event bus or webhook handlers, template management.

## 5. Non-Functional Requirements

### Performance
1. Public web pages: Largest Contentful Paint (LCP) p95 <= 2.5s on broadband desktop and <= 4.0s on mid-tier mobile web [INFERRED].
2. Authenticated dashboard page load: p95 <= 2.0s after login.
3. Read APIs: p95 <= 300ms; write APIs: p95 <= 700ms, excluding third-party dependency latency.
4. BGG import job: p95 completion <= 180s for collections up to 500 items.
5. Monthly recommendation batch: complete <= 4 hours for 10,000 active subscribers and 5,000 active catalog SKUs.

### Availability & Reliability
1. Customer-facing app SLA: **99.5% monthly uptime** excluding planned maintenance windows.
2. Recommendation batch completion success: **99.0% of monthly cycles** completed before fulfillment cutoff.
3. Webhook processing (billing and tracking): at-least-once ingestion with idempotent handlers.
4. Daily backups for operational databases; point-in-time recovery target <= 30 minutes [INFERRED].

### Scalability
1. Support **10,000 active subscribers** in v1 architecture without replatforming.
2. Support **100,000 catalog game records** and **2 million user-game relation records**.
3. Support **5,000 order exports/day** during peak batch windows.
4. Support **50 concurrent admin users** during batch review periods.

### Security Model
1. Roles: `subscriber`, `ops_admin`, `merchandiser`, `support_admin` [INFERRED].
2. Admin accounts require MFA; subscriber MFA is optional in v1 and should be offered if supported by auth provider [INFERRED].
3. All traffic over TLS 1.2+; sensitive data encrypted at rest.
4. Raw card data must never touch CrateMatch systems; Stripe-hosted/tokenized flows only.
5. Store minimum required PII: name, email, shipping address, billing customer ID, gameplay preferences.
6. Audit log required for admin inventory edits, recommendation overrides, and subscriber support impersonation [if enabled, NEEDS INPUT].
7. Follow privacy-by-default: users can request account deletion and export.

### Accessibility
- Meet **WCAG 2.2 AA** for public and authenticated subscriber experiences.
- Keyboard navigability required for onboarding quiz, dashboard, and checkout.
- Color contrast >= 4.5:1 for body text; non-color cues required for rating states.

### Internationalization (i18n)
- v1 launches in **English (en-US)** only.
- All user-facing strings must be externalized for future localization [INFERRED].
- Currency, tax, and shipping logic are US-only in v1.

### Data Retention
1. Active subscriber data retained while account is active.
2. Cancelled account profile data retained for **24 months** to support reactivation and analytics unless deletion is requested [INFERRED].
3. Deletion requests remove or anonymize PII within **30 days**, except financial records retained for **7 years** where legally required [INFERRED].
4. Operational logs retained for **90 days**; security audit logs retained for **1 year**.

### Browser Support
- Desktop: latest 2 versions of Chrome, Safari, Firefox, and Edge.
- Mobile web: Safari on iOS 16+ and Chrome on Android 12+ [INFERRED].
- No support commitment for Internet Explorer.

## 6. User Flows

### Flow 1 — New Subscriber Onboarding
**Happy path**
1. User lands on marketing site and clicks **Start my match**.
2. User creates account and verifies email.
3. User completes taste quiz.
4. User optionally imports BGG profile.
5. User enters shipping + payment details and subscribes.
6. Dashboard confirms next curation month and profile readiness.

**Error/exception paths**
- Email verification link expired -> user can request a new link.
- BGG import fails -> user can continue without import and retry later.
- Payment fails -> subscription remains inactive until payment succeeds.
- User misses monthly cutoff -> first box moves to next cycle [INFERRED].

### Flow 2 — Monthly Recommendation and Merchandiser Review
**Happy path**
1. Monthly batch selects eligible subscribers.
2. Recommendation engine generates ranked candidates.
3. High-confidence matches auto-finalize and reserve inventory.
4. Low-confidence matches route to merchandiser.
5. Final recommendation is recorded and explanation is generated.

**Error/exception paths**
- No eligible candidate found -> subscriber routed to exception queue; support template available.
- Selected item goes out of stock -> backup candidate is applied or review required.
- Batch job partially fails -> rerunnable job resumes from subscriber checkpoint [INFERRED].

### Flow 3 — Fulfillment and Tracking
**Happy path**
1. Finalized recommendation is exported to 3PL.
2. Warehouse picks, packs, and creates carrier label.
3. Tracking number syncs back to CrateMatch.
4. Subscriber receives shipment notification and can view status in dashboard.
5. Delivery event triggers feedback request.

**Error/exception paths**
- Address invalid -> order held; subscriber prompted to fix address.
- Carrier delay -> dashboard reflects latest carrier status; support visibility retained.
- Warehouse rejects item due to damage -> fallback item or delay notice required [INFERRED].

### Flow 4 — Feedback Loop
**Happy path**
1. Delivered subscriber receives “How was your match?” message.
2. Subscriber rates the game and optionally adds reasons/comments.
3. Profile updates and is used in next monthly cycle.
4. Dashboard shows feedback received.

**Error/exception paths**
- User has not played yet -> can choose “Not played yet” and snooze reminder 14 days [INFERRED].
- Duplicate rating submissions -> latest valid rating wins.
- Free-text abuse -> comment hidden from staff tools pending moderation rules [INFERRED].

### Flow 5 — Skip, Pause, or Cancel
**Happy path**
1. Subscriber opens dashboard settings.
2. Subscriber chooses skip next month, pause, or cancel.
3. UI shows effective date based on fulfillment cutoff.
4. System applies change and sends confirmation.

**Error/exception paths**
- User tries to skip after cutoff -> change applies to following cycle.
- User has failed payment and tries to resume -> payment update required first.
- Subscriber disputes charge after shipment locked -> routed to support policy [NEEDS INPUT].

## 7. Data Model

### Conceptual Entities

| Entity | Description | Key relationships | PII |
|---|---|---|---|
| User | Subscriber identity record | 1:1 with TasteProfile; 1:N with Subscription, Address, Feedback, Shipment | Yes |
| Address | Shipping destination | N:1 User; 1:N Shipment | Yes |
| TasteProfile | Derived preference model and quiz answers | 1:1 User; used by RecommendationCycle | Partial (preference data) |
| BGGImportJob | Async import execution record | N:1 User | No |
| UserGameRecord | Imported or manual game ownership/rating | N:1 User; N:1 GameCatalogItem | No |
| Subscription | Billing + lifecycle state | N:1 User; 1:N RecommendationCycle, BillingEvent | Partial |
| BillingEvent | Invoice/payment event history | N:1 Subscription | Partial |
| GameCatalogItem | Normalized game metadata | 1:N UserGameRecord, Recommendation, InventoryItem | No |
| InventoryItem | Available stock and procurement data | N:1 GameCatalogItem | No |
| RecommendationCycle | Monthly curation record for one subscriber | N:1 User; N:1 Subscription; 1:N Recommendation | No |
| Recommendation | Candidate or final game choice with score and rationale | N:1 RecommendationCycle; N:1 GameCatalogItem | No |
| Shipment | Fulfillment and tracking record | N:1 RecommendationCycle; N:1 Address | Partial |
| Feedback | Post-delivery rating and comments | N:1 User; N:1 Shipment; N:1 GameCatalogItem | Partial |
| AdminUser | Internal operations user | 1:N catalog edits, overrides, audit events | Yes |
| AuditEvent | Trace of privileged changes | N:1 AdminUser; optional references to catalog/recommendation/shipment | No |

### Relationships
1. A **User** has one active **TasteProfile** and zero or more **UserGameRecords**.
2. A **User** may have zero or one active **Subscription** in v1 [INFERRED].
3. Each monthly **RecommendationCycle** belongs to exactly one **Subscription** and one **User**.
4. A **RecommendationCycle** contains one or more candidate **Recommendations** and at most one final selected recommendation.
5. A final **Recommendation** can generate zero or one **Shipment**.
6. **Feedback** ties a user’s reaction back to the shipped game and next-cycle personalization.

## 8. Integration Points

| Integration | Purpose | Data exchanged | Failure handling |
|---|---|---|---|
| BGG public API/XML [NEEDS INPUT on exact endpoint strategy] | Import ownership, ratings, wishlist | BGG username, game IDs, ownership flags, ratings | Async retries, timeout handling, allow onboarding continuation without import |
| Stripe Billing | Subscription creation, recurring billing, payment method storage | Customer ID, subscription ID, invoice/payment events | Idempotent webhooks, payment-action-required state, retry messaging |
| 3PL / WMS (e.g., ShipBob) [NEEDS INPUT] | Order creation, stock sync, fulfillment status | SKU, address, order status, tracking number | Hold failed orders, reconcile stock mismatches daily |
| Carrier tracking / shipping aggregator (e.g., EasyPost) [INFERRED] | Tracking visibility | Tracking number, carrier, scan events | Poll + webhook fallback |
| Email provider (e.g., SendGrid/Postmark) [INFERRED] | Transactional lifecycle notifications | Email address, template variables, send status | Retry transient failures; alert on bounce spikes |
| Analytics / product telemetry | Funnel and retention measurement | Event names, user IDs, subscription states | Event queue with backpressure; no PII in analytics payload beyond internal IDs [INFERRED] |

## 9. UX/UI Requirements

### Key Screens
1. **Marketing + conversion landing page**
   - Must clearly explain value proposition: personalized monthly game, no duplicates, profile-driven matching.
   - Must show CTA, social proof placeholder, pricing, FAQ, and waitlist/subscribe path.
   - States: loading skeletons for hero assets, empty social proof fallback, payment-unavailable error banner if checkout disabled.

2. **Account creation + verification screen**
   - Minimal fields; clear password requirements; success state explains next step.
   - States: inline field validation, resend verification action, expired-link error state.

3. **Taste quiz**
   - One question per step or small batch; persistent progress indicator required.
   - Must support keyboard navigation and screen reader labels.
   - States: loading quiz content, save-in-progress, resume state, insufficient answers warning.

4. **BGG import screen**
   - Must explain why import helps and that it is optional.
   - Should show matched count, unmatched count, and last import timestamp.
   - States: importing spinner, partial success summary, retry state, empty BGG profile state.

5. **Checkout / plan confirmation**
   - Must show recurring price, shipping scope, billing cadence, and cutoff policy.
   - States: payment processing, success confirmation, failed payment recovery.

6. **Subscriber dashboard**
   - Sections: subscription status, next curation date, latest shipment, feedback to-do, account settings.
   - Must surface “Why this game?” for finalized picks and key cycle dates.
   - States: no upcoming shipment yet, onboarding incomplete empty state, payment action required, shipment delayed.

7. **Feedback screen**
   - 1-5 rating must be primary action; structured tags secondary; free text optional.
   - States: not delivered yet, already submitted, save failed, snoozed reminder confirmation.

8. **Admin operations console**
   - Views: catalog management, inventory availability, monthly batch queue, subscriber exception detail, audit history.
   - States: empty exception queue, stale inventory warning, conflict resolution state for concurrent edits.

### UX Rules
- Display monthly cutoff dates wherever users can take subscription-affecting actions.
- Never promise a specific game title before fulfillment unless business policy explicitly changes [INFERRED].
- Explanation copy must be transparent and understandable, not “AI magic” language.
- All error states must provide a clear next action.

## 10. Release & Rollout

### Rollout Plan

| Phase | Audience | Scope | Exit criteria |
|---|---|---|---|
| Phase 0 — Internal Alpha [INFERRED] | Team + friendly testers (<=25 users) | Full onboarding, manual monthly recommendations, no live billing if avoidable [INFERRED] | >=80% onboarding completion, no P1 auth/billing defects |
| Phase 1 — Closed Beta | Invite-only waitlist users (<=250 subscribers) | Discovery plan, US-only, live billing, human review for all recommendations at first | Recommendation fit rate >=55%, shipment SLA >=95%, support tickets <=15/100 shipments |
| Phase 2 — Limited Launch | Invite-only expansion (<=1,000 subscribers) | Increase auto-finalized recommendations, normalize ops load | Override rate <=30%, churn <=8%, gross margin >=22% |
| Phase 3 — General Availability | Open enrollment in US | Scaled v1 with standardized operations | Stable 2 consecutive cycles meeting KPI targets |

### Rollout Controls
1. Feature flags for BGG import, auto-finalization threshold, explanation generation, skip/pause controls, and notification campaigns.
2. Monthly launch review before each cycle: inventory readiness, catalog freshness, batch dry run, 3PL health check.
3. Manual fallback permitted in beta: merchandisers can assign games directly if model quality is insufficient.
4. Do not enable try-before-you-buy until v1 economics and fit rate are proven [INFERRED].

## 11. Open Questions with Proposed Defaults

| ID | Open question | Proposed default | Status |
|---|---|---|---|
| OQ-01 | Should v1 include gift subscriptions? | No. Defer to v2+; keep onboarding focused on self-serve subscribers. | [NEEDS INPUT] |
| OQ-02 | Should try-before-you-buy launch in v1? | No. Launch only after 2 successful cycles with fit rate >=70% and ops margin validated. | [NEEDS INPUT] |
| OQ-03 | Which 3PL should be selected for launch? | Use a US-based 3PL with API-based inventory + tracking support; ShipBob is the working assumption [INFERRED]. | [NEEDS INPUT] |
| OQ-04 | How should taxes be handled across US states? | Use Stripe Tax or equivalent managed tax service rather than custom logic [INFERRED]. | [NEEDS INPUT] |
| OQ-05 | What confidence threshold should auto-finalize recommendations? | Start at 0.60 and review after first 2 live cycles. | [NEEDS INPUT] |
| OQ-06 | What is the exact monthly cutoff date for skip/pause/address changes? | Set cutoff to the 20th at 11:59 PM subscriber local time [INFERRED]. | [NEEDS INPUT] |
| OQ-07 | Will support agents be allowed to impersonate subscribers? | Default to no impersonation in v1; use admin-assisted workflows until audit-safe tooling exists. | [NEEDS INPUT] |
| OQ-08 | What catalog size is required at launch to ensure recommendation diversity? | Minimum 150 active, in-stock titles spanning family, strategy, party, co-op, and 2-player categories [INFERRED]. | [NEEDS INPUT] |
