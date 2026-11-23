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
