import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircleIcon, SearchIcon, WarningIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import bowIconUrl from "./assets/bow.svg";
import archeryImg from "./assets/Arqueros Andinos logo upscaled.png";
import userPlusIconUrl from "./assets/user-plus.svg";
import editIconUrl from "./assets/edit.svg";
import notebookTabsIconUrl from "./assets/notebook-tabs.svg";
import lunesIconUrl from "./assets/dias-semana-svg/lunes.svg";
import lunesFilledIconUrl from "./assets/dias-semana-svg/lunes-filled.svg";
import martesIconUrl from "./assets/dias-semana-svg/martes.svg";
import martesFilledIconUrl from "./assets/dias-semana-svg/martes-filled.svg";
import miercolesIconUrl from "./assets/dias-semana-svg/miercoles.svg";
import miercolesFilledIconUrl from "./assets/dias-semana-svg/miercoles-filled.svg";
import juevesIconUrl from "./assets/dias-semana-svg/jueves.svg";
import juevesFilledIconUrl from "./assets/dias-semana-svg/jueves-filled.svg";
import viernesIconUrl from "./assets/dias-semana-svg/viernes.svg";
import viernesFilledIconUrl from "./assets/dias-semana-svg/viernes-filled.svg";
import sabadoIconUrl from "./assets/dias-semana-svg/sabado.svg";
import sabadoFilledIconUrl from "./assets/dias-semana-svg/sabado-filled.svg";
import domingoIconUrl from "./assets/dias-semana-svg/domingo.svg";
import domingoFilledIconUrl from "./assets/dias-semana-svg/domingo-filled.svg";
import { apiFetch, API_BASE } from "./api";

const routineDaySlide = keyframes`
  from {
    opacity: 0;
    transform: translateX(36px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const routineStepSlide = keyframes`
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

type Health = {
  status: string;
  env: string;
};

type Exercise = {
  id: number;
  name: string;
  arrows_count: number;
  distance_m: number;
  description?: string;
  is_active: boolean;
};

type RoutineDayExercise = {
  id: number;
  exercise_id: number;
  sort_order: number;
  arrows_override?: number | null;
  distance_override_m?: number | null;
  notes?: string | null;
};

type RoutineDay = {
  id: number;
  day_number: number;
  name?: string | null;
  notes?: string | null;
  exercises: RoutineDayExercise[];
};

type Routine = {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  days: RoutineDay[];
};

type Student = {
  id: number;
  full_name: string;
  document_number: string;
  contact?: string | null;
  bow_pounds?: number | null;
  arrows_available?: number | null;
  is_active: boolean;
};

type Assignment = {
  id: number;
  student_id: number;
  routine_id: number;
  assigned_at: string;
  start_date?: string | null;
  end_date?: string | null;
  status: "active" | "paused" | "finished";
  notes?: string | null;
};

function formatDay(day: RoutineDay) {
  return day.name || `día ${day.day_number}`;
}

function formatDateEs(value?: string | null): string {
  if (!value) return "-";
  const [yyyy, mm, dd] = value.split("-");
  if (!yyyy || !mm || !dd) return value;
  return `${dd}/${mm}/${yyyy}`;
}

function parseRoleFromToken(rawToken: string | null): string | null {
  if (!rawToken) return null;
  try {
    const [, payload] = rawToken.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as { role?: string };
    return parsed.role || null;
  } catch {
    return null;
  }
}

function App() {
  const [view, setView] = useState<"dashboard" | "login" | "professor">(() =>
    localStorage.getItem("token") ? "professor" : "login",
  );
  const [profSection, setProfSection] = useState<"administrar_rutinas" | "perfil" | "rutina" | "ejercicio" | "alumno">("administrar_rutinas");
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState("");
  const [editArrows, setEditArrows] = useState<number | "">("");
  const [editDistance, setEditDistance] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRoutineModalOpen, setCreateRoutineModalOpen] = useState(false);
  const [routineModalStep, setRoutineModalStep] = useState<0 | 1 | 2>(0);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineSelectedDays, setRoutineSelectedDays] = useState<string[]>([]);
  const [routineDayCursor, setRoutineDayCursor] = useState(0);
  const [routineExercisesByDay, setRoutineExercisesByDay] = useState<Record<string, number[]>>({});
  const [routineExerciseSearch, setRoutineExerciseSearch] = useState("");
  const [routineModalBodyHeight, setRoutineModalBodyHeight] = useState<number | null>(null);
  const [createRoutineLoading, setCreateRoutineLoading] = useState(false);
  const [createRoutineError, setCreateRoutineError] = useState<string | null>(null);
  const [assignRoutineModalOpen, setAssignRoutineModalOpen] = useState(false);
  const [assignRoutineStudent, setAssignRoutineStudent] = useState<Student | null>(null);
  const [assignRoutineStep, setAssignRoutineStep] = useState<"choice" | "existing_list" | "existing_preview">("choice");
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [assignRoutineError, setAssignRoutineError] = useState<string | null>(null);
  const [assignRoutineLoading, setAssignRoutineLoading] = useState(false);
  const [replaceAssignModalOpen, setReplaceAssignModalOpen] = useState(false);
  const [replaceAssignLoading, setReplaceAssignLoading] = useState(false);
  const [replaceAssignError, setReplaceAssignError] = useState<string | null>(null);
  const [pendingAssignPayload, setPendingAssignPayload] = useState<{
    student_id: number;
    routine_id: number;
    start_date: string;
    end_date: string;
    status: "active";
    notes?: string;
  } | null>(null);
  const [routineAssignStudentId, setRoutineAssignStudentId] = useState<number | null>(null);
  const [routineAssignExistingOverrides, setRoutineAssignExistingOverrides] = useState<Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>({});
  const [editAssignExerciseModalOpen, setEditAssignExerciseModalOpen] = useState(false);
  const [editAssignExerciseId, setEditAssignExerciseId] = useState<number | null>(null);
  const [editAssignArrows, setEditAssignArrows] = useState<number | "">("");
  const [editAssignDistance, setEditAssignDistance] = useState<number | "">("");
  const [editAssignDescription, setEditAssignDescription] = useState("");
  const routineStepRef = useRef<HTMLDivElement | null>(null);
  const [createName, setCreateName] = useState("");
  const [createArrows, setCreateArrows] = useState<number | "">("");
  const [createDistance, setCreateDistance] = useState<number | "">("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editStudentTarget, setEditStudentTarget] = useState<Student | null>(null);
  const [editStudentFullName, setEditStudentFullName] = useState("");
  const [editStudentDocumentNumber, setEditStudentDocumentNumber] = useState("");
  const [editStudentContact, setEditStudentContact] = useState("");
  const [editStudentBowPounds, setEditStudentBowPounds] = useState<number | "">("");
  const [editStudentArrowsAvailable, setEditStudentArrowsAvailable] = useState<number | "">("");
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentError, setEditStudentError] = useState<string | null>(null);
  const [studentFullName, setStudentFullName] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDocumentNumber, setStudentDocumentNumber] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [studentBowPounds, setStudentBowPounds] = useState<number | "">("");
  const [studentArrowsAvailable, setStudentArrowsAvailable] = useState<number | "">("");
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [createStudentError, setCreateStudentError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteExercise, setDeleteExercise] = useState<Exercise | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRoutineModalOpen, setDeleteRoutineModalOpen] = useState(false);
  const [deleteRoutineTarget, setDeleteRoutineTarget] = useState<Routine | null>(null);
  const [deleteRoutineLoading, setDeleteRoutineLoading] = useState(false);
  const [deleteRoutineError, setDeleteRoutineError] = useState<string | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateStudent, setDeactivateStudent] = useState<Student | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activateStudent, setActivateStudent] = useState<Student | null>(null);
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [deleteAssignedRoutineModalOpen, setDeleteAssignedRoutineModalOpen] = useState(false);
  const [deleteAssignedRoutineTarget, setDeleteAssignedRoutineTarget] = useState<Assignment | null>(null);
  const [deleteAssignedRoutineLoading, setDeleteAssignedRoutineLoading] = useState(false);
  const [deleteAssignedRoutineError, setDeleteAssignedRoutineError] = useState<string | null>(null);
  const [preAssignConflictModalOpen, setPreAssignConflictModalOpen] = useState(false);
  const [preAssignConflictStudent, setPreAssignConflictStudent] = useState<Student | null>(null);
  const [preAssignConflictAssignment, setPreAssignConflictAssignment] = useState<Assignment | null>(null);
  const [preAssignConflictLoading, setPreAssignConflictLoading] = useState(false);
  const [preAssignConflictError, setPreAssignConflictError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userRole, setUserRole] = useState<string | null>(() => parseRoleFromToken(localStorage.getItem("token")));
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
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
    setUserRole(parseRoleFromToken(token));
  }, [token]);

  useEffect(() => {
    if (!token && view !== "login") {
      setView("login");
      return;
    }
    if (token && view === "login") {
      setView("professor");
      return;
    }
    if (view === "dashboard" && userRole !== "admin") {
      setView(token ? "professor" : "login");
    }
  }, [token, userRole, view]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!token) return;
      try {
        const data = await apiFetch<Student[]>("/students", { token });
        setStudents(data);
      } catch {
        // Silenciamos errores aquí para no romper otras vistas.
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
        // Silenciamos errores aquí para no romper otras vistas.
      }
    };
    if (token) {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [token]);

  const normalizeInt = (value: string) => {
    const cleaned = value.replace(/\D+/g, "");
    if (cleaned === "") return "";
    const n = Number(cleaned);
    return Math.max(0, Math.trunc(n));
  };

  const normalizeFloat = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
    if (cleaned === "") return "";
    const n = Number(cleaned);
    if (Number.isNaN(n)) return "";
    return Math.max(0, n);
  };

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>, allowDot = false) => {
    const invalid = ["e", "E", "+", "-"];
    if (!allowDot) invalid.push(".", ",");
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const handleBeforeInputInt = (e: React.FormEvent<HTMLInputElement>) => {
    const be = e.nativeEvent as InputEvent;
    if (!be || typeof be.data !== "string") return;
    if (/[^0-9]/.test(be.data)) e.preventDefault();
  };

  const handleBeforeInputFloat = (e: React.FormEvent<HTMLInputElement>) => {
    const be = e.nativeEvent as InputEvent;
    if (!be || typeof be.data !== "string") return;
    const current = (e.target as HTMLInputElement).value;
    if (/[^0-9.,]/.test(be.data)) {
      e.preventDefault();
      return;
    }
    if ((be.data === "." || be.data === ",") && /[.,]/.test(current)) {
      e.preventDefault();
    }
  };

  const handlePasteInt = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[^0-9]/.test(text)) e.preventDefault();
  };

  const handlePasteFloat = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[^0-9.,]/.test(text)) {
      e.preventDefault();
      return;
    }
    const dots = (text.match(/[.,]/g) || []).length;
    const existing = ((e.target as HTMLInputElement).value.match(/[.,]/g) || []).length;
    if (dots + existing > 1) e.preventDefault();
  };

  const handleEditSave = async () => {
    if (!editExercise || !token) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await apiFetch<Exercise>(`/exercises/${editExercise.id}` , {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: editName,
          arrows_count: Number(editArrows),
          distance_m: Number(editDistance),
          description: editDescription,
          is_active: true,
        }),
      });
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditModalOpen(false);
      setEditExercise(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateSave = async () => {
    if (!token) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await apiFetch<Exercise>("/exercises", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: createName,
          arrows_count: Number(createArrows),
          distance_m: Number(createDistance),
          description: createDescription,
          is_active: true,
        }),
      });
      setExercises((prev) => [...prev, created]);
      setCreateModalOpen(false);
      setCreateName("");
      setCreateArrows("");
      setCreateDistance("");
      setCreateDescription("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateStudentSave = async () => {
    if (!token) return;
    setCreateStudentLoading(true);
    setCreateStudentError(null);
    try {
      const created = await apiFetch<Student>("/students", {
        method: "POST",
        token,
        body: JSON.stringify({
          full_name: studentFullName,
          document_number: studentDocumentNumber,
          contact: studentContact || null,
          bow_pounds: studentBowPounds === "" ? null : Number(studentBowPounds),
          arrows_available: studentArrowsAvailable === "" ? null : Number(studentArrowsAvailable),
          is_active: true,
        }),
      });
      setStudents((prev) => [...prev, created]);
      setCreateStudentModalOpen(false);
      setStudentFullName("");
      setStudentDocumentNumber("");
      setStudentContact("");
      setStudentBowPounds("");
      setStudentArrowsAvailable("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear alumno";
      setCreateStudentError(msg);
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const openEditStudentModal = (student: Student) => {
    setEditStudentTarget(student);
    setEditStudentFullName(student.full_name);
    setEditStudentDocumentNumber(student.document_number);
    setEditStudentContact(student.contact || "");
    setEditStudentBowPounds(student.bow_pounds ?? "");
    setEditStudentArrowsAvailable(student.arrows_available ?? "");
    setEditStudentError(null);
    setEditStudentModalOpen(true);
  };

  const handleEditStudentSave = async () => {
    if (!token || !editStudentTarget) return;
    setEditStudentLoading(true);
    setEditStudentError(null);
    try {
      const updated = await apiFetch<Student>(`/students/${editStudentTarget.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          full_name: editStudentFullName,
          document_number: editStudentDocumentNumber,
          contact: editStudentContact || null,
          bow_pounds: editStudentBowPounds === "" ? null : Number(editStudentBowPounds),
          arrows_available: editStudentArrowsAvailable === "" ? null : Number(editStudentArrowsAvailable),
          is_active: editStudentTarget.is_active,
        }),
      });
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditStudentModalOpen(false);
      setEditStudentTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al editar alumno";
      setEditStudentError(msg);
    } finally {
      setEditStudentLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteExercise) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiFetch(`/exercises/${deleteExercise.id}`, {
        method: "DELETE",
        token,
      });
      setExercises((prev) => prev.filter((e) => e.id !== deleteExercise.id));
      setDeleteModalOpen(false);
      setDeleteExercise(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = useMemo(
    () => ({ exercises: exercises.length, routines: routines.length, students: students.length }),
    [exercises, routines, students],
  );
  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => {
      const byName = s.full_name.toLowerCase().includes(term);
      const byDoc = s.document_number.toLowerCase().includes(term);
      const byContact = (s.contact || "").toLowerCase().includes(term);
      return byName || byDoc || byContact;
    });
  }, [students, studentSearch]);

  const sortedStudents = useMemo(
    () =>
      [...filteredStudents].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return a.full_name.localeCompare(b.full_name, "es", { sensitivity: "base" });
      }),
    [filteredStudents],
  );
  const activeStudents = useMemo(() => sortedStudents.filter((s) => s.is_active), [sortedStudents]);
  const inactiveStudents = useMemo(() => sortedStudents.filter((s) => !s.is_active), [sortedStudents]);
  const studentNameById = useMemo(() => new Map(students.map((s) => [s.id, s.full_name])), [students]);
  const routineNameById = useMemo(() => new Map(routines.map((r) => [r.id, r.name])), [routines]);
  const activeAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.status === "active")
        .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || "")),
    [assignments],
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

  const routineDayOptions = [
    { key: "lunes", label: "Lunes", dayNumber: 1, icon: lunesIconUrl, iconFilled: lunesFilledIconUrl },
    { key: "martes", label: "Martes", dayNumber: 2, icon: martesIconUrl, iconFilled: martesFilledIconUrl },
    { key: "miercoles", label: "Miércoles", dayNumber: 3, icon: miercolesIconUrl, iconFilled: miercolesFilledIconUrl },
    { key: "jueves", label: "Jueves", dayNumber: 4, icon: juevesIconUrl, iconFilled: juevesFilledIconUrl },
    { key: "viernes", label: "Viernes", dayNumber: 5, icon: viernesIconUrl, iconFilled: viernesFilledIconUrl },
    { key: "sabado", label: "Sábado", dayNumber: 6, icon: sabadoIconUrl, iconFilled: sabadoFilledIconUrl },
    { key: "domingo", label: "Domingo", dayNumber: 7, icon: domingoIconUrl, iconFilled: domingoFilledIconUrl },
  ];
  const orderedSelectedRoutineDays = useMemo(
    () => routineDayOptions.filter((day) => routineSelectedDays.includes(day.key)),
    [routineSelectedDays],
  );
  const currentRoutineDay = orderedSelectedRoutineDays[routineDayCursor] || null;
  const currentRoutineDayKey = currentRoutineDay?.key || null;
  const currentRoutineDayLabel = currentRoutineDay?.label || "";
  const exerciseNameById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.name])), [exercises]);
  const exerciseArrowsById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.arrows_count])), [exercises]);
  const sortedRoutines = useMemo(
    () => [...routines].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [routines],
  );
  const routineModalMaxW = routineModalStep === 0 ? "520px" : routineModalStep === 1 ? "640px" : "760px";
  const routineModalMinHeight = routineModalStep === 0 ? 205 : routineModalStep === 1 ? 220 : 260;
  const filteredRoutineExercises = useMemo(() => {
    const term = routineExerciseSearch.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((ex) => {
      const byName = ex.name.toLowerCase().includes(term);
      const byArrows = String(ex.arrows_count).includes(term);
      return byName || byArrows;
    });
  }, [exercises, routineExerciseSearch]);

  useLayoutEffect(() => {
    if (!createRoutineModalOpen || !routineStepRef.current) return;
    const nextHeight = Math.max(routineModalMinHeight, Math.ceil(routineStepRef.current.scrollHeight + 48));
    setRoutineModalBodyHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [
    createRoutineModalOpen,
    routineModalStep,
    routineName,
    routineSelectedDays.length,
    routineDayCursor,
    routineExerciseSearch,
    filteredRoutineExercises.length,
    currentRoutineDayKey,
    routineModalMinHeight,
    routineExercisesByDay,
  ]);

  useEffect(() => {
    if (!createRoutineModalOpen || !routineStepRef.current || typeof ResizeObserver === "undefined") return;
    const node = routineStepRef.current;
    const observer = new ResizeObserver(() => {
      const nextHeight = Math.max(routineModalMinHeight, Math.ceil(node.scrollHeight + 48));
      setRoutineModalBodyHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [createRoutineModalOpen, routineModalStep, routineDayCursor, routineModalMinHeight]);

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayDiff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toIso(weekStart), end: toIso(weekEnd) };
  };

  const getRoutineDayArrows = (day: RoutineDay) =>
    day.exercises.reduce((sum, dayExercise) => {
      if (typeof dayExercise.arrows_override === "number") return sum + dayExercise.arrows_override;
      return sum + (exerciseArrowsById.get(dayExercise.exercise_id) || 0);
    }, 0);

  const getRoutineWeekArrows = (routine: Routine) => routine.days.reduce((sum, day) => sum + getRoutineDayArrows(day), 0);

  const openAssignRoutineModal = (student: Student) => {
    const existingActive = assignments
      .filter((a) => a.student_id === student.id && a.status === "active")
      .sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""))[0];
    if (existingActive) {
      setPreAssignConflictStudent(student);
      setPreAssignConflictAssignment(existingActive);
      setPreAssignConflictError(null);
      setPreAssignConflictLoading(false);
      setPreAssignConflictModalOpen(true);
      return;
    }
    setAssignRoutineStudent(student);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setRoutineAssignExistingOverrides({});
    setAssignRoutineModalOpen(true);
  };

  const closeAssignRoutineModal = () => {
    setAssignRoutineModalOpen(false);
    setAssignRoutineStudent(null);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setRoutineAssignExistingOverrides({});
    setReplaceAssignError(null);
  };

  const handlePreAssignDeleteAndContinue = async () => {
    if (!token || !preAssignConflictStudent || !preAssignConflictAssignment) return;
    setPreAssignConflictLoading(true);
    setPreAssignConflictError(null);
    try {
      await apiFetch(`/assignments/${preAssignConflictAssignment.id}`, { method: "DELETE", token });
      const assignmentsData = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(assignmentsData);
      setPreAssignConflictModalOpen(false);
      const student = preAssignConflictStudent;
      setPreAssignConflictStudent(null);
      setPreAssignConflictAssignment(null);
      setAssignRoutineStudent(student);
      setAssignRoutineStep("choice");
      setSelectedRoutineToAssign(null);
      setAssignRoutineError(null);
      setAssignRoutineLoading(false);
      setRoutineAssignExistingOverrides({});
      setAssignRoutineModalOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al reemplazar la rutina activa";
      setPreAssignConflictError(msg);
    } finally {
      setPreAssignConflictLoading(false);
    }
  };

  const healthIcon = health?.status === "ok" ? <CheckCircleIcon color="green.500" /> : <WarningIcon color="orange.400" />;

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || "Credenciales inválidas");
      }
      const data = (await res.json()) as { access_token: string };
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      setView("professor");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem("token");
    setUsername("");
    setPassword("");
    setStudents([]);
    setView("login");
  };

  const openCreateRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineName("");
    setRoutineSelectedDays([]);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setRoutineModalStep(0);
    setCreateRoutineModalOpen(true);
  };

  const closeCreateRoutineModal = () => {
    setCreateRoutineModalOpen(false);
    setRoutineModalStep(0);
    setRoutineSelectedDays([]);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setCreateRoutineLoading(false);
    setEditingRoutineId(null);
    setRoutineAssignStudentId(null);
  };

  const openEditRoutineModal = (routine: Routine) => {
    const sortedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
    const selectedKeys = sortedDays
      .map((day) => routineDayOptions.find((option) => option.dayNumber === day.day_number)?.key || null)
      .filter((key): key is string => key !== null);
    const exercisesByDay: Record<string, number[]> = {};
    for (const day of sortedDays) {
      const key = routineDayOptions.find((option) => option.dayNumber === day.day_number)?.key;
      if (!key) continue;
      exercisesByDay[key] = [...day.exercises]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((exercise) => exercise.exercise_id);
    }
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setRoutineSelectedDays(selectedKeys);
    setRoutineExercisesByDay(exercisesByDay);
    setRoutineDayCursor(0);
    setRoutineExerciseSearch("");
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setCreateRoutineLoading(false);
    setRoutineModalStep(0);
    setCreateRoutineModalOpen(true);
  };

  const toggleRoutineDay = (dayKey: string) => {
    setRoutineSelectedDays((prev) => (prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]));
  };

  const toggleRoutineExerciseForDay = (dayKey: string, exerciseId: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      const next = current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId];
      return { ...prev, [dayKey]: next };
    });
  };

  const handleRoutineDaysContinue = () => {
    if (orderedSelectedRoutineDays.length === 0) return;
    setRoutineDayCursor(0);
    setRoutineExerciseSearch("");
    setCreateRoutineError(null);
    setRoutineModalStep(2);
  };

  const handleRoutineExerciseContinue = async () => {
    if (!token) {
      setCreateRoutineError("Sesión inválida.");
      return;
    }
    if (!currentRoutineDayKey) return;
    const selectedForDay = routineExercisesByDay[currentRoutineDayKey] || [];
    if (selectedForDay.length === 0) {
      setCreateRoutineError("Selecciona al menos un ejercicio para este día.");
      return;
    }
    if (routineDayCursor < orderedSelectedRoutineDays.length - 1) {
      setRoutineDayCursor((prev) => prev + 1);
      setRoutineExerciseSearch("");
      setCreateRoutineError(null);
      return;
    }
    try {
      setCreateRoutineLoading(true);
      setCreateRoutineError(null);
      const payload = {
        name: routineName.trim(),
        description: null,
        is_active: true,
        days: orderedSelectedRoutineDays.map((day) => ({
          day_number: day.dayNumber,
          name: day.label,
          exercises: (routineExercisesByDay[day.key] || []).map((exerciseId, idx) => ({
            exercise_id: exerciseId,
            sort_order: idx + 1,
          })),
        })),
      };
      if (editingRoutineId) {
        const updatedRoutine = await apiFetch<Routine>(`/routines/${editingRoutineId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
        setRoutines((prev) => prev.map((routine) => (routine.id === updatedRoutine.id ? updatedRoutine : routine)));
      } else {
        const createdRoutine = await apiFetch<Routine>("/routines", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
        setRoutines((prev) => [...prev, createdRoutine]);
        if (routineAssignStudentId) {
          const week = getWeekRange();
          await tryCreateAssignment({
            student_id: routineAssignStudentId,
            routine_id: createdRoutine.id,
            start_date: week.start,
            end_date: week.end,
            status: "active",
            notes: "Asignación desde creación rápida de rutina",
          });
        }
      }
      closeCreateRoutineModal();
      closeAssignRoutineModal();
      setRoutineAssignStudentId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear rutina";
      setCreateRoutineError(msg);
    } finally {
      setCreateRoutineLoading(false);
    }
  };

  const handleChooseCreateRoutineForStudent = () => {
    if (!assignRoutineStudent) return;
    setRoutineAssignStudentId(assignRoutineStudent.id);
    closeAssignRoutineModal();
    openCreateRoutineModal();
  };

  const handleChooseExistingRoutineList = () => {
    setAssignRoutineStep("existing_list");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setRoutineAssignExistingOverrides({});
  };

  const tryCreateAssignment = async (payload: {
    student_id: number;
    routine_id: number;
    start_date: string;
    end_date: string;
    status: "active";
    notes?: string;
  }) => {
    if (!token) return;
    try {
      await apiFetch("/assignments", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      const assignmentsData = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(assignmentsData);
      setPendingAssignPayload(null);
      setReplaceAssignModalOpen(false);
      setReplaceAssignError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar rutina";
      if (msg.includes("ya tiene una rutina activa")) {
        setPendingAssignPayload(payload);
        setReplaceAssignError(null);
        setReplaceAssignModalOpen(true);
      } else {
        setAssignRoutineError(msg);
        setCreateRoutineError(msg);
      }
      return false;
    }
  };

  const handleSelectRoutineToAssign = (routine: Routine) => {
    setSelectedRoutineToAssign(routine);
    setAssignRoutineStep("existing_preview");
    setAssignRoutineError(null);
    setRoutineAssignExistingOverrides({});
  };

  const openEditAssignExercise = (dayExercise: RoutineDayExercise) => {
    const base = exercises.find((ex) => ex.id === dayExercise.exercise_id);
    const override = routineAssignExistingOverrides[dayExercise.id];
    setEditAssignExerciseId(dayExercise.id);
    setEditAssignArrows(override?.arrows_override ?? dayExercise.arrows_override ?? base?.arrows_count ?? "");
    setEditAssignDistance(override?.distance_override_m ?? dayExercise.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "");
    setEditAssignDescription(override?.description_override ?? base?.description ?? "");
    setEditAssignExerciseModalOpen(true);
  };

  const saveEditAssignExercise = () => {
    if (!editAssignExerciseId) return;
    setRoutineAssignExistingOverrides((prev) => ({
      ...prev,
      [editAssignExerciseId]: {
        arrows_override: editAssignArrows === "" ? null : Number(editAssignArrows),
        distance_override_m: editAssignDistance === "" ? null : Number(editAssignDistance),
        description_override: editAssignDescription || null,
      },
    }));
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseId(null);
  };

  const handleAssignExistingRoutine = async () => {
    if (!token || !assignRoutineStudent || !selectedRoutineToAssign) return;
    setAssignRoutineLoading(true);
    setAssignRoutineError(null);
    try {
      const week = getWeekRange();
      const ok = await tryCreateAssignment({
        student_id: assignRoutineStudent.id,
        routine_id: selectedRoutineToAssign.id,
        start_date: week.start,
        end_date: week.end,
        status: "active",
        notes: JSON.stringify({ temporary_overrides: routineAssignExistingOverrides }),
      });
      if (ok) closeAssignRoutineModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar rutina";
      setAssignRoutineError(msg);
    } finally {
      setAssignRoutineLoading(false);
    }
  };

  const handleConfirmReplaceAndAssign = async () => {
    if (!token || !pendingAssignPayload) return;
    setReplaceAssignLoading(true);
    setReplaceAssignError(null);
    try {
      const current = assignments
        .filter((a) => a.student_id === pendingAssignPayload.student_id && a.status === "active")
        .sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
      if (current[0]) {
        await apiFetch(`/assignments/${current[0].id}`, { method: "DELETE", token });
      }
      await apiFetch("/assignments", {
        method: "POST",
        token,
        body: JSON.stringify(pendingAssignPayload),
      });
      const assignmentsData = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(assignmentsData);
      setPendingAssignPayload(null);
      setReplaceAssignModalOpen(false);
      setCreateRoutineError(null);
      setAssignRoutineError(null);
      closeAssignRoutineModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al reemplazar asignación";
      setReplaceAssignError(msg);
    } finally {
      setReplaceAssignLoading(false);
    }
  };

  const handleDeleteAssignedRoutineConfirm = async () => {
    if (!token || !deleteAssignedRoutineTarget) return;
    setDeleteAssignedRoutineLoading(true);
    setDeleteAssignedRoutineError(null);
    try {
      await apiFetch(`/assignments/${deleteAssignedRoutineTarget.id}`, { method: "DELETE", token });
      const assignmentsData = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(assignmentsData);
      setDeleteAssignedRoutineTarget(null);
      setDeleteAssignedRoutineModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar rutina asignada";
      setDeleteAssignedRoutineError(msg);
    } finally {
      setDeleteAssignedRoutineLoading(false);
    }
  };

  const handleDeleteRoutineConfirm = async () => {
    if (!token || !deleteRoutineTarget) return;
    setDeleteRoutineLoading(true);
    setDeleteRoutineError(null);
    try {
      await apiFetch(`/routines/${deleteRoutineTarget.id}`, { method: "DELETE", token });
      setRoutines((prev) => prev.filter((routine) => routine.id !== deleteRoutineTarget.id));
      setDeleteRoutineModalOpen(false);
      setDeleteRoutineTarget(null);
      setExpandedRoutine(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar rutina";
      setDeleteRoutineError(msg);
    } finally {
      setDeleteRoutineLoading(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!token || !deactivateStudent) return;
    setDeactivateLoading(true);
    setDeactivateError(null);
    try {
      const updated = await apiFetch<Student>(`/students/${deactivateStudent.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ is_active: false }),
      });
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setDeactivateModalOpen(false);
      setDeactivateStudent(null);
      setExpandedStudent(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al dar de baja";
      setDeactivateError(msg);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleActivateConfirm = async () => {
    if (!token || !activateStudent) return;
    setActivateLoading(true);
    setActivateError(null);
    try {
      const updated = await apiFetch<Student>(`/students/${activateStudent.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ is_active: true }),
      });
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setActivateModalOpen(false);
      setActivateStudent(null);
      setExpandedStudent(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al dar de alta";
      setActivateError(msg);
    } finally {
      setActivateLoading(false);
    }
  };

  if (view === "login") {
    return (
      <>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} minH="100vh">
          <GridItem
            display={{ base: "none", md: "block" }}
            bgImage={`url(${archeryImg})`}
            bgSize="cover"
            bgPos="center"
            m={6}
            borderRadius="2xl"
            overflow="hidden"
          />
          <GridItem bg="white" display="flex" alignItems="center" justifyContent="center" px={{ base: 6, md: 10 }}>
            <Box maxW="md" w="full">
              <Stack spacing={6}>
                <Stack spacing={2}>
                  <Heading size="lg" color="black">
                    Iniciar sesión
                  </Heading>
                  <Text color="gray.600">Ingresa tu usuario y contraseña para continuar.</Text>
                </Stack>
                <Stack
                  as="form"
                  spacing={4}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!authLoading && username && password) {
                      void handleLogin();
                    }
                  }}
                >
                  <FormControl>
                    <FormLabel color="gray.800">Usuario</FormLabel>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} bg="white" borderColor="gray.300" _hover={{ borderColor: "gray.500" }} />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.800">Contraseña</FormLabel>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} bg="white" borderColor="gray.300" _hover={{ borderColor: "gray.500" }} />
                  </FormControl>
                  {authError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {authError}
                    </Alert>
                  )}
                  <Button type="submit" bg="black" color="white" _hover={{ bg: "gray.800" }} _active={{ bg: "gray.900" }} size="lg" borderRadius="full" isLoading={authLoading} isDisabled={!username || !password}>
                    Iniciar sesión
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </GridItem>
        </Grid>
      </>
    );
  }

  if (view === "professor") {
    return (
      <>
        <Grid templateColumns={{ base: "1fr", md: "220px 1fr" }} minH="100vh" bg="white">
          <GridItem
            borderRight={{ base: "none", md: "1px solid" }}
            borderColor="rgba(0,0,0,0.08)"
            boxShadow={{ base: "none", md: "2px 0 8px rgba(0,0,0,0.06)" }}
            p={6}
            position={{ base: "static", md: "sticky" }}
            top={{ base: "auto", md: 0 }}
            h={{ base: "auto", md: "100vh" }}
            alignSelf="start"
            overflowY={{ base: "visible", md: "auto" }}
          >
            <Stack spacing={4} h="full">
              <Heading size="md" color="gray.900">
                Panel profesor
              </Heading>
              <Text
                color={profSection === "administrar_rutinas" ? "black" : "gray.700"}
                fontWeight={profSection === "administrar_rutinas" ? "bold" : "normal"}
                cursor="pointer"
                onClick={() => setProfSection("administrar_rutinas")}
              >
                Administrar rutinas
              </Text>
              <Text color={profSection === "rutina" ? "black" : "gray.700"} fontWeight={profSection === "rutina" ? "bold" : "normal"} cursor="pointer" onClick={() => setProfSection("rutina")}>
                Rutinas
              </Text>
              <Text color={profSection === "ejercicio" ? "black" : "gray.700"} fontWeight={profSection === "ejercicio" ? "bold" : "normal"} cursor="pointer" onClick={() => setProfSection("ejercicio")}>
                Ejercicios
              </Text>
              <Text color={profSection === "alumno" ? "black" : "gray.700"} fontWeight={profSection === "alumno" ? "bold" : "normal"} cursor="pointer" onClick={() => setProfSection("alumno")}>
                Alumnos
              </Text>
              <Box flex="1" />
              <HStack justify="space-between" align="center" w="full">
                <Text color={profSection === "perfil" ? "black" : "gray.700"} fontWeight={profSection === "perfil" ? "bold" : "normal"} cursor="pointer" onClick={() => setProfSection("perfil")}>
                  Perfil
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  minW="auto"
                  p={1}
                  color="gray.700"
                  _hover={{ bg: "gray.100", color: "black" }}
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                >
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="18px"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  </Box>
                </Button>
              </HStack>
              <Divider />
              <Stack spacing={3}>
                {userRole === "admin" && (
                  <Button variant="outline" onClick={() => setView("dashboard")}>
                    Ver conexiones
                  </Button>
                )}
              </Stack>
            </Stack>
          </GridItem>
          <GridItem pl={{ base: 6, md: 10 }} pr={{ base: 0, md: 0 }} py={{ base: 6, md: 10 }} display="flex" alignItems="flex-start" justifyContent="flex-start" w="full">
            <Stack spacing={4} w="full">
              {profSection === "administrar_rutinas" && (
                <Stack spacing={6}>
                  <Heading size="lg">Administrar rutinas</Heading>
                  <Stack spacing={3}>
                    {activeAssignments.map((assignment) => (
                      <Box key={assignment.id} p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                        <HStack justify="space-between" align="start">
                          <Stack spacing={1}>
                            <Text fontWeight="bold" color="gray.900">
                              {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                              Alumno: {studentNameById.get(assignment.student_id) || `Alumno #${assignment.student_id}`}
                            </Text>
                            <Text color="gray.500" fontSize="xs">
                              Semana: {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                            </Text>
                          </Stack>
                          <HStack spacing={2}>
                            <Badge colorScheme="green">Activa</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              borderRadius="xl"
                              borderColor="gray.300"
                              color="black"
                              _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                              onClick={() => {
                                setDeleteAssignedRoutineError(null);
                                setDeleteAssignedRoutineTarget(assignment);
                                setDeleteAssignedRoutineModalOpen(true);
                              }}
                            >
                              <Box
                                as="svg"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                boxSize="16px"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </Box>
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                    {!activeAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
                  </Stack>
                </Stack>
              )}
              {profSection === "rutina" && (
                <Stack spacing={6}>
                  <HStack align="flex-start" spacing={8} justify="space-between" w="full">
                    <Stack spacing={6} flex="1">
                      {sortedRoutines.map((routine) => {
                        const orderedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
                        const daysPreview = orderedDays.map((day) => day.name || formatDay(day)).join(" ● ");
                        const weekArrowsTotal = getRoutineWeekArrows(routine);
                        return (
                          <Box
                            key={routine.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="lg"
                            borderColor="gray.200"
                            bg="white"
                            shadow="sm"
                            _hover={{ borderColor: "gray.400", cursor: "pointer" }}
                            onClick={() => setExpandedRoutine((prev) => (prev === routine.id ? null : routine.id))}
                          >
                            <HStack align="flex-start" spacing={4}>
                              <Stack spacing={1.5} flex="1 1 70%">
                                <HStack justify="space-between" align="flex-start" w="full" spacing={4}>
                                  <Heading size="md" color="gray.900">
                                    {routine.name}
                                  </Heading>
                                  <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                                    Flechas totales: {weekArrowsTotal}
                                  </Text>
                                </HStack>
                                <Text color="gray.500">{daysPreview || "Sin días asignados"}</Text>
                                <Collapse in={expandedRoutine === routine.id} animateOpacity>
                                  <Stack spacing={3} pt={2}>
                                    {orderedDays.map((day) => (
                                      <Box key={day.id}>
                                        <HStack spacing={2} align="baseline" w="full">
                                          <Text color="gray.700" fontWeight="medium">
                                            {day.name || formatDay(day)}
                                          </Text>
                                          <Text color="gray.400" fontSize="sm">
                                            •
                                          </Text>
                                          <Text color="gray.500" fontSize="sm">
                                            Flechas totales: {getRoutineDayArrows(day)}
                                          </Text>
                                        </HStack>
                                        <Stack as="ul" spacing={0.5} mt={1} pl={5}>
                                          {day.exercises.map((dayExercise) => (
                                            <Text as="li" key={dayExercise.id} fontSize="sm" color="gray.500">
                                              {exerciseNameById.get(dayExercise.exercise_id) || `Ejercicio #${dayExercise.exercise_id}`}
                                            </Text>
                                          ))}
                                          {!day.exercises.length && (
                                            <Text as="li" fontSize="sm" color="gray.500">
                                              Sin ejercicios
                                            </Text>
                                          )}
                                        </Stack>
                                      </Box>
                                    ))}
                                    <HStack spacing={2} pt={2}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        borderRadius="xl"
                                        borderColor="gray.300"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditRoutineModal(routine);
                                        }}
                                      >
                                        <Image src={editIconUrl} alt="Editar" boxSize="16px" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        borderRadius="xl"
                                        borderColor="gray.300"
                                        color="black"
                                        _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteRoutineError(null);
                                          setDeleteRoutineTarget(routine);
                                          setDeleteRoutineModalOpen(true);
                                        }}
                                      >
                                        <Box
                                          as="svg"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          boxSize="16px"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M10 11v6" />
                                          <path d="M14 11v6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                          <path d="M3 6h18" />
                                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </Box>
                                      </Button>
                                    </HStack>
                                  </Stack>
                                </Collapse>
                              </Stack>
                            </HStack>
                          </Box>
                        );
                      })}
                      {!sortedRoutines.length && <Text color="gray.600">No hay rutinas para mostrar.</Text>}
                    </Stack>
                    <Stack flex="0 0 160px" pt={2} ml="auto" mr="50px" spacing={3}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderRadius="lg"
                        color="gray.800"
                        _hover={{ borderColor: "gray.500" }}
                        onClick={openCreateRoutineModal}
                        w="full"
                      >
                        <HStack justify="center" spacing={2}>
                          <Image src={notebookTabsIconUrl} alt="Agregar rutina" boxSize="18px" />
                          <Text>Agregar rutina</Text>
                        </HStack>
                      </Button>
                    </Stack>
                  </HStack>
                </Stack>
              )}
              {profSection === "ejercicio" && (
                <Stack spacing={6}>
                  <InputGroup maxW="360px">
                    <InputLeftElement pointerEvents="none" color="gray.500">
                      <SearchIcon boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="Buscar ejercicios"
                      bg="gray.100"
                      borderColor="gray.100"
                      borderRadius="lg"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{ borderColor: "gray.400", bg: "white" }}
                    />
                  </InputGroup>
                  <HStack align="flex-start" spacing={8} justify="space-between" w="full">
                    <Stack spacing={6} flex="1">
                      {filteredExercises.map((ex) => (
                        <Box
                          key={ex.id}
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor="gray.200"
                          bg="white"
                          shadow="sm"
                          _hover={{ borderColor: "gray.400", cursor: "pointer" }}
                          onClick={() => setExpandedExercise((prev) => (prev === ex.id ? null : ex.id))}
                        >
                          <HStack align="flex-start" spacing={4}>
                            <Stack spacing={2} flex="1 1 70%">
                              <Heading size="md" color="gray.900">
                                {ex.name}
                              </Heading>
                              <Stack spacing={1.5} pt={1}>
                                <Text color="gray.500">{ex.arrows_count} flechas</Text>
                                <Collapse in={expandedExercise === ex.id} animateOpacity>
                                  <Stack spacing={1.5} color="gray.700">
                                    <Text color="gray.500">Distancia: {ex.distance_m} m</Text>
                                    <Text color="gray.500">Descripción: {ex.description || "Sin descripción"}</Text>
                                    <HStack spacing={2} pt={2}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        borderRadius="xl"
                                        borderColor="gray.300"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditExercise(ex);
                                          setEditName(ex.name);
                                          setEditArrows(ex.arrows_count);
                                          setEditDistance(ex.distance_m);
                                          setEditDescription(ex.description || "");
                                          setEditError(null);
                                          setEditModalOpen(true);
                                        }}
                                      >
                                        <Image src={editIconUrl} alt="Editar" boxSize="16px" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        borderRadius="xl"
                                        borderColor="gray.300"
                                        color="black"
                                        _hover={{ bg: "red.600", borderColor: "red.700", color: "white" }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteExercise(ex);
                                          setDeleteModalOpen(true);
                                        }}
                                      >
                                        <Box
                                          as="svg"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          boxSize="16px"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M10 11v6" />
                                          <path d="M14 11v6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                          <path d="M3 6h18" />
                                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </Box>
                                      </Button>
                                    </HStack>
                                  </Stack>
                                </Collapse>
                              </Stack>
                            </Stack>
                          </HStack>
                        </Box>
                      ))}
                      {!filteredExercises.length && <Text color="gray.600">No hay ejercicios para mostrar.</Text>}
                    </Stack>
                    <Stack flex="0 0 160px" pt={2} ml="auto" mr="50px" spacing={3}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderRadius="lg"
                        color="gray.800"
                        _hover={{ borderColor: "gray.500" }}
                        onClick={() => setCreateModalOpen(true)}
                        w="full"
                      >
                        <HStack justify="center" spacing={2}>
                          <Image src={bowIconUrl} alt="Bow icon" boxSize="18px" />
                          <Text>Crear ejercicio</Text>
                        </HStack>
                      </Button>
                    </Stack>
                  </HStack>
                </Stack>
              )}
              {profSection === "alumno" && (
                <Stack spacing={6}>
                  <InputGroup maxW="360px">
                    <InputLeftElement pointerEvents="none" color="gray.500">
                      <SearchIcon boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Buscar alumnos"
                      bg="gray.100"
                      borderColor="gray.100"
                      borderRadius="lg"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{ borderColor: "gray.400", bg: "white" }}
                    />
                  </InputGroup>
                  <HStack align="flex-start" spacing={8} justify="space-between" w="full">
                    <Stack spacing={6} flex="1">
                      <Stack spacing={3}>
                        <Heading size="md" color="black">
                          Alumnos activos
                        </Heading>
                        {activeStudents.map((st) => (
                          <Box
                            key={st.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="lg"
                            borderColor="gray.200"
                            bg="white"
                            shadow="sm"
                            _hover={{ borderColor: "gray.400", cursor: "pointer" }}
                            onClick={() => setExpandedStudent((prev) => (prev === st.id ? null : st.id))}
                          >
                            <HStack justify="space-between" align="start">
                              <Heading size="md" color="gray.900" fontWeight="normal">
                                {st.full_name}
                              </Heading>
                              <Badge colorScheme="green">Activo</Badge>
                            </HStack>
                            <Collapse in={expandedStudent === st.id} animateOpacity>
                              <Stack spacing={1.5} mt={2} color="gray.600" fontSize="sm">
                                <Text>DNI: {st.document_number}</Text>
                                {st.contact && <Text>Contacto: {st.contact}</Text>}
                                {typeof st.bow_pounds === "number" && <Text>Arco: {st.bow_pounds} lb</Text>}
                                {typeof st.arrows_available === "number" && <Text>Flechas: {st.arrows_available}</Text>}
                                <HStack justify="space-between" align="center" pt={2}>
                                  <HStack spacing={2}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      borderRadius="xl"
                                      borderColor="gray.300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditStudentModal(st);
                                      }}
                                    >
                                      <Image src={editIconUrl} alt="Editar alumno" boxSize="16px" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      borderRadius="xl"
                                      borderColor="gray.300"
                                      color="black"
                                      _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeactivateStudent(st);
                                        setDeactivateError(null);
                                        setDeactivateModalOpen(true);
                                      }}
                                    >
                                      <Box
                                        as="svg"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        boxSize="16px"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                                        <path d="m14.5 9.5-5 5" />
                                        <path d="m9.5 9.5 5 5" />
                                      </Box>
                                    </Button>
                                  </HStack>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    color="gray.800"
                                    _hover={{ borderColor: "gray.500", bg: "gray.50" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAssignRoutineModal(st);
                                    }}
                                    h="40px"
                                    px={3}
                                  >
                                    <HStack spacing={2}>
                                      <Box
                                        as="svg"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        boxSize="18px"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect width="18" height="18" x="3" y="3" rx="2" />
                                        <path d="M8 12h8" />
                                        <path d="M12 8v8" />
                                      </Box>
                                      <Text fontSize="sm" fontWeight="bold">
                                        Asignar rutina
                                      </Text>
                                    </HStack>
                                  </Button>
                                </HStack>
                              </Stack>
                            </Collapse>
                          </Box>
                        ))}
                        {!activeStudents.length && <Text color="gray.600">No hay alumnos activos.</Text>}
                      </Stack>

                      <Stack spacing={3}>
                        <Heading size="md" color="black">
                          Alumnos inactivos
                        </Heading>
                        {inactiveStudents.map((st) => (
                          <Box
                            key={st.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="lg"
                            borderColor="gray.200"
                            bg="white"
                            shadow="sm"
                            _hover={{ borderColor: "gray.400", cursor: "pointer" }}
                            onClick={() => setExpandedStudent((prev) => (prev === st.id ? null : st.id))}
                          >
                            <HStack justify="space-between" align="start">
                              <Heading size="md" color="gray.900" fontWeight="normal">
                                {st.full_name}
                              </Heading>
                              <Badge colorScheme="red">Inactivo</Badge>
                            </HStack>
                            <Collapse in={expandedStudent === st.id} animateOpacity>
                              <Stack spacing={1.5} mt={2} color="gray.600" fontSize="sm">
                                <Text>DNI: {st.document_number}</Text>
                                {st.contact && <Text>Contacto: {st.contact}</Text>}
                                {typeof st.bow_pounds === "number" && <Text>Arco: {st.bow_pounds} lb</Text>}
                                {typeof st.arrows_available === "number" && <Text>Flechas: {st.arrows_available}</Text>}
                                <HStack justify="space-between" align="center" pt={2}>
                                  <HStack spacing={2}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      borderRadius="xl"
                                      borderColor="gray.300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditStudentModal(st);
                                      }}
                                    >
                                      <Image src={editIconUrl} alt="Editar alumno" boxSize="16px" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      borderRadius="xl"
                                      borderColor="gray.300"
                                      color="black"
                                      _hover={{ bg: "green.600", borderColor: "green.700", color: "white" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActivateStudent(st);
                                        setActivateError(null);
                                        setActivateModalOpen(true);
                                      }}
                                    >
                                      <Box
                                        as="svg"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        boxSize="16px"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                                        <path d="m9 12 2 2 4-4" />
                                      </Box>
                                    </Button>
                                  </HStack>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    color="gray.800"
                                    _hover={{ borderColor: "gray.500", bg: "gray.50" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAssignRoutineModal(st);
                                    }}
                                    h="40px"
                                    px={3}
                                  >
                                    <HStack spacing={2}>
                                      <Box
                                        as="svg"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        boxSize="18px"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect width="18" height="18" x="3" y="3" rx="2" />
                                        <path d="M8 12h8" />
                                        <path d="M12 8v8" />
                                      </Box>
                                      <Text fontSize="sm" fontWeight="bold">
                                        Asignar rutina
                                      </Text>
                                    </HStack>
                                  </Button>
                                </HStack>
                              </Stack>
                            </Collapse>
                          </Box>
                        ))}
                        {!inactiveStudents.length && <Text color="gray.600">No hay alumnos inactivos.</Text>}
                      </Stack>
                    </Stack>
                    <Stack flex="0 0 160px" pt={2} ml="auto" mr="50px" spacing={3}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        borderRadius="lg"
                        color="gray.800"
                        _hover={{ borderColor: "gray.500" }}
                        onClick={() => setCreateStudentModalOpen(true)}
                        w="full"
                      >
                        <HStack justify="center" spacing={2}>
                          <Image src={userPlusIconUrl} alt="Agregar alumno" boxSize="18px" />
                          <Text>Agregar alumno</Text>
                        </HStack>
                      </Button>
                    </Stack>
                  </HStack>
                </Stack>
              )}
              {profSection === "perfil" && (
                <Stack spacing={2}>
                  <Heading size="lg">Perfil</Heading>
                  <Text color="gray.600">Resumen del usuario y opciones de cuenta.</Text>
                </Stack>
              )}
            </Stack>
          </GridItem>
        </Grid>
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="700px">
            <ModalHeader>Editar ejercicio</ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto">
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Nombre</FormLabel>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Flechas</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={editArrows}
                    onChange={(e) => setEditArrows(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Distancia (m)</FormLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={editDistance}
                    onChange={(e) => setEditDistance(normalizeFloat(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, true)}
                    onBeforeInput={handleBeforeInputFloat}
                    onPaste={handlePasteFloat}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    minH="360px"
                    resize="vertical"
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.500" }}
                    fontSize="md"
                  />
                </FormControl>
                {editError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {editError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  isLoading={editLoading}
                  isDisabled={!editName || !editArrows || !editDistance}
                  onClick={handleEditSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="700px">
            <ModalHeader>Crear ejercicio</ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto">
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Nombre</FormLabel>
                  <Input value={createName} onChange={(e) => setCreateName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Flechas</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={createArrows}
                    onChange={(e) => setCreateArrows(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Distancia (m)</FormLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={createDistance}
                    onChange={(e) => setCreateDistance(normalizeFloat(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, true)}
                    onBeforeInput={handleBeforeInputFloat}
                    onPaste={handlePasteFloat}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    minH="180px"
                    resize="vertical"
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.500" }}
                    fontSize="md"
                  />
                </FormControl>
                {createError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {createError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  isLoading={createLoading}
                  isDisabled={!createName || !createArrows || !createDistance}
                  onClick={handleCreateSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={createRoutineModalOpen} onClose={closeCreateRoutineModal} isCentered>
          <ModalOverlay />
          <ModalContent maxW={routineModalMaxW} maxH="90vh" transition="max-width 0.3s ease" overflowY="auto" overflowX="hidden">
            <Box h={routineModalBodyHeight ? `${routineModalBodyHeight}px` : `${routineModalMinHeight}px`} transition="height 0.3s ease" overflow="hidden">
              <Box px={6} py={6}>
                {routineModalStep === 0 && (
                  <Stack ref={routineStepRef} spacing={6} animation={`${routineStepSlide} 0.3s ease`}>
                  <Heading size="md">{editingRoutineId ? "Editar nombre de la rutina" : "Ingrese el nombre de la rutina"}</Heading>
                  <FormControl>
                    <Input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Nombre de rutina" />
                  </FormControl>
                  <HStack spacing={3} justify="flex-end">
                    <Button
                      bg="black"
                      color="white"
                      _hover={{ bg: "gray.800" }}
                      _active={{ bg: "gray.900" }}
                      isDisabled={!routineName.trim()}
                      onClick={() => setRoutineModalStep(1)}
                    >
                      Siguiente
                    </Button>
                    <Button
                      bg="white"
                      color="black"
                      borderColor="gray.300"
                      borderWidth="1px"
                      _hover={{ bg: "gray.100" }}
                      onClick={closeCreateRoutineModal}
                    >
                      Cancelar
                    </Button>
                  </HStack>
                  </Stack>
                )}
                {routineModalStep === 1 && (
                  <Stack ref={routineStepRef} spacing={6} animation={`${routineStepSlide} 0.3s ease`}>
                  <Heading size="md">Seleccione los días de la rutina</Heading>
                  <SimpleGrid columns={{ base: 3, md: 7 }} spacing={3}>
                    {routineDayOptions.map((day) => {
                      const isSelected = routineSelectedDays.includes(day.key);
                      return (
                        <Button
                          key={day.key}
                          onClick={() => toggleRoutineDay(day.key)}
                          variant="unstyled"
                          borderRadius="full"
                          bg="transparent"
                          color={isSelected ? "white" : "black"}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          h="56px"
                          w="56px"
                          minW="56px"
                          p={0}
                        >
                          <Image src={isSelected ? day.iconFilled : day.icon} alt={day.label} boxSize="56px" objectFit="contain" />
                        </Button>
                      );
                    })}
                  </SimpleGrid>
                  <HStack spacing={3} justify="flex-end">
                    <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(0)}>
                      Volver
                    </Button>
                    <Button
                      bg="black"
                      color="white"
                      _hover={{ bg: "gray.800" }}
                      _active={{ bg: "gray.900" }}
                      isDisabled={orderedSelectedRoutineDays.length === 0}
                      onClick={handleRoutineDaysContinue}
                    >
                      Continuar
                    </Button>
                    <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>
                      Cancelar
                    </Button>
                  </HStack>
                  </Stack>
                )}
                {routineModalStep === 2 && (
                  <Stack ref={routineStepRef} key={`${currentRoutineDayKey || "dia"}-${routineDayCursor}`} spacing={4} animation={`${routineDaySlide} 0.3s ease`}>
                  <Heading size="md">{currentRoutineDayLabel || "Día"}</Heading>
                  <InputGroup maxW="360px">
                    <InputLeftElement pointerEvents="none" color="gray.500">
                      <SearchIcon boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                      value={routineExerciseSearch}
                      onChange={(e) => setRoutineExerciseSearch(e.target.value)}
                      placeholder="Buscar ejercicios"
                      bg="gray.100"
                      borderColor="gray.100"
                      borderRadius="lg"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{ borderColor: "gray.400", bg: "white" }}
                    />
                  </InputGroup>
                  <Stack spacing={2} maxH="300px" overflowY="auto" pr={1}>
                    {filteredRoutineExercises.map((ex) => {
                      const selectedForCurrentDay =
                        !!currentRoutineDayKey && (routineExercisesByDay[currentRoutineDayKey] || []).includes(ex.id);
                      return (
                        <Box
                          key={ex.id}
                          p={3}
                          borderWidth="1px"
                          borderColor={selectedForCurrentDay ? "gray.500" : "gray.200"}
                          borderRadius="md"
                          bg="white"
                          cursor="pointer"
                          _hover={{ borderColor: "gray.400" }}
                          onClick={() => currentRoutineDayKey && toggleRoutineExerciseForDay(currentRoutineDayKey, ex.id)}
                        >
                          <HStack justify="space-between" align="center" spacing={3}>
                            <Stack spacing={0.5} minW={0}>
                              <Text fontSize="sm" noOfLines={1}>
                                {ex.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {ex.arrows_count} flechas
                              </Text>
                            </Stack>
                            <Checkbox
                              isChecked={selectedForCurrentDay}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => currentRoutineDayKey && toggleRoutineExerciseForDay(currentRoutineDayKey, ex.id)}
                              colorScheme="gray"
                              sx={{ transform: "scale(1.25)", transformOrigin: "center" }}
                            />
                          </HStack>
                        </Box>
                      );
                    })}
                    {!filteredRoutineExercises.length && (
                      <Text fontSize="sm" color="gray.600">
                        No hay ejercicios para mostrar.
                      </Text>
                    )}
                  </Stack>
                  <Button
                    variant="outline"
                    borderColor="gray.300"
                    borderRadius="lg"
                    color="gray.800"
                    _hover={{ borderColor: "gray.500" }}
                    onClick={() => setCreateModalOpen(true)}
                    w="fit-content"
                  >
                    <HStack justify="center" spacing={2}>
                      <Image src={bowIconUrl} alt="Bow icon" boxSize="18px" />
                      <Text>Crear ejercicio</Text>
                    </HStack>
                  </Button>
                  {createRoutineError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {createRoutineError}
                    </Alert>
                  )}
                  <HStack spacing={3} justify="flex-end">
                    <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(1)}>
                      Volver
                    </Button>
                    <Button
                      bg="black"
                      color="white"
                      _hover={{ bg: "gray.800" }}
                      _active={{ bg: "gray.900" }}
                      isDisabled={!currentRoutineDayKey || (routineExercisesByDay[currentRoutineDayKey] || []).length === 0}
                      isLoading={createRoutineLoading}
                      onClick={handleRoutineExerciseContinue}
                    >
                      {routineDayCursor < orderedSelectedRoutineDays.length - 1 ? "Siguiente" : editingRoutineId ? "Guardar cambios" : "Crear rutina"}
                    </Button>
                    <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>
                      Cancelar
                    </Button>
                  </HStack>
                  </Stack>
                )}
              </Box>
            </Box>
          </ModalContent>
        </Modal>
        <Modal isOpen={createStudentModalOpen} onClose={() => setCreateStudentModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="700px">
            <ModalHeader>Agregar alumno</ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto">
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Nombre completo</FormLabel>
                  <Input value={studentFullName} onChange={(e) => setStudentFullName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>DNI</FormLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={studentDocumentNumber}
                    onChange={(e) => setStudentDocumentNumber(e.target.value.replace(/\D+/g, ""))}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Contacto</FormLabel>
                  <Input value={studentContact} onChange={(e) => setStudentContact(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Libras del arco</FormLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={studentBowPounds}
                    onChange={(e) => setStudentBowPounds(normalizeFloat(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, true)}
                    onBeforeInput={handleBeforeInputFloat}
                    onPaste={handlePasteFloat}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Flechas disponibles</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={studentArrowsAvailable}
                    onChange={(e) => setStudentArrowsAvailable(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                {createStudentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {createStudentError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setCreateStudentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  isLoading={createStudentLoading}
                  isDisabled={!studentFullName || !studentDocumentNumber}
                  onClick={handleCreateStudentSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={editStudentModalOpen} onClose={() => setEditStudentModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="700px">
            <ModalHeader>Editar alumno</ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto">
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Nombre completo</FormLabel>
                  <Input value={editStudentFullName} onChange={(e) => setEditStudentFullName(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>DNI</FormLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editStudentDocumentNumber}
                    onChange={(e) => setEditStudentDocumentNumber(e.target.value.replace(/\D+/g, ""))}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Contacto</FormLabel>
                  <Input value={editStudentContact} onChange={(e) => setEditStudentContact(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Libras del arco</FormLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={editStudentBowPounds}
                    onChange={(e) => setEditStudentBowPounds(normalizeFloat(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, true)}
                    onBeforeInput={handleBeforeInputFloat}
                    onPaste={handlePasteFloat}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Flechas disponibles</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={editStudentArrowsAvailable}
                    onChange={(e) => setEditStudentArrowsAvailable(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                {editStudentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {editStudentError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setEditStudentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  isLoading={editStudentLoading}
                  isDisabled={!editStudentFullName || !editStudentDocumentNumber}
                  onClick={handleEditStudentSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={assignRoutineModalOpen} onClose={closeAssignRoutineModal} isCentered>
          <ModalOverlay />
          <ModalContent maxW="760px">
            <ModalHeader>Asignar rutina a {assignRoutineStudent?.full_name || "alumno"}</ModalHeader>
            <ModalBody>
              {assignRoutineStep === "choice" && (
                <Stack spacing={4}>
                  <Text color="gray.700">Crear una rutina temporal o asignar una rutina ya creada</Text>
                  <HStack spacing={3}>
                    <Button bg="black" color="white" _hover={{ bg: "gray.800" }} _active={{ bg: "gray.900" }} onClick={handleChooseCreateRoutineForStudent}>
                      Crear rutina
                    </Button>
                    <Button variant="outline" borderColor="gray.300" onClick={handleChooseExistingRoutineList}>
                      Asignar rutina ya creada
                    </Button>
                  </HStack>
                </Stack>
              )}
              {assignRoutineStep === "existing_list" && (
                <Stack spacing={3} maxH="55vh" overflowY="auto" pr={1}>
                  {sortedRoutines.map((routine) => (
                    <Box
                      key={routine.id}
                      p={3}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ borderColor: "gray.400" }}
                      onClick={() => handleSelectRoutineToAssign(routine)}
                    >
                      <HStack justify="space-between" align="center">
                        <Text color="gray.900">{routine.name}</Text>
                        <Text color="gray.500" fontSize="sm">
                          Flechas totales: {getRoutineWeekArrows(routine)}
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                  {!sortedRoutines.length && <Text color="gray.600">No hay rutinas creadas.</Text>}
                </Stack>
              )}
              {assignRoutineStep === "existing_preview" && selectedRoutineToAssign && (
                <Stack spacing={3} maxH="55vh" overflowY="auto" pr={1}>
                  {[...selectedRoutineToAssign.days]
                    .sort((a, b) => a.day_number - b.day_number)
                    .map((day) => (
                      <Box key={day.id} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                        <Text color="gray.800" fontWeight="medium">
                          {day.name || formatDay(day)}
                        </Text>
                        <Stack spacing={1} mt={2}>
                          {[...day.exercises]
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((dayExercise) => {
                              const base = exercises.find((ex) => ex.id === dayExercise.exercise_id);
                              const override = routineAssignExistingOverrides[dayExercise.id];
                              return (
                                <HStack key={dayExercise.id} justify="space-between" align="center">
                                  <Stack spacing={0}>
                                    <Text fontSize="sm" color="gray.700">
                                      {base?.name || `Ejercicio #${dayExercise.exercise_id}`}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      Flechas: {override?.arrows_override ?? dayExercise.arrows_override ?? base?.arrows_count ?? "-"} | Distancia:{" "}
                                      {override?.distance_override_m ?? dayExercise.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "-"} m
                                    </Text>
                                  </Stack>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    borderRadius="xl"
                                    borderColor="gray.300"
                                    onClick={() => openEditAssignExercise(dayExercise)}
                                  >
                                    <Image src={editIconUrl} alt="Editar" boxSize="16px" />
                                  </Button>
                                </HStack>
                              );
                            })}
                        </Stack>
                      </Box>
                    ))}
                </Stack>
              )}
              {assignRoutineError && (
                <Alert status="error" borderRadius="md" mt={3}>
                  <AlertIcon />
                  {assignRoutineError}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                {assignRoutineStep === "existing_list" && (
                  <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("choice")}>
                    Volver
                  </Button>
                )}
                {assignRoutineStep === "existing_preview" && (
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_list")}>
                      Volver
                    </Button>
                    <Button
                      bg="black"
                      color="white"
                      _hover={{ bg: "gray.800" }}
                      _active={{ bg: "gray.900" }}
                      isLoading={assignRoutineLoading}
                      onClick={handleAssignExistingRoutine}
                    >
                      Confirmar asignación
                    </Button>
                  </>
                )}
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeAssignRoutineModal}>
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={editAssignExerciseModalOpen} onClose={() => setEditAssignExerciseModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="700px">
            <ModalHeader>Editar ejercicio temporal</ModalHeader>
            <ModalBody>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Flechas</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    step={1}
                    value={editAssignArrows}
                    onChange={(e) => setEditAssignArrows(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Distancia (m)</FormLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={editAssignDistance}
                    onChange={(e) => setEditAssignDistance(normalizeFloat(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, true)}
                    onBeforeInput={handleBeforeInputFloat}
                    onPaste={handlePasteFloat}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea value={editAssignDescription} onChange={(e) => setEditAssignDescription(e.target.value)} minH="120px" resize="vertical" />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={() => setEditAssignExerciseModalOpen(false)}>
                  Cancelar
                </Button>
                <Button bg="black" color="white" _hover={{ bg: "gray.800" }} _active={{ bg: "gray.900" }} onClick={saveEditAssignExercise}>
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="420px">
            <ModalHeader>¿Eliminar ejercicio?</ModalHeader>
            <ModalBody>
              {deleteError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deleteError}
                </Alert>
              )}
              <Text color="gray.700">Esta acción eliminará el ejercicio seleccionado.</Text>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleDeleteConfirm}
                  isLoading={deleteLoading}
                >
                  Eliminar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => setDeleteModalOpen(false)}
                  isDisabled={deleteLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteRoutineModalOpen} onClose={() => setDeleteRoutineModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="420px">
            <ModalHeader>¿Eliminar rutina?</ModalHeader>
            <ModalBody>
              {deleteRoutineError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deleteRoutineError}
                </Alert>
              )}
              <Text color="gray.700">Esta acción eliminará la rutina seleccionada.</Text>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleDeleteRoutineConfirm}
                  isLoading={deleteRoutineLoading}
                >
                  Eliminar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => setDeleteRoutineModalOpen(false)}
                  isDisabled={deleteRoutineLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteAssignedRoutineModalOpen} onClose={() => setDeleteAssignedRoutineModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="420px">
            <ModalHeader>¿Eliminar rutina asignada?</ModalHeader>
            <ModalBody>
              {deleteAssignedRoutineError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deleteAssignedRoutineError}
                </Alert>
              )}
              <Text color="gray.700">Se eliminará la rutina activa asignada al alumno.</Text>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleDeleteAssignedRoutineConfirm}
                  isLoading={deleteAssignedRoutineLoading}
                >
                  Eliminar
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => setDeleteAssignedRoutineModalOpen(false)}
                  isDisabled={deleteAssignedRoutineLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={replaceAssignModalOpen} onClose={() => setReplaceAssignModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="560px">
            <ModalHeader>
              <Text textAlign="center">Este alumno ya tiene una rutina asignada.</Text>
              <Text textAlign="center">¿Desea eliminar la rutina y asignarle una nueva?</Text>
            </ModalHeader>
            <ModalBody>
              {replaceAssignError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {replaceAssignError}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleConfirmReplaceAndAssign}
                  isLoading={replaceAssignLoading}
                >
                  Eliminar y asignar rutina nueva
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => {
                    setReplaceAssignModalOpen(false);
                    setPendingAssignPayload(null);
                  }}
                  isDisabled={replaceAssignLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={preAssignConflictModalOpen} onClose={() => setPreAssignConflictModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="560px">
            <ModalHeader>
              <Text textAlign="center">Este alumno ya tiene una rutina asignada.</Text>
              <Text textAlign="center">¿Desea eliminar la rutina y asignarle una nueva?</Text>
            </ModalHeader>
            <ModalBody>
              {preAssignConflictError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {preAssignConflictError}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handlePreAssignDeleteAndContinue}
                  isLoading={preAssignConflictLoading}
                >
                  Eliminar y asignar rutina nueva
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => {
                    setPreAssignConflictModalOpen(false);
                    setPreAssignConflictStudent(null);
                    setPreAssignConflictAssignment(null);
                  }}
                  isDisabled={preAssignConflictLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="420px">
            <ModalHeader>¿Dar de baja alumno?</ModalHeader>
            <ModalBody>
              {deactivateError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deactivateError}
                </Alert>
              )}
              <Text color="gray.700">
                Se dará de baja a {deactivateStudent?.full_name || "este alumno"}.
              </Text>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleDeactivateConfirm}
                  isLoading={deactivateLoading}
                >
                  Dar de baja
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => setDeactivateModalOpen(false)}
                  isDisabled={deactivateLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={activateModalOpen} onClose={() => setActivateModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent maxW="420px">
            <ModalHeader>¿Dar de alta alumno?</ModalHeader>
            <ModalBody>
              {activateError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {activateError}
                </Alert>
              )}
              <Text color="gray.700">
                Se dará de alta a {activateStudent?.full_name || "este alumno"}.
              </Text>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleActivateConfirm}
                  isLoading={activateLoading}
                >
                  Dar de alta
                </Button>
                <Button
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _active={{ bg: "gray.900" }}
                  onClick={() => setActivateModalOpen(false)}
                  isDisabled={activateLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Box bgGradient="linear(to-b, gray.50, white)">
        <Container maxW="6xl" py={10}>
          <Stack spacing={8}>
            <HStack spacing={3}>
              <Button alignSelf="flex-start" variant="outline" onClick={() => setView("professor")}>
                Volver al panel
              </Button>
              {token && (
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </HStack>
            <Stack spacing={3}>
              <Heading size="lg">Entrenamientos de Arquería</Heading>
              <Text color="gray.600">
                Maqueta inicial: ejercicios, rutinas semanales y alumnos. Conectado a la API FastAPI en {" "}
                <Tag colorScheme="blue" variant="subtle">
                  {API_BASE}
                </Tag>
                .
              </Text>
            </Stack>

            {loading && (
              <HStack color="gray.600">
                <Spinner />
                <Text>Cargando datos...</Text>
              </HStack>
            )}

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <StatCard title="Estado API" value={health?.status === "ok" ? "Online" : "Desconocido"} icon={healthIcon} helper={health ? `Entorno: ${health.env}` : "Sin respuesta"} />
              <StatCard title="Ejercicios" value={stats.exercises.toString()} helper="Creados en la base" />
              <StatCard title="Rutinas" value={stats.routines.toString()} helper="Plantillas semanales" />
            </SimpleGrid>

            <Stack spacing={6}>
              <Heading size="md">Ejercicios</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {exercises.map((ex) => (
                  <Box key={ex.id} p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{ex.name}</Heading>
                      <Badge colorScheme={ex.is_active ? "green" : "gray"}>{ex.is_active ? "Activo" : "Inactivo"}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">{ex.description || "Sin Descripción"}</Text>
                    <HStack spacing={4} mt={3} color="gray.700" fontWeight="medium">
                      <Tag colorScheme="blue">{ex.distance_m} m</Tag>
                      <Tag colorScheme="purple">{ex.arrows_count} flechas</Tag>
                    </HStack>
                  </Box>
                ))}
                {!exercises.length && !loading && (
                  <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text color="gray.600">Sin ejercicios cargados.</Text>
                  </Box>
                )}
              </SimpleGrid>
            </Stack>

            <Stack spacing={6}>
              <Heading size="md">Rutinas semanales</Heading>
              <Stack spacing={4}>
                {routines.map((routine) => (
                  <Box key={routine.id} p={5} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{routine.name}</Heading>
                      <Badge colorScheme={routine.is_active ? "green" : "gray"}>{routine.is_active ? "Activa" : "Inactiva"}</Badge>
                    </HStack>
                    {routine.description && (
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        {routine.description}
                      </Text>
                    )}
                    <Divider my={2} />
                    <Stack spacing={3}>
                      {routine.days.map((day) => (
                        <Box key={day.id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold">{formatDay(day)}</Text>
                            <Tag colorScheme="blue">Día {day.day_number}</Tag>
                          </HStack>
                          <VStack align="start" spacing={2}>
                            {day.exercises.map((dex) => (
                              <HStack key={dex.id} spacing={2} align="center">
                                <Badge colorScheme="purple">Ej {dex.exercise_id}</Badge>
                                <Text fontSize="sm">Orden {dex.sort_order}</Text>
                                {dex.arrows_override && <Tag colorScheme="orange">{dex.arrows_override} flechas</Tag>}
                                {dex.distance_override_m && <Tag colorScheme="teal">{dex.distance_override_m} m</Tag>}
                              </HStack>
                            ))}
                            {!day.exercises.length && <Text fontSize="sm" color="gray.500">Sin ejercicios en este Día.</Text>}
                          </VStack>
                        </Box>
                      ))}
                      {!routine.days.length && (
                        <HStack color="gray.600">
                          <WarningIcon />
                          <Text fontSize="sm">Rutina sin Días configurados.</Text>
                        </HStack>
                      )}
                    </Stack>
                  </Box>
                ))}
                {!routines.length && !loading && (
                  <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text color="gray.600">Sin rutinas cargadas.</Text>
                  </Box>
                )}
              </Stack>
            </Stack>

            <Stack spacing={6}>
              <Heading size="md">Administrar rutinas</Heading>
              <Stack spacing={3}>
                {activeAssignments.map((assignment) => (
                  <Box key={assignment.id} p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                    <HStack justify="space-between" align="start">
                      <Stack spacing={1}>
                        <Text fontWeight="bold" color="gray.900">
                          {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                        </Text>
                        <Text color="gray.600" fontSize="sm">
                          Alumno: {studentNameById.get(assignment.student_id) || `Alumno #${assignment.student_id}`}
                        </Text>
                        <Text color="gray.500" fontSize="xs">
                          Semana: {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                        </Text>
                      </Stack>
                      <HStack spacing={2}>
                        <Badge colorScheme="green">Activa</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          borderRadius="xl"
                          borderColor="gray.300"
                          color="black"
                          _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                          onClick={() => {
                            setDeleteAssignedRoutineError(null);
                            setDeleteAssignedRoutineTarget(assignment);
                            setDeleteAssignedRoutineModalOpen(true);
                          }}
                        >
                          <Box
                            as="svg"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            boxSize="16px"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </Box>
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
                {!activeAssignments.length && !loading && (
                  <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text color="gray.600">No hay rutinas activas asignadas.</Text>
                  </Box>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
};

function StatCard({ title, value, helper, icon }: StatCardProps) {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="gray.500">
          {title}
        </Text>
        {icon}
      </HStack>
      <Heading size="md">{value}</Heading>
      {helper && (
        <Text fontSize="sm" color="gray.600" mt={1}>
          {helper}
        </Text>
      )}
    </Box>
  );
}

export default App;





