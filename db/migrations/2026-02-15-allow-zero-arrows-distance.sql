-- Permitir valores 0 en flechas y distancia (ejercicios y overrides por día)
USE archery_training;

ALTER TABLE exercises
  DROP CONSTRAINT chk_exercises_arrows_positive,
  DROP CONSTRAINT chk_exercises_distance_positive,
  ADD CONSTRAINT chk_exercises_arrows_positive CHECK (arrows_count >= 0),
  ADD CONSTRAINT chk_exercises_distance_positive CHECK (distance_m >= 0);

ALTER TABLE routine_day_exercises
  DROP CONSTRAINT chk_day_exercises_arrows_override_positive,
  DROP CONSTRAINT chk_day_exercises_distance_override_positive,
  ADD CONSTRAINT chk_day_exercises_arrows_override_positive CHECK (arrows_override IS NULL OR arrows_override >= 0),
  ADD CONSTRAINT chk_day_exercises_distance_override_positive CHECK (distance_override_m IS NULL OR distance_override_m >= 0);
