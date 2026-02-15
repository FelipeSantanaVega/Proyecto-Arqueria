-- DB hardening for archery_training
-- Run once on existing environments.

USE archery_training;

ALTER TABLE users
  ADD KEY idx_users_active_role (is_active, role),
  ADD KEY idx_users_lang (preferred_lang),
  ADD CONSTRAINT chk_users_preferred_lang CHECK (preferred_lang IN ('es','en'));

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercises_arrows_positive CHECK (arrows_count > 0),
  ADD CONSTRAINT chk_exercises_distance_positive CHECK (distance_m > 0);

ALTER TABLE students
  ADD KEY idx_students_active_name (is_active, full_name),
  ADD CONSTRAINT chk_students_document_not_empty CHECK (CHAR_LENGTH(TRIM(document_number)) > 0),
  ADD CONSTRAINT chk_students_bow_positive CHECK (bow_pounds IS NULL OR bow_pounds > 0);

ALTER TABLE routines
  ADD UNIQUE KEY uq_routines_name (name);

ALTER TABLE routine_days
  ADD CONSTRAINT chk_routine_days_number_range CHECK (day_number BETWEEN 1 AND 7);

ALTER TABLE routine_day_exercises
  ADD CONSTRAINT chk_day_exercises_arrows_override_positive CHECK (arrows_override IS NULL OR arrows_override > 0),
  ADD CONSTRAINT chk_day_exercises_distance_override_positive CHECK (distance_override_m IS NULL OR distance_override_m > 0);

ALTER TABLE student_routine_assignments
  ADD KEY idx_assignments_student_status (student_id, status),
  ADD CONSTRAINT chk_assignments_date_range CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  );
