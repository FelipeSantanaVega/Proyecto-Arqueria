import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

export type Health = {
  status: string;
  env: string;
};

export type Exercise = {
  id: number;
  name: string;
  arrows_count: number;
  rounds?: number;
  arrows_per_round?: number;
  distance_m: number;
  description?: string;
  is_active: boolean;
};

export type RoutineDayExercise = {
  id: number;
  exercise_id: number;
  sort_order: number;
  arrows_override?: number | null;
  distance_override_m?: number | null;
  notes?: string | null;
};

export type RoutineDay = {
  id: number;
  day_number: number;
  name?: string | null;
  notes?: string | null;
  exercises: RoutineDayExercise[];
};

export type Routine = {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  is_template?: boolean;
  days: RoutineDay[];
};

export type Student = {
  id: number;
  full_name: string;
  document_number: string;
  contact?: string | null;
  bow_pounds?: number | null;
  arrows_available?: number | null;
  is_active: boolean;
};

export type Assignment = {
  id: number;
  student_id: number;
  routine_id: number;
  assigned_at: string;
  start_date?: string | null;
  end_date?: string | null;
  status: "active" | "paused" | "finished";
  notes?: string | null;
};

export function useAppDataController(
  token: string | null,
  options?: {
    view?: "dashboard" | "login" | "professor";
    activeSection?: "administrar_rutinas" | "perfil" | "rutina" | "ejercicio" | "alumno" | null;
  },
) {
  const [health, setHealth] = useState<Health | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [exercisesLoaded, setExercisesLoaded] = useState(false);
  const [routinesLoaded, setRoutinesLoaded] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureHealthLoaded = useCallback(async () => {
    if (healthLoaded || healthLoading) return;
    setHealthLoading(true);
    try {
      const healthData = await apiFetch<Health>("/health");
      setHealth(healthData);
      setHealthLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setHealthLoading(false);
    }
  }, [healthLoaded, healthLoading]);

  const ensureExercisesLoaded = useCallback(async () => {
    if (exercisesLoaded || exercisesLoading) return;
    setExercisesLoading(true);
    try {
      const data = await apiFetch<Exercise[]>("/exercises");
      setExercises(data);
      setExercisesLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setExercisesLoading(false);
    }
  }, [exercisesLoaded, exercisesLoading]);

  const ensureRoutinesLoaded = useCallback(async () => {
    if (routinesLoaded || routinesLoading) return;
    setRoutinesLoading(true);
    try {
      const data = await apiFetch<Routine[]>("/routines");
      setRoutines(data);
      setRoutinesLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setRoutinesLoading(false);
    }
  }, [routinesLoaded, routinesLoading]);

  const ensureStudentsLoaded = useCallback(async () => {
    if (!token || studentsLoaded || studentsLoading) return;
    setStudentsLoading(true);
    try {
      const data = await apiFetch<Student[]>("/students", { token });
      setStudents(data);
      setStudentsLoaded(true);
    } catch {
      // silencioso para no bloquear otras vistas
    } finally {
      setStudentsLoading(false);
    }
  }, [token, studentsLoaded, studentsLoading]);

  const ensureAssignmentsLoaded = useCallback(async () => {
    if (!token || assignmentsLoaded || assignmentsLoading) return;
    setAssignmentsLoading(true);
    try {
      const data = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(data);
      setAssignmentsLoaded(true);
    } catch {
      // silencioso para no bloquear otras vistas
    } finally {
      setAssignmentsLoading(false);
    }
  }, [token, assignmentsLoaded, assignmentsLoading]);

  useEffect(() => {
    if (!token) {
      setAssignments([]);
      setStudents([]);
      setAssignmentsLoaded(false);
      setStudentsLoaded(false);
    }
  }, [token]);

  useEffect(() => {
    const view = options?.view;
    const activeSection = options?.activeSection;

    if (view === "dashboard") {
      void ensureHealthLoaded();
      void ensureExercisesLoaded();
      void ensureRoutinesLoaded();
      if (token) {
        void ensureStudentsLoaded();
        void ensureAssignmentsLoaded();
      }
      return;
    }

    if (view !== "professor") return;

    if (activeSection === "ejercicio") {
      void ensureExercisesLoaded();
    } else if (activeSection === "rutina") {
      void ensureExercisesLoaded();
      void ensureRoutinesLoaded();
    } else if (activeSection === "alumno") {
      void ensureStudentsLoaded();
    } else if (activeSection === "administrar_rutinas") {
      void ensureAssignmentsLoaded();
      void ensureStudentsLoaded();
      void ensureRoutinesLoaded();
      void ensureExercisesLoaded();
    }
  }, [
    token,
    options?.view,
    options?.activeSection,
    ensureHealthLoaded,
    ensureExercisesLoaded,
    ensureRoutinesLoaded,
    ensureStudentsLoaded,
    ensureAssignmentsLoaded,
  ]);

  const loading = useMemo(() => {
    const view = options?.view;
    const activeSection = options?.activeSection;
    if (view === "dashboard") {
      return healthLoading || exercisesLoading || routinesLoading || studentsLoading || assignmentsLoading;
    }
    if (view !== "professor") return false;
    if (activeSection === "ejercicio") return exercisesLoading;
    if (activeSection === "rutina") return exercisesLoading || routinesLoading;
    if (activeSection === "alumno") return studentsLoading;
    if (activeSection === "administrar_rutinas") return exercisesLoading || routinesLoading || studentsLoading || assignmentsLoading;
    return false;
  }, [
    options?.view,
    options?.activeSection,
    healthLoading,
    exercisesLoading,
    routinesLoading,
    studentsLoading,
    assignmentsLoading,
  ]);
  const setLoading = () => {};

  return useMemo(() => ({
    health,
    setHealth,
    exercises,
    setExercises,
    routines,
    setRoutines,
    students,
    setStudents,
    assignments,
    setAssignments,
    loading,
    setLoading,
    error,
    setError,
    ensureHealthLoaded,
    ensureExercisesLoaded,
    ensureRoutinesLoaded,
    ensureStudentsLoaded,
    ensureAssignmentsLoaded,
  }), [
    health,
    exercises,
    routines,
    students,
    assignments,
    loading,
    error,
    ensureHealthLoaded,
    ensureExercisesLoaded,
    ensureRoutinesLoaded,
    ensureStudentsLoaded,
    ensureAssignmentsLoaded,
  ]);
}
