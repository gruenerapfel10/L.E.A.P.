# Project Tasks

This file tracks the development tasks for the Leap learning platform.

## NEW MAJOR REFACTORING: Vocabulary/Structure Controlled Generation

**Goal:** Increase sentence variability and control by selecting specific vocabulary and structural elements before prompting the AI, rather than relying solely on AI generation based on context.

**Phase 1: Database Foundation (Vocabulary)**

-   [x] ~~**Investigate Supabase Schema:** Determine if existing vocabulary/word tables exist and are suitable.~~ Log: Found basic `vocabulary` table.
-   [x] ~~**Design Vocabulary Table Schema:** Define fields (word, lemma, lang, pos, features, cefr, themes etc.) and indexes.~~ Log: Defined required additional columns. --> *Renamed `pos` to `vocabulary_type`.*
-   [x] ~~**Create/Migrate Vocabulary Table:** Implement schema in Supabase.~~ Log: Migrations created for columns and function. Manual execution needed for function. --> *Added migration to rename `pos` to `vocabulary_type`.*
-   [ ] **Populate Vocabulary Table (Initial):** Add starting German vocabulary *with new details* (including full `vocabulary_type` names).

**Phase 2: Vocabulary & Structure Selection Logic**

-   [x] ~~**Create `VocabularyService`:** Implement Supabase client integration and `getVocabularyItems` function.~~ Log: Service created, uses RPC, fixed param/return types. --> *Updated to use `vocabulary_type`.*
-   [x] ~~**Create `StructureConstraintService`:** Define service to determine constraints (POS counts, features, theme) based on submodule/difficulty.~~ Log: Service created with defaults. --> *Updated to use `vocabulary_type`.*
-   [x] ~~**Implement Initial Constraint Logic:** Start with simple logic (e.g., request NNVAdj based on submodule hints).~~

**Phase 3: Integrate into Generation Flow**

-   [x] ~~**Refactor `question-generation.service.ts`:**~~ Log: Integrated Vocab/Constraint services, updated prompt construction. --> *Updated to use `vocabulary_type`.*
-   [x] ~~**Modify API (`/generate`):**~~ Update request body and pass constraints down. Log: Done.
-   [ ] **Modify Modal/Submodule Definitions (Optional):** Add optional config for vocabulary/structure needs.

**Phase 4: Refinement & Expansion**

-   [ ] Tune Enhanced Prompts.
-   [x] ~~Expand Vocabulary DB.~~ Log: Added sample data & themes.
-   [x] ~~Enhance Constraint Logic.~~ Log: Added basic theme inference based on submodule context.
-   [x] ~~Fix MC Gap Generation.~~ Log: Moved gap insertion to UI component.

## Refactoring: Deterministic Error Generation (80/20 Logic)

**(Superseded by Vocabulary/Structure Controlled Generation Refactoring for sentence-error-* modals, but structure schema and AI service changes remain relevant)**

**Goal:** Shift from AI generating errors directly to AI generating correct content, which is then programmatically manipulated based on submodule logic to introduce specific, controlled errors.

**Core Components:**
*   **`SentenceStructureSchema` (Zod):** ...
*   **Gemini JSON Mode (via `responseSchema`):** Utilize the AI provider's capability to return JSON conforming to the `SentenceStructureSchema`.
*   **Error Generation Algorithms (e.g., `correct-incorrect.service.ts`):** ...

**Phase 1: Design & Foundation**

-   [x] ~~**Define `SentenceStructureSchema` (Zod):** ...~~ Log: Simplified schema created. Updated description for PUNCT.
-   [x] ~~**Research & Configure Gemini JSON Mode:** ...~~ Log: Confirmed use of `responseSchema` / `responseMimeType`.
-   [x] ~~**Update `ai.service.ts`:** ...~~ Log: Refactored service to use `convertZodToGoogleSchema` and `responseSchema` config. Added retry logic on Zod validation failure.
-   [ ] **Design Error Combination Algorithm (`correct-incorrect`):** ...
-   [x] ~~**Implement Error Algorithm Stub (`correct-incorrect.service.ts`):** ...~~
-   [x] ~~**Redefine Submodule Error Logic:** ...~~ Log: Added `allowedErrorTypes` to overrides.
-   [x] ~~**Refactor Modal Definition (`correct-incorrect` -> `sentence-error-identify` / `sentence-replace-error`):** ...~~ Log: Created new files/IDs.
-   [x] ~~**Update Modal Schemas JSON/Registry:** ...~~ Log: Created new JSON files, deleted old. Registry loads automatically.

**Phase 2: Implementation (Proof of Concept - German Adjectives & Split Modals)**

-   [x] ~~Implement `SentenceStructureSchema`:** ...~~
-   [x] ~~Implement Error Algorithm (`correct-incorrect.service.ts`):** ...~~ Log: Refactored to use AI calls (`applySingleErrorAI`) for generating incorrect forms. Fixed reconstruction logic. **Known Issue:** AI features noisy. Error plausibility TBD.
-   [x] ~~Update `sentence-identify-error.json` / `sentence-replace-error.json`:** ...~~ Log: Prompt improved... -> Aligned with new prompt structure.
-   [x] ~~Update `adjective-declension.de.json`:** ...~~
-   [x] ~~Refactor `question-generation.service.ts`:** ...~~ 
-   [x] ~~Refactor `WritingCorrectIncorrectSentence` Component (if needed):** ...~~

**Phase 3: Rollout & Refinement**

-   [ ] Verify Punctuation Fix: Confirm if latest prompt ensures AI includes punctuation tokens reliably.
-   [ ] Address Noisy Features: ...
-   [x] ~~Apply pattern to other relevant modals/modules (e.g., define explicit schemas for MC, Fill-in-Gap in `question-generation.service.ts`).~~ Log: Added explicit schema handling for `true-false`, `multiple-choice`, `fill-in-gap` in generation service. Removed redundant `zodSchema` from JSON definitions.
-   [ ] Refine `SentenceStructureSchema`, parsing prompts, and error logic definitions.

## Known Bugs / Issues

-   [x] ~~**AI generating structure from description:** ...~~
-   [x] ~~**AI generating incorrect structure:** ...~~
-   [x] ~~**Repetitive Sentence Generation:** ...~~
-   [x] ~~**Vocabulary Fetch Error:** ...~~
-   [x] ~~**UI Error: Unsupported taskType undefined:** ...~~
-   [x] ~~**Debug Constraints Ignored:** ...~~ Log: Fixed placeholders & override prompts.
-   [x] ~~**Missing Vocabulary Data:** Database lacks entries...~~ Log: Added sample data.
-   [x] ~~**MC Question Format:** ...~~ Log: Updated prompts.
-   [x] ~~**MC Context Ignored:** ...~~ Log: Updated prompts.
-   [x] ~~**MC Duplicate/Incorrect Options:** AI generated duplicate or wrong correctOptionIndex.~~ Log: Updated prompts to require distinct options and correct index/explanation.
-   [x] ~~**Vocabulary Variety:** AI generates repetitive nouns/themes...~~ Log: Implemented theme inference. Vocab list in prompt now includes POS tags.
-   [x] ~~**Vocabulary & Context Conflict:** ...~~ Log: Re-prioritized prompts... Added explicit negative constraints... -> Fixed sentence-error prompts.
-   [ ] **Initial Load Errors:** `/dashboard/language-skills` page shows repeated `Could not determine skill type for schema ID: null` and registry initialization logs. Needs investigation in frontend page/component logic.
-   [ ] **SentenceStructureSchema Generation Failure:** AI fails to generate JSON matching SentenceStructureSchema (e.g., `clauses: null` error) for `sentence-error-*` modals. Log: Aligned prompts with MC structure. Needs testing.

## Core Learning Loop

- [x] ~~Implement basic session start endpoint ...~~
- [x] ~~Implement session state fetching endpoint ...~~
- [x] ~~Implement answer submission endpoint ...~~
- [x] ~~Implement question generation service ...~~
- [x] ~~Implement answer marking service ...~~ Log: Refactored to use explicit Zod schema object (`AiMarkingResultSchema`) with `aiService`.
- [x] ~~Implement picker service ...~~
- [x] ~~Create basic session page UI ...~~ Log: Implemented dynamic UI rendering. Added Task Type badge.
- [x] ~~Implement Module Registry ...~~
- [x] ~~Implement Modal Schema Registry ...~~

## Debugging & Development

- [x] ~~Create Debug Menu component ...~~ Log: ... Added detailed constraint controls. --> *Updated to use `vocabulary_type`.*
- [x] ~~Add API endpoint to fetch module details ...~~
- [x] ~~Add API endpoint for forced question generation ...~~ Log: ... Updated to return debug info. --> *Updated to accept detailed `forcedConstraints`.*
- [x] ~~**Fix Debug Menu Generation URL:** ...~~
- [x] ~~**Refactor Debug Generation:** ...~~
- [ ] **Add Task Type Selector to Debug Menu?:** ...
- [ ] **Enhance Forced Generation:** ...
- [ ] **Log External API Error:** ...
- [ ] **Issue with `correct-incorrect-sentence` Generation:** ...

## UI Components for Interaction Modals

- [x] ~~ReadingMultipleChoiceComponent~~ Log: Created.
- [x] ~~WritingFillInGapComponent~~ Log: Created.
- [x] ~~ReadingTrueFalseComponent~~ Log: Created.
- [x] ~~WritingCorrectIncorrectSentence~~ Log: Created. Refactored for new data structure.
- [ ] Add UI component for Speaking tasks
- [ ] Add UI component for Listening tasks
- [x] ~~Change word definition interaction to use right-click~~ Log: Modified WordPopover component...

## Content Definition (Modules & Modals)

- [x] ~~Define `multiple-choice` modal schema~~ Log: Created.
- [x] ~~Define `fill-in-gap` modal schema~~ Log: Created.
- [x] ~~Define `true-false` modal schema~~ Log: Created.
- [x] ~~Define `sentence-error-identify` modal schema~~ Log: Created.
- [x] ~~Define `sentence-error-replace` modal schema~~ Log: Created.
- [x] ~~Define `vocabulary-entry` modal schema~~ Log: Created.
- [x] ~~Define German Adjective Declension module (`adjective-declension.de.json`)~~ Log: Created. Refactored for split modals.
- [x] ~~Define German Verb Conjugation module (`verb-conjugation.de.json`)~~ Log: Created.
- [ ] Define more modules...
- [ ] Define more modal schemas...

## Future Features

- [ ] Implement Spaced Repetition Strategy in `picker.service.ts`
- [ ] User Profiles & Progress Tracking
- [ ] Difficulty Level integration
- [ ] Session history analysis
- [ ] Internationalization (i18n) improvements
- [ ] **Refactor AI Service:** Consider migrating `ai.service.ts` from native `@google/generative-ai` SDK to use the Vercel AI SDK (`@ai-sdk/google-generative-ai`) for provider abstraction.
- [ ] **Submodule Help Resources:**
    - [x] ~~Define `HelperResource` type & add to `SubmoduleDefinition`.~~
    - [x] ~~Add sample markdown data to `adjective-declension.de.json`.~~
    - [x] ~~Install `react-markdown`.~~
    - [x] ~~Create `HelperSheet.tsx` component using `<Sheet>`.~~
    - [x] ~~Integrate `HelperSheet` trigger onto submodule badge.~~
    - [x] ~~Add "Module Overview" button and integrate with `HelperSheet`.~~
    - [x] ~~Add helper content for all `adjective-declension.de` submodules.~~
    - [ ] Add more helper content (tables, explanations) to other modules/submodules.
    - [ ] **API Change:** Ensure session state API returns full module/submodule definitions.
    - [ ] **State Handling:** Update state logic in `page.tsx` (`handleDebug...`, `handleNext...`) for module/submodule object changes.
- [ ] **LeetCode-Style Tab System:**
    - [x] ~~Install `@devbookhq/splitter`.~~
    - [x] ~~Create basic `TabSystem.tsx` component with `Splitter`.~~
    - [x] ~~Integrate `TabSystem` into `SessionPage`.~~
    - [x] ~~Refactor `TabSystem` for two separate `TabWindow` components.~~
    - [x] ~~Install `react-dnd` and `react-dnd-html5-backend`.~~
    - [x] ~~Implement drag-and-drop for tabs between windows using `react-dnd`.~~
    - [x] ~~Wrap `SessionPage` content with `DndProvider`.~~
    - [ ] Handle empty tab windows (e.g., hide window or show placeholder). // Next step
    - [ ] Allow dropping tabs anywhere on the target window, not just the header. // Next step
    - [ ] Implement drag preview/indicators. // Next step

## New Features

-   [ ] **Schema Breakdown Mode:**
    -   [ ] Design UI component (`SchemaBreakdownView.tsx`)...
    -   [ ] Add toggle mechanism...
    -   [ ] Ensure `SentenceStructure` data is available...
    -   [ ] Modify `question-generation.service.ts` or session state logic...

## Architecture Notes (Clarification)

*   **Module:** Broad topic...
*   **Submodule:** Specific aspect/rule...
*   **Modal Schema:** Interaction type/format (`sentence-error-identify`, `multiple-choice`)... Defines UI component, generation/marking approach.
*   **Task Type:** Specific interaction variant (`identify`, `replace`, `confirm`). Determined by backend logic based on chosen Modal Schema ID.