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
-   [x] ~~**Debug Menu Disabled:** Dropdowns were disabled due to `/api/learning/module` returning 404.~~ Log: Updated API route to use `getDefinitionsForModuleId` and return first available language definition for the concept.
-   [x] ~~**Picker Always Choosing Same Submodule:** `adjective-declension.de.json` only contained one submodule.~~ Log: Restored other submodules.
-   [x] ~~**AI Marking Error:** Zod validation failed for `correctAnswer` being null.~~ Log: Updated schema to require string (`""` for null case).
-   [x] ~~**AI Generation Error (True/False):** Zod validation failed for `explanation` being null.~~ Log: Updated schema to require string (`""` for null case).
-   [x] ~~**AI Generation Error (General):** Systematically removed `.optional().nullable()` from AI-facing Zod schemas (`MultipleChoice`, `FillInGap`) to prevent Google API schema errors.~~ Log: Updated schemas to require string/array/object and use descriptions to guide AI on empty values.
-   [x] ~~**AI Assistant Context:** Context data (`chatContextBody`) was not being sent from `SessionPage` via `useChat` hook.~~ Log: Refactored `/api/chat` to fetch context based on `sessionId` instead of relying on the request body.

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
- [x] ~~**Issue with `correct-incorrect-sentence` Generation:** ...~~ Log: Refactored Module Registry and dependent services (Picker, API) to support language-specific module definitions.

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
- [ ] **Session Settings:**
    - [x] ~~Create basic settings popover component.~~
    - [ ] Implement session settings persistence.
    - [ ] Add settings for:
        - [ ] Font size adjustment
        - [ ] Theme preferences
        - [ ] Audio settings
        - [ ] Keyboard shortcuts
        - [ ] Session preferences (auto-submit, show hints, etc.)
    - [ ] Add settings to user profile for persistence across sessions.
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

-   [x] **Floating Library Helper Sheet System:**
    -   [x] Design new helper sheet architecture with prerequisites
    -   [x] Create helper sheet registry and loader
    -   [x] Create new FloatingHelperSheet component
    -   [x] Create sample helper sheets for German grammar
    -   [ ] Add more helper sheets for other grammar concepts
    -   [ ] Add helper sheet search functionality
    -   [ ] Add helper sheet tagging and filtering
    -   [ ] Add helper sheet versioning and updates

## Architecture Overview

This section provides a high-level overview of the key components and data flow in the Leap learning platform, focusing on the backend services and content definition.

**Core Concepts:**

*   **Module Concept:** Represents a broad learning topic (e.g., `adjective-declension`, `verb-conjugation`). Identified by a language-agnostic `moduleId`.
*   **Module Definition:** A specific JSON file (e.g., `adjective-declension.json`) containing the actual content, submodules, overrides, and helper resources for one or more *target languages* related to a Module Concept. Contains `supportedTargetLanguages` array.
*   **Submodule:** A specific aspect or rule within a module (e.g., `nach-bestimmte-artikel`). Defined within a Module Definition file.
*   **Modal Schema:** Defines an interaction type/format (e.g., `multiple-choice`, `sentence-error-identify`) including its UI component, generation logic, and marking logic. Defined in separate JSON files.
*   **Session:** Represents a user's learning attempt through a module.
*   **Event:** Represents a single interaction (question presented, answer submitted, marked) within a session.

**Key Services:**

1.  **Registries (`ModuleRegistryService`, `ModalSchemaRegistryService`):**
    *   Responsible for loading and caching Module Definition and Modal Schema JSON files on application startup (or first API request).
    *   `ModuleRegistryService` now stores definitions indexed by both `moduleId` and `targetLanguage`. It provides methods like `getModule(id, targetLanguage)` to retrieve language-specific content and `getUniqueModuleConcepts()` for listing available topics.
    *   Ensures definitions are readily available without repeated file parsing.

2.  **Vocabulary Service (`VocabularyService`):**
    *   Interacts with the PostgreSQL database (`vocabulary_entries` table and related tables like `themes`, `translations`, `word_forms`).
    *   Provides methods to fetch vocabulary items based on criteria (language, POS, theme, CEFR level) via the `get_random_vocabulary` RPC function (which needs its internal logic updated for theme joins).
    *   Designed with a relational, concept-aware model for scalability and language nuance.

3.  **Structure Constraint Service (`StructureConstraintService`):**
    *   Determines *default* grammatical and structural constraints (e.g., number of clauses, required POS counts, inferred theme) for sentence generation based on the submodule and difficulty.
    *   Does *not* directly interact with Vocabulary Service.

4.  **Question Generation Service (`QuestionGenerationService`):**
    *   Orchestrates the generation of a specific question instance.
    *   Receives the specific `ModuleDefinition`, `SubmoduleDefinition`, and `ModalSchemaDefinition` as parameters (avoids internal registry lookups).
    *   Determines constraints (using `StructureConstraintService` or forced overrides).
    *   Fetches required vocabulary (using `VocabularyService`).
    *   Constructs a detailed prompt using the relevant template (from modal schema or submodule override).
    *   Calls the `AIService` to generate structured question data based on the prompt and a specific Zod schema for the modal type.
    *   For `sentence-error-*` modals, it first generates a correct sentence structure and then uses `CorrectIncorrectErrorService` to introduce errors.

5.  **AI Service (`AIService`):**
    *   Handles communication with the external AI provider (Google Gemini).
    *   Uses the Vercel AI SDK (`generateObject`) for abstraction and direct Zod schema validation.
    *   Includes basic retry logic for validation failures.
    *   Removes the need for `zod-schema-converter.ts`.

6.  **Error Generation Service (`CorrectIncorrectErrorService`):**
    *   Specifically for `sentence-error-*` modals.
    *   Takes a correct `SentenceStructure`.
    *   Identifies potential locations for allowed error types.
    *   Uses the `AIService` to generate *plausible* incorrect word forms for specific locations.
    *   Modifies the sentence structure and reconstructs the sentence string with errors.

7.  **Marking Service (`MarkingService`):**
    *   Evaluates a user's answer.
    *   Retrieves the relevant language-specific `ModuleDefinition`, `SubmoduleDefinition`, and `ModalSchemaDefinition` (using `targetLanguage`).
    *   Implements simple, deterministic marking logic for some modal types (e.g., `multiple-choice`, `true-false`).
    *   For complex marking, constructs a prompt using the marking template (from modal schema or override).
    *   Calls the `AIService` to get structured marking results (isCorrect, score, feedback) based on the `AiMarkingResultSchema`.

8.  **Picker Algorithm Service (`PickerAlgorithmService`):**
    *   Decides the *next* `submoduleId` and `modalSchemaId` for the user within a session.
    *   Currently uses a `RandomStrategy` which requires the `targetLanguage` to fetch the correct `ModuleDefinition` before randomly selecting from its submodules and the submodule's supported schemas.
    *   Designed to support other strategies (like Spaced Repetition) in the future.

9.  **Statistics Service (`StatisticsService`):**
    *   Handles interactions with the `user_learning_sessions` and `user_session_events` tables.
    *   Starts/ends sessions, records events (including marking results).
    *   Provides methods to fetch user history and calculate performance statistics (e.g., `getUserModulePerformance`).

10. **Helper Sheet Registry (`HelperSheetRegistry`):**
    *   Manages a collection of helper sheets in the floating library system
    *   Provides methods to register, retrieve, and manage helper sheets
    *   Supports prerequisite relationships between helper sheets
    *   Allows linking helper sheets to specific modules
    *   Implemented as a singleton to ensure consistent state
    *   Helper sheets are stored in JSON files in `src/lib/learning/helper-sheets/definitions/`
    *   Each helper sheet has:
        - Unique ID and title
        - Markdown content
        - Optional prerequisites (other helper sheet IDs)
        - Optional module links
        - Metadata (CEFR level, tags, last updated)

**Helper Sheet System:**

The floating library helper sheet system is a new approach to organizing and presenting help content:

1. **Core Concepts:**
   * **Helper Sheet:** A standalone document containing explanations, tables, and examples
   * **Prerequisites:** Optional links to other helper sheets that should be read first
   * **Module Links:** Optional connections to specific learning modules

2. **Components:**
   * **`FloatingHelperSheet`:** React component for displaying helper sheets
   * **`HelperSheetRegistry`:** Service for managing helper sheets
   * **`loadHelperSheets`:** Function to load helper sheets into registry

3. **Features:**
   * Navigation between related helper sheets
   * Prerequisite tracking and suggestions
   * Module-specific helper sheet recommendations
   * CEFR level and tag-based organization

4. **Benefits:**
   * Decoupled from module structure
   * Reusable across different modules
   * Clear prerequisite relationships
   * Easy to maintain and update

5. **Future Improvements:**
   * Search functionality
   * Tag-based filtering
   * Version control
   * User progress tracking

**API Routes:**

*   `/api/learning/module`: Fetches basic module concept details (submodule list) for the Debug Menu.
*   `/api/learning/session/start`: Initializes registries, starts a session (records in DB), uses Picker to get the first step, uses Generator to create the first question, records the initial event, and returns session/question details.
*   `/api/learning/session/state`: Initializes registries, fetches current session state (including the *first* event's details) from the database to allow resuming/reloading a session page.
*   `/api/learning/session/submit`: Initializes registries, receives user answer, uses Marking Service, records the event, uses Picker to get the next step, uses Generator for the next question, returns marking result and next step/question details.
*   `/api/learning/session/generate` (Debug): Allows forcing generation with specific parameters and constraints via the Debug Menu.
*   `/api/chat`: Handles AI assistant chat requests. ~~enriching the prompt with context (module, submodule, question, stats, languages) before sending to the AI.~~ **Refactored:** Now receives only `sessionId` and fetches all required context (session, latest event, definitions, stats) from DB/registries before constructing the prompt.

**Frontend (`SessionPage`):**

*   Fetches initial session state from `/api/learning/session/state`.
*   Renders the appropriate UI component based on `modalSchemaId` / `uiComponent`.
*   Handles user interaction and calls `/api/learning/session/submit`.
*   Updates state with the next question returned by the submit API.
*   Provides context to the `Chat` component (`useChat` hook), which interacts with `/api/chat`.

**Data Flow (Simplified Submit -> Next Question):**

1.  User submits answer on `SessionPage`.
2.  `SessionPage` POSTs to `/api/learning/session/submit` (with answer, IDs, questionData, languages).
3.  `/submit` API:
    *   Initializes registries.
    *   Calls `MarkingService.markAnswer` (passes languages).
    *   Calls `StatisticsService.recordEvent`.
    *   Calls `PickerAlgorithmService.getNextStep` (passes languages).
    *   Gets specific Module/Submodule/Schema definitions (using languages).
    *   Calls `QuestionGenerationService.generateQuestion` (passes definitions & languages).
    *   Returns { markResult, nextStep, nextQuestionData, nextQuestionDebugInfo }.
4.  `SessionPage` receives response, displays `markResult`, updates state with `nextQuestionData` and other info for the next interaction.

## AI Assistant Context Enhancement

**Goal:** Enhance the AI assistant's context awareness to provide more relevant and contextual help based on the current learning session.

**Phase 1: Context Data Structure**
- [ ] **Define Context Types:** Create TypeScript interfaces for system and message-level context data.
- [ ] **System Context:** Module info, help sheet content, general learning context.
- [ ] **Message Context:** Current submodule, modal type, question data, user stats, vocabulary constraints.

**Phase 2: Context Integration**
- [ ] **Update Chat API Route:** Enhance `/api/chat` to handle separate system and message contexts.
- [ ] **Update useChat Hook:** Modify context passing in `SessionPage` to include both system and message contexts.
- [ ] **Add Debug Logging:** Implement comprehensive logging of context data at each step.

**Phase 3: System Prompt Enhancement**
- [ ] **Update System Prompt:** Modify the system prompt to better utilize the provided context.
- [ ] **Add Context Acknowledgment:** Ensure AI acknowledges current context in responses.
- [ ] **Add Help Sheet Integration:** Enable AI to reference help sheet content when relevant.

**Phase 4: Testing & Refinement**
- [ ] **Test Context Flow:** Verify context is properly passed and utilized at each step.
- [ ] **Test Response Quality:** Ensure AI responses are appropriately contextual.
- [ ] **Refine Logging:** Optimize debug logging for development and production.

*   **Override Mechanism:** Allows tailoring generation/marking prompts per submodule/modal combination. **Improved:** Now uses a hierarchical system (Submodule > Module > Modal Default) to reduce duplication.
*   **AI Service (`AIService`):** Uses Vercel AI SDK. Includes retry logic. No Zod conversion needed.

**Potential Breaking Points & Weaknesses:**

*   **Vocabulary RPC Function (`get_random_vocabulary`):** Theme filtering logic was placeholder. **Fixed:** Updated SQL function with appropriate joins.
*   **Module Registry Initialization & Consistency:** No validation for consistent `title_en`, `supportedSourceLanguages` across language files for the same `moduleId`. **Action:** Implement validation checks (Improvement 6).
*   **Submodule Overrides (Complexity & Repetition):** Mitigated: Hierarchical overrides reduce duplication but add resolution complexity.
*   **Modal Schema Definition (Generation/Marking Coupling):** Still coupled. **Action:** Consider decoupling later (Improvement 3).
*   **Structure Constraint Service (Defaults vs. Overrides):** Defaults hardcoded. **Action:** Consider defining defaults in JSON (Improvement 4).
*   **Content Definition (JSON Verbosity):** Hierarchical overrides help, but large files can still be complex. **Action:** Consider validation tooling (Improvement 6).

**Brainstorming Improvements (Standardization vs. Customization):**

*   **Improvement 1: Vocabulary Service - Query Builder Approach:** Keeps logic in TS, potentially more flexible than complex SQL.
*   **Improvement 2: Hierarchical Overrides / Templates:** **Implemented.** Reduces duplication via Submodule > Module > Modal Default layering.
*   **Improvement 3: Decouple Marking/Generation Config?:** More modular, but more files.
*   **Improvement 4: Constraint Definition in JSON:** Keeps simple defaults with content, but limited expressiveness.
*   **Improvement 5: Abstracted AI Service (Vercel AI SDK?):** Implemented. Provides abstraction.
*   **Improvement 6: Content Validation & Tooling:** **Implemented Zod Schemas.** Add Zod schemas for definitions. **Action:** Create/run validation script manually.