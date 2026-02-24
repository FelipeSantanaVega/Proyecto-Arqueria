import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppData } from "./AppDataContext";

type ExerciseLite = {
  id: number;
  name: string;
  arrows_count: number;
  distance_m: number;
  description?: string;
};

type StudentLite = {
  id: number;
  full_name: string;
  document_number: string;
  contact?: string | null;
};

type ProfessorListsContextValue = {
  exerciseSearch: string;
  setExerciseSearch: (value: string) => void;
  filteredExercises: ExerciseLite[];
  visibleExercises: ExerciseLite[];
  showMoreExercises: () => void;
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  filteredActiveStudents: StudentLite[];
  visibleActiveStudents: StudentLite[];
  showMoreActiveStudents: () => void;
  filteredInactiveStudents: StudentLite[];
  visibleInactiveStudents: StudentLite[];
  showMoreInactiveStudents: () => void;
};

const ProfessorListsContext = createContext<ProfessorListsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

const PAGE_SIZE = 30;

export function ProfessorListsProvider({ children }: Props) {
  const { exercises, students } = useAppData();
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [exerciseVisibleCount, setExerciseVisibleCount] = useState(PAGE_SIZE);
  const [activeStudentsVisibleCount, setActiveStudentsVisibleCount] = useState(PAGE_SIZE);
  const [inactiveStudentsVisibleCount, setInactiveStudentsVisibleCount] = useState(PAGE_SIZE);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.full_name.localeCompare(b.full_name, "es")),
    [students],
  );
  const activeStudents = useMemo(
    () => sortedStudents.filter((s) => s.is_active),
    [sortedStudents],
  );
  const inactiveStudents = useMemo(
    () => sortedStudents.filter((s) => !s.is_active),
    [sortedStudents],
  );

  const filteredExercises = useMemo(() => {
    const term = exerciseSearch.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((ex) => {
      const byName = ex.name.toLowerCase().includes(term);
      const byDescription = (ex.description || "").toLowerCase().includes(term);
      const byArrows = String(ex.arrows_count).includes(term);
      const byDistance = String(ex.distance_m).includes(term);
      return byName || byDescription || byArrows || byDistance;
    });
  }, [exercises, exerciseSearch]);

  const filteredActiveStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return activeStudents;
    return activeStudents.filter((s) => {
      const byName = s.full_name.toLowerCase().includes(term);
      const byDoc = s.document_number.toLowerCase().includes(term);
      const byContact = (s.contact || "").toLowerCase().includes(term);
      return byName || byDoc || byContact;
    });
  }, [activeStudents, studentSearch]);

  const filteredInactiveStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return inactiveStudents;
    return inactiveStudents.filter((s) => {
      const byName = s.full_name.toLowerCase().includes(term);
      const byDoc = s.document_number.toLowerCase().includes(term);
      const byContact = (s.contact || "").toLowerCase().includes(term);
      return byName || byDoc || byContact;
    });
  }, [inactiveStudents, studentSearch]);

  useEffect(() => {
    setExerciseVisibleCount(PAGE_SIZE);
  }, [exerciseSearch]);

  useEffect(() => {
    setActiveStudentsVisibleCount(PAGE_SIZE);
    setInactiveStudentsVisibleCount(PAGE_SIZE);
  }, [studentSearch]);

  const value = useMemo<ProfessorListsContextValue>(() => ({
    exerciseSearch,
    setExerciseSearch,
    filteredExercises,
    visibleExercises: filteredExercises.slice(0, exerciseVisibleCount),
    showMoreExercises: () => setExerciseVisibleCount((prev) => prev + PAGE_SIZE),
    studentSearch,
    setStudentSearch,
    filteredActiveStudents,
    visibleActiveStudents: filteredActiveStudents.slice(0, activeStudentsVisibleCount),
    showMoreActiveStudents: () => setActiveStudentsVisibleCount((prev) => prev + PAGE_SIZE),
    filteredInactiveStudents,
    visibleInactiveStudents: filteredInactiveStudents.slice(0, inactiveStudentsVisibleCount),
    showMoreInactiveStudents: () => setInactiveStudentsVisibleCount((prev) => prev + PAGE_SIZE),
  }), [
    exerciseSearch,
    filteredExercises,
    exerciseVisibleCount,
    studentSearch,
    filteredActiveStudents,
    activeStudentsVisibleCount,
    filteredInactiveStudents,
    inactiveStudentsVisibleCount,
  ]);

  return <ProfessorListsContext.Provider value={value}>{children}</ProfessorListsContext.Provider>;
}

export function useProfessorLists() {
  const ctx = useContext(ProfessorListsContext);
  if (!ctx) throw new Error("useProfessorLists must be used inside ProfessorListsProvider");
  return ctx;
}
