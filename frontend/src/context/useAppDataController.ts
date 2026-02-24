import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export type Health = {
  status: string;
  env: string;
};

export type Exercise = {
  id: number;
  name: string;
  arrows_count: number;
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

export function useAppDataController(token: string | null) {
  const [health, setHealth] = useState<Health | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [healthData, exercisesData, routinesData] = await Promise.all([
          apiFetch<Health>("/health"),
          apiFetch<Exercise[]>("/exercises"),
          apiFetch<Routine[]>("/routines"),
        ]);
        setHealth(healthData);
        setExercises(exercisesData);
        setRoutines(routinesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      try {
        const data = await apiFetch<Student[]>("/students", { token });
        setStudents(data);
      } catch {
        // silencioso para no bloquear otras vistas
      }
    };
    if (token && students.length === 0) {
      fetchStudents();
    }
  }, [token, students.length]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!token) return;
      try {
        const data = await apiFetch<Assignment[]>("/assignments", { token });
        setAssignments(data);
      } catch {
        // silencioso para no bloquear otras vistas
      }
    };
    if (token) {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [token]);

  return {
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
  };
}

