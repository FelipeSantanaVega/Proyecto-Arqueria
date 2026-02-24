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
  is_template?: boolean;
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

function toIsoLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayIsoLocal(): string {
  return toIsoLocal(new Date());
}

function getRoutineEndDateFromStart(startDate: string): string {
  const [yearRaw, monthRaw, dayRaw] = startDate.split("-").map(Number);
  if (!yearRaw || !monthRaw || !dayRaw) return startDate;
  const date = new Date(yearRaw, monthRaw - 1, dayRaw);
  date.setDate(date.getDate() + 6);
  return toIsoLocal(date);
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

function getStoredToken(): string | null {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token");
}

function App() {
  const [view, setView] = useState<"dashboard" | "login" | "professor">(() =>
    getStoredToken() ? "professor" : "login",
  );
  const [profSection, setProfSection] = useState<"administrar_rutinas" | "perfil" | "rutina" | "ejercicio" | "alumno">("administrar_rutinas");
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<number | null>(null);
  const [expandedActiveAssignment, setExpandedActiveAssignment] = useState<number | null>(null);
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
  const [routineModalStep, setRoutineModalStep] = useState<0 | 1 | 2 | 3>(0);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineDayCount, setRoutineDayCount] = useState(1);
  const [routineDayCursor, setRoutineDayCursor] = useState(0);
  const [routineExercisesByDay, setRoutineExercisesByDay] = useState<Record<string, number[]>>({});
  const [routineExerciseSearch, setRoutineExerciseSearch] = useState("");
  const [routineCreateExerciseOverridesByDay, setRoutineCreateExerciseOverridesByDay] = useState<
    Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>
  >({});
  const [routineCreateAddExerciseModalOpen, setRoutineCreateAddExerciseModalOpen] = useState(false);
  const [routineCreateAddExerciseDayKey, setRoutineCreateAddExerciseDayKey] = useState<string | null>(null);
  const [routineCreateAddExerciseSearch, setRoutineCreateAddExerciseSearch] = useState("");
  const [routineCreateEditExerciseModalOpen, setRoutineCreateEditExerciseModalOpen] = useState(false);
  const [routineCreateEditTarget, setRoutineCreateEditTarget] = useState<{ dayKey: string; exerciseId: number } | null>(null);
  const [routineCreateEditArrows, setRoutineCreateEditArrows] = useState<number | "">("");
  const [routineCreateEditDistance, setRoutineCreateEditDistance] = useState<number | "">("");
  const [routineCreateEditDescription, setRoutineCreateEditDescription] = useState("");
  const [deleteRoutineDayConfirmOpen, setDeleteRoutineDayConfirmOpen] = useState(false);
  const [deleteRoutineDayTargetNumber, setDeleteRoutineDayTargetNumber] = useState<number | null>(null);
  const [routineModalBodyHeight, setRoutineModalBodyHeight] = useState<number | null>(null);
  const [createRoutineLoading, setCreateRoutineLoading] = useState(false);
  const [createRoutineError, setCreateRoutineError] = useState<string | null>(null);
  const [assignRoutineModalOpen, setAssignRoutineModalOpen] = useState(false);
  const [assignRoutineStudent, setAssignRoutineStudent] = useState<Student | null>(null);
  const [assignRoutineStep, setAssignRoutineStep] = useState<"choice" | "existing_list" | "existing_preview" | "existing_dates">("choice");
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [assignRoutineError, setAssignRoutineError] = useState<string | null>(null);
  const [assignRoutineLoading, setAssignRoutineLoading] = useState(false);
  const [assignmentStartDate, setAssignmentStartDate] = useState<string>(getTodayIsoLocal());
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
  const [routineAssignDayCount, setRoutineAssignDayCount] = useState(1);
  const [routineAssignExercisesByDay, setRoutineAssignExercisesByDay] = useState<Record<string, number[]>>({});
  const [routineAssignExerciseOverridesByDay, setRoutineAssignExerciseOverridesByDay] = useState<
    Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>
  >({});
  const [addExerciseDayModalOpen, setAddExerciseDayModalOpen] = useState(false);
  const [addExerciseTargetDayKey, setAddExerciseTargetDayKey] = useState<string | null>(null);
  const [addExerciseSearch, setAddExerciseSearch] = useState("");
  const [editAssignExerciseModalOpen, setEditAssignExerciseModalOpen] = useState(false);
  const [editAssignExerciseTarget, setEditAssignExerciseTarget] = useState<{ dayKey: string; exerciseId: number } | null>(null);
  const [editAssignArrows, setEditAssignArrows] = useState<number | "">("");
  const [editAssignDistance, setEditAssignDistance] = useState<number | "">("");
  const [editAssignDescription, setEditAssignDescription] = useState("");
  const [deleteAssignDayConfirmOpen, setDeleteAssignDayConfirmOpen] = useState(false);
  const [deleteAssignDayTargetNumber, setDeleteAssignDayTargetNumber] = useState<number | null>(null);
  const [pendingScrollCreateSummaryToBottom, setPendingScrollCreateSummaryToBottom] = useState(false);
  const [pendingScrollAssignSummaryToBottom, setPendingScrollAssignSummaryToBottom] = useState(false);
  const routineStepRef = useRef<HTMLDivElement | null>(null);
  const addExerciseListRef = useRef<HTMLDivElement | null>(null);
  const routineSummaryListRef = useRef<HTMLDivElement | null>(null);
  const routineCreateAddExerciseListRef = useRef<HTMLDivElement | null>(null);
  const assignRoutineSummaryListRef = useRef<HTMLDivElement | null>(null);
  const assignmentStartDatePickerRef = useRef<HTMLInputElement | null>(null);
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
  const [adminAssignModalOpen, setAdminAssignModalOpen] = useState(false);
  const [adminAssignSearch, setAdminAssignSearch] = useState("");
  const [adminAssignSelectedStudentId, setAdminAssignSelectedStudentId] = useState<number | null>(null);
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
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [userRole, setUserRole] = useState<string | null>(() => parseRoleFromToken(getStoredToken()));
  const [rememberMe, setRememberMe] = useState<boolean>(() => localStorage.getItem("remember_me") !== "0");
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
      closeCreateExerciseModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreateExerciseModal = () => {
    setCreateModalOpen(false);
    setCreateName("");
    setCreateArrows("");
    setCreateDistance("");
    setCreateDescription("");
    setCreateError(null);
    setCreateLoading(false);
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

  const templateRoutines = useMemo(
    () => routines.filter((routine) => routine.is_template !== false),
    [routines],
  );
  const stats = useMemo(
    () => ({ exercises: exercises.length, routines: templateRoutines.length, students: students.length }),
    [exercises, templateRoutines.length, students],
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
  const adminAssignableStudents = useMemo(() => {
    const term = adminAssignSearch.trim().toLowerCase();
    if (!term) return activeStudents;
    return activeStudents.filter((student) => {
      const byName = student.full_name.toLowerCase().includes(term);
      const byDoc = student.document_number.toLowerCase().includes(term);
      const byContact = (student.contact || "").toLowerCase().includes(term);
      return byName || byDoc || byContact;
    });
  }, [activeStudents, adminAssignSearch]);
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

  const routineBuilderDays = useMemo(
    () =>
      Array.from({ length: Math.max(1, Math.min(7, routineDayCount)) }, (_, index) => ({
        key: `day_${index + 1}`,
        label: `Día ${index + 1}`,
        dayNumber: index + 1,
      })),
    [routineDayCount],
  );
  const routineAssignBuilderDays = useMemo(
    () =>
      Array.from({ length: Math.max(1, Math.min(7, routineAssignDayCount)) }, (_, index) => ({
        key: `day_${index + 1}`,
        label: `Día ${index + 1}`,
        dayNumber: index + 1,
      })),
    [routineAssignDayCount],
  );
  const currentRoutineDay = routineBuilderDays[routineDayCursor] || null;
  const currentRoutineDayKey = currentRoutineDay?.key || null;
  const currentRoutineDayLabel = currentRoutineDay?.label || "";
  const exerciseNameById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.name])), [exercises]);
  const exerciseArrowsById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.arrows_count])), [exercises]);
  const sortedRoutines = useMemo(
    () => [...templateRoutines].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [templateRoutines],
  );
  const routineModalMaxW = routineModalStep === 0 ? "520px" : routineModalStep === 1 ? "640px" : "760px";
  const routineModalMinHeight = routineModalStep === 0
    ? 320
    : routineModalStep === 1
      ? 220
      : routineModalStep === 2
        ? 300
        : Math.min(340 + Math.max(0, routineDayCount - 1) * 55, 760);
  const routineModalMaxBodyHeight = routineModalStep === 0 ? 420 : routineModalStep === 1 ? 420 : routineModalStep === 2 ? 620 : 760;
  const actionIconButtonSize = { base: "xs", xl: "sm", "2xl": "md" } as const;
  const actionIconSize = "15px";
  const filteredRoutineExercises = useMemo(() => {
    const term = routineExerciseSearch.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((ex) => {
      const byName = ex.name.toLowerCase().includes(term);
      const byArrows = String(ex.arrows_count).includes(term);
      return byName || byArrows;
    });
  }, [exercises, routineExerciseSearch]);
  const routineSummaryListMaxH = Math.max(
    240,
    Math.min(520, 240 + (routineDayCount - 1) * 55),
  );
  const routineAssignSummaryListMaxH = Math.max(
    240,
    Math.min(520, 240 + (routineAssignDayCount - 1) * 55),
  );

  useLayoutEffect(() => {
    if (!createRoutineModalOpen || !routineStepRef.current) return;
    if (routineModalStep === 0) {
      setRoutineModalBodyHeight(routineModalMinHeight);
      return;
    }
    const contentHeight = Math.ceil(routineStepRef.current.scrollHeight + 48);
    const nextHeight = Math.max(
      routineModalMinHeight,
      Math.min(routineModalMaxBodyHeight, contentHeight),
    );
    setRoutineModalBodyHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [
    createRoutineModalOpen,
    routineModalStep,
    routineName,
    routineDayCount,
    routineDayCursor,
    routineExerciseSearch,
    routineCreateAddExerciseSearch,
    filteredRoutineExercises.length,
    currentRoutineDayKey,
    routineModalMinHeight,
    routineModalMaxBodyHeight,
    routineExercisesByDay,
    routineCreateExerciseOverridesByDay,
  ]);

  useEffect(() => {
    if (!createRoutineModalOpen || !routineStepRef.current || typeof ResizeObserver === "undefined") return;
    if (routineModalStep === 0) return;
    const node = routineStepRef.current;
    const observer = new ResizeObserver(() => {
      const contentHeight = Math.ceil(node.scrollHeight + 48);
      const nextHeight = Math.max(
        routineModalMinHeight,
        Math.min(routineModalMaxBodyHeight, contentHeight),
      );
      setRoutineModalBodyHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [createRoutineModalOpen, routineModalStep, routineDayCursor, routineModalMinHeight, routineModalMaxBodyHeight]);

  const assignmentEndDate = useMemo(
    () => getRoutineEndDateFromStart(assignmentStartDate),
    [assignmentStartDate],
  );

  const getRoutineDayArrows = (day: RoutineDay) =>
    day.exercises.reduce((sum, dayExercise) => {
      if (typeof dayExercise.arrows_override === "number") return sum + dayExercise.arrows_override;
      return sum + (exerciseArrowsById.get(dayExercise.exercise_id) || 0);
    }, 0);

  const getRoutineWeekArrows = (routine: Routine) => routine.days.reduce((sum, day) => sum + getRoutineDayArrows(day), 0);

  const openAdminAssignModal = () => {
    setAdminAssignSearch("");
    setAdminAssignSelectedStudentId(null);
    setAdminAssignModalOpen(true);
  };

  const closeAdminAssignModal = () => {
    setAdminAssignModalOpen(false);
    setAdminAssignSearch("");
    setAdminAssignSelectedStudentId(null);
  };

  const handleAdminAssignContinue = () => {
    if (!adminAssignSelectedStudentId) return;
    const student = students.find((value) => value.id === adminAssignSelectedStudentId && value.is_active);
    if (!student) return;
    setAdminAssignModalOpen(false);
    openAssignRoutineModal(student);
  };

  const resetAssignRoutineDraft = () => {
    setRoutineAssignDayCount(1);
    setRoutineAssignExercisesByDay({});
    setRoutineAssignExerciseOverridesByDay({});
    setAddExerciseDayModalOpen(false);
    setAddExerciseTargetDayKey(null);
    setAddExerciseSearch("");
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseTarget(null);
    setDeleteAssignDayConfirmOpen(false);
    setDeleteAssignDayTargetNumber(null);
  };

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
    setAssignmentStartDate(getTodayIsoLocal());
    resetAssignRoutineDraft();
    setAssignRoutineModalOpen(true);
  };

  const closeAssignRoutineModal = () => {
    setAssignRoutineModalOpen(false);
    setAssignRoutineStudent(null);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setAssignmentStartDate(getTodayIsoLocal());
    resetAssignRoutineDraft();
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
      setAssignmentStartDate(getTodayIsoLocal());
      resetAssignRoutineDraft();
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
      if (rememberMe) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("remember_me", "1");
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", data.access_token);
        localStorage.removeItem("token");
        localStorage.setItem("remember_me", "0");
      }
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
    sessionStorage.removeItem("token");
    setUsername("");
    setPassword("");
    setStudents([]);
    setView("login");
  };

  const openCreateRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineName("");
    setRoutineDayCount(1);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineCreateExerciseOverridesByDay({});
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    setDeleteRoutineDayConfirmOpen(false);
    setDeleteRoutineDayTargetNumber(null);
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setRoutineModalStep(0);
    setCreateRoutineModalOpen(true);
  };

  const closeCreateRoutineModal = () => {
    setCreateRoutineModalOpen(false);
    setRoutineModalStep(0);
    setRoutineDayCount(1);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineCreateExerciseOverridesByDay({});
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    setDeleteRoutineDayConfirmOpen(false);
    setDeleteRoutineDayTargetNumber(null);
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setCreateRoutineLoading(false);
    setEditingRoutineId(null);
    setRoutineAssignStudentId(null);
  };

  const openEditRoutineModal = (routine: Routine) => {
    const sortedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
    const exercisesByDay: Record<string, number[]> = {};
    const overridesByDay: Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
    for (const day of sortedDays) {
      const key = `day_${day.day_number}`;
      exercisesByDay[key] = [...day.exercises]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((exercise) => exercise.exercise_id);
      for (const exercise of day.exercises) {
        const hasOverride =
          exercise.arrows_override !== null ||
          exercise.distance_override_m !== null ||
          (exercise.notes || "").trim() !== "";
        if (!hasOverride) continue;
        overridesByDay[key] = overridesByDay[key] || {};
        overridesByDay[key][exercise.exercise_id] = {
          arrows_override: exercise.arrows_override,
          distance_override_m: exercise.distance_override_m,
          description_override: exercise.notes || null,
        };
      }
    }
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setRoutineDayCount(Math.max(1, Math.min(7, sortedDays.length || 1)));
    setRoutineExercisesByDay(exercisesByDay);
    setRoutineCreateExerciseOverridesByDay(overridesByDay);
    setRoutineDayCursor(0);
    setRoutineExerciseSearch("");
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    setDeleteRoutineDayConfirmOpen(false);
    setDeleteRoutineDayTargetNumber(null);
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setCreateRoutineLoading(false);
    setRoutineModalStep(0);
    setCreateRoutineModalOpen(true);
  };

  const toggleRoutineExerciseForDay = (dayKey: string, exerciseId: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      const next = current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId];
      return { ...prev, [dayKey]: next };
    });
  };

  const handleRoutineExerciseContinue = async () => {
    if (!currentRoutineDayKey) return;
    const selectedForDay = routineExercisesByDay[currentRoutineDayKey] || [];
    if (selectedForDay.length === 0) {
      setCreateRoutineError("Selecciona al menos un ejercicio para este día.");
      return;
    }
    if (routineDayCursor < routineBuilderDays.length - 1) {
      setRoutineDayCursor((prev) => prev + 1);
      setRoutineExerciseSearch("");
      setCreateRoutineError(null);
      return;
    }
    setCreateRoutineError(null);
    setRoutineModalStep(3);
  };

  const handleCreateOrUpdateRoutineFromSummary = async () => {
    if (!token) {
      setCreateRoutineError("Sesión inválida.");
      return;
    }
    try {
      setCreateRoutineLoading(true);
      setCreateRoutineError(null);
      const payload = {
        name: routineName.trim(),
        description: null,
        is_active: true,
        is_template: editingRoutineId
          ? (routines.find((routine) => routine.id === editingRoutineId)?.is_template ?? true)
          : routineAssignStudentId
            ? false
            : true,
        days: routineBuilderDays.map((day) => ({
          day_number: day.dayNumber,
          name: day.label,
          exercises: (routineExercisesByDay[day.key] || []).map((exerciseId, idx) => ({
            exercise_id: exerciseId,
            sort_order: idx + 1,
            arrows_override: routineCreateExerciseOverridesByDay[day.key]?.[exerciseId]?.arrows_override ?? null,
            distance_override_m: routineCreateExerciseOverridesByDay[day.key]?.[exerciseId]?.distance_override_m ?? null,
            notes: routineCreateExerciseOverridesByDay[day.key]?.[exerciseId]?.description_override ?? null,
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
          await tryCreateAssignment({
            student_id: routineAssignStudentId,
            routine_id: createdRoutine.id,
            start_date: assignmentStartDate,
            end_date: assignmentEndDate,
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

  const openRoutineCreateAddExercise = (dayKey: string) => {
    setRoutineCreateAddExerciseDayKey(dayKey);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateAddExerciseModalOpen(true);
  };

  const addExerciseToRoutineSummaryDay = (dayKey: string, exerciseId: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      if (current.includes(exerciseId)) return prev;
      return { ...prev, [dayKey]: [...current, exerciseId] };
    });
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
  };

  const handleAddRoutineDay = () => {
    if (routineDayCount >= 7) return;
    const nextCount = routineDayCount + 1;
    const nextKey = `day_${nextCount}`;
    setRoutineDayCount(nextCount);
    setRoutineExercisesByDay((prev) => ({ ...prev, [nextKey]: prev[nextKey] || [] }));
    setPendingScrollCreateSummaryToBottom(true);
  };

  const requestDeleteRoutineDay = (dayNumber: number) => {
    if (routineDayCount <= 1) return;
    setDeleteRoutineDayTargetNumber(dayNumber);
    setDeleteRoutineDayConfirmOpen(true);
  };

  const confirmDeleteRoutineDay = () => {
    if (!deleteRoutineDayTargetNumber || routineDayCount <= 1) {
      setDeleteRoutineDayConfirmOpen(false);
      setDeleteRoutineDayTargetNumber(null);
      return;
    }
    const target = deleteRoutineDayTargetNumber;
    const nextCount = Math.max(1, routineDayCount - 1);

    setRoutineExercisesByDay((prev) => {
      const next: Record<string, number[]> = {};
      let writeIdx = 1;
      for (let readIdx = 1; readIdx <= routineDayCount; readIdx++) {
        if (readIdx === target) continue;
        next[`day_${writeIdx}`] = [...(prev[`day_${readIdx}`] || [])];
        writeIdx += 1;
      }
      return next;
    });

    setRoutineCreateExerciseOverridesByDay((prev) => {
      const next: Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
      let writeIdx = 1;
      for (let readIdx = 1; readIdx <= routineDayCount; readIdx++) {
        if (readIdx === target) continue;
        const source = prev[`day_${readIdx}`];
        if (source) next[`day_${writeIdx}`] = { ...source };
        writeIdx += 1;
      }
      return next;
    });

    setRoutineDayCount(nextCount);
    setRoutineDayCursor((prev) => Math.min(prev, nextCount - 1));
    setDeleteRoutineDayConfirmOpen(false);
    setDeleteRoutineDayTargetNumber(null);
  };

  const openRoutineCreateEditExercise = (dayKey: string, exerciseId: number) => {
    const base = exercises.find((ex) => ex.id === exerciseId);
    const override = routineCreateExerciseOverridesByDay[dayKey]?.[exerciseId];
    setRoutineCreateEditTarget({ dayKey, exerciseId });
    setRoutineCreateEditArrows(override?.arrows_override ?? base?.arrows_count ?? "");
    setRoutineCreateEditDistance(override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "");
    setRoutineCreateEditDescription(override?.description_override ?? base?.description ?? "");
    setRoutineCreateEditExerciseModalOpen(true);
  };

  const saveRoutineCreateEditExercise = () => {
    if (!routineCreateEditTarget) return;
    setRoutineCreateExerciseOverridesByDay((prev) => ({
      ...prev,
      [routineCreateEditTarget.dayKey]: {
        ...(prev[routineCreateEditTarget.dayKey] || {}),
        [routineCreateEditTarget.exerciseId]: {
          arrows_override: routineCreateEditArrows === "" ? null : Number(routineCreateEditArrows),
          distance_override_m: routineCreateEditDistance === "" ? null : Number(routineCreateEditDistance),
          description_override: routineCreateEditDescription || null,
        },
      },
    }));
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
  };

  const removeExerciseFromRoutineSummaryDay = (dayKey: string, exerciseId: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      return { ...prev, [dayKey]: current.filter((id) => id !== exerciseId) };
    });
    setRoutineCreateExerciseOverridesByDay((prev) => {
      const dayOverrides = prev[dayKey] || {};
      if (!(exerciseId in dayOverrides)) return prev;
      const nextDayOverrides = { ...dayOverrides };
      delete nextDayOverrides[exerciseId];
      return { ...prev, [dayKey]: nextDayOverrides };
    });
  };

  const handleRoutineSummaryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const node = routineSummaryListRef.current;
    if (!node) return;
    node.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRoutineCreateAddExerciseListWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const node = routineCreateAddExerciseListRef.current;
    if (!node) return;
    node.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAssignRoutineSummaryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const node = assignRoutineSummaryListRef.current;
    if (!node) return;
    node.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!pendingScrollCreateSummaryToBottom || routineModalStep !== 3) return;
    const node = routineSummaryListRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
      setPendingScrollCreateSummaryToBottom(false);
    });
  }, [pendingScrollCreateSummaryToBottom, routineDayCount, routineModalStep]);

  useEffect(() => {
    if (!pendingScrollAssignSummaryToBottom || assignRoutineStep !== "existing_preview") return;
    const node = assignRoutineSummaryListRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
      setPendingScrollAssignSummaryToBottom(false);
    });
  }, [pendingScrollAssignSummaryToBottom, routineAssignDayCount, assignRoutineStep]);

  const handleChooseCreateRoutineForStudent = () => {
    if (!assignRoutineStudent) return;
    setRoutineAssignStudentId(assignRoutineStudent.id);
    setAssignmentStartDate(getTodayIsoLocal());
    setAssignRoutineModalOpen(false);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    resetAssignRoutineDraft();
    openCreateRoutineModal();
  };

  const handleBackToAssignOptionsFromCreate = () => {
    if (!assignRoutineStudent) return;
    closeCreateRoutineModal();
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setAssignmentStartDate(getTodayIsoLocal());
    setAssignRoutineModalOpen(true);
  };

  const handleChooseExistingRoutineList = () => {
    setAssignRoutineStep("existing_list");
    setSelectedRoutineToAssign(null);
    setAssignRoutineError(null);
    resetAssignRoutineDraft();
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
    const orderedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
    const nextExercisesByDay: Record<string, number[]> = {};
    const nextOverridesByDay: Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
    orderedDays.forEach((day, index) => {
      const dayKey = `day_${index + 1}`;
      nextExercisesByDay[dayKey] = day.exercises
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((ex) => ex.exercise_id);
      day.exercises.forEach((ex) => {
        const hasOverride = ex.arrows_override !== null || ex.distance_override_m !== null || (ex.notes || "").trim() !== "";
        if (!hasOverride) return;
        nextOverridesByDay[dayKey] = nextOverridesByDay[dayKey] || {};
        nextOverridesByDay[dayKey][ex.exercise_id] = {
          arrows_override: ex.arrows_override,
          distance_override_m: ex.distance_override_m,
          description_override: ex.notes || null,
        };
      });
    });
    setSelectedRoutineToAssign(routine);
    setAssignRoutineStep("existing_preview");
    setAssignRoutineError(null);
    setRoutineAssignDayCount(Math.max(1, Math.min(7, orderedDays.length || 1)));
    setRoutineAssignExercisesByDay(nextExercisesByDay);
    setRoutineAssignExerciseOverridesByDay(nextOverridesByDay);
    setDeleteAssignDayConfirmOpen(false);
    setDeleteAssignDayTargetNumber(null);
  };

  const openEditAssignExercise = (dayKey: string, exerciseId: number) => {
    const base = exercises.find((ex) => ex.id === exerciseId);
    const override = routineAssignExerciseOverridesByDay[dayKey]?.[exerciseId];
    setEditAssignExerciseTarget({ dayKey, exerciseId });
    setEditAssignArrows(override?.arrows_override ?? base?.arrows_count ?? "");
    setEditAssignDistance(override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "");
    setEditAssignDescription(override?.description_override ?? base?.description ?? "");
    setEditAssignExerciseModalOpen(true);
  };

  const openAddExerciseForDay = (dayKey: string) => {
    setAddExerciseTargetDayKey(dayKey);
    setAddExerciseSearch("");
    setAddExerciseDayModalOpen(true);
  };

  const addTemporaryExerciseToDay = (dayKey: string, exerciseId: number) => {
    setRoutineAssignExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      if (current.includes(exerciseId)) return prev;
      return { ...prev, [dayKey]: [...current, exerciseId] };
    });
    setAddExerciseDayModalOpen(false);
    setAddExerciseTargetDayKey(null);
    setAddExerciseSearch("");
  };

  const handleAddExerciseListWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const node = addExerciseListRef.current;
    if (!node) return;
    node.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  };

  const saveEditAssignExercise = () => {
    if (!editAssignExerciseTarget) return;
    setRoutineAssignExerciseOverridesByDay((prev) => ({
      ...prev,
      [editAssignExerciseTarget.dayKey]: {
        ...(prev[editAssignExerciseTarget.dayKey] || {}),
        [editAssignExerciseTarget.exerciseId]: {
          arrows_override: editAssignArrows === "" ? null : Number(editAssignArrows),
          distance_override_m: editAssignDistance === "" ? null : Number(editAssignDistance),
          description_override: editAssignDescription || null,
        },
      },
    }));
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseTarget(null);
  };

  const addAssignRoutineDay = () => {
    if (routineAssignDayCount >= 7) return;
    const nextCount = routineAssignDayCount + 1;
    const nextKey = `day_${nextCount}`;
    setRoutineAssignDayCount(nextCount);
    setRoutineAssignExercisesByDay((prev) => ({ ...prev, [nextKey]: prev[nextKey] || [] }));
    setPendingScrollAssignSummaryToBottom(true);
  };

  const requestDeleteAssignRoutineDay = (dayNumber: number) => {
    if (routineAssignDayCount <= 1) return;
    setDeleteAssignDayTargetNumber(dayNumber);
    setDeleteAssignDayConfirmOpen(true);
  };

  const confirmDeleteAssignRoutineDay = () => {
    if (!deleteAssignDayTargetNumber || routineAssignDayCount <= 1) return;
    const target = deleteAssignDayTargetNumber;
    const nextCount = routineAssignDayCount - 1;
    setRoutineAssignExercisesByDay((prev) => {
      const next: Record<string, number[]> = {};
      let writeIdx = 1;
      for (let readIdx = 1; readIdx <= routineAssignDayCount; readIdx++) {
        if (readIdx === target) continue;
        next[`day_${writeIdx}`] = [...(prev[`day_${readIdx}`] || [])];
        writeIdx += 1;
      }
      return next;
    });
    setRoutineAssignExerciseOverridesByDay((prev) => {
      const next: Record<string, Record<number, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
      let writeIdx = 1;
      for (let readIdx = 1; readIdx <= routineAssignDayCount; readIdx++) {
        if (readIdx === target) continue;
        const source = prev[`day_${readIdx}`];
        if (source) next[`day_${writeIdx}`] = { ...source };
        writeIdx += 1;
      }
      return next;
    });
    setRoutineAssignDayCount(nextCount);
    setDeleteAssignDayConfirmOpen(false);
    setDeleteAssignDayTargetNumber(null);
  };

  const removeAssignExerciseFromDay = (dayKey: string, exerciseId: number) => {
    setRoutineAssignExercisesByDay((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((id) => id !== exerciseId),
    }));
    setRoutineAssignExerciseOverridesByDay((prev) => {
      const dayOverrides = prev[dayKey] || {};
      if (!(exerciseId in dayOverrides)) return prev;
      const nextDayOverrides = { ...dayOverrides };
      delete nextDayOverrides[exerciseId];
      return { ...prev, [dayKey]: nextDayOverrides };
    });
  };

  const handleAssignExistingRoutine = async () => {
    if (!token || !assignRoutineStudent || !selectedRoutineToAssign) return;
    setAssignRoutineLoading(true);
    setAssignRoutineError(null);
    try {
      const ok = await tryCreateAssignment({
        student_id: assignRoutineStudent.id,
        routine_id: selectedRoutineToAssign.id,
        start_date: assignmentStartDate,
        end_date: assignmentEndDate,
        status: "active",
        notes: JSON.stringify({
          temporary_day_count: routineAssignDayCount,
          temporary_exercises_by_day: routineAssignExercisesByDay,
          temporary_exercise_overrides_by_day: routineAssignExerciseOverridesByDay,
        }),
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
        <Box
          minH="100vh"
          bg="#f3f4f6"
          px={{ base: 4, md: 8 }}
          py={{ base: 6, md: 8 }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box w="full" maxW="640px">
            <Stack spacing={6} align="center">
              <Box
                w="120px"
                h="120px"
                borderRadius="full"
                bg="#0d1b2a"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                boxShadow="0 8px 24px rgba(0,0,0,0.12)"
                border="3px solid white"
              >
                <Image src={archeryImg} alt="Arqueros Andinos" w="full" h="full" objectFit="cover" />
              </Box>
              <Box
                w="full"
                maxW="460px"
                bg="white"
                borderRadius="14px"
                border="1px solid"
                borderColor="gray.200"
                boxShadow="0 18px 35px rgba(0,0,0,0.10)"
                overflow="hidden"
              >
                <Box px={{ base: 6, md: 7 }} py={{ base: 6, md: 7 }}>
                  <Stack spacing={5}>
                    <Heading size="md" color="#1f2937">
                      Iniciar Sesión
                    </Heading>
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
                        <FormLabel color="gray.700" mb={1.5} fontSize="sm">
                          Usuario
                        </FormLabel>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          bg="#f9fafb"
                          borderColor="#d1d5db"
                          borderRadius="8px"
                          h="42px"
                          _hover={{ borderColor: "gray.400" }}
                          _focusVisible={{ borderColor: "#d97706", boxShadow: "0 0 0 1px #d97706" }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color="gray.700" mb={1.5} fontSize="sm">
                          Contraseña
                        </FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="#f9fafb"
                          borderColor="#d1d5db"
                          borderRadius="8px"
                          h="42px"
                          _hover={{ borderColor: "gray.400" }}
                          _focusVisible={{ borderColor: "#d97706", boxShadow: "0 0 0 1px #d97706" }}
                        />
                      </FormControl>

                      <HStack justify="space-between" fontSize="sm" color="gray.600">
                        <HStack spacing={2}>
                          <Text>Recordarme</Text>
                          <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} colorScheme="orange" />
                        </HStack>
                        <Text color="#d97706" fontWeight="500">
                          ¿Olvidaste tu contraseña?
                        </Text>
                      </HStack>

                      {authError && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          {authError}
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        bg="#d97706"
                        color="white"
                        _hover={{ bg: "#b45309" }}
                        _active={{ bg: "#92400e" }}
                        h="44px"
                        borderRadius="8px"
                        fontWeight="600"
                        isLoading={authLoading}
                        isDisabled={!username || !password}
                      >
                        Ingresar
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
                <Box h="4px" bg="linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)" />
              </Box>
            </Stack>
          </Box>
        </Box>
      </>
    );
  }

  if (view === "professor") {
    return (
      <>
        <Grid templateColumns={{ base: "1fr", md: "250px 1fr" }} minH="100vh" bg="#f9fafb">
          <GridItem
            borderRight={{ base: "none", md: "1px solid" }}
            borderColor="gray.200"
            bg="white"
            p={{ base: 5, md: 4 }}
            position={{ base: "static", md: "sticky" }}
            top={{ base: "auto", md: 0 }}
            h={{ base: "auto", md: "100vh" }}
            alignSelf="start"
            display="flex"
            flexDirection="column"
          >
            <Stack spacing={5} h="full">
              <Heading size="lg" color="gray.900" lineHeight="1.1" px={2} pt={2}>
                Panel
                <br />
                profesor
              </Heading>
              <Stack spacing={1}>
                <HStack
                  px={3}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "administrar_rutinas" ? "orange.50" : "transparent"}
                  color={profSection === "administrar_rutinas" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "administrar_rutinas" ? "600" : "500"}
                  cursor="pointer"
                  onClick={() => setProfSection("administrar_rutinas")}
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
                    <rect width="7" height="18" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                  </Box>
                  <Text fontSize="17px">Administrar rutinas</Text>
                </HStack>
                <HStack
                  px={3}
                  py={3}
                  borderRadius="md"
                  color={profSection === "rutina" ? "gray.900" : "gray.700"}
                  fontWeight={profSection === "rutina" ? "600" : "500"}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => setProfSection("rutina")}
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
                    <path d="M8 2v4" />
                    <path d="M12 2v4" />
                    <path d="M16 2v4" />
                    <rect width="16" height="18" x="4" y="4" rx="2" />
                    <path d="M8 10h6" />
                    <path d="M8 14h8" />
                    <path d="M8 18h5" />
                  </Box>
                  <Text fontSize="17px">Rutinas</Text>
                </HStack>
                <HStack
                  px={3}
                  py={3}
                  borderRadius="md"
                  color={profSection === "ejercicio" ? "gray.900" : "gray.700"}
                  fontWeight={profSection === "ejercicio" ? "600" : "500"}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => setProfSection("ejercicio")}
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </Box>
                  <Text fontSize="17px">Ejercicios</Text>
                </HStack>
                <HStack
                  px={3}
                  py={3}
                  borderRadius="md"
                  color={profSection === "alumno" ? "gray.900" : "gray.700"}
                  fontWeight={profSection === "alumno" ? "600" : "500"}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => setProfSection("alumno")}
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="9" cy="7" r="4" />
                  </Box>
                  <Text fontSize="17px">Alumnos</Text>
                </HStack>
              </Stack>
              <Stack spacing={3}>
                {userRole === "admin" && (
                  <Button size="sm" variant="outline" onClick={() => setView("dashboard")}>
                    Ver conexiones
                  </Button>
                )}
              </Stack>
              <Box flex="1" />
              <Box borderTop="1px solid" borderColor="gray.200" pt={3}>
                <HStack px={2} py={2.5} borderRadius="md" cursor="pointer" _hover={{ bg: "gray.50" }} onClick={() => setProfSection("perfil")}>
                  <Text fontSize="17px">◉</Text>
                  <Text fontSize="17px" color="gray.700" fontWeight={profSection === "perfil" ? "600" : "500"}>
                    Perfil
                  </Text>
                </HStack>
                <HStack px={2} py={2.5} borderRadius="md" cursor="pointer" _hover={{ bg: "gray.50" }} onClick={handleLogout}>
                  <Text fontSize="17px">↪</Text>
                  <Text fontSize="17px" color="gray.700" fontWeight="500">
                    Cerrar sesión
                  </Text>
                </HStack>
              </Box>
            </Stack>
          </GridItem>
          <GridItem pl={{ base: 6, md: 8 }} pr={{ base: 6, md: 8 }} py={{ base: 6, md: 7 }} display="flex" alignItems="flex-start" justifyContent="flex-start" w="full" fontSize={{ base: "sm", xl: "md", "2xl": "lg" }}>
            <Stack spacing={{ base: 4, xl: 6 }} w="full">
              {profSection === "administrar_rutinas" && (
                <Stack spacing={6} maxW="980px">
                  <HStack justify="space-between" align="flex-start">
                    <Stack spacing={1}>
                      <Heading size="lg">Rutinas activas</Heading>
                      <Text color="gray.500" fontSize="sm">
                        Gestiona y supervisa el progreso de tus arqueros.
                      </Text>
                    </Stack>
                    <Button bg="#d97706" color="white" borderRadius="md" px={5} _hover={{ bg: "#b45309" }} _active={{ bg: "#92400e" }} onClick={openAdminAssignModal}>
                      <HStack spacing={2}>
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
                          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <path d="M9 14h6" />
                          <path d="M12 17v-6" />
                        </Box>
                        <Text>Asignar rutina</Text>
                      </HStack>
                    </Button>
                  </HStack>
                  <Stack spacing={4}>
                    {activeAssignments.map((assignment) => {
                      const routine = routines.find((r) => r.id === assignment.routine_id);
                      const orderedDays = routine ? [...routine.days].sort((a, b) => a.day_number - b.day_number) : [];
                      return (
                        <Box key={assignment.id} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" overflow="hidden">
                          <Box p={6}>
                            <HStack justify="space-between" align="start" mb={4}>
                              <Stack spacing={1}>
                                <Heading size="md" color="gray.900">
                                  {studentNameById.get(assignment.student_id) || `Alumno #${assignment.student_id}`}
                                </Heading>
                                <Text color="gray.600" fontSize="sm" fontWeight="medium">
                                  {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                                </Text>
                                <Text color="gray.400" fontSize="xs">
                                  Semana: {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                                </Text>
                              </Stack>
                              <Badge bg="green.100" color="green.800" borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="700">
                                ACTIVA
                              </Badge>
                            </HStack>
                            <Stack spacing={5}>
                              {orderedDays.map((day) => (
                                <Box key={day.id} pl={3} borderLeft="2px solid" borderColor="gray.200">
                                  <HStack justify="space-between" align="start" mb={1}>
                                    <Text color="gray.800" fontWeight="semibold">
                                      {day.name || formatDay(day)}
                                    </Text>
                                    <Text color="gray.400" fontSize="xs">
                                      Flechas totales: {getRoutineDayArrows(day)}
                                    </Text>
                                  </HStack>
                                  <Stack as="ul" spacing={1}>
                                    {day.exercises.map((dayExercise) => (
                                      <HStack as="li" key={dayExercise.id} align="flex-start" spacing={2}>
                                        <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="orange.400" flexShrink={0} />
                                        <Text fontSize="sm" color="gray.600">
                                          {exerciseNameById.get(dayExercise.exercise_id) || `Ejercicio #${dayExercise.exercise_id}`}
                                        </Text>
                                      </HStack>
                                    ))}
                                  </Stack>
                                </Box>
                              ))}
                              {!routine && <Text color="gray.500">No se encontró la rutina asociada.</Text>}
                            </Stack>
                          </Box>
                          <HStack justify="flex-end" spacing={2} px={6} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                            <Button
                              size={actionIconButtonSize}
                              variant="ghost"
                              color="gray.400"
                              _hover={{ bg: "gray.100", color: "gray.700" }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              aria-label="Exportar rutina"
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
                                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                                <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                                <path d="M10 9H8" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                              </Box>
                            </Button>
                            <Button
                              size={actionIconButtonSize}
                              variant="ghost"
                              color="gray.400"
                              _hover={{ bg: "gray.100", color: "red.600" }}
                              onClick={() => {
                                setDeleteAssignedRoutineError(null);
                                setDeleteAssignedRoutineTarget(assignment);
                                setDeleteAssignedRoutineModalOpen(true);
                              }}
                              aria-label="Eliminar rutina activa"
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
                        </Box>
                      );
                    })}
                    {!activeAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
                  </Stack>
                </Stack>
              )}
              {profSection === "rutina" && (
                <Stack spacing={6}>
                  <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
                    <Stack spacing={1}>
                      <Heading size="lg">Rutinas</Heading>
                      <Text color="gray.500" fontSize="sm">
                        Gestiona tus rutinas predefinidas.
                      </Text>
                    </Stack>
                    <Button
                      bg="#f97316"
                      color="white"
                      borderRadius="10px"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      onClick={openCreateRoutineModal}
                    >
                      <HStack justify="center" spacing={2}>
                        <Image src={notebookTabsIconUrl} alt="Agregar rutina" boxSize="16px" filter="brightness(0) invert(1)" />
                        <Text>Agregar rutina</Text>
                      </HStack>
                    </Button>
                  </HStack>
                  <Stack spacing={4} w="full" maxW="980px">
                    {sortedRoutines.map((routine) => {
                      const orderedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
                      const daysPreview = `${orderedDays.length} Días`;
                      const weekArrowsTotal = getRoutineWeekArrows(routine);
                      const isExpanded = expandedRoutine === routine.id;
                      return (
                        <Box
                          key={routine.id}
                          borderWidth="1px"
                          borderRadius="12px"
                          borderColor="gray.200"
                          bg="white"
                          overflow="hidden"
                          _hover={{ borderColor: "gray.300", cursor: "pointer" }}
                          onClick={() => setExpandedRoutine((prev) => (prev === routine.id ? null : routine.id))}
                        >
                          <Box p={{ base: 4, xl: 5 }}>
                            <Stack spacing={1.5}>
                              <HStack justify="space-between" align="flex-start" w="full" spacing={4}>
                                <Heading size="md" color="gray.900">
                                  {routine.name}
                                </Heading>
                                <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                                  Flechas totales: {weekArrowsTotal}
                                </Text>
                              </HStack>
                              <Text color="gray.500">{daysPreview}</Text>
                              <Collapse in={isExpanded} animateOpacity>
                                <Stack spacing={4} pt={2}>
                                  {orderedDays.map((day) => (
                                    <Box key={day.id} pl={3} borderLeft="2px solid" borderColor="gray.200">
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
                                      <Stack as="ul" spacing={0.75} mt={1}>
                                        {day.exercises.map((dayExercise) => (
                                          <HStack as="li" key={dayExercise.id} align="flex-start" spacing={2}>
                                            <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="orange.400" flexShrink={0} />
                                            <Text fontSize="sm" color="gray.500">
                                              {exerciseNameById.get(dayExercise.exercise_id) || `Ejercicio #${dayExercise.exercise_id}`}
                                            </Text>
                                          </HStack>
                                        ))}
                                        {!day.exercises.length && (
                                          <HStack as="li" align="flex-start" spacing={2}>
                                            <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="gray.300" flexShrink={0} />
                                            <Text fontSize="sm" color="gray.500">
                                              Sin ejercicios
                                            </Text>
                                          </HStack>
                                        )}
                                      </Stack>
                                    </Box>
                                  ))}
                                </Stack>
                              </Collapse>
                            </Stack>
                          </Box>
                          <Collapse in={isExpanded} animateOpacity>
                            <HStack justify="flex-start" spacing={2} px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                              <Button
                                size={actionIconButtonSize}
                                variant="ghost"
                                color="gray.400"
                                _hover={{ bg: "gray.100", color: "blue.600" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditRoutineModal(routine);
                                }}
                              >
                                <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                              </Button>
                              <Button
                                size={actionIconButtonSize}
                                variant="ghost"
                                color="gray.400"
                                _hover={{ bg: "red.50", color: "red.600" }}
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
                                  boxSize={actionIconSize}
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
                          </Collapse>
                        </Box>
                      );
                    })}
                    {!sortedRoutines.length && <Text color="gray.600">No hay rutinas para mostrar.</Text>}
                  </Stack>
                </Stack>
              )}
              {profSection === "ejercicio" && (
                <Stack spacing={6}>
                  <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
                    <InputGroup maxW="420px">
                      <InputLeftElement pointerEvents="none" color="gray.500">
                        <SearchIcon boxSize={3.5} />
                      </InputLeftElement>
                      <Input
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        placeholder="Buscar ejercicios"
                        bg="white"
                        borderColor="gray.300"
                        borderRadius="10px"
                        _hover={{ borderColor: "gray.400" }}
                        _focus={{ borderColor: "gray.500", bg: "white" }}
                      />
                    </InputGroup>
                    <Button
                      bg="#f97316"
                      color="white"
                      borderRadius="10px"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <HStack justify="center" spacing={2}>
                        <Image src={bowIconUrl} alt="Bow icon" boxSize="16px" filter="brightness(0) invert(1)" />
                        <Text>Crear ejercicio</Text>
                      </HStack>
                    </Button>
                  </HStack>
                  <HStack align="flex-start" spacing={8} justify="space-between" w="full">
                    <Stack spacing={4} flex="1" maxW="980px">
                      {filteredExercises.map((ex) => (
                        <Box
                          key={ex.id}
                          w="full"
                          borderWidth="1px"
                          borderRadius="12px"
                          borderColor="gray.200"
                          bg="white"
                          overflow="hidden"
                          _hover={{ borderColor: "gray.300", cursor: "pointer" }}
                          onClick={() => setExpandedExercise((prev) => (prev === ex.id ? null : ex.id))}
                        >
                          <Box p={{ base: 4, xl: 5 }}>
                            <Stack spacing={2}>
                              <Heading size="md" color="gray.900">
                                {ex.name}
                              </Heading>
                              <Text color="gray.500">{ex.arrows_count} flechas</Text>
                              <Collapse in={expandedExercise === ex.id} animateOpacity>
                                <Stack spacing={1.5} color="gray.700" pt={1}>
                                  <Text color="gray.500">Distancia: {ex.distance_m} m</Text>
                                  <Text color="gray.500" fontSize="95%">
                                    Descripción: {ex.description || "Sin descripción"}
                                  </Text>
                                </Stack>
                              </Collapse>
                            </Stack>
                          </Box>
                          <Collapse in={expandedExercise === ex.id} animateOpacity>
                            <HStack justify="flex-start" spacing={2} px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                              <Button
                                size={actionIconButtonSize}
                                variant="ghost"
                                color="gray.400"
                                _hover={{ bg: "gray.100", color: "blue.600" }}
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
                                <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                              </Button>
                              <Button
                                size={actionIconButtonSize}
                                variant="ghost"
                                color="gray.400"
                                _hover={{ bg: "red.50", color: "red.600" }}
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
                                  boxSize={actionIconSize}
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
                          </Collapse>
                        </Box>
                      ))}
                      {!filteredExercises.length && <Text color="gray.600">No hay ejercicios para mostrar.</Text>}
                    </Stack>
                  </HStack>
                </Stack>
              )}
              {profSection === "alumno" && (
                <Stack spacing={6}>
                  <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
                    <InputGroup maxW="420px">
                      <InputLeftElement pointerEvents="none" color="gray.500">
                        <SearchIcon boxSize={3.5} />
                      </InputLeftElement>
                      <Input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Buscar alumnos"
                        bg="white"
                        borderColor="gray.300"
                        borderRadius="10px"
                        _hover={{ borderColor: "gray.400" }}
                        _focus={{ borderColor: "gray.500", bg: "white" }}
                      />
                    </InputGroup>
                    <Button
                      bg="#f97316"
                      color="white"
                      borderRadius="10px"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      onClick={() => setCreateStudentModalOpen(true)}
                    >
                      <HStack justify="center" spacing={2}>
                        <Image src={userPlusIconUrl} alt="Agregar alumno" boxSize="16px" filter="brightness(0) invert(1)" />
                        <Text>Agregar alumno</Text>
                      </HStack>
                    </Button>
                  </HStack>
                  <Stack spacing={6} w="full" maxW="980px">
                    <Stack spacing={3}>
                      <Heading size="md" color="black">
                        Alumnos activos
                      </Heading>
                      {activeStudents.map((st) => (
                        <Box
                          key={st.id}
                          borderWidth="1px"
                          borderRadius="12px"
                          borderColor="gray.200"
                          bg="white"
                          overflow="hidden"
                          _hover={{ borderColor: "gray.300", cursor: "pointer" }}
                          onClick={() => setExpandedStudent((prev) => (prev === st.id ? null : st.id))}
                        >
                          <Box p={{ base: 4, xl: 5 }}>
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
                              </Stack>
                            </Collapse>
                          </Box>
                          <Collapse in={expandedStudent === st.id} animateOpacity>
                            <HStack justify="flex-start" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                              <HStack spacing={2}>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="ghost"
                                  color="gray.400"
                                  _hover={{ bg: "gray.100", color: "blue.600" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditStudentModal(st);
                                  }}
                                >
                                  <Image src={editIconUrl} alt="Editar alumno" boxSize={actionIconSize} />
                                </Button>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="ghost"
                                  color="gray.400"
                                  _hover={{ bg: "red.50", color: "red.600" }}
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
                                    boxSize={actionIconSize}
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
                                size={{ base: "sm", xl: "md", "2xl": "lg" }}
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
                          borderWidth="1px"
                          borderRadius="12px"
                          borderColor="gray.200"
                          bg="white"
                          overflow="hidden"
                          _hover={{ borderColor: "gray.300", cursor: "pointer" }}
                          onClick={() => setExpandedStudent((prev) => (prev === st.id ? null : st.id))}
                        >
                          <Box p={{ base: 4, xl: 5 }}>
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
                              </Stack>
                            </Collapse>
                          </Box>
                          <Collapse in={expandedStudent === st.id} animateOpacity>
                            <HStack justify="space-between" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                              <HStack spacing={2}>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="ghost"
                                  color="gray.400"
                                  _hover={{ bg: "gray.100", color: "blue.600" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditStudentModal(st);
                                  }}
                                >
                                  <Image src={editIconUrl} alt="Editar alumno" boxSize={actionIconSize} />
                                </Button>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="ghost"
                                  color="gray.400"
                                  _hover={{ bg: "green.50", color: "green.600" }}
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
                            </HStack>
                          </Collapse>
                        </Box>
                      ))}
                      {!inactiveStudents.length && <Text color="gray.600">No hay alumnos inactivos.</Text>}
                    </Stack>
                  </Stack>
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
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="560px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Editar ejercicio</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setEditModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Nombre</FormLabel>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Distancia (m)</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Descripción</FormLabel>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    minH="120px"
                    resize="vertical"
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.500" }}
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
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
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={() => setEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isLoading={editLoading}
                  isDisabled={!editName || editArrows === "" || editDistance === ""}
                  onClick={handleEditSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={createModalOpen} onClose={closeCreateExerciseModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="560px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Nuevo Ejercicio</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeCreateExerciseModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Nombre</FormLabel>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Distancia (m)</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Descripción</FormLabel>
                  <Textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Escribe los detalles del ejercicio..."
                    minH="120px"
                    resize="vertical"
                    borderColor="gray.300"
                    borderRadius="8px"
                    _hover={{ borderColor: "gray.500" }}
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
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
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateExerciseModal}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isLoading={createLoading}
                  isDisabled={!createName || createArrows === "" || createDistance === ""}
                  onClick={handleCreateSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={createRoutineModalOpen} onClose={closeCreateRoutineModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent
            maxW={routineModalMaxW}
            maxH="86vh"
            transition="max-width 0.3s ease, max-height 0.3s ease"
            overflowY="auto"
            overflowX="hidden"
            borderRadius="14px"
            borderTop={routineModalStep === 0 ? "6px solid" : "0 solid"}
            borderTopColor={routineModalStep === 0 ? "#f97316" : "transparent"}
          >
            <Box h={routineModalBodyHeight ? `${routineModalBodyHeight}px` : `${routineModalMinHeight}px`} transition="height 0.3s ease" overflow="hidden">
              <Box px={6} py={6}>
                {routineModalStep === 0 && (
                  <Stack ref={routineStepRef} spacing={6} animation={`${routineStepSlide} 0.3s ease`} px={2} pt={2} pb={0} w="full" maxW="420px" mx="auto">
                  <Stack spacing={2} align="center" textAlign="center">
                    <Box w="56px" h="56px" borderRadius="full" bg="#fff7ed" display="flex" alignItems="center" justifyContent="center" color="#f97316" fontWeight="700">
                      <Box
                        as="svg"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        boxSize="20px"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 .83.18 2 2 0 0 0 .83-.18l8.58-3.9a1 1 0 0 0 0-1.831z" />
                        <path d="M16 17h6" />
                        <path d="M19 14v6" />
                        <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 .825.178" />
                        <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l2.116-.962" />
                      </Box>
                    </Box>
                    <Heading size="md">{editingRoutineId ? "Editar rutina" : "Nueva Rutina"}</Heading>
                  </Stack>
                  <FormControl>
                    <Input
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      placeholder="Ingresar el nombre de la rutina..."
                      borderColor="gray.300"
                      borderRadius="10px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        if (!routineName.trim()) return;
                        e.preventDefault();
                        setRoutineDayCount((prev) => Math.max(1, Math.min(7, prev)));
                        setRoutineDayCursor(0);
                        setRoutineExerciseSearch("");
                        setCreateRoutineError(null);
                        setRoutineModalStep(2);
                      }}
                    />
                  </FormControl>
                  <HStack spacing={3} justify="center" wrap="wrap">
                    {routineAssignStudentId && !editingRoutineId && (
                      <Button variant="outline" borderColor="gray.300" onClick={handleBackToAssignOptionsFromCreate}>
                        Volver
                      </Button>
                    )}
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!routineName.trim()}
                      onClick={() => {
                        setRoutineDayCount((prev) => Math.max(1, Math.min(7, prev)));
                        setRoutineDayCursor(0);
                        setRoutineExerciseSearch("");
                        setCreateRoutineError(null);
                        setRoutineModalStep(2);
                      }}
                    >
                      Siguiente
                    </Button>
                    <Button variant="ghost" color="gray.600" _hover={{ bg: "transparent", color: "gray.800" }} onClick={closeCreateRoutineModal}>
                      Cancelar
                    </Button>
                  </HStack>
                  </Stack>
                )}
                {routineModalStep === 2 && (
                  <Stack ref={routineStepRef} key={`${currentRoutineDayKey || "dia"}-${routineDayCursor}`} spacing={6} animation={`${routineDaySlide} 0.3s ease`}>
                  <Box p={4}>
                  <Heading size="md" mb={4}>{currentRoutineDayLabel || "Día"}</Heading>
                  <InputGroup maxW={{ base: "360px", xl: "480px", "2xl": "560px" }}>
                    <InputLeftElement pointerEvents="none" color="gray.500">
                      <SearchIcon boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                      value={routineExerciseSearch}
                      onChange={(e) => setRoutineExerciseSearch(e.target.value)}
                      placeholder="Buscar ejercicios"
                      bg="white"
                      borderColor="gray.300"
                      borderRadius="8px"
                      _hover={{ borderColor: "gray.400" }}
                      _focus={{ borderColor: "#f97316", bg: "white" }}
                    />
                  </InputGroup>
                  <Stack spacing={2} maxH="300px" overflowY="auto" pr={1} mt={4}>
                    {filteredRoutineExercises.map((ex) => {
                      const selectedForCurrentDay =
                        !!currentRoutineDayKey && (routineExercisesByDay[currentRoutineDayKey] || []).includes(ex.id);
                      return (
                        <Box
                          key={ex.id}
                          p={3}
                          borderWidth="1px"
                          borderColor={selectedForCurrentDay ? "#f97316" : "gray.200"}
                          borderRadius="md"
                          bg={selectedForCurrentDay ? "#fff7ed" : "white"}
                          cursor="pointer"
                          _hover={{ borderColor: selectedForCurrentDay ? "#f97316" : "gray.400" }}
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
                              colorScheme="orange"
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
                  </Box>
                  {createRoutineError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {createRoutineError}
                    </Alert>
                  )}
                  <HStack spacing={3} justify="flex-end" p={4}>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(0)}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!currentRoutineDayKey || (routineExercisesByDay[currentRoutineDayKey] || []).length === 0}
                      isLoading={createRoutineLoading}
                      onClick={handleRoutineExerciseContinue}
                    >
                      Siguiente
                    </Button>
                    <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>
                      Cancelar
                    </Button>
                  </HStack>
                  </Stack>
                )}
                {routineModalStep === 3 && (
                  <Stack ref={routineStepRef} spacing={4} animation={`${routineStepSlide} 0.3s ease`}>
                    <HStack justify="space-between" px={6} py={4} borderBottomWidth="1px" borderColor="gray.200">
                      <Heading size="md">Resumen de la rutina</Heading>
                      <Button variant="ghost" size="sm" color="gray.500" onClick={closeCreateRoutineModal}>×</Button>
                    </HStack>
                    <Stack
                      ref={routineSummaryListRef}
                      spacing={3}
                      maxH={`${routineSummaryListMaxH}px`}
                      overflowY="auto"
                      pr={1}
                      px={4}
                      py={3}
                      onWheel={handleRoutineSummaryWheel}
                      sx={{ overscrollBehaviorY: "contain" }}
                    >
                      {routineBuilderDays.map((day) => (
                        <Box key={`summary-${day.key}`} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                          <Text color="gray.800" fontWeight="medium">
                            {day.label}
                          </Text>
                          <Stack spacing={1} mt={2}>
                            {(routineExercisesByDay[day.key] || []).map((exerciseId) => {
                              const base = exercises.find((ex) => ex.id === exerciseId);
                              const override = routineCreateExerciseOverridesByDay[day.key]?.[exerciseId];
                              return (
                                <HStack key={`summary-ex-${day.key}-${exerciseId}`} spacing={2} align="center">
                                  <Stack spacing={0} flex="1">
                                    <Text fontSize="sm" color="gray.700">
                                      {base?.name || `Ejercicio #${exerciseId}`}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      Flechas: {override?.arrows_override ?? base?.arrows_count ?? "-"} | Distancia: {override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "-"} m
                                    </Text>
                                  </Stack>
                                  <HStack spacing={1}>
                                    <Button
                                      size={actionIconButtonSize}
                                      variant="ghost"
                                      minW="auto"
                                      px={2}
                                      onClick={() => openRoutineCreateEditExercise(day.key, exerciseId)}
                                    >
                                      <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                                    </Button>
                                    <Button
                                      size={actionIconButtonSize}
                                      variant="outline"
                                      borderRadius="xl"
                                      borderColor="gray.300"
                                      color="black"
                                      _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                                      onClick={() => removeExerciseFromRoutineSummaryDay(day.key, exerciseId)}
                                    >
                                      <Box
                                        as="svg"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        boxSize={actionIconSize}
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
                              );
                            })}
                            {(routineExercisesByDay[day.key] || []).length === 0 && (
                              <Text fontSize="sm" color="gray.500">Sin ejercicios</Text>
                            )}
                          </Stack>
                          <HStack mt={3} justify="space-between" align="center">
                            <Button
                              size="sm"
                              variant="outline"
                              borderColor="gray.300"
                              borderRadius="lg"
                              onClick={() => openRoutineCreateAddExercise(day.key)}
                              leftIcon={
                                <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14" />
                                  <path d="M12 5v14" />
                                </Box>
                              }
                            >
                              Agregar ejercicio
                            </Button>
                            {routineDayCount > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                borderColor="gray.300"
                                borderRadius="lg"
                                color="black"
                                _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                                onClick={() => requestDeleteRoutineDay(day.dayNumber)}
                                leftIcon={
                                  <Box
                                    as="svg"
                                    viewBox="0 0 24 24"
                                    boxSize="16px"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M5 12h14" />
                                  </Box>
                                }
                              >
                                Eliminar día
                              </Button>
                            )}
                          </HStack>
                        </Box>
                      ))}
                      {routineDayCount < 7 && (
                        <HStack justify="center">
                          <Button
                            variant="ghost"
                            color="gray.600"
                            _hover={{ bg: "gray.100", color: "gray.700" }}
                            onClick={handleAddRoutineDay}
                          >
                            Agregar día
                          </Button>
                        </HStack>
                      )}
                    </Stack>
                    {routineAssignStudentId && !editingRoutineId && (
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} px={4}>
                        <FormControl>
                          <FormLabel>Inicio de rutina</FormLabel>
                          <Input
                            type="date"
                            value={assignmentStartDate}
                            maxW="240px"
                            onChange={(e) => setAssignmentStartDate(e.target.value || getTodayIsoLocal())}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Fin de rutina</FormLabel>
                          <Input type="date" value={assignmentEndDate} maxW="240px" isReadOnly />
                        </FormControl>
                      </SimpleGrid>
                    )}
                    {createRoutineError && (
                      <Alert status="error" borderRadius="md" mx={4}>
                        <AlertIcon />
                        {createRoutineError}
                      </Alert>
                    )}
                    <HStack spacing={3} justify="flex-end" p={4}>
                      <Button
                        variant="outline"
                        borderColor="gray.300"
                        onClick={() => {
                          setRoutineDayCursor(Math.max(routineBuilderDays.length - 1, 0));
                          setRoutineModalStep(2);
                        }}
                      >
                        Volver
                      </Button>
                      <Button
                        bg="#f97316"
                        color="white"
                        _hover={{ bg: "#ea580c" }}
                        _active={{ bg: "#c2410c" }}
                        isLoading={createRoutineLoading}
                        isDisabled={routineBuilderDays.some((day) => (routineExercisesByDay[day.key] || []).length === 0)}
                        onClick={handleCreateOrUpdateRoutineFromSummary}
                      >
                        {editingRoutineId ? "Guardar cambios" : "Crear rutina"}
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
        <Modal isOpen={routineCreateAddExerciseModalOpen} onClose={() => setRoutineCreateAddExerciseModalOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="620px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Agregar ejercicio al día</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setRoutineCreateAddExerciseModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={4}>
              <Stack spacing={3}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar ejercicio..."
                    value={routineCreateAddExerciseSearch}
                    onChange={(e) => setRoutineCreateAddExerciseSearch(e.target.value)}
                    borderColor="gray.300"
                    borderRadius="8px"
                  />
                </InputGroup>
                <Stack
                  ref={routineCreateAddExerciseListRef}
                  spacing={2}
                  maxH="50vh"
                  overflowY="auto"
                  pr={1}
                  onWheel={handleRoutineCreateAddExerciseListWheel}
                  sx={{ overscrollBehaviorY: "contain" }}
                >
                  {exercises
                    .filter((exercise) => {
                      const term = routineCreateAddExerciseSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        exercise.name.toLowerCase().includes(term) ||
                        String(exercise.arrows_count).includes(term) ||
                        String(exercise.distance_m).includes(term)
                      );
                    })
                    .filter((exercise) => {
                      if (!routineCreateAddExerciseDayKey) return false;
                      return !(routineExercisesByDay[routineCreateAddExerciseDayKey] || []).includes(exercise.id);
                    })
                    .map((exercise) => (
                      <HStack key={`create-day-add-${exercise.id}`} justify="space-between" borderWidth="1px" borderColor="gray.200" borderRadius="8px" p={3}>
                        <Stack spacing={0}>
                          <Text fontSize="sm" color="gray.800" fontWeight="500">{exercise.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Flechas: {exercise.arrows_count} | Distancia: {Number(exercise.distance_m)} m
                          </Text>
                        </Stack>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="gray.300"
                          borderRadius="8px"
                          bg="white"
                          _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                          onClick={() =>
                            routineCreateAddExerciseDayKey &&
                            addExerciseToRoutineSummaryDay(routineCreateAddExerciseDayKey, exercise.id)
                          }
                        >
                          Agregar
                        </Button>
                      </HStack>
                    ))}
                </Stack>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <Button variant="outline" borderColor="gray.300" bg="white" _hover={{ bg: "gray.50" }} onClick={() => setRoutineCreateAddExerciseModalOpen(false)}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal
          isOpen={routineCreateEditExerciseModalOpen}
          onClose={() => {
            setRoutineCreateEditExerciseModalOpen(false);
            setRoutineCreateEditTarget(null);
          }}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="560px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Editar ejercicio</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setRoutineCreateEditExerciseModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody>
              <Stack spacing={4}>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas</FormLabel>
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      step={1}
                      value={routineCreateEditArrows}
                      onChange={(e) => setRoutineCreateEditArrows(normalizeInt(e.target.value))}
                      onKeyDown={(e) => blockInvalidKeys(e, false)}
                      onBeforeInput={handleBeforeInputInt}
                      onPaste={handlePasteInt}
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Distancia (m)</FormLabel>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={routineCreateEditDistance}
                      onChange={(e) => setRoutineCreateEditDistance(normalizeFloat(e.target.value))}
                      onKeyDown={(e) => blockInvalidKeys(e, true)}
                      onBeforeInput={handleBeforeInputFloat}
                      onPaste={handlePasteFloat}
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Descripción</FormLabel>
                  <Textarea
                    value={routineCreateEditDescription}
                    onChange={(e) => setRoutineCreateEditDescription(e.target.value)}
                    minH="120px"
                    resize="vertical"
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={() => setRoutineCreateEditExerciseModalOpen(false)}>
                  Cancelar
                </Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={saveRoutineCreateEditExercise}>
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteRoutineDayConfirmOpen} onClose={() => setDeleteRoutineDayConfirmOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="420px" borderRadius="14px" overflow="hidden">
            <ModalBody py={8}>
              <Stack spacing={4} align="center" textAlign="center">
                <Box w="56px" h="56px" borderRadius="full" bg="#fee2e2" display="flex" alignItems="center" justifyContent="center">
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="20px"
                    fill="none"
                    stroke="#ef4444"
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
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Eliminar día?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="300px">
                  Se eliminará{" "}
                  <Box as="span" fontWeight="600" color="gray.700">
                    {deleteRoutineDayTargetNumber ? `Día ${deleteRoutineDayTargetNumber}` : "este día"}
                  </Box>{" "}
                  de la rutina. Esta acción no se puede deshacer.
                </Text>
                <HStack spacing={3} pt={2}>
                  <Button
                    bg="white"
                    color="#ef4444"
                    borderColor="#fecaca"
                    borderWidth="1px"
                    _hover={{ bg: "#fef2f2" }}
                    onClick={confirmDeleteRoutineDay}
                  >
                    Eliminar
                  </Button>
                  <Button
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    onClick={() => setDeleteRoutineDayConfirmOpen(false)}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
        <Modal isOpen={createStudentModalOpen} onClose={() => setCreateStudentModalOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="560px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <HStack spacing={2}>
                    <Box
                      as="svg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      boxSize="16px"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" x2="19" y1="8" y2="14" />
                      <line x1="22" x2="16" y1="11" y2="11" />
                    </Box>
                    <Text fontWeight="700" color="gray.900">Nuevo Alumno</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">Ingresa los datos del nuevo estudiante de arquería.</Text>
                </Stack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setCreateStudentModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Nombre completo</FormLabel>
                  <Input
                    value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">DNI</FormLabel>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={studentDocumentNumber}
                      onChange={(e) => setStudentDocumentNumber(e.target.value.replace(/\D+/g, ""))}
                      onBeforeInput={handleBeforeInputInt}
                      onPaste={handlePasteInt}
                      placeholder="12345678"
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Contacto</FormLabel>
                    <Input
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Libras del arco</FormLabel>
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
                      placeholder="Ej. 24"
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas disponibles</FormLabel>
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
                      placeholder="Ej. 6"
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                {createStudentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {createStudentError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={() => setCreateStudentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
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
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="560px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <HStack spacing={2}>
                    <Box color="#f97316" fontSize="16px">◎</Box>
                    <Text fontWeight="700" color="gray.900">Editar Alumno</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">Actualiza los datos del estudiante.</Text>
                </Stack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setEditStudentModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Nombre completo</FormLabel>
                  <Input
                    value={editStudentFullName}
                    onChange={(e) => setEditStudentFullName(e.target.value)}
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">DNI</FormLabel>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editStudentDocumentNumber}
                      onChange={(e) => setEditStudentDocumentNumber(e.target.value.replace(/\D+/g, ""))}
                      onBeforeInput={handleBeforeInputInt}
                      onPaste={handlePasteInt}
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Contacto</FormLabel>
                    <Input
                      value={editStudentContact}
                      onChange={(e) => setEditStudentContact(e.target.value)}
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Libras del arco</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas disponibles</FormLabel>
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
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                </SimpleGrid>
                {editStudentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {editStudentError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={() => setEditStudentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
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
        <Modal
          isOpen={adminAssignModalOpen}
          onClose={closeAdminAssignModal}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="620px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Asignar rutina</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAdminAssignModal}>×</Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={4}>
              <Stack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.500">
                    <SearchIcon boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    value={adminAssignSearch}
                    onChange={(e) => setAdminAssignSearch(e.target.value)}
                    placeholder="Buscar alumno activo"
                    borderRadius="8px"
                    borderColor="gray.300"
                  />
                </InputGroup>
                <Stack spacing={2} maxH="42vh" overflowY="auto" pr={1}>
                  {adminAssignableStudents.map((student) => {
                    const isSelected = adminAssignSelectedStudentId === student.id;
                    return (
                      <Box
                        key={student.id}
                        p={3.5}
                        borderWidth="1px"
                        borderColor={isSelected ? "#f97316" : "gray.200"}
                        bg={isSelected ? "#fff7ed" : "white"}
                        borderRadius="8px"
                        cursor="pointer"
                        _hover={{ borderColor: isSelected ? "#f97316" : "gray.400" }}
                        onClick={() => setAdminAssignSelectedStudentId(student.id)}
                      >
                        <HStack justify="space-between" align="center">
                          <Stack spacing={0}>
                            <Text color="gray.900" fontWeight="500">{student.full_name}</Text>
                            <Text color="gray.500" fontSize="xs">
                              DNI: {student.document_number}
                            </Text>
                          </Stack>
                          {isSelected && (
                            <Badge bg="#f97316" color="white" borderRadius="full" px={2} py={0.5}>✓</Badge>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                  {!adminAssignableStudents.length && (
                    <Text color="gray.600">No hay alumnos activos para asignar.</Text>
                  )}
                </Stack>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="gray.700"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={closeAdminAssignModal}
                >
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isDisabled={!adminAssignSelectedStudentId}
                  onClick={handleAdminAssignContinue}
                >
                  Continuar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={assignRoutineModalOpen} onClose={closeAssignRoutineModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="760px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Stack spacing={0}>
                  <Text fontWeight="700" color="gray.900">
                    Asignar rutina a{" "}
                    <Text as="span" color={assignRoutineStep === "choice" ? "#f97316" : "gray.900"}>
                      {assignRoutineStudent?.full_name || "alumno"}
                    </Text>
                  </Text>
                  {assignRoutineStep === "choice" && <Text fontSize="sm" color="gray.500">Paso 2 de 4: Selecciona el método de asignación</Text>}
                  {assignRoutineStep === "existing_list" && <Text fontSize="sm" color="gray.500">Selecciona una rutina existente de la lista para asignarla.</Text>}
                  {assignRoutineStep === "existing_preview" && <Text fontSize="sm" color="gray.500">Paso 4: Configurar ejercicios y días</Text>}
                  {assignRoutineStep === "existing_dates" && <Text fontSize="sm" color="gray.500">Paso 5: Seleccionar fechas de la rutina</Text>}
                </Stack>
                {assignRoutineStep === "existing_preview" || assignRoutineStep === "existing_dates" ? (
                  <Button variant="ghost" size="sm" color="gray.500" _hover={{ bg: "gray.100", color: "gray.700" }} aria-label="Configuración">
                    ⚙
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAssignRoutineModal}>×</Button>
                )}
              </HStack>
            </ModalHeader>
            <ModalBody py={5}>
              {assignRoutineStep === "choice" && (
                <Stack spacing={5}>
                  <Text color="gray.700" textAlign="center">
                    ¿Deseas crear una rutina temporal nueva o asignar una que ya tengas guardada en tu biblioteca?
                  </Text>
                  <HStack spacing={4} align="stretch">
                    <Box
                      flex="1"
                      role="group"
                      borderWidth="1px"
                      borderColor="gray.300"
                      bg="white"
                      borderRadius="12px"
                      p={5}
                      cursor="pointer"
                      _hover={{ borderColor: "#f97316", bg: "#fff7ed" }}
                      onClick={handleChooseCreateRoutineForStudent}
                    >
                      <Stack spacing={3} align="center" textAlign="center">
                        <Box
                          w="44px"
                          h="44px"
                          borderRadius="full"
                          bg="gray.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="gray.500"
                          _groupHover={{ bg: "orange.100", color: "orange.500" }}
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                            <path d="M12 8v8" />
                          </Box>
                        </Box>
                        <Text fontWeight="700" color="gray.900">Crear rutina</Text>
                        <Text fontSize="sm" color="gray.500">Diseña una rutina específica desde cero para este alumno.</Text>
                      </Stack>
                    </Box>
                    <Box
                      flex="1"
                      role="group"
                      borderWidth="1px"
                      borderColor="gray.300"
                      borderRadius="12px"
                      p={5}
                      cursor="pointer"
                      _hover={{ borderColor: "#f97316", bg: "#fff7ed" }}
                      onClick={handleChooseExistingRoutineList}
                    >
                      <Stack spacing={3} align="center" textAlign="center">
                        <Box
                          w="44px"
                          h="44px"
                          borderRadius="full"
                          bg="gray.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="gray.500"
                          _groupHover={{ bg: "orange.100", color: "orange.500" }}
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
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </Box>
                        </Box>
                        <Text fontWeight="700" color="gray.900">Asignar rutina ya creada</Text>
                        <Text fontSize="sm" color="gray.500">Selecciona una rutina existente de tu biblioteca de plantillas.</Text>
                      </Stack>
                    </Box>
                  </HStack>
                </Stack>
              )}
              {assignRoutineStep === "existing_list" && (
                <Stack spacing={3} maxH="55vh" overflowY="auto" pr={1}>
                  {sortedRoutines.map((routine) => (
                    <Box
                      key={routine.id}
                      p={3.5}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="8px"
                      cursor="pointer"
                      _hover={{ borderColor: "gray.400" }}
                      onClick={() => handleSelectRoutineToAssign(routine)}
                    >
                      <HStack justify="space-between" align="center">
                        <Stack spacing={0}>
                          <Text color="gray.900" fontWeight="500">{routine.name}</Text>
                        </Stack>
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
                <Stack
                  ref={assignRoutineSummaryListRef}
                  spacing={4}
                  maxH={`${routineAssignSummaryListMaxH}px`}
                  overflowY="auto"
                  pr={1}
                  onWheel={handleAssignRoutineSummaryWheel}
                  sx={{ overscrollBehaviorY: "contain" }}
                >
                  {routineAssignBuilderDays.map((day) => (
                    <Box key={`assign-summary-${day.key}`} borderWidth="1px" borderColor="gray.200" borderRadius="10px" p={4}>
                      <Text color="gray.800" fontWeight="semibold" mb={2}>
                        {day.label}
                      </Text>
                      <Stack spacing={1} mt={2}>
                        {(routineAssignExercisesByDay[day.key] || []).map((exerciseId) => {
                          const base = exercises.find((ex) => ex.id === exerciseId);
                          const override = routineAssignExerciseOverridesByDay[day.key]?.[exerciseId];
                          return (
                            <HStack key={`assign-summary-ex-${day.key}-${exerciseId}`} spacing={2} align="center">
                              <Stack spacing={0} flex="1">
                                <Text fontSize="sm" color="gray.700">
                                  {base?.name || `Ejercicio #${exerciseId}`}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  Flechas: {override?.arrows_override ?? base?.arrows_count ?? "-"} | Distancia: {override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "-"} m
                                </Text>
                              </Stack>
                              <HStack spacing={1}>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="ghost"
                                  minW="auto"
                                  px={2}
                                  onClick={() => openEditAssignExercise(day.key, exerciseId)}
                                >
                                  <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                                </Button>
                                <Button
                                  size={actionIconButtonSize}
                                  variant="outline"
                                  borderRadius="xl"
                                  borderColor="gray.300"
                                  color="black"
                                  _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }}
                                  onClick={() => removeAssignExerciseFromDay(day.key, exerciseId)}
                                >
                                  <Box
                                    as="svg"
                                    viewBox="0 0 24 24"
                                    boxSize={actionIconSize}
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
                          );
                        })}
                        {(routineAssignExercisesByDay[day.key] || []).length === 0 && (
                          <Text fontSize="sm" color="gray.500">Sin ejercicios</Text>
                        )}
                      </Stack>
                      <HStack mt={4} justify="space-between" align="center">
                        <Button
                          size="sm"
                          variant="ghost"
                          color="#f97316"
                          _hover={{ bg: "orange.50" }}
                          onClick={() => openAddExerciseForDay(day.key)}
                          leftIcon={
                            <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14" />
                              <path d="M12 5v14" />
                            </Box>
                          }
                        >
                          Agregar ejercicio
                        </Button>
                        {routineAssignDayCount > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            color="red.500"
                            _hover={{ bg: "red.50", color: "red.600" }}
                            onClick={() => requestDeleteAssignRoutineDay(day.dayNumber)}
                            leftIcon={
                              <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                              </Box>
                            }
                          >
                            Eliminar día
                          </Button>
                        )}
                      </HStack>
                    </Box>
                  ))}
                  <HStack justify="center">
                    {routineAssignDayCount < 7 && (
                      <Button
                        variant="ghost"
                        color="gray.600"
                        _hover={{ bg: "gray.100", color: "gray.700" }}
                        onClick={addAssignRoutineDay}
                      >
                        Agregar día
                      </Button>
                    )}
                  </HStack>
                </Stack>
              )}
              {assignRoutineStep === "existing_dates" && selectedRoutineToAssign && (
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="10px" p={4}>
                  <Stack spacing={4}>
                    <Text fontWeight="600" color="gray.800">Selecciona la semana de la rutina</Text>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                      <FormControl>
                        <FormLabel>Inicio de rutina</FormLabel>
                        <Box position="relative" maxW="240px">
                          <Input type="text" value={formatDateEs(assignmentStartDate)} pr="44px" isReadOnly />
                          <Button
                            size="sm"
                            variant="ghost"
                            position="absolute"
                            right="6px"
                            top="50%"
                            transform="translateY(-50%)"
                            minW="30px"
                            h="30px"
                            p={0}
                            aria-label="Abrir calendario"
                            onClick={() => {
                              const picker = assignmentStartDatePickerRef.current;
                              if (!picker) return;
                              if ("showPicker" in picker) {
                                (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                              } else {
                                picker.click();
                              }
                            }}
                          >
                            <Box
                              as="svg"
                              viewBox="0 0 24 24"
                              boxSize="16px"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M16 2v4" />
                              <path d="M8 2v4" />
                              <path d="M3 10h18" />
                            </Box>
                          </Button>
                          <Input
                            ref={assignmentStartDatePickerRef}
                            type="date"
                            value={assignmentStartDate}
                            onChange={(e) => setAssignmentStartDate(e.target.value || getTodayIsoLocal())}
                            position="absolute"
                            inset={0}
                            opacity={0}
                            pointerEvents="none"
                            aria-label="Seleccionar inicio de rutina"
                          />
                        </Box>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Fin de rutina</FormLabel>
                        <Input type="text" value={formatDateEs(assignmentEndDate)} maxW="240px" isReadOnly />
                      </FormControl>
                    </SimpleGrid>
                  </Stack>
                </Box>
              )}
              {assignRoutineError && (
                <Alert status="error" borderRadius="md" mt={3}>
                  <AlertIcon />
                  {assignRoutineError}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                {assignRoutineStep === "choice" && (
                  <Button variant="outline" borderColor="gray.300" onClick={() => {
                    setAssignRoutineModalOpen(false);
                    openAdminAssignModal();
                  }}>
                    Volver
                  </Button>
                )}
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
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      onClick={() => setAssignRoutineStep("existing_dates")}
                    >
                      Siguiente
                    </Button>
                  </>
                )}
                {assignRoutineStep === "existing_dates" && (
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_preview")}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
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
        <Modal
          isOpen={editAssignExerciseModalOpen}
          onClose={() => {
            setEditAssignExerciseModalOpen(false);
            setEditAssignExerciseTarget(null);
          }}
          isCentered
        >
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditAssignExerciseModalOpen(false);
                    setEditAssignExerciseTarget(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button bg="black" color="white" _hover={{ bg: "gray.800" }} _active={{ bg: "gray.900" }} onClick={saveEditAssignExercise}>
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={addExerciseDayModalOpen} onClose={() => setAddExerciseDayModalOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="620px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Agregar ejercicio al día</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setAddExerciseDayModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={4}>
              <Stack spacing={3}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar ejercicio..."
                    value={addExerciseSearch}
                    onChange={(e) => setAddExerciseSearch(e.target.value)}
                    borderColor="gray.300"
                    borderRadius="8px"
                  />
                </InputGroup>
                <Stack
                  ref={addExerciseListRef}
                  spacing={2}
                  maxH="50vh"
                  overflowY="auto"
                  pr={1}
                  onWheel={handleAddExerciseListWheel}
                  sx={{ overscrollBehaviorY: "contain" }}
                >
                  {exercises
                    .filter((exercise) => {
                      const term = addExerciseSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        exercise.name.toLowerCase().includes(term) ||
                        String(exercise.arrows_count).includes(term) ||
                        String(exercise.distance_m).includes(term)
                      );
                    })
                    .filter((exercise) => {
                      if (!addExerciseTargetDayKey) return false;
                      return !(routineAssignExercisesByDay[addExerciseTargetDayKey] || []).includes(exercise.id);
                    })
                    .map((exercise) => (
                      <HStack key={`add-day-ex-${exercise.id}`} justify="space-between" borderWidth="1px" borderColor="gray.200" borderRadius="8px" p={3}>
                        <Stack spacing={0}>
                          <Text fontSize="sm" color="gray.800" fontWeight="500">{exercise.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Flechas: {exercise.arrows_count} | Distancia: {Number(exercise.distance_m)} m
                          </Text>
                        </Stack>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="gray.300"
                          borderRadius="8px"
                          bg="white"
                          _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                          onClick={() => addExerciseTargetDayKey && addTemporaryExerciseToDay(addExerciseTargetDayKey, exercise.id)}
                        >
                          Agregar
                        </Button>
                      </HStack>
                    ))}
                </Stack>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <Button variant="outline" borderColor="gray.300" bg="white" _hover={{ bg: "gray.50" }} onClick={() => setAddExerciseDayModalOpen(false)}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteAssignDayConfirmOpen} onClose={() => setDeleteAssignDayConfirmOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="420px" borderRadius="14px" overflow="hidden">
            <ModalBody py={8}>
              <Stack spacing={4} align="center" textAlign="center">
                <Box w="56px" h="56px" borderRadius="full" bg="#fee2e2" display="flex" alignItems="center" justifyContent="center">
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="20px"
                    fill="none"
                    stroke="#ef4444"
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
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Eliminar día?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="300px">
                  Se eliminará{" "}
                  <Box as="span" fontWeight="600" color="gray.700">
                    {deleteAssignDayTargetNumber ? `Día ${deleteAssignDayTargetNumber}` : "este día"}
                  </Box>{" "}
                  de la asignación temporal. Esta acción no se puede deshacer.
                </Text>
                <HStack spacing={3} pt={2}>
                  <Button
                    bg="white"
                    color="#ef4444"
                    borderColor="#fecaca"
                    borderWidth="1px"
                    _hover={{ bg: "#fef2f2" }}
                    onClick={confirmDeleteAssignRoutineDay}
                  >
                    Eliminar
                  </Button>
                  <Button
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    onClick={() => setDeleteAssignDayConfirmOpen(false)}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
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
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="420px" borderRadius="14px" overflow="hidden">
            <ModalBody py={8}>
              <Stack spacing={4} align="center" textAlign="center">
                <Box w="56px" h="56px" borderRadius="full" bg="#fee2e2" display="flex" alignItems="center" justifyContent="center">
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="20px"
                    fill="none"
                    stroke="#ef4444"
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
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Eliminar rutina?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="300px">
                  Esta acción eliminará la rutina seleccionada. Esta acción no se puede deshacer.
                </Text>
                {deleteRoutineError && (
                  <Alert status="error" borderRadius="md" w="100%">
                    <AlertIcon />
                    {deleteRoutineError}
                  </Alert>
                )}
                <HStack spacing={3} pt={1}>
                  <Button
                    bg="white"
                    color="#ef4444"
                    borderColor="#fecaca"
                    borderWidth="1px"
                    _hover={{ bg: "#fef2f2" }}
                    onClick={handleDeleteRoutineConfirm}
                    isLoading={deleteRoutineLoading}
                  >
                    Eliminar
                  </Button>
                  <Button
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    onClick={() => setDeleteRoutineModalOpen(false)}
                    isDisabled={deleteRoutineLoading}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteAssignedRoutineModalOpen} onClose={() => setDeleteAssignedRoutineModalOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="420px" borderRadius="14px" overflow="hidden">
            <ModalBody py={8}>
              <Stack spacing={4} align="center" textAlign="center">
                <Box w="56px" h="56px" borderRadius="full" bg="#fee2e2" display="flex" alignItems="center" justifyContent="center">
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="20px"
                    fill="none"
                    stroke="#ef4444"
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
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Eliminar rutina asignada?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="300px">
                  Se eliminará la rutina activa asignada al alumno. Esta acción no se puede deshacer.
                </Text>
                {deleteAssignedRoutineError && (
                  <Alert status="error" borderRadius="md" w="100%">
                    <AlertIcon />
                    {deleteAssignedRoutineError}
                  </Alert>
                )}
                <HStack spacing={3} pt={1}>
                  <Button
                    bg="white"
                    color="#ef4444"
                    borderColor="#fecaca"
                    borderWidth="1px"
                    _hover={{ bg: "#fef2f2" }}
                    onClick={handleDeleteAssignedRoutineConfirm}
                    isLoading={deleteAssignedRoutineLoading}
                  >
                    Eliminar
                  </Button>
                  <Button
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    onClick={() => setDeleteAssignedRoutineModalOpen(false)}
                    isDisabled={deleteAssignedRoutineLoading}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
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
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="460px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box w="28px" h="28px" borderRadius="full" bg="#fee2e2" display="flex" alignItems="center" justifyContent="center">
                    <Box
                      as="svg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      boxSize="18px"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </Box>
                  </Box>
                  <Text fontWeight="700" color="gray.900">¿Dar de baja alumno?</Text>
                </HStack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setDeactivateModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={5}>
              {deactivateError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deactivateError}
                </Alert>
              )}
              <Text color="gray.600">
                Se dará de baja a{" "}
                <Box as="span" fontWeight="600" color="gray.800">
                  {deactivateStudent?.full_name || "este alumno"}
                </Box>
                . Esta acción no se puede deshacer.
              </Text>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3} w="full" justify="flex-end">
                <Button
                  bg="white"
                  color="#ef4444"
                  borderColor="#fecaca"
                  borderWidth="1px"
                  _hover={{ bg: "#fef2f2" }}
                  onClick={handleDeactivateConfirm}
                  isLoading={deactivateLoading}
                >
                  Dar de baja
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
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
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW="460px" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box w="28px" h="28px" borderRadius="full" bg="#dcfce7" display="flex" alignItems="center" justifyContent="center">
                    <Box
                      as="svg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      boxSize="18px"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m16 11 2 2 4-4" />
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </Box>
                  </Box>
                  <Text fontWeight="700" color="gray.900">¿Dar de alta alumno?</Text>
                </HStack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => setActivateModalOpen(false)}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={5}>
              {activateError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {activateError}
                </Alert>
              )}
              <Text color="gray.600">
                Se dará de alta a{" "}
                <Box as="span" fontWeight="600" color="gray.800">
                  {activateStudent?.full_name || "este alumno"}
                </Box>
                .
              </Text>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3} w="full" justify="flex-end">
                <Button
                  bg="white"
                  color="#16a34a"
                  borderColor="#86efac"
                  borderWidth="1px"
                  _hover={{ bg: "#f0fdf4" }}
                  onClick={handleActivateConfirm}
                  isLoading={activateLoading}
                >
                  Dar de alta
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
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
                  <Box key={ex.id} p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                    <HStack justify="space-between" mb={2}>
                      <Heading size={{ base: "sm", xl: "md", "2xl": "lg" }}>{ex.name}</Heading>
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
                  <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text color="gray.600">Sin ejercicios cargados.</Text>
                  </Box>
                )}
              </SimpleGrid>
            </Stack>

            <Stack spacing={6}>
              <Heading size="md">Rutinas semanales</Heading>
              <Stack spacing={4}>
                {templateRoutines.map((routine) => (
                  <Box key={routine.id} p={5} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                    <HStack justify="space-between" mb={2}>
                      <Heading size={{ base: "sm", xl: "md", "2xl": "lg" }}>{routine.name}</Heading>
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
                                {dex.arrows_override !== null && dex.arrows_override !== undefined && <Tag colorScheme="orange">{dex.arrows_override} flechas</Tag>}
                                {dex.distance_override_m !== null && dex.distance_override_m !== undefined && <Tag colorScheme="teal">{dex.distance_override_m} m</Tag>}
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
                {!templateRoutines.length && !loading && (
                  <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text color="gray.600">Sin rutinas cargadas.</Text>
                  </Box>
                )}
              </Stack>
            </Stack>

            <Stack spacing={6}>
              <Heading size="md">Rutinas activas</Heading>
              <Stack spacing={3}>
                {activeAssignments.map((assignment) => (
                  <Box key={assignment.id} p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
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
                      <Badge colorScheme="green">Activa</Badge>
                    </HStack>
                    <HStack justify="flex-end" pt={1}>
                      <Button
                        size={actionIconButtonSize}
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
                          boxSize={actionIconSize}
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
                  </Box>
                ))}
                {!activeAssignments.length && !loading && (
                  <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white">
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
    <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
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










