# interactive-lesson-player Specification

## Purpose
Deliver a calm, distraction-free guided interactive lesson loop with immediate diagnostic feedback and anti-gaming progressive hints.

## Requirements

### Requirement: Guided Lesson Step Progression
The system SHALL execute each lesson sequentially through its declared JSON steps without countdown timers, advancing only after the learner completes or resolves the active step.

#### Scenario: Completing an active step unlocks continuation
- **GIVEN** a learner on step 1 of a multi-step lesson
- **WHEN** the learner submits a valid answer
- **THEN** the system displays a concise Khmer affirmation and visual explanation
- **AND** enables the "បន្តទៅមុខ" (Continue) control to advance to step 2
- **AND** no countdown timer or punitive failure banner is displayed

### Requirement: Progressive Three-Tier Hint Reveal
The system SHALL reveal up to three escalating Khmer hints per problem step—visual cue, strategy nudge, and worked step—while gating full reveal behind an initial attempt or explicit request.

#### Scenario: Learner struggles and requests tiered hints
- **GIVEN** an active problem step with 3 defined hint tiers
- **WHEN** the learner submits an incorrect attempt
- **THEN** the system provides non-punitive visual discrepancy feedback and highlights the "សុំជំនួយ" (Ask for hint) button
- **WHEN** the learner activates "សុំជំនួយ" once
- **THEN** Tier 1 (visual cue) displays without revealing the final answer
- **WHEN** the learner activates "សុំជំនួយ" a second and third time
- **THEN** Tier 2 (strategy nudge) and Tier 3 (worked step) display sequentially

### Requirement: Khmer Audio Prompt Read-Aloud
The system SHALL provide an accessible one-tap Khmer read-aloud control for lesson prompts and a persistent audio preference toggle so emergent readers can listen to prompts without reading fatigue.

#### Scenario: Learner activates prompt read-aloud and toggles audio preference
- **GIVEN** an active lesson step on a mobile viewport
- **WHEN** the learner taps the Khmer read-aloud button on the step prompt
- **THEN** the system plays recorded step audio if present or uses Khmer speech synthesis fallback without runtime error
- **WHEN** the learner toggles the persistent audio preference control
- **THEN** the updated `audioEnabled` preference persists locally across reloads

### Requirement: Spoken Hints, Lesson Scratchpad, And Printable Khmer Certificate
The system SHALL provide spoken Khmer read-aloud buttons on revealed hints and explanations, a toggleable on-screen doodle scratchpad inside `<LessonPlayer />` that preserves active step state, and an offline print-ready Khmer Achievement Certificate accessible from `/parent` and `/garden`.

#### Scenario: Child opens scratchpad and hears spoken hint during a lesson
- **GIVEN** a learner solving a lesson step on a 360x800 viewport
- **WHEN** the learner toggles the scratchpad open, draws or taps tallies, and reveals a hint
- **THEN** the active step state remains intact, the hint displays a spoken Khmer read-aloud button, and zero WCAG 2.2 AA violations occur

#### Scenario: Parent previews printable Khmer Achievement Certificate
- **GIVEN** a parent or learner viewing `/garden` or unlocked `/parent`
- **WHEN** they open the Achievement Certificate preview
- **THEN** the Khmer certificate renders the child's name, mastered stats, and print action with zero WCAG 2.2 AA violations

### Requirement: Responsive Mobile Lesson Header
The system SHALL render the sticky lesson header at 360px mobile width without cramping, overlapping, or clipping the exit control, step progress indicator, audio toggle, or numeral toggle, while providing immediate visual press feedback on all lesson action buttons.

#### Scenario: Lesson header stays legible and non-overflowing on 360px phones
- **GIVEN** a learner opening any lesson on a 360x800 mobile viewport
- **WHEN** the lesson header renders with Khmer numerals and both audio and numeral toggles active
- **THEN** the exit button, step counter, progress bar, audio toggle, and numeral toggle all remain fully visible with zero overlap and zero horizontal page overflow
- **AND** toggling audio off or switching numeral script does not push header controls outside the viewport

#### Scenario: Lesson view adapts to dynamic mobile viewport height
- **GIVEN** a mobile phone browser whose address bar shows and hides during vertical scrolling
- **WHEN** the learner scrolls through a lesson step and taps primary check, hint, or continue controls
- **THEN** primary actions remain reachable above the device bottom safe area with immediate pressed visual feedback and zero WCAG 2.2 AA violations

### Requirement: Mobile Gesture-Safe Audio Playback
The system SHALL unlock mobile browser audio playback synchronously inside the user tap gesture before fetching dynamic Khmer speech audio or playing feedback chimes so read-aloud prompts and chimes play reliably on iOS Safari and Android Chrome.

#### Scenario: First tap on read-aloud plays Khmer speech on mobile browser
- **GIVEN** a learner opening a lesson on a mobile phone browser with audio enabled and no prior audio playback in the session
- **WHEN** the learner taps the prompt, hint, or explanation read-aloud button
- **THEN** playback succeeds without being rejected by mobile autoplay restrictions
- **AND** tapping the button again while speaking stops playback immediately without leaving the button stuck in a speaking state
