# activity-engine-primitives Specification

## Purpose
Render interactive mathematical manipulatives from decoupled JSON definitions while meeting child motor accessibility and WCAG 2.2 Level AA standards.

## Requirements

### Requirement: Decoupled JSON Activity Rendering
The system SHALL render any schema-valid lesson JSON file using registered reusable activity components without requiring custom per-lesson frontend code.

#### Scenario: Invalid lesson JSON fails fast at validation
- **GIVEN** a lesson JSON payload missing a required hint tier or containing an unknown activity `type`
- **WHEN** content validation runs during build or load
- **THEN** schema validation rejects the payload with the exact field path error
- **AND** the lesson is blocked from publishing

### Requirement: Dual Drag And Tap-To-Place Input
The system SHALL allow every drag-based mathematical manipulative to be completed interchangeably via pointer dragging or single-pointer tap-to-select and tap-to-place.

#### Scenario: Child moves mango into ten-frame via taps only
- **GIVEN** a `counting-stage` ten-frame activity with 8 items inside and 5 items outside
- **WHEN** the learner taps an outside item (without dragging) and then taps an empty slot in the ten-frame
- **THEN** the item moves smoothly into the selected slot and updates the active count
- **AND** the action works identically on touchscreens, trackpads, and mice

### Requirement: Touch Target Size And Focus Visibility
The system SHALL size interactive manipulative tokens to at least 56x56 CSS pixels, secondary controls to at least 44x44 CSS pixels, and keep keyboard-focused controls unobscured by sticky headers.

#### Scenario: Mobile viewport meets child touch standards
- **GIVEN** a 360x800 mobile viewport running an interactive lesson
- **WHEN** automated accessibility and layout checks inspect all interactive tokens and navigation controls
- **THEN** every manipulative target measures at least 56x56 CSS pixels
- **AND** zero WCAG 2.2 Level AA violations are reported by axe-core (`wcag22aa`)

### Requirement: Eight Reusable Interactive Primitives
The system SHALL support eight schema-validated interactive primitives (`counting-stage`, `number-line`, `place-value-blocks`, `scenario-choice`, `comparison-balance`, `array-groups`, `fraction-bar-shape`, and `pattern-sequence`) rendered dynamically from lesson JSON without `<foreignObject>`.

#### Scenario: Learner compares quantities with comparison-balance
- **GIVEN** a `comparison-balance` step comparing 7 oranges against 4 oranges
- **WHEN** the learner taps the `>` operator tile and submits
- **THEN** the grader accepts the answer and displays the Khmer visual explanation
- **AND** selecting `<` or `=` provides non-punitive Khmer discrepancy feedback

#### Scenario: Learner builds equivalent fraction on fraction-bar-shape
- **GIVEN** a `fraction-bar-shape` step expecting a fraction equivalent to `1/2`
- **WHEN** the learner partitions the bar into 4 equal parts and shades 2 parts (`2/4`)
- **THEN** the grader evaluates reduced rational equivalence (`2/4 === 1/2`) and grades the answer as correct

#### Scenario: Learner completes krama pattern via tap-to-place
- **GIVEN** a `pattern-sequence` step with missing slots in a repeating krama sequence
- **WHEN** the learner taps a palette tile and taps an empty sequence slot (without dragging)
- **THEN** the tile snaps into the slot and the grader verifies ordered slot equality

### Requirement: Geometry Drawing Primitive
The system SHALL support a `geometry-draw` interactive SVG primitive (without `<foreignObject>`) enabling children to draw polygons on a pegboard (`dot-connect`), paint mirror symmetry (`symmetry-mirror`), and paint target-area figures (`area-paint`) via tap or drag with `>= 56x56 px` targets.

#### Scenario: Child draws a triangle by tapping pegboard dots
- **GIVEN** a `geometry-draw` `dot-connect` step expecting a triangle
- **WHEN** the child taps 3 non-collinear pegs in sequence and closes the loop back to the first peg
- **THEN** the SVG renders the closed filled triangle and `gradeStep()` grades the drawing as correct

#### Scenario: Child completes a mirror-symmetry drawing
- **GIVEN** a `geometry-draw` `symmetry-mirror` step with pre-painted left-half cells
- **WHEN** the child taps the exact mirrored right-half cells across the vertical symmetry axis
- **THEN** `gradeStep()` confirms exact mirror reflection and displays the Khmer explanation
