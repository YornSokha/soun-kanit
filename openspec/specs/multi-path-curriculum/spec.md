# multi-path-curriculum Specification

## Purpose
Organize Khmer math lessons across multiple unrestricted learning paths spanning Grades 1–5 (Early Foundations, Geometry, and Fractions & Decimals) without rigid grade locking.

## Requirements

### Requirement: Unrestricted Multi-Path Navigation
The system SHALL present Early Foundations, Geometry, and Fractions & Decimals paths on `/learn` and allow any learner to open any lesson regardless of advisory grade level.

#### Scenario: Learner switches to Geometry or Fractions path freely
- **GIVEN** a learner registered with advisory Grade 1 on `/learn`
- **WHEN** the learner selects the Geometry or Fractions & Decimals path tab
- **THEN** all lessons in the selected path appear unlocked and open directly in `<LessonPlayer />`

### Requirement: Four Unrestricted Learning Paths
The system SHALL organize 22 Khmer lessons across four unrestricted paths—Early Foundations, Geometry, Fractions & Decimals, and Multiplication, Division & Algebra—each with pre-generated local Khmer MP3 prompt audio.

#### Scenario: Learner opens Multiplication and Algebra path freely
- **GIVEN** a learner on `/learn`
- **WHEN** the learner selects the Multiplication, Division & Algebra path tab
- **THEN** all four lessons (`m01`–`m04`) appear unlocked and render cleanly in `<LessonPlayer />`

### Requirement: Persistent Khmer App Navigation Menu
The system SHALL render a persistent, WCAG 2.2 AA Khmer navigation menu across primary hub routes (`/`, `/learn`, `/play`, `/garden`, `/daily`, `/review`, `/parent`, `/admin`) providing one-tap access to Learning Paths, Play Studio, Living Garden, Daily Puzzle, and an expandable More Menu (Review, Parent Dashboard, Admin Studio, Home) while auto-hiding during active lesson steps (`/learn/[lessonId]`) and `/onboarding`.

#### Scenario: Child navigates between hubs using the global menu on 360x800 mobile
- **GIVEN** a learner viewing `/learn` on a 360x800 mobile viewport
- **WHEN** the learner taps the Play Studio tab, the Living Garden tab, and opens the expandable More Menu to visit `/review`
- **THEN** each destination loads cleanly with active `aria-current="page"` styling and zero WCAG 2.2 AA violations
- **AND** opening `/learn/g06-rectangles-and-area-design` hides the global bottom menu so active manipulatives stay distraction-free

### Requirement: Interactive Lesson Filtering And Expanded 28-Lesson Library
The system SHALL organize at least 28 schema-validated interactive Khmer lessons across 4 unrestricted learning paths, including hands-on drawing, Angkor symmetry, Cambodian market Riel, visual fractions, and skip-counting algebra lessons, with a topic/drawing filter menu on `/learn`.

#### Scenario: Learner filters for drawing lessons and launches Lesson g06
- **GIVEN** a learner on `/learn` viewing the Geometry path
- **WHEN** the learner selects the interactive drawing filter and opens `g06-rectangles-and-area-design`
- **THEN** the lesson renders dynamically via `<ActivityRenderer />` with `>= 56x56 px` targets and native Khmer audio
