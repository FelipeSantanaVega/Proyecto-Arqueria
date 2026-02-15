-- =========================================
-- DB: archery_training
-- MariaDB - InnoDB + utf8mb4 (compatibilidad es/en)
-- =========================================

CREATE DATABASE IF NOT EXISTS archery_training
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE archery_training;

-- -----------------------------------------
-- Users (por ahora solo admin; futuro: roles alumno/profesor)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt/argon2 generado desde el backend
  role ENUM('admin','professor','student') NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  preferred_lang CHAR(2) NOT NULL DEFAULT 'es', -- futuro i18n (es/en)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_active_role (is_active, role),
  KEY idx_users_lang (preferred_lang),
  CONSTRAINT chk_users_preferred_lang CHECK (preferred_lang IN ('es', 'en'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Exercises
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  arrows_count INT UNSIGNED NOT NULL,           -- cantidad de flechas a tirar
  distance_m DECIMAL(6,2) UNSIGNED NOT NULL,    -- distancia en metros (18.00, 70.00, etc.)
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exercises_active (is_active),
  KEY idx_exercises_name (name),
  CONSTRAINT chk_exercises_arrows_positive CHECK (arrows_count >= 0),
  CONSTRAINT chk_exercises_distance_positive CHECK (distance_m >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Students
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  contact VARCHAR(255) NULL,                   -- tel/email/nota libre
  bow_pounds DECIMAL(6,2) UNSIGNED NULL,       -- libras del arco
  arrows_available INT UNSIGNED NULL,          -- flechas disponibles
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  inactive_since DATETIME NULL,                -- fecha desde la que quedó inactivo (auto purge a 30 días)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_document (document_number),
  KEY idx_students_active (is_active),
  KEY idx_students_name (full_name),
  KEY idx_students_active_name (is_active, full_name),
  KEY idx_students_inactive_since (is_active, inactive_since),
  CONSTRAINT chk_students_document_not_empty CHECK (CHAR_LENGTH(TRIM(document_number)) > 0),
  CONSTRAINT chk_students_bow_positive CHECK (bow_pounds IS NULL OR bow_pounds > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Routines (plantillas de rutinas)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS routines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_template TINYINT(1) NOT NULL DEFAULT 1, -- 1=plantilla permanente, 0=rutina temporal para asignación
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_routines_name (name),
  KEY idx_routines_active (is_active),
  KEY idx_routines_name (name),
  KEY idx_routines_template_active (is_template, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Routine days (días dentro de una rutina semanal)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS routine_days (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  routine_id BIGINT UNSIGNED NOT NULL,
  day_number TINYINT UNSIGNED NOT NULL, -- 1=lunes (o día 1), permite 1-7 (incluso 1-14 si se extiende)
  name VARCHAR(100) NULL,               -- Ej: "Día 1", "Lunes"
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_routine_days_routine
    FOREIGN KEY (routine_id) REFERENCES routines(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE KEY uq_routine_day (routine_id, day_number),
  KEY idx_routine_days_routine (routine_id),
  CONSTRAINT chk_routine_days_number_range CHECK (day_number BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Routine day exercises (ejercicios por día dentro de la rutina)
-- Permite overrides por día para flechas/distancia.
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS routine_day_exercises (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  routine_day_id BIGINT UNSIGNED NOT NULL,
  exercise_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  arrows_override INT UNSIGNED NULL,
  distance_override_m DECIMAL(6,2) UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_day_exercises_day
    FOREIGN KEY (routine_day_id) REFERENCES routine_days(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_day_exercises_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  UNIQUE KEY uq_day_sort (routine_day_id, sort_order),
  KEY idx_day_exercises_day (routine_day_id),
  KEY idx_day_exercises_exercise (exercise_id),
  CONSTRAINT chk_day_exercises_arrows_override_positive CHECK (
    arrows_override IS NULL OR arrows_override >= 0
  ),
  CONSTRAINT chk_day_exercises_distance_override_positive CHECK (
    distance_override_m IS NULL OR distance_override_m >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Student routine assignments (asignación de rutinas a alumnos)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS student_routine_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  routine_id BIGINT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('active','paused','finished') NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_assignment_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_assignment_routine
    FOREIGN KEY (routine_id) REFERENCES routines(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  KEY idx_assignments_student (student_id),
  KEY idx_assignments_status (status),
  KEY idx_assignments_routine (routine_id),
  KEY idx_assignments_student_status (student_id, status),
  CONSTRAINT chk_assignments_date_range CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------
-- Admin inicial (opcional)
-- Reemplazar <HASH_AQUI> por un hash real (bcrypt/argon2) generado en Python.
-- -----------------------------------------
-- INSERT INTO users (username, password_hash) VALUES ('admin', '<HASH_AQUI>');

-- Ejemplo de alumno
-- INSERT INTO students (full_name, document_number, contact, bow_pounds, arrows_available)
-- VALUES ('Ricardo Santana', '40211888', 'ricardito.s@example.com', 50.00, 15);
