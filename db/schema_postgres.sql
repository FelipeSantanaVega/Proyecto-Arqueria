-- =========================================
-- DB: archery_training (PostgreSQL)
-- Compatible con Render Postgres
-- =========================================

-- Crear DB manualmente en Render (ya viene creada). Solo ejecutar este script en esa DB.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','professor','student')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_lang CHAR(2) NOT NULL DEFAULT 'es' CHECK (preferred_lang IN ('es','en')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users (is_active, role);
CREATE INDEX IF NOT EXISTS idx_users_lang ON users (preferred_lang);

CREATE TABLE IF NOT EXISTS exercises (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  arrows_count INTEGER NOT NULL CHECK (arrows_count >= 0),
  rounds INTEGER NOT NULL DEFAULT 1 CHECK (rounds > 0),
  arrows_per_round INTEGER NOT NULL DEFAULT 0 CHECK (arrows_per_round >= 0),
  distance_m NUMERIC(6,2) NOT NULL CHECK (distance_m >= 0),
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises (is_active);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises (name);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  document_number VARCHAR(50) NOT NULL UNIQUE,
  contact VARCHAR(255) NULL,
  bow_pounds NUMERIC(6,2) NULL CHECK (bow_pounds IS NULL OR bow_pounds > 0),
  arrows_available INTEGER NULL CHECK (arrows_available IS NULL OR arrows_available >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  inactive_since TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_students_active ON students (is_active);
CREATE INDEX IF NOT EXISTS idx_students_name ON students (full_name);
CREATE INDEX IF NOT EXISTS idx_students_active_name ON students (is_active, full_name);
CREATE INDEX IF NOT EXISTS idx_students_inactive_since ON students (is_active, inactive_since);

CREATE TABLE IF NOT EXISTS routines (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_template BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_routines_active ON routines (is_active);
CREATE INDEX IF NOT EXISTS idx_routines_name ON routines (name);
CREATE INDEX IF NOT EXISTS idx_routines_template_active ON routines (is_template, is_active);

CREATE TABLE IF NOT EXISTS routine_days (
  id BIGSERIAL PRIMARY KEY,
  routine_id BIGINT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  name VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_routine_day UNIQUE (routine_id, day_number)
);
CREATE INDEX IF NOT EXISTS idx_routine_days_routine ON routine_days (routine_id);

CREATE TABLE IF NOT EXISTS routine_day_exercises (
  id BIGSERIAL PRIMARY KEY,
  routine_day_id BIGINT NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  exercise_id BIGINT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  arrows_override INTEGER NULL CHECK (arrows_override IS NULL OR arrows_override >= 0),
  distance_override_m NUMERIC(6,2) NULL CHECK (distance_override_m IS NULL OR distance_override_m >= 0),
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_day_sort UNIQUE (routine_day_id, sort_order)
);
CREATE INDEX IF NOT EXISTS idx_day_exercises_day ON routine_day_exercises (routine_day_id);
CREATE INDEX IF NOT EXISTS idx_day_exercises_exercise ON routine_day_exercises (exercise_id);

CREATE TABLE IF NOT EXISTS student_routine_assignments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  routine_id BIGINT NOT NULL REFERENCES routines(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','finished')),
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_assignments_date_range CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON student_routine_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON student_routine_assignments (status);
CREATE INDEX IF NOT EXISTS idx_assignments_routine ON student_routine_assignments (routine_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_status ON student_routine_assignments (student_id, status);

CREATE TABLE IF NOT EXISTS student_routine_history (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NULL UNIQUE,
  student_id BIGINT NOT NULL,
  student_full_name VARCHAR(150) NOT NULL,
  routine_id BIGINT NULL,
  routine_name VARCHAR(120) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  objective VARCHAR(255) NOT NULL DEFAULT 'Determinante',
  professor_notes TEXT NULL,
  student_observations TEXT NULL,
  weekly_total_arrows INTEGER NOT NULL DEFAULT 0,
  snapshot_json TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_history_student_completed ON student_routine_history (student_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_history_completed ON student_routine_history (completed_at);
