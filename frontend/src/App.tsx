import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";
import { CheckCircleIcon, SearchIcon, WarningIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import { useLocation, useNavigate } from "react-router-dom";
import bowIconUrl from "./assets/bow.svg";
import archeryImg from "./assets/arqueros-logo-240.webp";
import arquerosAndinosHeaderUrl from "./assets/arqueros-andinos-header.svg";
import userPlusIconUrl from "./assets/user-plus.svg";
import editIconUrl from "./assets/edit.svg";
import notebookTabsIconUrl from "./assets/notebook-tabs.svg";
import {
  apiFetch,
  API_BASE,
  clearStoredAuth,
  getAuthEventName,
  getStoredRefreshToken,
  getStoredToken,
  storeAuthTokens,
} from "./api";
import { AppDataProvider } from "./context/AppDataContext";
import { ProfessorListsProvider } from "./context/ProfessorListsContext";
import { useAppDataController } from "./context/useAppDataController";
import AssignRoutineModal from "./sections/AssignRoutineModal";
import CreateRoutineModal from "./sections/CreateRoutineModal";

type PasswordInputProps = ComponentProps<typeof Input>;

function EyeOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-.722-3.25" />
      <path d="M2 8a10.645 10.645 0 0 0 20 0" />
      <path d="m20 15-1.726-2.05" />
      <path d="m4 15 1.726-2.05" />
      <path d="m9 18 .722-3.25" />
    </svg>
  );
}

function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        pr="3rem"
      />
      <InputRightElement h="full" width="3rem">
        <Button
          type="button"
          variant="ghost"
          minW="auto"
          h="full"
          px={0}
          color="gray.500"
          _hover={{ bg: "transparent", color: "gray.600" }}
          _active={{ bg: "transparent", color: "gray.700" }}
          _focusVisible={{ boxShadow: "none", color: "gray.700" }}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </Button>
      </InputRightElement>
    </InputGroup>
  );
}

const mobileConfirmSheetSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const mobileConfirmSheetSlideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const MOBILE_CONFIRM_SHEET_ANIMATION_MS = 180;

function MobileDangerConfirmSheet({
  isOpen,
  title,
  message,
  confirmLabel,
  error,
  tone = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  error?: string | null;
  tone?: "danger" | "success";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setShouldRender(true);
      setIsClosing(false);
      return;
    }
    if (!shouldRender) return;
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, MOBILE_CONFIRM_SHEET_ANIMATION_MS);
  }, [isOpen, shouldRender]);

  useEffect(() => () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
  }, []);

  if (!shouldRender) return null;
  const success = tone === "success";

  return (
    <Box position="fixed" inset={0} zIndex={90} bg="rgba(15, 23, 42, 0.32)" onClick={onClose}>
      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        bg="#f8fafc"
        borderTopRadius="22px"
        px={4}
        pt={3}
        pb="calc(1rem + env(safe-area-inset-bottom))"
        boxShadow="0 -18px 48px rgba(15, 23, 42, 0.16)"
        animation={`${isClosing ? mobileConfirmSheetSlideDown : mobileConfirmSheetSlideUp} ${MOBILE_CONFIRM_SHEET_ANIMATION_MS}ms ease-out`}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack spacing={4}>
          <Box alignSelf="center" w="52px" h="5px" borderRadius="full" bg="#e5d5ca" />
          <HStack spacing={3} align="center">
            <Box w="42px" h="42px" borderRadius="14px" bg={success ? "#dcfce7" : "#fee2e2"} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
              <Box
                as="svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                boxSize="18px"
                fill="none"
                stroke={success ? "#16a34a" : "#ef4444"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {success ? (
                  <>
                    <path d="m16 11 2 2 4-4" />
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </>
                ) : (
                  <>
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </>
                )}
              </Box>
            </Box>
            <Text fontSize="18px" fontWeight="800" color="#1f2937">
              {title}
            </Text>
          </HStack>

          <Text color="#667085" fontSize="14px" lineHeight="1.6">
            {message}
          </Text>

          {error && (
            <Alert status="error" borderRadius="14px">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Button
              bg={success ? "#16a34a" : "#ef4444"}
              color="white"
              h="50px"
              borderRadius="16px"
              _hover={{ bg: success ? "#15803d" : "#dc2626" }}
              _active={{ bg: success ? "#166534" : "#b91c1c" }}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
            <Button
              variant="outline"
              bg="white"
              borderColor="#d1d5db"
              color="#1f2937"
              h="50px"
              borderRadius="16px"
              _hover={{ bg: "gray.50" }}
              onClick={onClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function MobileBottomNavItem({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Stack as="button" type="button" spacing={1} align="center" justify="center" minW="64px" color={active ? "#f97316" : "#94a3b8"} onClick={onClick}>
      <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </Box>
      <Text fontSize="9px" fontWeight={active ? "700" : "500"}>
        {label}
      </Text>
    </Stack>
  );
}

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

const routineOrderButtonMoveUp = keyframes`
  from {
    transform: translate3d(0, 64px, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
`;

const routineOrderButtonMoveDown = keyframes`
  from {
    transform: translate3d(0, -64px, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
`;

const createStudentMobileSlideIn = keyframes`
  from {
    opacity: 0.96;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const createStudentMobileSlideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0.96;
    transform: translateX(100%);
  }
`;

const CREATE_STUDENT_MOBILE_ANIMATION_MS = 200;

type AppView = "dashboard" | "login" | "professor";
type ProfSection = "inicio" | "administrar_rutinas" | "perfil" | "rutina" | "ejercicio" | "alumno";

const SECTION_TO_PATH: Record<ProfSection, string> = {
  inicio: "inicio",
  administrar_rutinas: "administrar-rutinas",
  rutina: "rutinas",
  ejercicio: "ejercicios",
  alumno: "alumnos",
  perfil: "perfil",
};

const PATH_TO_SECTION = Object.fromEntries(
  Object.entries(SECTION_TO_PATH).map(([section, path]) => [path, section]),
) as Record<string, ProfSection>;

const WHEEL_ROW_HEIGHT = 44;

function VerticalDayWheelPicker({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const movedWhileDraggingRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollTopRef = useRef(0);
  const options = useMemo(
    () => Array.from({ length: Math.max(0, max - min + 1) }, (_, idx) => min + idx),
    [min, max],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || options.length === 0) return;
    const index = Math.max(0, options.indexOf(value));
    node.scrollTo({ top: index * WHEEL_ROW_HEIGHT, behavior: "smooth" });
  }, [value, options]);

  const handleSnap = () => {
    const node = containerRef.current;
    if (!node || options.length === 0) return;
    const index = Math.max(0, Math.min(options.length - 1, Math.round(node.scrollTop / WHEEL_ROW_HEIGHT)));
    const selected = options[index];
    if (selected !== value) onChange(selected);
    node.scrollTo({ top: index * WHEEL_ROW_HEIGHT, behavior: "smooth" });
  };

  useEffect(() => () => {
    if (snapTimeoutRef.current !== null) window.clearTimeout(snapTimeoutRef.current);
  }, []);

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (movedWhileDraggingRef.current) suppressNextClickRef.current = true;
    const node = containerRef.current;
    if (node) node.style.cursor = "grab";
    handleSnap();
  };

  return (
    <Box position="relative" w="170px" h={`${WHEEL_ROW_HEIGHT * 5}px`}>
      <Box
        ref={containerRef}
        h="full"
        overflowY="auto"
        userSelect="none"
        cursor="grab"
        css={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        sx={{ "&::-webkit-scrollbar": { display: "none" } }}
        onMouseDown={(e) => {
          const node = containerRef.current;
          if (!node) return;
          draggingRef.current = true;
          movedWhileDraggingRef.current = false;
          dragStartYRef.current = e.clientY;
          dragStartScrollTopRef.current = node.scrollTop;
          node.style.cursor = "grabbing";
          e.preventDefault();
        }}
        onMouseMove={(e) => {
          if (!draggingRef.current) return;
          const node = containerRef.current;
          if (!node) return;
          const deltaY = e.clientY - dragStartYRef.current;
          if (Math.abs(deltaY) > 2) movedWhileDraggingRef.current = true;
          node.scrollTop = dragStartScrollTopRef.current - deltaY;
          e.preventDefault();
        }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onScroll={() => {
          if (draggingRef.current) return;
          if (snapTimeoutRef.current !== null) window.clearTimeout(snapTimeoutRef.current);
          snapTimeoutRef.current = window.setTimeout(() => {
            handleSnap();
          }, 110);
        }}
      >
        <Box h={`${WHEEL_ROW_HEIGHT * 2}px`} />
        {options.map((dayNumber) => {
          const selected = dayNumber === value;
          return (
            <Box
              key={`wheel-day-${dayNumber}`}
              h={`${WHEEL_ROW_HEIGHT}px`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              scrollSnapAlign="center"
              cursor="pointer"
              onClick={() => {
                if (suppressNextClickRef.current) {
                  suppressNextClickRef.current = false;
                  return;
                }
                onChange(dayNumber);
              }}
            >
              <Text
                fontSize={selected ? "4xl" : "3xl"}
                lineHeight="1"
                fontWeight={selected ? "700" : "400"}
                color={selected ? "black" : "gray.400"}
                transition="all 0.15s ease"
              >
                {dayNumber}
              </Text>
            </Box>
          );
        })}
        <Box h={`${WHEEL_ROW_HEIGHT * 2}px`} />
      </Box>
      <Box
        pointerEvents="none"
        position="absolute"
        left="0"
        right="0"
        top={`calc(50% - ${WHEEL_ROW_HEIGHT / 2}px)`}
        h={`${WHEEL_ROW_HEIGHT}px`}
        borderTopWidth="1px"
        borderBottomWidth="1px"
        borderColor="gray.200"
        bg="transparent"
      />
      <Box
        pointerEvents="none"
        position="absolute"
        left="0"
        right="0"
        top="0"
        h="24px"
        bgGradient="linear(to-b, white, transparent)"
      />
      <Box
        pointerEvents="none"
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        h="24px"
        bgGradient="linear(to-t, white, transparent)"
      />
    </Box>
  );
}

function getSectionFromPath(pathname: string): ProfSection {
  if (!pathname.startsWith("/profesor")) return "inicio";
  const sectionPath = pathname.split("/")[2];
  if (!sectionPath) return "inicio";
  return PATH_TO_SECTION[sectionPath] ?? "inicio";
}

function getViewFromPath(pathname: string, hasToken: boolean): AppView {
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/dashboard")) return hasToken ? "dashboard" : "login";
  if (pathname.startsWith("/profesor")) return hasToken ? "professor" : "login";
  return hasToken ? "professor" : "login";
}

function getPathForView(view: AppView, section: ProfSection): string {
  if (view === "login") return "/login";
  if (view === "dashboard") return "/dashboard";
  return `/profesor/${SECTION_TO_PATH[section]}`;
}

function getPathForSection(section: ProfSection): string {
  return `/profesor/${SECTION_TO_PATH[section]}`;
}

const AdminRoutinesSection = lazy(() => import("./sections/AdminRoutinesSection"));
const HomeSection = lazy(() => import("./sections/HomeSection"));
const RoutinesSection = lazy(() => import("./sections/RoutinesSection"));
const ExercisesSection = lazy(() => import("./sections/ExercisesSection"));
const StudentsSection = lazy(() => import("./sections/StudentsSection"));
const ProfileSection = lazy(() => import("./sections/ProfileSection"));
const AdminDashboardSection = lazy(() => import("./sections/AdminDashboardSection"));

const ACTION_ICON_BUTTON_SIZE = { base: "xs", xl: "sm", "2xl": "md" } as const;
const ACTION_ICON_SIZE = "15px";

type Exercise = {
  id: number;
  name: string;
  arrows_count: number;
  rounds?: number;
  arrows_per_round?: number;
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
  user_id?: number | null;
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

type UserAccount = {
  id: number;
  username: string;
  role: "admin" | "professor" | "student";
  is_active: boolean;
  preferred_lang: string;
  created_at: string;
  updated_at: string;
};

type AssignmentHistory = {
  id: number;
  assignment_id?: number | null;
  student_id: number;
  student_full_name: string;
  routine_id?: number | null;
  routine_name: string;
  start_date?: string | null;
  end_date?: string | null;
  completed_at: string;
  objective: string;
  professor_notes?: string | null;
  student_observations?: string | null;
  weekly_total_arrows: number;
  snapshot_json: string;
};

type HistorySnapshotDay = {
  day_number: number;
  name?: string | null;
  label?: string | null;
  exercises?: Array<{
    name?: string;
  }>;
  items?: Array<{
    name?: string;
  }>;
};

type HistorySnapshot = {
  days?: HistorySnapshotDay[];
};

function parseHistorySnapshot(raw: unknown): HistorySnapshot | null {
  try {
    const parsed = (
      typeof raw === "string"
        ? JSON.parse(raw)
        : raw
    ) as HistorySnapshot | null;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getHistoryDayExerciseNames(day: HistorySnapshotDay): string[] {
  const fromItems = Array.isArray(day.items) ? day.items : [];
  const fromExercises = Array.isArray(day.exercises) ? day.exercises : [];
  const source = fromItems.length ? fromItems : fromExercises;
  return source
    .map((ex) => (typeof ex?.name === "string" ? ex.name.trim() : ""))
    .filter((name) => name.length > 0);
}

function normalizeHistoryItem(raw: unknown): AssignmentHistory | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<AssignmentHistory> & { snapshot_json?: unknown };
  const snapshot =
    typeof item.snapshot_json === "string"
      ? item.snapshot_json
      : JSON.stringify(item.snapshot_json ?? {});
  return {
    id: Number(item.id ?? 0),
    assignment_id: item.assignment_id ?? null,
    student_id: Number(item.student_id ?? 0),
    student_full_name: String(item.student_full_name ?? ""),
    routine_id: item.routine_id ?? null,
    routine_name: String(item.routine_name ?? ""),
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null,
    completed_at: String(item.completed_at ?? ""),
    objective: String(item.objective ?? ""),
    professor_notes: item.professor_notes ?? null,
    student_observations: item.student_observations ?? null,
    weekly_total_arrows: Number(item.weekly_total_arrows ?? 0),
    snapshot_json: snapshot,
  };
}

function formatDay(day: RoutineDay) {
  return day.name || `día ${day.day_number}`;
}

function formatDateEs(value?: string | null): string {
  if (!value) return "-";
  const [yyyy, mm, dd] = value.split("-");
  if (!yyyy || !mm || !dd) return value;
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateTimeEs(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRoleLabel(role: string | null | undefined): string {
  if (role === "admin") return "Administrador";
  if (role === "professor") return "Profesor";
  if (role === "student") return "Deportista";
  return "Sin rol";
}

function getRoutineEntryKey(exerciseId: number, itemIndex: number): string {
  return `${itemIndex}:${exerciseId}`;
}

function remapOverrideKeysAfterRemoval(
  dayOverrides: Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>,
  removedIndex: number,
): Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }> {
  const next: Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }> = {};
  Object.entries(dayOverrides).forEach(([key, value]) => {
    const [idxRaw, exerciseIdRaw] = key.split(":");
    const idx = Number(idxRaw);
    if (Number.isNaN(idx) || !exerciseIdRaw) return;
    if (idx === removedIndex) return;
    const nextIdx = idx > removedIndex ? idx - 1 : idx;
    next[`${nextIdx}:${exerciseIdRaw}`] = value;
  });
  return next;
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

function addDaysIso(startDate: string, days: number): string {
  const [yearRaw, monthRaw, dayRaw] = startDate.split("-").map(Number);
  if (!yearRaw || !monthRaw || !dayRaw) return startDate;
  const date = new Date(yearRaw, monthRaw - 1, dayRaw);
  date.setDate(date.getDate() + days);
  return toIsoLocal(date);
}

function isEndAfterStart(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return endDate > startDate;
}

function getDayCountFromRange(startDate: string, endDate: string): number {
  if (!isEndAfterStart(startDate, endDate)) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

function buildTemporaryRoutineName(baseName: string, documentNumber: string, startDate: string): string {
  const cleanedBase = (baseName || "Rutina temporal").trim();
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const composed = `${cleanedBase} · tmp ${documentNumber} ${startDate} ${stamp}`;
  return composed.length > 120 ? composed.slice(0, 120) : composed;
}

function getHistoryRoutineDisplayName(name: string | null | undefined): string {
  const raw = (name || "").trim();
  const cleaned = raw
    .replace(/\s*[·|-]?\s*tmp\s+\S+\s+\d{4}-\d{2}-\d{2}\s+\d{14}\s*$/i, "")
    .trim();
  return cleaned || "Rutina temporal";
}

function buildCombinedRoutineBaseName(routines: Routine[]): string {
  const names = routines.map((routine) => routine.name.trim()).filter(Boolean);
  if (!names.length) return "Rutina temporal";
  const combined = names.join(" + ");
  return combined.length > 120 ? combined.slice(0, 120) : combined;
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

function parseUsernameFromToken(rawToken: string | null): string | null {
  if (!rawToken) return null;
  try {
    const [, payload] = rawToken.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as { sub?: string };
    return parsed.sub || null;
  } catch {
    return null;
  }
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<AppView>(() =>
    getViewFromPath(window.location.pathname, Boolean(getStoredToken())),
  );
  const [profSection, setProfSection] = useState<ProfSection>(() => getSectionFromPath(window.location.pathname));
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState("");
  const [editRounds, setEditRounds] = useState<number | "">("");
  const [editArrows, setEditArrows] = useState<number | "">("");
  const [editDistance, setEditDistance] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isClosingEditExerciseMobileScreen, setIsClosingEditExerciseMobileScreen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRoutineModalOpen, setCreateRoutineModalOpen] = useState(false);
  const [routineModalStep, setRoutineModalStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineDayCount, setRoutineDayCount] = useState(1);
  const [routineDayInitialLimit, setRoutineDayInitialLimit] = useState(1);
  const [routineDayCursor, setRoutineDayCursor] = useState(0);
  const [routineExercisesByDay, setRoutineExercisesByDay] = useState<Record<string, number[]>>({});
  const [routineExerciseSearch, setRoutineExerciseSearch] = useState("");
  const [routineCreateExerciseOverridesByDay, setRoutineCreateExerciseOverridesByDay] = useState<
    Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>
  >({});
  const [routineCreateAddExerciseModalOpen, setRoutineCreateAddExerciseModalOpen] = useState(false);
  const [routineCreateAddExerciseDayKey, setRoutineCreateAddExerciseDayKey] = useState<string | null>(null);
  const [routineCreateAddExerciseSearch, setRoutineCreateAddExerciseSearch] = useState("");
  const routineCreateAddExerciseMobileHistoryActiveRef = useRef(false);
  const [routineCreateEditExerciseModalOpen, setRoutineCreateEditExerciseModalOpen] = useState(false);
  const [routineCreateEditTarget, setRoutineCreateEditTarget] = useState<{ dayKey: string; exerciseId: number; itemIndex: number } | null>(null);
  const [routineCreateEditRounds, setRoutineCreateEditRounds] = useState<number | "">("");
  const [routineCreateEditArrows, setRoutineCreateEditArrows] = useState<number | "">("");
  const [routineCreateEditDistance, setRoutineCreateEditDistance] = useState<number | "">("");
  const [routineCreateEditDescription, setRoutineCreateEditDescription] = useState("");
  const routineCreateEditExerciseMobileHistoryActiveRef = useRef(false);
  const [deleteRoutineDayConfirmOpen, setDeleteRoutineDayConfirmOpen] = useState(false);
  const [deleteRoutineDayTargetNumber, setDeleteRoutineDayTargetNumber] = useState<number | null>(null);
  const [routineModalBodyHeight, setRoutineModalBodyHeight] = useState<number | null>(null);
  const [createRoutineLoading, setCreateRoutineLoading] = useState(false);
  const [createRoutineError, setCreateRoutineError] = useState<string | null>(null);
  const [assignRoutineModalOpen, setAssignRoutineModalOpen] = useState(false);
  const [assignRoutineStudent, setAssignRoutineStudent] = useState<Student | null>(null);
  const [assignRoutineStep, setAssignRoutineStep] = useState<"choice" | "existing_list" | "existing_order" | "existing_days" | "existing_preview" | "existing_dates">("choice");
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [selectedRoutineIdsToAssign, setSelectedRoutineIdsToAssign] = useState<number[]>([]);
  const [draggingRoutineOrderId, setDraggingRoutineOrderId] = useState<number | null>(null);
  const [hoveredRoutineOrderId, setHoveredRoutineOrderId] = useState<number | null>(null);
  const [draggingRoutineOrderTop, setDraggingRoutineOrderTop] = useState<number | null>(null);
  const [draggingRoutineOrderLeft, setDraggingRoutineOrderLeft] = useState<number | null>(null);
  const [draggingRoutineOrderWidth, setDraggingRoutineOrderWidth] = useState<number | null>(null);
  const [draggingRoutineOrderHeight, setDraggingRoutineOrderHeight] = useState<number>(0);
  const draggingRoutinePointerOffsetYRef = useRef(0);
  const routineOrderItemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const routineOrderContainerRef = useRef<HTMLDivElement | null>(null);
  const routineOrderButtonAnimationTimeoutRef = useRef<number | null>(null);
  const [routineOrderButtonAnimationById, setRoutineOrderButtonAnimationById] = useState<Record<number, "up" | "down">>({});
  const [assignRoutineError, setAssignRoutineError] = useState<string | null>(null);
  const [assignRoutineLoading, setAssignRoutineLoading] = useState(false);
  const [assignmentStartDate, setAssignmentStartDate] = useState<string>(getTodayIsoLocal());
  const [assignmentEndDate, setAssignmentEndDate] = useState<string>(addDaysIso(getTodayIsoLocal(), 1));
  const [assignmentProfessorNotes, setAssignmentProfessorNotes] = useState("");
  const [assignmentObjective, setAssignmentObjective] = useState("");
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
  const [routineAssignDayInitialLimit, setRoutineAssignDayInitialLimit] = useState(1);
  const [routineAssignExercisesByDay, setRoutineAssignExercisesByDay] = useState<Record<string, number[]>>({});
  const [routineAssignExerciseOverridesByDay, setRoutineAssignExerciseOverridesByDay] = useState<
    Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>
  >({});
  const [addExerciseDayModalOpen, setAddExerciseDayModalOpen] = useState(false);
  const [addExerciseTargetDayKey, setAddExerciseTargetDayKey] = useState<string | null>(null);
  const [addExerciseSearch, setAddExerciseSearch] = useState("");
  const addExerciseDayMobileHistoryActiveRef = useRef(false);
  const [editAssignExerciseModalOpen, setEditAssignExerciseModalOpen] = useState(false);
  const [editAssignExerciseTarget, setEditAssignExerciseTarget] = useState<{ dayKey: string; exerciseId: number; itemIndex: number } | null>(null);
  const [editAssignRounds, setEditAssignRounds] = useState<number | "">("");
  const [editAssignArrows, setEditAssignArrows] = useState<number | "">("");
  const [editAssignDistance, setEditAssignDistance] = useState<number | "">("");
  const [editAssignDescription, setEditAssignDescription] = useState("");
  const editAssignExerciseMobileHistoryActiveRef = useRef(false);
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
  const assignmentEndDatePickerRef = useRef<HTMLInputElement | null>(null);
  const [createName, setCreateName] = useState("");
  const [createRounds, setCreateRounds] = useState<number | "">("");
  const [createArrows, setCreateArrows] = useState<number | "">("");
  const [createDistance, setCreateDistance] = useState<number | "">("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isClosingCreateExerciseMobileScreen, setIsClosingCreateExerciseMobileScreen] = useState(false);
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
  const [isClosingEditStudentMobileScreen, setIsClosingEditStudentMobileScreen] = useState(false);
  const [studentFullName, setStudentFullName] = useState("");
  const [studentAccountUsername, setStudentAccountUsername] = useState("");
  const [studentAccountPassword, setStudentAccountPassword] = useState("");
  const [adminAssignModalOpen, setAdminAssignModalOpen] = useState(false);
  const [adminAssignSearch, setAdminAssignSearch] = useState("");
  const [adminAssignSelectedStudentId, setAdminAssignSelectedStudentId] = useState<number | null>(null);
  const [studentDocumentNumber, setStudentDocumentNumber] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [studentBowPounds, setStudentBowPounds] = useState<number | "">("");
  const [studentArrowsAvailable, setStudentArrowsAvailable] = useState<number | "">("");
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [createStudentError, setCreateStudentError] = useState<string | null>(null);
  const [isClosingCreateStudentMobileScreen, setIsClosingCreateStudentMobileScreen] = useState(false);
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
  const [studentHistoryModalOpen, setStudentHistoryModalOpen] = useState(false);
  const [studentHistoryTarget, setStudentHistoryTarget] = useState<Student | null>(null);
  const [studentHistorySearch, setStudentHistorySearch] = useState("");
  const [studentHistoryLoading, setStudentHistoryLoading] = useState(false);
  const [studentHistoryError, setStudentHistoryError] = useState<string | null>(null);
  const [studentHistoryItems, setStudentHistoryItems] = useState<AssignmentHistory[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [studentHistoryExportLoadingId, setStudentHistoryExportLoadingId] = useState<number | null>(null);
  const [deleteAssignedRoutineModalOpen, setDeleteAssignedRoutineModalOpen] = useState(false);
  const [deleteAssignedRoutineTarget, setDeleteAssignedRoutineTarget] = useState<Assignment | null>(null);
  const [deleteAssignedRoutineLoading, setDeleteAssignedRoutineLoading] = useState(false);
  const [deleteAssignedRoutineError, setDeleteAssignedRoutineError] = useState<string | null>(null);
  const [saveAssignmentModalOpen, setSaveAssignmentModalOpen] = useState(false);
  const [saveAssignmentTargetId, setSaveAssignmentTargetId] = useState<number | null>(null);
  const [saveAssignmentStudentObservations, setSaveAssignmentStudentObservations] = useState("");
  const [saveAssignmentError, setSaveAssignmentError] = useState<string | null>(null);
  const [saveAssignmentLoadingId, setSaveAssignmentLoadingId] = useState<number | null>(null);
  const [exportAssignmentLoadingId, setExportAssignmentLoadingId] = useState<number | null>(null);
  const [exportAssignmentError, setExportAssignmentError] = useState<string | null>(null);
  const [preAssignConflictModalOpen, setPreAssignConflictModalOpen] = useState(false);
  const [preAssignConflictStudent, setPreAssignConflictStudent] = useState<Student | null>(null);
  const [preAssignConflictAssignment, setPreAssignConflictAssignment] = useState<Assignment | null>(null);
  const [preAssignConflictLoading, setPreAssignConflictLoading] = useState(false);
  const [preAssignConflictError, setPreAssignConflictError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isDesktopViewport] = useMediaQuery("(min-width: 48em)");
  const [userRole, setUserRole] = useState<string | null>(() => parseRoleFromToken(getStoredToken()));
  const studentHistoryMobileHistoryActiveRef = useRef(false);
  const closeEditStudentMobileTimeoutRef = useRef<number | null>(null);
  const editStudentMobileHistoryActiveRef = useRef(false);
  const editStudentMobileClosingFromPopRef = useRef(false);
  const closeEditExerciseMobileTimeoutRef = useRef<number | null>(null);
  const editExerciseMobileHistoryActiveRef = useRef(false);
  const editExerciseMobileClosingFromPopRef = useRef(false);
  const closeCreateExerciseMobileTimeoutRef = useRef<number | null>(null);
  const createExerciseMobileHistoryActiveRef = useRef(false);
  const createExerciseMobileClosingFromPopRef = useRef(false);
  const closeCreateStudentMobileTimeoutRef = useRef<number | null>(null);
  const createStudentMobileHistoryActiveRef = useRef(false);
  const createStudentMobileClosingFromPopRef = useRef(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => localStorage.getItem("remember_me") !== "0");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordCurrent, setChangePasswordCurrent] = useState("");
  const [changePasswordNext, setChangePasswordNext] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const changePasswordMobileHistoryActiveRef = useRef(false);
  const [adminUserModalOpen, setAdminUserModalOpen] = useState(false);
  const [adminUserUsername, setAdminUserUsername] = useState("");
  const [adminUserPassword, setAdminUserPassword] = useState("");
  const [adminUserRole, setAdminUserRole] = useState<"admin" | "professor" | "student">("professor");
  const [adminUserCreateLoading, setAdminUserCreateLoading] = useState(false);
  const [adminUserCreateError, setAdminUserCreateError] = useState<string | null>(null);
  const [adminUserMutationId, setAdminUserMutationId] = useState<number | null>(null);
  const [adminUserMutationError, setAdminUserMutationError] = useState<string | null>(null);
  const canManageUsers = userRole === "admin";
  const currentUsername = parseUsernameFromToken(token) ?? username;
  const changePasswordValidationError = useMemo(() => {
    if (!changePasswordCurrent || !changePasswordNext || !changePasswordConfirm) {
      return "Todos los campos son obligatorios";
    }
    if (changePasswordNext.length < 8) {
      return "La nueva contraseña debe tener al menos 8 caracteres";
    }
    if (changePasswordCurrent === changePasswordNext) {
      return "La nueva contraseña no puede ser igual a la actual";
    }
    if (changePasswordNext !== changePasswordConfirm) {
      return "Las contraseñas no coinciden";
    }
    return null;
  }, [changePasswordConfirm, changePasswordCurrent, changePasswordNext]);
  const changePasswordCanSubmit =
    Boolean(changePasswordCurrent) &&
    Boolean(changePasswordNext) &&
    Boolean(changePasswordConfirm) &&
    !changePasswordValidationError &&
    !changePasswordLoading;
  const appData = useAppDataController(token, { view, activeSection: view === "professor" ? profSection : null });
  const {
    health,
    exercises,
    setExercises,
    routines,
    setRoutines,
    students,
    setStudents,
    assignments,
    setAssignments,
    users,
    setUsers,
    loading,
    error,
    ensureExercisesLoaded,
    ensureRoutinesLoaded,
    ensureStudentsLoaded,
    ensureAssignmentsLoaded,
  } = appData;

  useEffect(() => {
    setUserRole(parseRoleFromToken(token));
  }, [token]);

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const detail = (event as CustomEvent<{ accessToken: string | null }>).detail;
      setToken(detail?.accessToken ?? null);
    };
    window.addEventListener(getAuthEventName(), handleAuthChange as EventListener);
    return () => window.removeEventListener(getAuthEventName(), handleAuthChange as EventListener);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void apiFetch<{ username: string; role: string }>("/auth/me", { token })
      .then((me) => {
        if (cancelled) return;
        setUsername(me.username);
        setUserRole(me.role);
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredAuth();
        setToken(null);
        setUserRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => () => {
    if (closeEditStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditStudentMobileTimeoutRef.current);
    }
    if (closeEditExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditExerciseMobileTimeoutRef.current);
    }
    if (closeCreateExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateExerciseMobileTimeoutRef.current);
    }
    if (closeCreateStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateStudentMobileTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const hasToken = Boolean(token);
    const nextView = getViewFromPath(location.pathname, hasToken);
    const nextSection = getSectionFromPath(location.pathname);

    if (view !== nextView) setView(nextView);
    if (profSection !== nextSection) setProfSection(nextSection);

    if (!hasToken && nextView !== "login") {
      navigate("/login", { replace: true });
      return;
    }

    if (nextView === "login" && location.pathname !== "/login") {
      navigate("/login", { replace: true });
      return;
    }

    if (hasToken && location.pathname === "/login") {
      navigate(getPathForView("professor", nextSection), { replace: true });
      return;
    }

    if (nextView === "professor" && (!location.pathname.startsWith("/profesor/"))) {
      navigate(getPathForSection(nextSection), { replace: true });
      return;
    }

    if (nextView === "dashboard" && userRole !== "admin") {
      navigate(getPathForView(hasToken ? "professor" : "login", nextSection), { replace: true });
    }
  }, [token, userRole, location.pathname, navigate, view, profSection]);

  const goToView = useCallback((nextView: AppView, replace = false) => {
    navigate(getPathForView(nextView, profSection), { replace });
  }, [navigate, profSection]);

  const goToSection = useCallback((section: ProfSection, replace = false) => {
    navigate(getPathForSection(section), { replace });
  }, [navigate]);

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

  const deriveRoundsAndArrowsPerRound = (totalArrows: number | "", baseRounds: number, baseArrowsPerRound: number) => {
    if (totalArrows === "" || Number(totalArrows) < 0) {
      return { rounds: baseRounds > 0 ? baseRounds : 1, arrowsPerRound: baseArrowsPerRound >= 0 ? baseArrowsPerRound : 0 };
    }
    const total = Number(totalArrows);
    if (baseRounds > 0 && total % baseRounds === 0) {
      return { rounds: baseRounds, arrowsPerRound: total / baseRounds };
    }
    return { rounds: 1, arrowsPerRound: total };
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
          rounds: Number(editRounds),
          arrows_per_round: Number(editArrows),
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
          rounds: Number(createRounds),
          arrows_per_round: Number(createArrows),
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

  const resetEditExerciseForm = useCallback(() => {
    setEditModalOpen(false);
    setEditExercise(null);
    setEditName("");
    setEditRounds("");
    setEditArrows("");
    setEditDistance("");
    setEditDescription("");
    setEditError(null);
    setEditLoading(false);
  }, []);

  const finishCloseEditExerciseMobileScreen = useCallback(() => {
    setIsClosingEditExerciseMobileScreen(true);
    if (closeEditExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditExerciseMobileTimeoutRef.current);
    }
    closeEditExerciseMobileTimeoutRef.current = window.setTimeout(() => {
      setIsClosingEditExerciseMobileScreen(false);
      resetEditExerciseForm();
      editExerciseMobileClosingFromPopRef.current = false;
      closeEditExerciseMobileTimeoutRef.current = null;
    }, CREATE_STUDENT_MOBILE_ANIMATION_MS);
  }, [resetEditExerciseForm]);

  const closeEditExerciseModal = useCallback(() => {
    if (!editModalOpen) {
      resetEditExerciseForm();
      return;
    }
    if (isDesktopViewport) {
      setIsClosingEditExerciseMobileScreen(false);
      editExerciseMobileHistoryActiveRef.current = false;
      editExerciseMobileClosingFromPopRef.current = false;
      resetEditExerciseForm();
      return;
    }
    if (editExerciseMobileHistoryActiveRef.current && !editExerciseMobileClosingFromPopRef.current) {
      window.history.back();
      return;
    }
    finishCloseEditExerciseMobileScreen();
  }, [editModalOpen, finishCloseEditExerciseMobileScreen, isDesktopViewport, resetEditExerciseForm]);

  const resetCreateExerciseForm = useCallback(() => {
    setCreateName("");
    setCreateRounds("");
    setCreateArrows("");
    setCreateDistance("");
    setCreateDescription("");
    setCreateError(null);
    setCreateLoading(false);
  }, []);

  const finishCloseCreateExerciseMobileScreen = useCallback(() => {
    setIsClosingCreateExerciseMobileScreen(true);
    if (closeCreateExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateExerciseMobileTimeoutRef.current);
    }
    closeCreateExerciseMobileTimeoutRef.current = window.setTimeout(() => {
      setCreateModalOpen(false);
      setIsClosingCreateExerciseMobileScreen(false);
      resetCreateExerciseForm();
      createExerciseMobileClosingFromPopRef.current = false;
      closeCreateExerciseMobileTimeoutRef.current = null;
    }, CREATE_STUDENT_MOBILE_ANIMATION_MS);
  }, [resetCreateExerciseForm]);

  const closeCreateExerciseModal = useCallback(() => {
    if (!createModalOpen) {
      resetCreateExerciseForm();
      return;
    }
    if (isDesktopViewport) {
      setCreateModalOpen(false);
      setIsClosingCreateExerciseMobileScreen(false);
      createExerciseMobileHistoryActiveRef.current = false;
      createExerciseMobileClosingFromPopRef.current = false;
      resetCreateExerciseForm();
      return;
    }
    if (createExerciseMobileHistoryActiveRef.current && !createExerciseMobileClosingFromPopRef.current) {
      window.history.back();
      return;
    }
    finishCloseCreateExerciseMobileScreen();
  }, [createModalOpen, finishCloseCreateExerciseMobileScreen, isDesktopViewport, resetCreateExerciseForm]);

  const openCreateExerciseModal = useCallback(() => {
    if (closeCreateExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateExerciseMobileTimeoutRef.current);
      closeCreateExerciseMobileTimeoutRef.current = null;
    }
    createExerciseMobileClosingFromPopRef.current = false;
    setIsClosingCreateExerciseMobileScreen(false);
    if (!isDesktopViewport && !createExerciseMobileHistoryActiveRef.current) {
      window.history.pushState({ createExerciseMobile: true }, "", window.location.href);
      createExerciseMobileHistoryActiveRef.current = true;
    }
    setCreateModalOpen(true);
  }, [isDesktopViewport]);

  const openEditExerciseModal = useCallback((exercise: Exercise) => {
    if (closeEditExerciseMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditExerciseMobileTimeoutRef.current);
      closeEditExerciseMobileTimeoutRef.current = null;
    }
    editExerciseMobileClosingFromPopRef.current = false;
    setIsClosingEditExerciseMobileScreen(false);
    setEditExercise(exercise);
    setEditName(exercise.name);
    setEditRounds(exercise.rounds ?? 1);
    setEditArrows(exercise.arrows_per_round ?? exercise.arrows_count);
    setEditDistance(exercise.distance_m);
    setEditDescription(exercise.description || "");
    setEditError(null);
    if (!isDesktopViewport && !editExerciseMobileHistoryActiveRef.current) {
      window.history.pushState({ editExerciseMobile: exercise.id }, "", window.location.href);
      editExerciseMobileHistoryActiveRef.current = true;
    }
    setEditModalOpen(true);
  }, [isDesktopViewport]);

  const handleCreateStudentSave = async () => {
    if (!token) return;
    if (studentAccountUsername.trim().length < 3) {
      setCreateStudentError("El usuario debe tener al menos 3 caracteres");
      return;
    }
    if (studentAccountPassword.length < 8) {
      setCreateStudentError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
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
          account_username: studentAccountUsername.trim(),
          account_password: studentAccountPassword,
        }),
      });
      setStudents((prev) => [...prev, created]);
      closeCreateStudentModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear deportista";
      setCreateStudentError(msg);
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const resetCreateStudentForm = useCallback(() => {
    setStudentFullName("");
    setStudentAccountUsername("");
    setStudentAccountPassword("");
    setStudentDocumentNumber("");
    setStudentContact("");
    setStudentBowPounds("");
    setStudentArrowsAvailable("");
    setCreateStudentError(null);
    setCreateStudentLoading(false);
  }, []);

  const finishCloseCreateStudentMobileScreen = useCallback(() => {
    setIsClosingCreateStudentMobileScreen(true);
    if (closeCreateStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateStudentMobileTimeoutRef.current);
    }
    closeCreateStudentMobileTimeoutRef.current = window.setTimeout(() => {
      setCreateStudentModalOpen(false);
      setIsClosingCreateStudentMobileScreen(false);
      resetCreateStudentForm();
      createStudentMobileClosingFromPopRef.current = false;
      closeCreateStudentMobileTimeoutRef.current = null;
    }, CREATE_STUDENT_MOBILE_ANIMATION_MS);
  }, [resetCreateStudentForm]);

  const closeCreateStudentModal = useCallback(() => {
    if (!createStudentModalOpen) {
      resetCreateStudentForm();
      return;
    }
    if (isDesktopViewport) {
      setCreateStudentModalOpen(false);
      setIsClosingCreateStudentMobileScreen(false);
      createStudentMobileHistoryActiveRef.current = false;
      createStudentMobileClosingFromPopRef.current = false;
      resetCreateStudentForm();
      return;
    }
    if (createStudentMobileHistoryActiveRef.current && !createStudentMobileClosingFromPopRef.current) {
      window.history.back();
      return;
    }
    finishCloseCreateStudentMobileScreen();
  }, [createStudentModalOpen, finishCloseCreateStudentMobileScreen, isDesktopViewport, resetCreateStudentForm]);

  const openCreateStudentModal = useCallback(() => {
    if (closeCreateStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeCreateStudentMobileTimeoutRef.current);
      closeCreateStudentMobileTimeoutRef.current = null;
    }
    createStudentMobileClosingFromPopRef.current = false;
    setIsClosingCreateStudentMobileScreen(false);
    if (!isDesktopViewport && !createStudentMobileHistoryActiveRef.current) {
      window.history.pushState({ createStudentMobile: true }, "", window.location.href);
      createStudentMobileHistoryActiveRef.current = true;
    }
    setCreateStudentModalOpen(true);
  }, [isDesktopViewport]);

  const resetEditStudentForm = useCallback(() => {
    setEditStudentModalOpen(false);
    setEditStudentTarget(null);
    setEditStudentFullName("");
    setEditStudentDocumentNumber("");
    setEditStudentContact("");
    setEditStudentBowPounds("");
    setEditStudentArrowsAvailable("");
    setEditStudentError(null);
    setEditStudentLoading(false);
  }, []);

  const finishCloseEditStudentMobileScreen = useCallback(() => {
    setIsClosingEditStudentMobileScreen(true);
    if (closeEditStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditStudentMobileTimeoutRef.current);
    }
    closeEditStudentMobileTimeoutRef.current = window.setTimeout(() => {
      setIsClosingEditStudentMobileScreen(false);
      resetEditStudentForm();
      editStudentMobileClosingFromPopRef.current = false;
      closeEditStudentMobileTimeoutRef.current = null;
    }, CREATE_STUDENT_MOBILE_ANIMATION_MS);
  }, [resetEditStudentForm]);

  const closeEditStudentModal = useCallback(() => {
    if (!editStudentModalOpen) {
      resetEditStudentForm();
      return;
    }
    if (isDesktopViewport) {
      setIsClosingEditStudentMobileScreen(false);
      editStudentMobileHistoryActiveRef.current = false;
      editStudentMobileClosingFromPopRef.current = false;
      resetEditStudentForm();
      return;
    }
    if (editStudentMobileHistoryActiveRef.current && !editStudentMobileClosingFromPopRef.current) {
      window.history.back();
      return;
    }
    finishCloseEditStudentMobileScreen();
  }, [editStudentModalOpen, finishCloseEditStudentMobileScreen, isDesktopViewport, resetEditStudentForm]);

  useEffect(() => {
    if (!createModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!createExerciseMobileHistoryActiveRef.current) return;
      createExerciseMobileHistoryActiveRef.current = false;
      createExerciseMobileClosingFromPopRef.current = true;
      finishCloseCreateExerciseMobileScreen();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [createModalOpen, finishCloseCreateExerciseMobileScreen, isDesktopViewport]);

  useEffect(() => {
    if (!editModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!editExerciseMobileHistoryActiveRef.current) return;
      editExerciseMobileHistoryActiveRef.current = false;
      editExerciseMobileClosingFromPopRef.current = true;
      finishCloseEditExerciseMobileScreen();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editModalOpen, finishCloseEditExerciseMobileScreen, isDesktopViewport]);

  useEffect(() => {
    if (!editStudentModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!editStudentMobileHistoryActiveRef.current) return;
      editStudentMobileHistoryActiveRef.current = false;
      editStudentMobileClosingFromPopRef.current = true;
      finishCloseEditStudentMobileScreen();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editStudentModalOpen, finishCloseEditStudentMobileScreen, isDesktopViewport]);

  useEffect(() => {
    if (!studentHistoryModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!studentHistoryMobileHistoryActiveRef.current) return;
      studentHistoryMobileHistoryActiveRef.current = false;
      setStudentHistoryModalOpen(false);
      setStudentHistoryTarget(null);
      setStudentHistorySearch("");
      setStudentHistoryError(null);
      setStudentHistoryItems([]);
      setExpandedHistoryId(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDesktopViewport, studentHistoryModalOpen]);

  useEffect(() => {
    if (!changePasswordModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!changePasswordMobileHistoryActiveRef.current) return;
      changePasswordMobileHistoryActiveRef.current = false;
      setChangePasswordModalOpen(false);
      setChangePasswordError(null);
      setChangePasswordCurrent("");
      setChangePasswordNext("");
      setChangePasswordConfirm("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [changePasswordModalOpen, isDesktopViewport]);

  useEffect(() => {
    if (!createStudentModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!createStudentMobileHistoryActiveRef.current) return;
      createStudentMobileHistoryActiveRef.current = false;
      createStudentMobileClosingFromPopRef.current = true;
      finishCloseCreateStudentMobileScreen();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [createStudentModalOpen, finishCloseCreateStudentMobileScreen, isDesktopViewport]);

  const createStudentCanSave =
    !createStudentLoading &&
    Boolean(studentAccountUsername) &&
    Boolean(studentAccountPassword) &&
    Boolean(studentFullName) &&
    Boolean(studentDocumentNumber);

  const editStudentCanSave =
    !editStudentLoading &&
    Boolean(editStudentFullName) &&
    Boolean(editStudentDocumentNumber);

  const createExerciseCanSave =
    !createLoading &&
    Boolean(createName) &&
    createRounds !== "" &&
    createArrows !== "" &&
    createDistance !== "";

  const editExerciseCanSave =
    !editLoading &&
    Boolean(editName) &&
    editRounds !== "" &&
    editArrows !== "" &&
    editDistance !== "";

  const createExerciseFormFields = (
    <Stack spacing={4}>
      <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" px={{ base: 4, md: 0 }} py={{ base: 4, md: 0 }} boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.04)", md: "none" }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Text fontSize="13px" fontWeight="800" color="#1f2937">Datos del ejercicio</Text>
            <Text fontSize="11px" color="#667085">Configura nombre, volumen y distancia del nuevo ejercicio.</Text>
          </Stack>
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
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <FormControl>
              <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                step={1}
                value={createRounds}
                onChange={(e) => setCreateRounds(normalizeInt(e.target.value))}
                onKeyDown={(e) => blockInvalidKeys(e, false)}
                onBeforeInput={handleBeforeInputInt}
                onPaste={handlePasteInt}
                borderColor="gray.300"
                borderRadius="8px"
                _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
        </Stack>
      </Box>
      {createError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {createError}
        </Alert>
      )}
    </Stack>
  );

  const editExerciseFormFields = (
    <Stack spacing={4}>
      <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" px={{ base: 4, md: 0 }} py={{ base: 4, md: 0 }} boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.04)", md: "none" }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Text fontSize="13px" fontWeight="800" color="#1f2937">Datos del ejercicio</Text>
            <Text fontSize="11px" color="#667085">Actualiza nombre, volumen y distancia del ejercicio.</Text>
          </Stack>
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
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <FormControl>
              <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                step={1}
                value={editRounds}
                onChange={(e) => setEditRounds(normalizeInt(e.target.value))}
                onKeyDown={(e) => blockInvalidKeys(e, false)}
                onBeforeInput={handleBeforeInputInt}
                onPaste={handlePasteInt}
                borderColor="gray.300"
                borderRadius="8px"
                _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
        </Stack>
      </Box>
      {editError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {editError}
        </Alert>
      )}
    </Stack>
  );

  const createStudentFormFields = (
    <Stack spacing={4}>
      <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" px={{ base: 4, md: 0 }} py={{ base: 4, md: 0 }} boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.04)", md: "none" }}>
        <Stack spacing={4}>
          <Box position="absolute" left="-9999px" top="auto" w="1px" h="1px" overflow="hidden" aria-hidden="true">
            <Input
              tabIndex={-1}
              name="fake-login-username"
              autoComplete="username"
              value=""
              readOnly
            />
            <Input
              tabIndex={-1}
              type="password"
              name="fake-login-password"
              autoComplete="current-password"
              value=""
              readOnly
            />
          </Box>
          <Stack spacing={1}>
            <Text fontSize="13px" fontWeight="800" color="#1f2937">Cuenta del deportista</Text>
            <Text fontSize="11px" color="#667085">Define el usuario y la contraseña inicial para el acceso del alumno.</Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired>
              <FormLabel color="gray.700" fontSize="sm">Usuario</FormLabel>
              <Input
                value={studentAccountUsername}
                onChange={(e) => {
                  setStudentAccountUsername(e.target.value);
                  if (createStudentError) setCreateStudentError(null);
                }}
                name="student-account-access"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore
                data-bwignore="true"
                placeholder="Nombre de usuario"
                borderColor="gray.300"
                borderRadius="8px"
                _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color="gray.700" fontSize="sm">Contraseña inicial</FormLabel>
              <PasswordInput
                value={studentAccountPassword}
                onChange={(e) => {
                  setStudentAccountPassword(e.target.value);
                  if (createStudentError) setCreateStudentError(null);
                }}
                name="student-account-secret"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore
                data-bwignore="true"
                placeholder="Mínimo 8 caracteres"
                borderColor="gray.300"
                borderRadius="8px"
                _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
              />
            </FormControl>
          </SimpleGrid>
        </Stack>
      </Box>

      <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" px={{ base: 4, md: 0 }} py={{ base: 4, md: 0 }} boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.04)", md: "none" }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Text fontSize="13px" fontWeight="800" color="#1f2937">Datos del deportista</Text>
            <Text fontSize="11px" color="#667085">Completa la ficha para que aparezca en la lista y pueda recibir rutinas.</Text>
          </Stack>
          <FormControl isRequired>
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
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <FormControl isRequired>
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
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
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
        </Stack>
      </Box>

      {createStudentError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {createStudentError}
        </Alert>
      )}
    </Stack>
  );

  const editStudentFormFields = (
    <Stack spacing={4}>
      <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" px={{ base: 4, md: 0 }} py={{ base: 4, md: 0 }} boxShadow={{ base: "0 10px 24px rgba(15, 23, 42, 0.04)", md: "none" }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Text fontSize="13px" fontWeight="800" color="#1f2937">Datos del deportista</Text>
            <Text fontSize="11px" color="#667085">Actualiza la información personal y técnica del deportista.</Text>
          </Stack>
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
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
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
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
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
        </Stack>
      </Box>
      {editStudentError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {editStudentError}
        </Alert>
      )}
    </Stack>
  );

  const openEditStudentModal = useCallback((student: Student) => {
    if (closeEditStudentMobileTimeoutRef.current !== null) {
      window.clearTimeout(closeEditStudentMobileTimeoutRef.current);
      closeEditStudentMobileTimeoutRef.current = null;
    }
    editStudentMobileClosingFromPopRef.current = false;
    setIsClosingEditStudentMobileScreen(false);
    setEditStudentTarget(student);
    setEditStudentFullName(student.full_name);
    setEditStudentDocumentNumber(student.document_number);
    setEditStudentContact(student.contact || "");
    setEditStudentBowPounds(student.bow_pounds ?? "");
    setEditStudentArrowsAvailable(student.arrows_available ?? "");
    setEditStudentError(null);
    if (!isDesktopViewport && !editStudentMobileHistoryActiveRef.current) {
      window.history.pushState({ editStudentMobile: student.id }, "", window.location.href);
      editStudentMobileHistoryActiveRef.current = true;
    }
    setEditStudentModalOpen(true);
  }, [isDesktopViewport]);

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
      const msg = err instanceof Error ? err.message : "Error al editar deportista";
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
  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return a.full_name.localeCompare(b.full_name, "es", { sensitivity: "base" });
      }),
    [students],
  );
  const activeStudents = useMemo(() => sortedStudents.filter((s) => s.is_active), [sortedStudents]);
  const activeAssignmentStudentIds = useMemo(
    () => new Set(assignments.filter((a) => a.status === "active").map((a) => a.student_id)),
    [assignments],
  );
  const adminAssignableStudents = useMemo(() => {
    const withoutActiveRoutine = activeStudents.filter((student) => !activeAssignmentStudentIds.has(student.id));
    const term = adminAssignSearch.trim().toLowerCase();
    if (!term) return withoutActiveRoutine;
    return withoutActiveRoutine.filter((student) => {
      const byName = student.full_name.toLowerCase().includes(term);
      const byDoc = student.document_number.toLowerCase().includes(term);
      const byContact = (student.contact || "").toLowerCase().includes(term);
      return byName || byDoc || byContact;
    });
  }, [activeStudents, activeAssignmentStudentIds, adminAssignSearch]);
  const studentNameById = useMemo(() => new Map(students.map((s) => [s.id, s.full_name])), [students]);
  const routineNameById = useMemo(() => new Map(routines.map((r) => [r.id, r.name])), [routines]);
  const activeAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.status === "active")
        .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || "")),
    [assignments],
  );
  const usersSortedByCreated = useMemo(
    () => [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [users],
  );
  const usersSortedByUpdated = useMemo(
    () => [...users].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [users],
  );
  const activeUserCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);
  const inactiveUsers = useMemo(() => users.filter((user) => !user.is_active), [users]);
  const professorUserCount = useMemo(() => users.filter((user) => user.role === "professor").length, [users]);
  const adminUserCount = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);
  const recentUserChanges = useMemo(() => usersSortedByUpdated.slice(0, 5), [usersSortedByUpdated]);
  const recentUsers = useMemo(() => usersSortedByCreated.slice(0, 5), [usersSortedByCreated]);
  const lastUserUpdate = usersSortedByUpdated[0] ?? null;
  const mobileSectionTitle = useMemo(() => {
    if (profSection === "inicio") return "Inicio";
    if (profSection === "rutina") return "Rutinas";
    if (profSection === "ejercicio") return "Ejercicios";
    if (profSection === "alumno") return "Deportistas";
    if (profSection === "perfil") return "Perfil";
    return "Rutinas en curso";
  }, [profSection]);
  const filteredStudentHistoryItems = useMemo(() => {
    const term = studentHistorySearch.trim().toLowerCase();
    if (!term) return studentHistoryItems;
    return studentHistoryItems.filter((item) => {
      const byRoutine = (item.routine_name || "").toLowerCase().includes(term);
      const byObjective = (item.objective || "").toLowerCase().includes(term);
      return byRoutine || byObjective;
    });
  }, [studentHistoryItems, studentHistorySearch]);

  const handleExportHistoryPdf = useCallback(async (historyItem: AssignmentHistory) => {
    if (!token) return;
    if (!historyItem.assignment_id) {
      setStudentHistoryError("No se puede exportar PDF para este registro de historial.");
      return;
    }
    setStudentHistoryError(null);
    setStudentHistoryExportLoadingId(historyItem.id);
    try {
      const response = await fetch(`${API_BASE}/assignments/${historyItem.assignment_id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        let detail = "No se pudo generar el PDF";
        try {
          const body = (await response.json()) as { detail?: string };
          if (body?.detail) detail = body.detail;
        } catch {
          // ignore parse error
        }
        throw new Error(detail);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename=\"([^\"]+)\"/i);
      const filename = match?.[1] || `historial_${historyItem.id}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo exportar el PDF del historial";
      setStudentHistoryError(msg);
    } finally {
      setStudentHistoryExportLoadingId(null);
    }
  }, [token]);

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
  const currentRoutineDayExercises = currentRoutineDayKey ? (routineExercisesByDay[currentRoutineDayKey] || []) : [];
  const currentRoutineDayLabel = currentRoutineDay?.label || "";
  const exerciseNameById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.name])), [exercises]);
  const exerciseArrowsById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex.arrows_count])), [exercises]);
  const currentRoutineDayTotalArrows = useMemo(
    () => currentRoutineDayExercises.reduce((sum, exerciseId) => sum + Number(exerciseArrowsById.get(exerciseId) ?? 0), 0),
    [currentRoutineDayExercises, exerciseArrowsById],
  );
  const getSummaryDayArrows = useCallback(
    (
      exerciseIds: number[],
      dayKey: string,
      overridesByDay: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>>,
    ) =>
      exerciseIds.reduce((sum, exerciseId, itemIndex) => {
        const override = overridesByDay[dayKey]?.[getRoutineEntryKey(exerciseId, itemIndex)];
        if (typeof override?.arrows_override === "number") return sum + override.arrows_override;
        return sum + Number(exerciseArrowsById.get(exerciseId) ?? 0);
      }, 0),
    [exerciseArrowsById],
  );
  const sortedRoutines = useMemo(
    () => [...templateRoutines].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [templateRoutines],
  );
  const selectedRoutinesToAssign = useMemo(
    () => {
      const routineById = new Map(sortedRoutines.map((routine) => [routine.id, routine]));
      return selectedRoutineIdsToAssign
        .map((id) => routineById.get(id))
        .filter((routine): routine is Routine => Boolean(routine));
    },
    [sortedRoutines, selectedRoutineIdsToAssign],
  );
  const routineModalMaxW = routineModalStep === 0 ? "520px" : routineModalStep === 1 ? "640px" : routineModalStep === 4 ? "700px" : "760px";
  const routineModalMinHeight = routineModalStep === 0
    ? 320
    : routineModalStep === 1
      ? (routineAssignStudentId && !editingRoutineId ? 320 : 360)
      : routineModalStep === 2
        ? 300
        : routineModalStep === 4
          ? 460
        : Math.min(380 + Math.max(0, routineDayCount - 1) * 55, 760);
  const routineModalMaxBodyHeight = routineModalStep === 0 ? 420 : routineModalStep === 1 ? 640 : routineModalStep === 2 ? 620 : routineModalStep === 4 ? 760 : 680;
  const actionIconButtonSize = ACTION_ICON_BUTTON_SIZE;
  const actionIconSize = ACTION_ICON_SIZE;
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
    220,
    Math.min(420, 220 + (routineDayCount - 1) * 50),
  );
  const routineAssignSummaryListMaxH = Math.max(
    220,
    Math.min(420, 220 + (routineAssignDayCount - 1) * 50),
  );
  const assignSelectedRangeDayCount = useMemo(
    () => Math.max(1, Math.min(7, getDayCountFromRange(assignmentStartDate, assignmentEndDate))),
    [assignmentStartDate, assignmentEndDate],
  );
  const assignPreviewExcessDays = Math.max(0, routineAssignDayCount - assignSelectedRangeDayCount);
  const isAssignPreviewOverDayLimit = assignRoutineStep === "existing_preview" && assignPreviewExcessDays > 0;

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

  const getRoutineDayArrows = useCallback((day: RoutineDay) =>
    day.exercises.reduce((sum, dayExercise) => {
      if (typeof dayExercise.arrows_override === "number") return sum + dayExercise.arrows_override;
      return sum + (exerciseArrowsById.get(dayExercise.exercise_id) || 0);
    }, 0),
  [exerciseArrowsById]);

  const getRoutineWeekArrows = useCallback((routine: Routine) => routine.days.reduce((sum, day) => sum + getRoutineDayArrows(day), 0), [getRoutineDayArrows]);

  const openAdminAssignModal = useCallback(() => {
    void ensureStudentsLoaded();
    void ensureAssignmentsLoaded();
    setAdminAssignSearch("");
    setAdminAssignSelectedStudentId(null);
    setAdminAssignModalOpen(true);
  }, [ensureAssignmentsLoaded, ensureStudentsLoaded]);

  const closeAdminAssignModal = useCallback(() => {
    setAdminAssignModalOpen(false);
    setAdminAssignSearch("");
    setAdminAssignSelectedStudentId(null);
  }, []);

  const handleAdminAssignContinue = () => {
    if (!adminAssignSelectedStudentId) return;
    const student = students.find((value) => value.id === adminAssignSelectedStudentId && value.is_active);
    if (!student) return;
    setAdminAssignModalOpen(false);
    openAssignRoutineModal(student);
  };

  const resetAssignRoutineDraft = useCallback(() => {
    setRoutineAssignDayCount(1);
    setRoutineAssignDayInitialLimit(1);
    setRoutineAssignExercisesByDay({});
    setRoutineAssignExerciseOverridesByDay({});
    setAssignmentProfessorNotes("");
    setAssignmentObjective("");
    setAddExerciseDayModalOpen(false);
    setAddExerciseTargetDayKey(null);
    setAddExerciseSearch("");
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseTarget(null);
    setEditAssignRounds("");
    setEditAssignArrows("");
    setEditAssignDistance("");
    setEditAssignDescription("");
    setDeleteAssignDayConfirmOpen(false);
    setDeleteAssignDayTargetNumber(null);
  }, []);

  const openAssignRoutineModal = useCallback((student: Student) => {
    void ensureRoutinesLoaded();
    void ensureExercisesLoaded();
    void ensureAssignmentsLoaded();
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
    setSelectedRoutineIdsToAssign([]);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setAssignmentStartDate(getTodayIsoLocal());
    setAssignmentEndDate(addDaysIso(getTodayIsoLocal(), 1));
    resetAssignRoutineDraft();
    setAssignRoutineModalOpen(true);
  }, [assignments, ensureAssignmentsLoaded, ensureExercisesLoaded, ensureRoutinesLoaded, resetAssignRoutineDraft]);

  const closeAssignRoutineModal = useCallback(() => {
    setAssignRoutineModalOpen(false);
    setAssignRoutineStudent(null);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setSelectedRoutineIdsToAssign([]);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setAssignmentStartDate(getTodayIsoLocal());
    setAssignmentEndDate(addDaysIso(getTodayIsoLocal(), 1));
    resetAssignRoutineDraft();
    setReplaceAssignError(null);
  }, [resetAssignRoutineDraft]);

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
      setAssignmentEndDate(addDaysIso(getTodayIsoLocal(), 1));
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
      const data = (await res.json()) as { access_token: string; refresh_token: string };
      storeAuthTokens(data.access_token, data.refresh_token, rememberMe);
      setToken(data.access_token);
      goToView("professor", true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const clearClientSession = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUserRole(null);
    setUsername("");
    setPassword("");
    setStudents([]);
    goToView("login", true);
  }, [goToView, setStudents]);

  const handleLogout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        token,
        body: JSON.stringify({ refresh_token: refreshToken }),
        skipAuthRefresh: true,
      });
    } catch {
      if (refreshToken) {
        try {
          await apiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
            skipAuthRefresh: true,
          });
        } catch {
          // ignore logout API errors and clear local session anyway
        }
      }
    }
    clearClientSession();
  }, [clearClientSession, token]);

  const openChangePasswordModal = useCallback(() => {
    if (!isDesktopViewport && !changePasswordMobileHistoryActiveRef.current) {
      window.history.pushState({ changePasswordMobile: true }, "", window.location.href);
      changePasswordMobileHistoryActiveRef.current = true;
    }
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    setChangePasswordCurrent("");
    setChangePasswordNext("");
    setChangePasswordConfirm("");
    setChangePasswordModalOpen(true);
  }, [isDesktopViewport]);

  const closeChangePasswordModal = useCallback(() => {
    if (!changePasswordModalOpen) return;
    if (!isDesktopViewport && changePasswordMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setChangePasswordModalOpen(false);
    setChangePasswordError(null);
    setChangePasswordCurrent("");
    setChangePasswordNext("");
    setChangePasswordConfirm("");
    changePasswordMobileHistoryActiveRef.current = false;
  }, [changePasswordModalOpen, isDesktopViewport]);

  const handleChangePassword = useCallback(async () => {
    if (!token) return;
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (changePasswordValidationError) {
      setChangePasswordError(changePasswordValidationError);
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await apiFetch<{ detail: string }>("/auth/change-password", {
        method: "POST",
        token,
        body: JSON.stringify({
          current_password: changePasswordCurrent,
          new_password: changePasswordNext,
          confirm_password: changePasswordConfirm,
        }),
      });
      setChangePasswordSuccess(response.detail || "Contraseña actualizada correctamente");
      closeChangePasswordModal();
      clearClientSession();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar la contraseña";
      setChangePasswordError(msg);
    } finally {
      setChangePasswordLoading(false);
    }
  }, [changePasswordConfirm, changePasswordCurrent, changePasswordNext, changePasswordValidationError, clearClientSession, closeChangePasswordModal, token]);

  const openAdminUserModal = useCallback(() => {
    setAdminUserCreateError(null);
    setAdminUserUsername("");
    setAdminUserPassword("");
    setAdminUserRole(userRole === "professor" ? "student" : "professor");
    setAdminUserModalOpen(true);
  }, [userRole]);

  const closeAdminUserModal = useCallback(() => {
    setAdminUserModalOpen(false);
    setAdminUserCreateError(null);
    setAdminUserUsername("");
    setAdminUserPassword("");
    setAdminUserRole(userRole === "professor" ? "student" : "professor");
  }, [userRole]);

  const handleCreateAdminUser = useCallback(async () => {
    if (!token) return;
    setAdminUserCreateError(null);
    if (adminUserUsername.trim().length < 3) {
      setAdminUserCreateError("El usuario debe tener al menos 3 caracteres");
      return;
    }
    if (adminUserPassword.length < 8) {
      setAdminUserCreateError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setAdminUserCreateLoading(true);
    try {
      const created = await apiFetch<UserAccount>("/users", {
        method: "POST",
        token,
        body: JSON.stringify({
          username: adminUserUsername.trim(),
          password: adminUserPassword,
          role: adminUserRole,
          is_active: true,
        }),
      });
      setUsers((prev) =>
        [created, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );
      closeAdminUserModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el usuario";
      setAdminUserCreateError(msg);
    } finally {
      setAdminUserCreateLoading(false);
    }
  }, [adminUserPassword, adminUserRole, adminUserUsername, closeAdminUserModal, setUsers, token]);

  const handleAdminUserUpdate = useCallback(async (userId: number, payload: Pick<UserAccount, "role" | "is_active">) => {
    if (!token) return;
    setAdminUserMutationError(null);
    setAdminUserMutationId(userId);
    try {
      const updated = await apiFetch<UserAccount>(`/users/${userId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
      });
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el usuario";
      setAdminUserMutationError(msg);
    } finally {
      setAdminUserMutationId(null);
    }
  }, [setUsers, token]);

  const openCreateRoutineModal = useCallback(() => {
    void ensureExercisesLoaded();
    setEditingRoutineId(null);
    setRoutineName("");
    setRoutineDayCount(1);
    setRoutineDayInitialLimit(1);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineCreateExerciseOverridesByDay({});
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditRounds("");
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    setDeleteRoutineDayConfirmOpen(false);
    setDeleteRoutineDayTargetNumber(null);
    setRoutineModalBodyHeight(null);
    setCreateRoutineError(null);
    setRoutineModalStep(0);
    setCreateRoutineModalOpen(true);
  }, [ensureExercisesLoaded]);

  const closeCreateRoutineModal = useCallback(() => {
    setCreateRoutineModalOpen(false);
    setRoutineModalStep(0);
    setRoutineDayCount(1);
    setRoutineDayInitialLimit(1);
    setRoutineDayCursor(0);
    setRoutineExercisesByDay({});
    setRoutineExerciseSearch("");
    setRoutineCreateExerciseOverridesByDay({});
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditRounds("");
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
  }, []);

  const openEditRoutineModal = useCallback((routine: Routine) => {
    void ensureExercisesLoaded();
    const sortedDays = [...routine.days].sort((a, b) => a.day_number - b.day_number);
    const exercisesByDay: Record<string, number[]> = {};
    const overridesByDay: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
    for (const day of sortedDays) {
      const key = `day_${day.day_number}`;
      exercisesByDay[key] = [...day.exercises]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((exercise) => exercise.exercise_id);
      day.exercises
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((exercise, itemIndex) => {
        const hasOverride =
          exercise.arrows_override !== null ||
          exercise.distance_override_m !== null ||
          (exercise.notes || "").trim() !== "";
        if (!hasOverride) return;
        overridesByDay[key] = overridesByDay[key] || {};
        overridesByDay[key][getRoutineEntryKey(exercise.exercise_id, itemIndex)] = {
          arrows_override: exercise.arrows_override,
          distance_override_m: exercise.distance_override_m,
          description_override: exercise.notes || null,
        };
      });
    }
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    const initialDays = Math.max(1, Math.min(7, sortedDays.length || 1));
    setRoutineDayCount(initialDays);
    setRoutineDayInitialLimit(initialDays);
    setRoutineExercisesByDay(exercisesByDay);
    setRoutineCreateExerciseOverridesByDay(overridesByDay);
    setRoutineDayCursor(0);
    setRoutineExerciseSearch("");
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditRounds("");
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
  }, [ensureExercisesLoaded]);

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
    if (routineAssignStudentId && !isEndAfterStart(assignmentStartDate, assignmentEndDate)) {
      setCreateRoutineError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    if (!token) {
      setCreateRoutineError("Sesión inválida.");
      return;
    }
    try {
      setCreateRoutineLoading(true);
      setCreateRoutineError(null);
      const payload = {
        name:
          routineAssignStudentId && !editingRoutineId
            ? buildTemporaryRoutineName(
                routineName.trim(),
                students.find((student) => student.id === routineAssignStudentId)?.document_number || String(routineAssignStudentId),
                assignmentStartDate,
              )
            : routineName.trim(),
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
            arrows_override: routineCreateExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.arrows_override ?? null,
            distance_override_m: routineCreateExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.distance_override_m ?? null,
            notes: routineCreateExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.description_override ?? null,
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
          const assignResult = await tryCreateAssignment({
            student_id: routineAssignStudentId,
            routine_id: createdRoutine.id,
            start_date: assignmentStartDate,
            end_date: assignmentEndDate,
            status: "active",
            notes: JSON.stringify({
              source: "quick_create_assignment",
              objective: assignmentObjective.trim() || "Determinante",
              professor_notes: assignmentProfessorNotes.trim() || null,
            }),
          });
          if (!assignResult.ok && !assignResult.conflict) {
            await cleanupTemporaryRoutineIfOrphan(createdRoutine.id);
          }
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
    if (!isDesktopViewport && !routineCreateAddExerciseMobileHistoryActiveRef.current) {
      window.history.pushState({ routineCreateAddExerciseMobile: true }, "", window.location.href);
      routineCreateAddExerciseMobileHistoryActiveRef.current = true;
    }
    setRoutineCreateAddExerciseDayKey(dayKey);
    setRoutineCreateAddExerciseSearch("");
    setRoutineCreateAddExerciseModalOpen(true);
  };

  const closeRoutineCreateAddExerciseModal = () => {
    if (!routineCreateAddExerciseModalOpen) return;
    if (!isDesktopViewport && routineCreateAddExerciseMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    routineCreateAddExerciseMobileHistoryActiveRef.current = false;
  };

  const addExerciseToRoutineSummaryDay = (dayKey: string, exerciseId: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      return { ...prev, [dayKey]: [...current, exerciseId] };
    });
    setRoutineCreateAddExerciseModalOpen(false);
    setRoutineCreateAddExerciseDayKey(null);
    setRoutineCreateAddExerciseSearch("");
    routineCreateAddExerciseMobileHistoryActiveRef.current = false;
  };

  const handleAddRoutineDay = () => {
    if (routineDayCount >= routineDayInitialLimit) return;
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
      const next: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
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

  const openRoutineCreateEditExercise = (dayKey: string, exerciseId: number, itemIndex: number) => {
    const base = exercises.find((ex) => ex.id === exerciseId);
    const entryKey = getRoutineEntryKey(exerciseId, itemIndex);
    const override = routineCreateExerciseOverridesByDay[dayKey]?.[entryKey];
    const baseRounds = Number(base?.rounds ?? 1);
    const baseArrowsPerRound = Number(base?.arrows_per_round ?? base?.arrows_count ?? 0);
    const derived = deriveRoundsAndArrowsPerRound(
      override?.arrows_override ?? "",
      baseRounds,
      baseArrowsPerRound,
    );
    setRoutineCreateEditTarget({ dayKey, exerciseId, itemIndex });
    setRoutineCreateEditRounds(derived.rounds);
    setRoutineCreateEditArrows(derived.arrowsPerRound);
    setRoutineCreateEditDistance(override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "");
    setRoutineCreateEditDescription(override?.description_override ?? base?.description ?? "");
    if (!isDesktopViewport && !routineCreateEditExerciseMobileHistoryActiveRef.current) {
      window.history.pushState({ routineCreateEditExerciseMobile: true }, "", window.location.href);
      routineCreateEditExerciseMobileHistoryActiveRef.current = true;
    }
    setRoutineCreateEditExerciseModalOpen(true);
  };

  const closeRoutineCreateEditExercise = () => {
    if (!routineCreateEditExerciseModalOpen) return;
    if (!isDesktopViewport && routineCreateEditExerciseMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditRounds("");
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    routineCreateEditExerciseMobileHistoryActiveRef.current = false;
  };

  const saveRoutineCreateEditExercise = () => {
    if (!routineCreateEditTarget) return;
    if (routineCreateEditRounds === "" || routineCreateEditArrows === "") return;
    setRoutineCreateExerciseOverridesByDay((prev) => ({
      ...prev,
      [routineCreateEditTarget.dayKey]: {
        ...(prev[routineCreateEditTarget.dayKey] || {}),
        [getRoutineEntryKey(routineCreateEditTarget.exerciseId, routineCreateEditTarget.itemIndex)]: {
          arrows_override: Number(routineCreateEditRounds) * Number(routineCreateEditArrows),
          distance_override_m: routineCreateEditDistance === "" ? null : Number(routineCreateEditDistance),
          description_override: routineCreateEditDescription || null,
        },
      },
    }));
    setRoutineCreateEditExerciseModalOpen(false);
    setRoutineCreateEditTarget(null);
    setRoutineCreateEditRounds("");
    setRoutineCreateEditArrows("");
    setRoutineCreateEditDistance("");
    setRoutineCreateEditDescription("");
    routineCreateEditExerciseMobileHistoryActiveRef.current = false;
  };

  useEffect(() => {
    if (!routineCreateAddExerciseModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!routineCreateAddExerciseMobileHistoryActiveRef.current) return;
      routineCreateAddExerciseMobileHistoryActiveRef.current = false;
      setRoutineCreateAddExerciseModalOpen(false);
      setRoutineCreateAddExerciseDayKey(null);
      setRoutineCreateAddExerciseSearch("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDesktopViewport, routineCreateAddExerciseModalOpen]);

  useEffect(() => {
    if (!routineCreateEditExerciseModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!routineCreateEditExerciseMobileHistoryActiveRef.current) return;
      routineCreateEditExerciseMobileHistoryActiveRef.current = false;
      setRoutineCreateEditExerciseModalOpen(false);
      setRoutineCreateEditTarget(null);
      setRoutineCreateEditRounds("");
      setRoutineCreateEditArrows("");
      setRoutineCreateEditDistance("");
      setRoutineCreateEditDescription("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDesktopViewport, routineCreateEditExerciseModalOpen]);

  const removeExerciseFromRoutineSummaryDay = (dayKey: string, itemIndex: number) => {
    setRoutineExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      return { ...prev, [dayKey]: current.filter((_, idx) => idx !== itemIndex) };
    });
    setRoutineCreateExerciseOverridesByDay((prev) => {
      const dayOverrides = prev[dayKey] || {};
      const nextDayOverrides = remapOverrideKeysAfterRemoval(dayOverrides, itemIndex);
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
    setAssignmentEndDate(addDaysIso(getTodayIsoLocal(), 1));
    setAssignRoutineModalOpen(false);
    setAssignRoutineStep("choice");
    setSelectedRoutineToAssign(null);
    setSelectedRoutineIdsToAssign([]);
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
    setSelectedRoutineIdsToAssign([]);
    setAssignRoutineError(null);
    setAssignRoutineLoading(false);
    setAssignmentStartDate(getTodayIsoLocal());
    setAssignmentEndDate(addDaysIso(getTodayIsoLocal(), 1));
    setAssignRoutineModalOpen(true);
  };

  const handleChooseExistingRoutineList = () => {
    setAssignRoutineStep("existing_days");
    setSelectedRoutineToAssign(null);
    setSelectedRoutineIdsToAssign([]);
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
    if (!token) return { ok: false, conflict: false };
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
      return { ok: true, conflict: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar rutina";
      if (msg.includes("ya tiene una rutina activa")) {
        setPendingAssignPayload(payload);
        setReplaceAssignError(null);
        setReplaceAssignModalOpen(true);
        return { ok: false, conflict: true };
      } else {
        setAssignRoutineError(msg);
        setCreateRoutineError(msg);
        return { ok: false, conflict: false };
      }
    }
  };

  const cleanupTemporaryRoutineIfOrphan = useCallback(async (routineId: number | null | undefined) => {
    if (!token || !routineId) return;
    const routine = routines.find((value) => value.id === routineId);
    if (routine && routine.is_template !== false) return;
    try {
      await apiFetch(`/routines/${routineId}`, { method: "DELETE", token });
      setRoutines((prev) => prev.filter((value) => value.id !== routineId));
    } catch {
      // Ignorar: puede estar asignada/referenciada o ya eliminada.
    }
  }, [token, routines, setRoutines]);

  const loadRoutineIntoAssignPreview = (routinesToCombine: Routine[]) => {
    const orderedDays = routinesToCombine
      .flatMap((routine) => [...routine.days].sort((a, b) => a.day_number - b.day_number))
      .slice(0, 7);
    const nextExercisesByDay: Record<string, number[]> = {};
    const nextOverridesByDay: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
    orderedDays.forEach((day, index) => {
      const dayKey = `day_${index + 1}`;
      nextExercisesByDay[dayKey] = day.exercises
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((ex) => ex.exercise_id);
      day.exercises
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((ex, itemIndex) => {
        const hasOverride = ex.arrows_override !== null || ex.distance_override_m !== null || (ex.notes || "").trim() !== "";
        if (!hasOverride) return;
        nextOverridesByDay[dayKey] = nextOverridesByDay[dayKey] || {};
        nextOverridesByDay[dayKey][getRoutineEntryKey(ex.exercise_id, itemIndex)] = {
          arrows_override: ex.arrows_override,
          distance_override_m: ex.distance_override_m,
          description_override: ex.notes || null,
        };
      });
    });
    setSelectedRoutineToAssign(routinesToCombine[0] || null);
    const totalDays = Math.max(1, Math.min(7, orderedDays.length || 1));
    const selectedDaysFromDates = Math.max(1, Math.min(7, getDayCountFromRange(assignmentStartDate, assignmentEndDate)));
    const selectedDays = totalDays;
    const initialLimitDays = Math.max(selectedDays, selectedDaysFromDates);
    setAssignRoutineStep("existing_preview");
    setAssignRoutineError(null);
    const limitedExercises: Record<string, number[]> = {};
    const limitedOverrides: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
    for (let idx = 1; idx <= selectedDays; idx += 1) {
      const key = `day_${idx}`;
      limitedExercises[key] = [...(nextExercisesByDay[key] || [])];
      if (nextOverridesByDay[key]) {
        limitedOverrides[key] = { ...nextOverridesByDay[key] };
      }
    }
    setRoutineAssignDayCount(selectedDays);
    setRoutineAssignDayInitialLimit(initialLimitDays);
    setRoutineAssignExercisesByDay(limitedExercises);
    setRoutineAssignExerciseOverridesByDay(limitedOverrides);
    setDeleteAssignDayConfirmOpen(false);
    setDeleteAssignDayTargetNumber(null);
  };

  const handleSelectRoutineToAssign = (routine: Routine) => {
    setSelectedRoutineIdsToAssign((prev) => {
      const exists = prev.includes(routine.id);
      if (exists) {
        return prev.filter((id) => id !== routine.id);
      }
      return [...prev, routine.id];
    });
  };

  const handleContinueToRoutineOrder = () => {
    if (!selectedRoutinesToAssign.length) return;
    if (selectedRoutinesToAssign.length === 1) {
      loadRoutineIntoAssignPreview(selectedRoutinesToAssign);
      return;
    }
    setAssignRoutineStep("existing_order");
    setAssignRoutineError(null);
  };

  const handleContinueFromRoutineOrder = () => {
    if (!selectedRoutinesToAssign.length) return;
    loadRoutineIntoAssignPreview(selectedRoutinesToAssign);
  };

  const moveSelectedRoutineOrder = (routineId: number, direction: -1 | 1) => {
    setSelectedRoutineIdsToAssign((prev) => {
      const currentIndex = prev.indexOf(routineId);
      if (currentIndex === -1) return prev;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const swappedRoutineId = prev[nextIndex];
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, moved);

      if (routineOrderButtonAnimationTimeoutRef.current !== null) {
        window.clearTimeout(routineOrderButtonAnimationTimeoutRef.current);
      }
      setRoutineOrderButtonAnimationById({
        [routineId]: direction === -1 ? "up" : "down",
        [swappedRoutineId]: direction === -1 ? "down" : "up",
      });
      routineOrderButtonAnimationTimeoutRef.current = window.setTimeout(() => {
        setRoutineOrderButtonAnimationById({});
      }, 320);
      return next;
    });
  };

  const handleRoutineOrderDragStart = (event: React.MouseEvent<HTMLDivElement>, routineId: number) => {
    const element = routineOrderItemRefs.current[routineId];
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setDraggingRoutineOrderId(routineId);
    setHoveredRoutineOrderId(null);
    setDraggingRoutineOrderTop(rect.top);
    setDraggingRoutineOrderLeft(rect.left);
    setDraggingRoutineOrderWidth(rect.width);
    setDraggingRoutineOrderHeight(rect.height);
    draggingRoutinePointerOffsetYRef.current = event.clientY - rect.top;
  };

  const handleRoutineOrderDragEnd = () => {
    setDraggingRoutineOrderId(null);
    setHoveredRoutineOrderId(null);
    setDraggingRoutineOrderTop(null);
    setDraggingRoutineOrderLeft(null);
    setDraggingRoutineOrderWidth(null);
    setDraggingRoutineOrderHeight(0);
  };

  useEffect(() => {
    if (draggingRoutineOrderId === null) return;

    const handleMouseMove = (event: MouseEvent) => {
      const containerRect = routineOrderContainerRef.current?.getBoundingClientRect();
      const rawTop = event.clientY - draggingRoutinePointerOffsetYRef.current;
      const minTop = containerRect?.top ?? rawTop;
      const maxTop = containerRect ? containerRect.bottom - draggingRoutineOrderHeight : rawTop;
      const clampedTop = Math.min(Math.max(rawTop, minTop), Math.max(minTop, maxTop));
      setDraggingRoutineOrderTop(clampedTop);

      let nextHoveredId: number | null = null;
      for (const routine of selectedRoutinesToAssign) {
        if (routine.id === draggingRoutineOrderId) continue;
        const element = routineOrderItemRefs.current[routine.id];
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (event.clientY < midpoint) {
          nextHoveredId = routine.id;
          break;
        }
        nextHoveredId = routine.id;
      }
      setHoveredRoutineOrderId(nextHoveredId);
    };

    const handleMouseUp = () => {
      if (hoveredRoutineOrderId !== null) {
        setSelectedRoutineIdsToAssign((prev) => {
          const sourceIndex = prev.indexOf(draggingRoutineOrderId);
          const targetIndex = prev.indexOf(hoveredRoutineOrderId);
          if (sourceIndex === -1 || targetIndex === -1) return prev;
          const next = [...prev];
          const [moved] = next.splice(sourceIndex, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      }
      handleRoutineOrderDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingRoutineOrderId, hoveredRoutineOrderId, selectedRoutinesToAssign]);

  useEffect(() => () => {
    if (routineOrderButtonAnimationTimeoutRef.current !== null) {
      window.clearTimeout(routineOrderButtonAnimationTimeoutRef.current);
    }
  }, []);

  const openEditAssignExercise = (dayKey: string, exerciseId: number, itemIndex: number) => {
    const base = exercises.find((ex) => ex.id === exerciseId);
    const entryKey = getRoutineEntryKey(exerciseId, itemIndex);
    const override = routineAssignExerciseOverridesByDay[dayKey]?.[entryKey];
    const baseRounds = Number(base?.rounds ?? 1);
    const baseArrowsPerRound = Number(base?.arrows_per_round ?? base?.arrows_count ?? 0);
    const derived = deriveRoundsAndArrowsPerRound(
      override?.arrows_override ?? "",
      baseRounds,
      baseArrowsPerRound,
    );
    setEditAssignExerciseTarget({ dayKey, exerciseId, itemIndex });
    setEditAssignRounds(derived.rounds);
    setEditAssignArrows(derived.arrowsPerRound);
    setEditAssignDistance(override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "");
    setEditAssignDescription(override?.description_override ?? base?.description ?? "");
    if (!isDesktopViewport && !editAssignExerciseMobileHistoryActiveRef.current) {
      window.history.pushState({ editAssignExerciseMobile: true }, "", window.location.href);
      editAssignExerciseMobileHistoryActiveRef.current = true;
    }
    setEditAssignExerciseModalOpen(true);
  };

  const closeEditAssignExerciseModal = () => {
    if (!editAssignExerciseModalOpen) return;
    if (!isDesktopViewport && editAssignExerciseMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseTarget(null);
    setEditAssignRounds("");
    setEditAssignArrows("");
    setEditAssignDistance("");
    setEditAssignDescription("");
    editAssignExerciseMobileHistoryActiveRef.current = false;
  };

  const openAddExerciseForDay = (dayKey: string) => {
    if (!isDesktopViewport && !addExerciseDayMobileHistoryActiveRef.current) {
      window.history.pushState({ addExerciseDayMobile: true }, "", window.location.href);
      addExerciseDayMobileHistoryActiveRef.current = true;
    }
    setAddExerciseTargetDayKey(dayKey);
    setAddExerciseSearch("");
    setAddExerciseDayModalOpen(true);
  };

  const closeAddExerciseDayModal = () => {
    if (!addExerciseDayModalOpen) return;
    if (!isDesktopViewport && addExerciseDayMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setAddExerciseDayModalOpen(false);
    setAddExerciseTargetDayKey(null);
    setAddExerciseSearch("");
    addExerciseDayMobileHistoryActiveRef.current = false;
  };

  const addTemporaryExerciseToDay = (dayKey: string, exerciseId: number) => {
    setRoutineAssignExercisesByDay((prev) => {
      const current = prev[dayKey] || [];
      return { ...prev, [dayKey]: [...current, exerciseId] };
    });
    setAddExerciseDayModalOpen(false);
    setAddExerciseTargetDayKey(null);
    setAddExerciseSearch("");
    addExerciseDayMobileHistoryActiveRef.current = false;
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
    if (editAssignRounds === "" || editAssignArrows === "") return;
    setRoutineAssignExerciseOverridesByDay((prev) => ({
      ...prev,
      [editAssignExerciseTarget.dayKey]: {
        ...(prev[editAssignExerciseTarget.dayKey] || {}),
        [getRoutineEntryKey(editAssignExerciseTarget.exerciseId, editAssignExerciseTarget.itemIndex)]: {
          arrows_override: Number(editAssignRounds) * Number(editAssignArrows),
          distance_override_m: editAssignDistance === "" ? null : Number(editAssignDistance),
          description_override: editAssignDescription || null,
        },
      },
    }));
    setEditAssignExerciseModalOpen(false);
    setEditAssignExerciseTarget(null);
    setEditAssignRounds("");
    setEditAssignArrows("");
    setEditAssignDistance("");
    setEditAssignDescription("");
    editAssignExerciseMobileHistoryActiveRef.current = false;
  };

  useEffect(() => {
    if (!addExerciseDayModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!addExerciseDayMobileHistoryActiveRef.current) return;
      addExerciseDayMobileHistoryActiveRef.current = false;
      setAddExerciseDayModalOpen(false);
      setAddExerciseTargetDayKey(null);
      setAddExerciseSearch("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [addExerciseDayModalOpen, isDesktopViewport]);

  useEffect(() => {
    if (!editAssignExerciseModalOpen || isDesktopViewport) return;
    const handlePopState = () => {
      if (!editAssignExerciseMobileHistoryActiveRef.current) return;
      editAssignExerciseMobileHistoryActiveRef.current = false;
      setEditAssignExerciseModalOpen(false);
      setEditAssignExerciseTarget(null);
      setEditAssignRounds("");
      setEditAssignArrows("");
      setEditAssignDistance("");
      setEditAssignDescription("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editAssignExerciseModalOpen, isDesktopViewport]);

  const addAssignRoutineDay = () => {
    if (routineAssignDayCount >= routineAssignDayInitialLimit) return;
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
      const next: Record<string, Record<string, { arrows_override?: number | null; distance_override_m?: number | null; description_override?: string | null }>> = {};
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

  const removeAssignExerciseFromDay = (dayKey: string, itemIndex: number) => {
    setRoutineAssignExercisesByDay((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((_, idx) => idx !== itemIndex),
    }));
    setRoutineAssignExerciseOverridesByDay((prev) => {
      const dayOverrides = prev[dayKey] || {};
      const nextDayOverrides = remapOverrideKeysAfterRemoval(dayOverrides, itemIndex);
      return { ...prev, [dayKey]: nextDayOverrides };
    });
  };

  const handleAssignExistingRoutine = async () => {
    if (!token || !assignRoutineStudent || !selectedRoutineToAssign) return;
    if (!isEndAfterStart(assignmentStartDate, assignmentEndDate)) {
      setAssignRoutineError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }
    setAssignRoutineLoading(true);
    setAssignRoutineError(null);
    try {
      const validExerciseIds = new Set(exercises.map((ex) => ex.id));
      const sanitizedDays = routineAssignBuilderDays
        .map((day) => {
          const dayExercises = (routineAssignExercisesByDay[day.key] || []).filter((id) => validExerciseIds.has(id));
          const sanitizedExercises = dayExercises.map((exerciseId, idx) => ({
            exercise_id: exerciseId,
            sort_order: idx + 1,
            arrows_override: routineAssignExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.arrows_override ?? null,
            distance_override_m: routineAssignExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.distance_override_m ?? null,
            notes: routineAssignExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, idx)]?.description_override ?? null,
          }));
          return {
            day_number: day.dayNumber,
            name: day.label,
            exercises: sanitizedExercises,
          };
        })
        .filter((day) => Number.isInteger(day.day_number) && day.day_number >= 1 && day.day_number <= 7);

      if (!sanitizedDays.length) {
        setAssignRoutineError("No se pudo preparar la rutina temporal. Verifica los días y ejercicios seleccionados.");
        setAssignRoutineLoading(false);
        return;
      }

      const temporaryRoutinePayload = {
        name: buildTemporaryRoutineName(
          buildCombinedRoutineBaseName(selectedRoutinesToAssign),
          assignRoutineStudent.document_number || String(assignRoutineStudent.id),
          assignmentStartDate,
        ),
        description: selectedRoutinesToAssign.map((routine) => routine.name).join(" + ") || selectedRoutineToAssign.description || null,
        is_active: true,
        is_template: false,
        days: sanitizedDays,
      };
      const createdTemporaryRoutine = await apiFetch<Routine>("/routines", {
        method: "POST",
        token,
        body: JSON.stringify(temporaryRoutinePayload),
      });
      setRoutines((prev) => [...prev, createdTemporaryRoutine]);

      const assignResult = await tryCreateAssignment({
        student_id: assignRoutineStudent.id,
        routine_id: createdTemporaryRoutine.id,
        start_date: assignmentStartDate,
        end_date: assignmentEndDate,
        status: "active",
        notes: JSON.stringify({
          source: "existing_template_assignment",
          source_routine_id: selectedRoutineToAssign.id,
          source_routine_ids: selectedRoutinesToAssign.map((routine) => routine.id),
          assigned_routine_id: createdTemporaryRoutine.id,
          objective: assignmentObjective.trim() || "Determinante",
          professor_notes: assignmentProfessorNotes.trim() || null,
          temporary_day_count: routineAssignDayCount,
          temporary_exercises_by_day: routineAssignExercisesByDay,
          temporary_exercise_overrides_by_day: routineAssignExerciseOverridesByDay,
        }),
      });
      if (assignResult.ok) {
        closeAssignRoutineModal();
      } else if (!assignResult.conflict) {
        await cleanupTemporaryRoutineIfOrphan(createdTemporaryRoutine.id);
      }
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

  const handleCancelReplaceAndAssign = useCallback(async () => {
    const pendingRoutineId = pendingAssignPayload?.routine_id ?? null;
    setReplaceAssignModalOpen(false);
    setReplaceAssignError(null);
    setPendingAssignPayload(null);
    await cleanupTemporaryRoutineIfOrphan(pendingRoutineId);
  }, [pendingAssignPayload, cleanupTemporaryRoutineIfOrphan]);

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

  const handleSaveAssignmentToHistory = useCallback(async (assignmentId: number) => {
    if (!token) return;
    setSaveAssignmentLoadingId(assignmentId);
    setSaveAssignmentError(null);
    try {
      await apiFetch<Assignment>(`/assignments/${assignmentId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: "finished",
          student_observations: saveAssignmentStudentObservations.trim() || null,
        }),
      });
      const assignmentsData = await apiFetch<Assignment[]>("/assignments", { token });
      setAssignments(assignmentsData);
      setSaveAssignmentModalOpen(false);
      setSaveAssignmentTargetId(null);
      setSaveAssignmentStudentObservations("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar en historial";
      setSaveAssignmentError(msg);
    } finally {
      setSaveAssignmentLoadingId(null);
    }
  }, [token, saveAssignmentStudentObservations, setAssignments]);

  const openSaveAssignmentModal = useCallback((assignmentId: number) => {
    setSaveAssignmentError(null);
    setSaveAssignmentTargetId(assignmentId);
    setSaveAssignmentStudentObservations("");
    setSaveAssignmentModalOpen(true);
  }, []);

  const openStudentHistoryModal = useCallback(async (student: Student) => {
    if (!token) return;
    if (!isDesktopViewport && !studentHistoryMobileHistoryActiveRef.current) {
      window.history.pushState({ studentHistoryMobile: student.id }, "", window.location.href);
      studentHistoryMobileHistoryActiveRef.current = true;
    }
    setStudentHistoryTarget(student);
    setStudentHistorySearch("");
    setStudentHistoryError(null);
    setStudentHistoryItems([]);
    setExpandedHistoryId(null);
    setStudentHistoryModalOpen(true);
    setStudentHistoryLoading(true);
    try {
      const history = await apiFetch<AssignmentHistory[]>(`/assignments/history?student_id=${student.id}`, { token });
      const normalized = (Array.isArray(history) ? history : [])
        .map((entry) => normalizeHistoryItem(entry))
        .filter((entry): entry is AssignmentHistory => entry !== null && entry.id > 0);
      setStudentHistoryItems(normalized);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo cargar el historial";
      setStudentHistoryError(msg);
    } finally {
      setStudentHistoryLoading(false);
    }
  }, [isDesktopViewport, token]);

  const closeStudentHistoryModal = useCallback(() => {
    if (!studentHistoryModalOpen) return;
    if (!isDesktopViewport && studentHistoryMobileHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setStudentHistoryModalOpen(false);
    setStudentHistoryTarget(null);
    setStudentHistorySearch("");
    setStudentHistoryError(null);
    setStudentHistoryItems([]);
    setExpandedHistoryId(null);
    studentHistoryMobileHistoryActiveRef.current = false;
  }, [isDesktopViewport, studentHistoryModalOpen]);

  const downloadPdfBlob = useCallback((blob: Blob, filename: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const navigatorWithSave = window.navigator as Navigator & {
      msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
    };

    if (typeof navigatorWithSave.msSaveOrOpenBlob === "function") {
      navigatorWithSave.msSaveOrOpenBlob(blob, filename);
      window.URL.revokeObjectURL(blobUrl);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  }, []);

  const handleExportAssignmentPdf = useCallback(async (assignmentId: number) => {
    if (!token) return;
    setExportAssignmentLoadingId(assignmentId);
    setExportAssignmentError(null);
    const userAgent = window.navigator.userAgent || "";
    const isMobileDevice = /android|iphone|ipad|mobile/i.test(userAgent);

    if (isMobileDevice) {
      try {
        const downloadUrl = `${API_BASE}/assignments/${assignmentId}/pdf-download?access_token=${encodeURIComponent(token)}`;
        window.location.assign(downloadUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo generar el PDF";
        setExportAssignmentError(msg);
      } finally {
        setExportAssignmentLoadingId(null);
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        let detail = "No se pudo generar el PDF";
        try {
          const body = (await response.json()) as { detail?: string };
          if (body?.detail) detail = body.detail;
        } catch {
          // ignore json parse error
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename=\"([^\"]+)\"/i);
      const filename = match?.[1] || `rutina_${assignmentId}.pdf`;
      downloadPdfBlob(blob, filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo generar el PDF";
      setExportAssignmentError(msg);
    } finally {
      setExportAssignmentLoadingId(null);
    }
  }, [downloadPdfBlob, token]);

  const getAssignmentPdfDownloadUrl = useCallback((assignmentId: number) => {
    if (!token) return "#";
    return `${API_BASE}/assignments/${assignmentId}/pdf-download?access_token=${encodeURIComponent(token)}`;
  }, [token]);

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
          bg="linear-gradient(180deg, #fff7ed 0%, #f8fafc 34%, #eef2ff 100%)"
          px={{ base: 0, md: 8 }}
          py={{ base: 0, md: 8 }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box w="full" maxW="1080px">
            <Stack spacing={{ base: 0, md: 6 }} align="stretch">
              <Box
                w="full"
                minH={{ base: "100vh", md: "auto" }}
                bg={{ base: "transparent", md: "white" }}
                borderRadius={{ base: "0", md: "32px" }}
                border={{ base: "none", md: "1px solid" }}
                borderColor={{ md: "rgba(251, 146, 60, 0.12)" }}
                boxShadow={{ base: "none", md: "0 24px 60px rgba(15, 23, 42, 0.10)" }}
                overflow="hidden"
                display="grid"
                gridTemplateColumns={{ base: "1fr", md: "1.02fr 0.98fr" }}
              >
                <Box
                  display={{ base: "none", md: "flex" }}
                  position="relative"
                  bg="linear-gradient(165deg, #111827 0%, #1f2937 45%, #fb5a13 135%)"
                  px={10}
                  py={10}
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  minH="620px"
                >
                  <Stack spacing={6} position="relative" zIndex={1} align="center" textAlign="center">
                    <Box
                      w="96px"
                      h="96px"
                      borderRadius="28px"
                      bg="rgba(255,255,255,0.14)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                      border="1px solid rgba(255,255,255,0.18)"
                      boxShadow="0 18px 40px rgba(15, 23, 42, 0.18)"
                    >
                      <Image src={archeryImg} alt="Arqueros Andinos" w="full" h="full" objectFit="cover" />
                    </Box>
                    <Stack spacing={3} maxW="340px" align="center">
                      <Text fontSize="13px" fontWeight="700" color="rgba(255,255,255,0.75)" letterSpacing="0.08em" textTransform="uppercase">
                        Plataforma de entrenamiento
                      </Text>
                      <Heading size="xl" color="white" lineHeight="1.08">
                        Accede a tu panel de Arquería
                      </Heading>
                      <Text color="rgba(255,255,255,0.82)" fontSize="15px" lineHeight="1.7">
                        Gestiona deportistas, rutinas y ejercicios desde una interfaz más cómoda para escritorio y móvil.
                      </Text>
                    </Stack>
                  </Stack>
                  <Box
                    position="absolute"
                    inset="0"
                    background="radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 32%)"
                  />
                </Box>

                <Box
                  position="relative"
                  px={{ base: 5, sm: 6, md: 0 }}
                  pt={{ base: 7, md: 0 }}
                  pb={{ base: 8, md: 0 }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={{ base: "transparent", md: "white" }}
                >
                  <Stack
                    w="full"
                    maxW={{ base: "420px", md: "420px" }}
                    spacing={{ base: 5, md: 6 }}
                  >
                    <Stack spacing={4} display={{ base: "flex", md: "none" }} align="center" pt={2}>
                      <Box
                        w="96px"
                        h="96px"
                        borderRadius="30px"
                        bg="#111827"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        overflow="hidden"
                        boxShadow="0 16px 40px rgba(15, 23, 42, 0.16)"
                        border="3px solid rgba(255,255,255,0.9)"
                      >
                        <Image src={archeryImg} alt="Arqueros Andinos" w="full" h="full" objectFit="cover" />
                      </Box>
                      <Stack spacing={1} align="center">
                        <Heading size="lg" color="#111827">
                          Iniciar sesión
                        </Heading>
                        <Text fontSize="14px" color="#667085" textAlign="center" maxW="280px">
                          Ingresa con tu cuenta para acceder al panel y continuar tu trabajo.
                        </Text>
                      </Stack>
                    </Stack>

                    <Box
                      bg="white"
                      border={{ base: "1px solid", md: "none" }}
                      borderColor="rgba(226, 232, 240, 0.95)"
                      borderRadius={{ base: "28px", md: "24px" }}
                      boxShadow={{ base: "0 24px 54px rgba(15, 23, 42, 0.10)", md: "none" }}
                      px={{ base: 5, sm: 6, md: 8 }}
                      py={{ base: 5, md: 8 }}
                    >
                      <Stack spacing={{ base: 4.5, md: 5 }}>
                        <Stack spacing={1} display={{ base: "none", md: "flex" }}>
                          <Heading size="lg" color="#111827">
                            Iniciar sesión
                          </Heading>
                          <Text color="#667085" fontSize="14px">
                            Accede a tu cuenta para continuar.
                          </Text>
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
                            <FormLabel color="#344054" mb={1.5} fontSize="sm" fontWeight="700">
                              Usuario
                            </FormLabel>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          name="username"
                          autoComplete="username"
                          bg="#f8fafc"
                          borderColor="#e2e8f0"
                          borderRadius="14px"
                              h="50px"
                              px={4}
                              _hover={{ borderColor: "#cbd5e1" }}
                              _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13" }}
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel color="#344054" mb={1.5} fontSize="sm" fontWeight="700">
                              Contraseña
                            </FormLabel>
                            <PasswordInput
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              name="current-password"
                              autoComplete="current-password"
                              bg="#f8fafc"
                              borderColor="#e2e8f0"
                              borderRadius="14px"
                              h="50px"
                              px={4}
                              _hover={{ borderColor: "#cbd5e1" }}
                              _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13" }}
                            />
                          </FormControl>

                          <Stack spacing={3} pt={1}>
                            <HStack justify="space-between" align={{ base: "start", sm: "center" }} fontSize="sm" color="#667085" spacing={3} flexWrap="wrap">
                              <HStack spacing={2}>
                                <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} colorScheme="orange" />
                                <Text>Recordarme</Text>
                              </HStack>
                              <Text color="#fb5a13" fontWeight="700" whiteSpace="nowrap">
                                ¿Olvidaste tu contraseña?
                              </Text>
                            </HStack>

                            {authError && (
                              <Alert status="error" borderRadius="16px">
                                <AlertIcon />
                                {authError}
                              </Alert>
                            )}

                            <Button
                              type="submit"
                              bg="#fb5a13"
                              color="white"
                              _hover={{ bg: "#ea580c" }}
                              _active={{ bg: "#c2410c" }}
                              h="52px"
                              borderRadius="16px"
                              fontWeight="700"
                              fontSize="15px"
                              isLoading={authLoading}
                              isDisabled={!username || !password}
                            >
                              Ingresar
                            </Button>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
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
        <Box display={{ base: "flex", md: "none" }} position="sticky" top={0} zIndex={20} alignItems="center" justifyContent="space-between" h="44px" px={3} bg="white" borderBottomWidth="1px" borderColor="gray.200">
          <HStack spacing={2.5}>
            <Text fontWeight="800" color="#111827" fontSize="16px">{mobileSectionTitle}</Text>
          </HStack>
          <Box as="button" type="button" onClick={() => goToSection("perfil")} width="29px" height="29px" borderRadius="full" border="1px solid" borderColor="orange.200" bg="orange.50" color="#111827" display="flex" alignItems="center" justifyContent="center">
            <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
            </Box>
          </Box>
        </Box>
        <Grid templateColumns={{ base: "1fr", md: "92px 1fr", lg: "220px 1fr", xl: "250px 1fr" }} minH={{ base: "calc(100vh - 44px)", md: "100vh" }} bg="#f9fafb">
          <GridItem
            borderRight={{ base: "none", md: "1px solid rgba(148, 163, 184, 0.45)" }}
            bg="white"
            p={{ base: 5, md: 3, lg: 4 }}
            position={{ base: "static", md: "sticky" }}
            top={{ base: "auto", md: 0 }}
            h={{ base: "auto", md: "100vh" }}
            alignSelf="start"
            display={{ base: "none", md: "flex" }}
            flexDirection="column"
          >
            <Stack spacing={{ base: 5, md: 4, lg: 5 }} h="full">
              <Box px={{ base: 2, md: 0, lg: 2 }} pt={2}>
                <Box
                  h={{ md: "44px", lg: "108px" }}
                  w={{ md: "28px", lg: "320px" }}
                  mx={{ md: "auto", lg: 0 }}
                  bg="black"
                  sx={{
                    WebkitMaskImage: `url(${arquerosAndinosHeaderUrl})`,
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "left center",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${arquerosAndinosHeaderUrl})`,
                    maskRepeat: "no-repeat",
                    maskPosition: "left center",
                    maskSize: "contain",
                  }}
                />
              </Box>
              <Stack spacing={1} mt={{ base: "10px", md: 0, lg: "10px" }}>
                <HStack
                  px={{ md: 2, lg: 3 }}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "inicio" ? "orange.50" : "transparent"}
                  color={profSection === "inicio" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "inicio" ? "600" : "500"}
                  cursor="pointer"
                  justify={{ md: "center", lg: "flex-start" }}
                  _hover={{ bg: "gray.50" }}
                  onClick={() => goToSection("inicio")}
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
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </Box>
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px">Inicio</Text>
                </HStack>
                <HStack
                  px={{ md: 2, lg: 3 }}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "administrar_rutinas" ? "orange.50" : "transparent"}
                  color={profSection === "administrar_rutinas" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "administrar_rutinas" ? "600" : "500"}
                  cursor="pointer"
                  justify={{ md: "center", lg: "flex-start" }}
                  onClick={() => goToSection("administrar_rutinas")}
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
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px">Administrar rutinas</Text>
                </HStack>
                <HStack
                  px={{ md: 2, lg: 3 }}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "rutina" ? "orange.50" : "transparent"}
                  color={profSection === "rutina" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "rutina" ? "600" : "500"}
                  cursor="pointer"
                  justify={{ md: "center", lg: "flex-start" }}
                  _hover={{ bg: "gray.50" }}
                  onClick={() => goToSection("rutina")}
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
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px">Rutinas</Text>
                </HStack>
                <HStack
                  px={{ md: 2, lg: 3 }}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "ejercicio" ? "orange.50" : "transparent"}
                  color={profSection === "ejercicio" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "ejercicio" ? "600" : "500"}
                  cursor="pointer"
                  justify={{ md: "center", lg: "flex-start" }}
                  _hover={{ bg: "gray.50" }}
                  onClick={() => goToSection("ejercicio")}
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
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px">Ejercicios</Text>
                </HStack>
                <HStack
                  px={{ md: 2, lg: 3 }}
                  py={3}
                  borderRadius="md"
                  bg={profSection === "alumno" ? "orange.50" : "transparent"}
                  color={profSection === "alumno" ? "orange.600" : "gray.700"}
                  fontWeight={profSection === "alumno" ? "600" : "500"}
                  cursor="pointer"
                  justify={{ md: "center", lg: "flex-start" }}
                  _hover={{ bg: "gray.50" }}
                  onClick={() => goToSection("alumno")}
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
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px">Deportistas</Text>
                </HStack>
              </Stack>
              <Stack spacing={3}>
                {userRole === "admin" && (
                  <Button size="sm" variant="outline" onClick={() => goToView("dashboard")}>
                    Ver conexiones
                  </Button>
                )}
              </Stack>
              <Box flex="1" />
              <Box borderTop="1px solid" borderColor="gray.200" pt={3}>
                <HStack px={2} py={2.5} borderRadius="md" bg={profSection === "perfil" ? "orange.50" : "transparent"} cursor="pointer" justify={{ md: "center", lg: "flex-start" }} _hover={{ bg: "gray.50" }} onClick={() => goToSection("perfil")}>
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="17px"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    color={profSection === "perfil" ? "orange.600" : "gray.700"}
                  >
                    <path d="M18 20a6 6 0 0 0-12 0" />
                    <circle cx="12" cy="10" r="4" />
                    <circle cx="12" cy="12" r="10" />
                  </Box>
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px" color={profSection === "perfil" ? "orange.600" : "gray.700"} fontWeight={profSection === "perfil" ? "600" : "500"}>
                    Perfil
                  </Text>
                </HStack>
                <HStack px={2} py={2.5} borderRadius="md" cursor="pointer" justify={{ md: "center", lg: "flex-start" }} _hover={{ bg: "gray.50" }} onClick={handleLogout}>
                  <Box
                    as="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    boxSize="17px"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    color="gray.700"
                  >
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  </Box>
                  <Text display={{ base: "block", md: "none", lg: "block" }} fontSize="17px" color="gray.700" fontWeight="500">
                    Cerrar sesión
                  </Text>
                </HStack>
              </Box>
            </Stack>
          </GridItem>
          <GridItem pl={{ base: 0, md: 5, lg: 7, xl: 8 }} pr={{ base: 0, md: 5, lg: 7, xl: 8 }} py={{ base: 0, md: 5, lg: 6, xl: 7 }} pb={{ base: "74px", md: 5, lg: 6, xl: 7 }} display="flex" alignItems="flex-start" justifyContent="flex-start" w="full" fontSize={{ base: "sm", xl: "md", "2xl": "lg" }}>
            <Stack spacing={{ base: 4, xl: 6 }} w="full">
              <AppDataProvider value={appData}>
              <ProfessorListsProvider>
              <Suspense fallback={<Spinner />}>
                {profSection === "inicio" && (
                  <HomeSection
                    activeAssignments={activeAssignments}
                    activeStudents={activeStudents}
                    assignments={assignments}
                    exercises={exercises}
                    routines={routines}
                    students={students}
                    studentNameById={studentNameById}
                    routineNameById={routineNameById}
                    formatDateEs={formatDateEs}
                    goToSection={goToSection}
                    openAdminAssignModal={openAdminAssignModal}
                    openCreateRoutineModal={openCreateRoutineModal}
                    openCreateStudentModal={openCreateStudentModal}
                    openCreateExerciseModal={openCreateExerciseModal}
                  />
                )}
                {profSection === "administrar_rutinas" && (
                  <AdminRoutinesSection
                    activeAssignments={activeAssignments}
                    routines={routines}
                    studentNameById={studentNameById}
                    routineNameById={routineNameById}
                    formatDateEs={formatDateEs}
                    formatDay={formatDay}
                    getRoutineDayArrows={getRoutineDayArrows}
                    exerciseNameById={exerciseNameById}
                    actionIconButtonSize={actionIconButtonSize}
                    exportAssignmentLoadingId={exportAssignmentLoadingId}
                    exportAssignmentError={exportAssignmentError}
                    setExportAssignmentError={setExportAssignmentError}
                    getAssignmentPdfDownloadUrl={getAssignmentPdfDownloadUrl}
                    saveAssignmentLoadingId={saveAssignmentLoadingId}
                    openSaveAssignmentModal={openSaveAssignmentModal}
                    handleExportAssignmentPdf={handleExportAssignmentPdf}
                    openAdminAssignModal={openAdminAssignModal}
                    setDeleteAssignedRoutineError={setDeleteAssignedRoutineError}
                    setDeleteAssignedRoutineTarget={setDeleteAssignedRoutineTarget}
                    setDeleteAssignedRoutineModalOpen={setDeleteAssignedRoutineModalOpen}
                  />
                )}
                {profSection === "rutina" && (
                  <RoutinesSection
                    sortedRoutines={sortedRoutines}
                    expandedRoutine={expandedRoutine}
                    setExpandedRoutine={setExpandedRoutine}
                    getRoutineWeekArrows={getRoutineWeekArrows}
                    getRoutineDayArrows={getRoutineDayArrows}
                    exerciseNameById={exerciseNameById}
                    formatDay={formatDay}
                    actionIconButtonSize={actionIconButtonSize}
                    actionIconSize={actionIconSize}
                    editIconUrl={editIconUrl}
                    notebookTabsIconUrl={notebookTabsIconUrl}
                    openCreateRoutineModal={openCreateRoutineModal}
                    openEditRoutineModal={openEditRoutineModal}
                    setDeleteRoutineError={setDeleteRoutineError}
                    setDeleteRoutineTarget={setDeleteRoutineTarget}
                    setDeleteRoutineModalOpen={setDeleteRoutineModalOpen}
                  />
                )}
                {profSection === "ejercicio" && (
                  <ExercisesSection
                    expandedExercise={expandedExercise}
                    setExpandedExercise={setExpandedExercise}
                    setCreateModalOpen={(isOpen: boolean) => {
                      if (isOpen) openCreateExerciseModal();
                      else closeCreateExerciseModal();
                    }}
                    openEditExerciseModal={openEditExerciseModal}
                    setDeleteExercise={setDeleteExercise}
                    setDeleteModalOpen={setDeleteModalOpen}
                    actionIconButtonSize={actionIconButtonSize}
                    actionIconSize={actionIconSize}
                    editIconUrl={editIconUrl}
                    bowIconUrl={bowIconUrl}
                  />
                )}
                {profSection === "alumno" && (
                  <StudentsSection
                    expandedStudent={expandedStudent}
                    setExpandedStudent={setExpandedStudent}
                    setCreateStudentModalOpen={(isOpen: boolean) => {
                      if (isOpen) openCreateStudentModal();
                      else closeCreateStudentModal();
                    }}
                    userPlusIconUrl={userPlusIconUrl}
                    actionIconButtonSize={actionIconButtonSize}
                    actionIconSize={actionIconSize}
                    editIconUrl={editIconUrl}
                    openEditStudentModal={openEditStudentModal}
                    setDeactivateStudent={setDeactivateStudent}
                    setDeactivateError={setDeactivateError}
                    setDeactivateModalOpen={setDeactivateModalOpen}
                    openAssignRoutineModal={openAssignRoutineModal}
                    openStudentHistoryModal={openStudentHistoryModal}
                    setActivateStudent={setActivateStudent}
                    setActivateError={setActivateError}
                    setActivateModalOpen={setActivateModalOpen}
                  />
                )}
                {profSection === "perfil" && (
                  <ProfileSection
                    username={currentUsername}
                    userRole={userRole}
                    changePasswordSuccess={changePasswordSuccess}
                    openChangePasswordModal={openChangePasswordModal}
                    handleLogout={handleLogout}
                  />
                )}
              </Suspense>
              </ProfessorListsProvider>
              </AppDataProvider>
            </Stack>
          </GridItem>
        </Grid>
        <Box display={{ base: "block", md: "none" }} position="fixed" left={0} right={0} bottom={0} zIndex={1000} bg="white" borderTopWidth="1px" borderColor="gray.200" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.06)" pb="env(safe-area-inset-bottom)">
          <HStack h="64px" justify="space-around" align="center">
            <MobileBottomNavItem label="Inicio" active={profSection === "inicio"} onClick={() => goToSection("inicio")}>
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </MobileBottomNavItem>
            <MobileBottomNavItem label="Administrar rutinas" active={profSection === "administrar_rutinas"} onClick={() => goToSection("administrar_rutinas")}>
              <rect width="7" height="18" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
            </MobileBottomNavItem>
            <MobileBottomNavItem label="Rutinas" active={profSection === "rutina"} onClick={() => goToSection("rutina")}>
              <path d="M8 2v4" />
              <path d="M12 2v4" />
              <path d="M16 2v4" />
              <rect width="16" height="18" x="4" y="4" rx="2" />
              <path d="M8 10h6" />
              <path d="M8 14h8" />
              <path d="M8 18h5" />
            </MobileBottomNavItem>
            <MobileBottomNavItem label="Ejercicios" active={profSection === "ejercicio"} onClick={() => goToSection("ejercicio")}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </MobileBottomNavItem>
            <MobileBottomNavItem label="Deportistas" active={profSection === "alumno"} onClick={() => goToSection("alumno")}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path d="M16 3.128a4 4 0 0 1 0 7.744" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <circle cx="9" cy="7" r="4" />
            </MobileBottomNavItem>
          </HStack>
        </Box>
        <Modal isOpen={adminUserModalOpen} onClose={closeAdminUserModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "480px" }} borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Crear usuario</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAdminUserModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={5}>
              <Stack spacing={4}>
                {adminUserCreateError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {adminUserCreateError}
                  </Alert>
                )}
                <FormControl isRequired>
                  <FormLabel color="gray.700">Usuario</FormLabel>
                  <Input
                    value={adminUserUsername}
                    onChange={(e) => {
                      setAdminUserUsername(e.target.value);
                      if (adminUserCreateError) setAdminUserCreateError(null);
                    }}
                    placeholder="Nombre de usuario"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="gray.700">Contraseña inicial</FormLabel>
                  <PasswordInput
                    value={adminUserPassword}
                    onChange={(e) => {
                      setAdminUserPassword(e.target.value);
                      if (adminUserCreateError) setAdminUserCreateError(null);
                    }}
                    placeholder="Mínimo 8 caracteres"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="gray.700">Rol</FormLabel>
                  <Select
                    value={adminUserRole}
                    onChange={(e) => setAdminUserRole(e.target.value as "admin" | "professor" | "student")}
                    isDisabled={!canManageUsers}
                  >
                    {canManageUsers ? (
                      <>
                        <option value="professor">Profesor</option>
                        <option value="admin">Administrador</option>
                        <option value="student">Deportista</option>
                      </>
                    ) : (
                      <option value="student">Deportista</option>
                    )}
                  </Select>
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200">
              <HStack spacing={3}>
                <Button variant="outline" borderColor="gray.300" onClick={closeAdminUserModal} isDisabled={adminUserCreateLoading}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  onClick={() => { void handleCreateAdminUser(); }}
                  isLoading={adminUserCreateLoading}
                >
                  Crear usuario
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {changePasswordModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeChangePasswordModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="12" x="3" y="10" rx="2" />
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                    </Box>
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Cambiar contraseña</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Actualiza tu contraseña y vuelve a tu perfil al terminar.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                <Stack spacing={4}>
                  {changePasswordError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {changePasswordError}
                    </Alert>
                  )}
                  <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" p={4} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Contraseña actual</FormLabel>
                        <PasswordInput
                          value={changePasswordCurrent}
                          onChange={(e) => {
                            setChangePasswordCurrent(e.target.value);
                            if (changePasswordError) setChangePasswordError(null);
                          }}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <PasswordInput
                          value={changePasswordNext}
                          onChange={(e) => {
                            setChangePasswordNext(e.target.value);
                            if (changePasswordError) setChangePasswordError(null);
                          }}
                          autoComplete="new-password"
                        />
                        <Text mt={2} fontSize="sm" color="gray.500">Debe tener al menos 8 caracteres.</Text>
                        {changePasswordNext.length > 0 && changePasswordNext.length < 8 && (
                          <Text mt={1} fontSize="sm" color="red.500">La nueva contraseña debe tener al menos 8 caracteres.</Text>
                        )}
                        {changePasswordCurrent.length > 0 && changePasswordNext.length > 0 && changePasswordCurrent === changePasswordNext && (
                          <Text mt={1} fontSize="sm" color="red.500">La nueva contraseña no puede ser igual a la actual.</Text>
                        )}
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Confirmar nueva contraseña</FormLabel>
                        <PasswordInput
                          value={changePasswordConfirm}
                          onChange={(e) => {
                            setChangePasswordConfirm(e.target.value);
                            if (changePasswordError) setChangePasswordError(null);
                          }}
                          autoComplete="new-password"
                        />
                        {changePasswordConfirm.length > 0 && changePasswordNext !== changePasswordConfirm && (
                          <Text mt={1} fontSize="sm" color="red.500">Las contraseñas no coinciden.</Text>
                        )}
                        {changePasswordConfirm.length > 0 && changePasswordNext === changePasswordConfirm && changePasswordNext.length >= 8 && changePasswordCurrent !== changePasswordNext && (
                          <Text mt={1} fontSize="sm" color="green.600">Las contraseñas coinciden.</Text>
                        )}
                      </FormControl>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1401} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" variant="outline" borderColor="gray.300" onClick={closeChangePasswordModal} isDisabled={changePasswordLoading}>
                    Cancelar
                  </Button>
                  <Button flex="1" bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => { void handleChangePassword(); }} isLoading={changePasswordLoading} isDisabled={!changePasswordCanSubmit}>
                    Guardar contraseña
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={changePasswordModalOpen && isDesktopViewport} onClose={closeChangePasswordModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "520px" }} borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Cambiar contraseña</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeChangePasswordModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={5}>
              <Stack spacing={4}>
                {changePasswordError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {changePasswordError}
                  </Alert>
                )}
                <FormControl isRequired>
                  <FormLabel>Contraseña actual</FormLabel>
                  <PasswordInput
                    value={changePasswordCurrent}
                    onChange={(e) => {
                      setChangePasswordCurrent(e.target.value);
                      if (changePasswordError) setChangePasswordError(null);
                    }}
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <PasswordInput
                    value={changePasswordNext}
                    onChange={(e) => {
                      setChangePasswordNext(e.target.value);
                      if (changePasswordError) setChangePasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                  <Text mt={2} fontSize="sm" color="gray.500">Debe tener al menos 8 caracteres.</Text>
                  {changePasswordNext.length > 0 && changePasswordNext.length < 8 && (
                    <Text mt={1} fontSize="sm" color="red.500">La nueva contraseña debe tener al menos 8 caracteres.</Text>
                  )}
                  {changePasswordCurrent.length > 0 && changePasswordNext.length > 0 && changePasswordCurrent === changePasswordNext && (
                    <Text mt={1} fontSize="sm" color="red.500">La nueva contraseña no puede ser igual a la actual.</Text>
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <PasswordInput
                    value={changePasswordConfirm}
                    onChange={(e) => {
                      setChangePasswordConfirm(e.target.value);
                      if (changePasswordError) setChangePasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                  {changePasswordConfirm.length > 0 && changePasswordNext !== changePasswordConfirm && (
                    <Text mt={1} fontSize="sm" color="red.500">Las contraseñas no coinciden.</Text>
                  )}
                  {changePasswordConfirm.length > 0 && changePasswordNext === changePasswordConfirm && changePasswordNext.length >= 8 && changePasswordCurrent !== changePasswordNext && (
                    <Text mt={1} fontSize="sm" color="green.600">Las contraseñas coinciden.</Text>
                  )}
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button variant="outline" borderColor="gray.300" onClick={closeChangePasswordModal} isDisabled={changePasswordLoading}>
                  Cancelar
                </Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => { void handleChangePassword(); }} isLoading={changePasswordLoading} isDisabled={!changePasswordCanSubmit}>
                  Guardar contraseña
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {editModalOpen && !isDesktopViewport && (
          <Box
            position="fixed"
            inset={0}
            zIndex={1500}
            bg="#f6f7fb"
            animation={`${isClosingEditExerciseMobileScreen ? createStudentMobileSlideOut : createStudentMobileSlideIn} ${CREATE_STUDENT_MOBILE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`}
          >
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeEditExerciseModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={bowIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Editar ejercicio</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Ajusta la configuración del ejercicio sin salir de la vista móvil.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                {editExerciseFormFields}
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1501} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeEditExerciseModal}>
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isLoading={editLoading}
                    isDisabled={!editExerciseCanSave}
                    onClick={handleEditSave}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={editModalOpen && isDesktopViewport} onClose={closeEditExerciseModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Editar ejercicio</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeEditExerciseModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              {editExerciseFormFields}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeEditExerciseModal}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isLoading={editLoading}
                  isDisabled={!editExerciseCanSave}
                  onClick={handleEditSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {createModalOpen && !isDesktopViewport && (
          <Box
            position="fixed"
            inset={0}
            zIndex={1500}
            bg="#f6f7fb"
            animation={`${isClosingCreateExerciseMobileScreen ? createStudentMobileSlideOut : createStudentMobileSlideIn} ${CREATE_STUDENT_MOBILE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`}
          >
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeCreateExerciseModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={bowIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Crear ejercicio</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Registra un nuevo ejercicio manteniendo el mismo formato del panel.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                {createExerciseFormFields}
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1501} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateExerciseModal}>
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isLoading={createLoading}
                    isDisabled={!createExerciseCanSave}
                    onClick={handleCreateSave}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={createModalOpen && isDesktopViewport} onClose={closeCreateExerciseModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Crear ejercicio</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeCreateExerciseModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              {createExerciseFormFields}
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
                  isDisabled={!createExerciseCanSave}
                  onClick={handleCreateSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <CreateRoutineModal
          createRoutineModalOpen={createRoutineModalOpen}
          closeCreateRoutineModal={closeCreateRoutineModal}
          routineModalMaxW={routineModalMaxW}
          routineModalStep={routineModalStep}
          routineModalBodyHeight={routineModalBodyHeight}
          routineModalMinHeight={routineModalMinHeight}
          routineStepRef={routineStepRef}
          editingRoutineId={editingRoutineId}
          routineName={routineName}
          setRoutineName={setRoutineName}
          routineAssignStudentId={routineAssignStudentId}
          handleBackToAssignOptionsFromCreate={handleBackToAssignOptionsFromCreate}
          setRoutineDayCount={setRoutineDayCount}
          setRoutineDayCursor={setRoutineDayCursor}
          setRoutineExerciseSearch={setRoutineExerciseSearch}
          setCreateRoutineError={setCreateRoutineError}
          setRoutineModalStep={setRoutineModalStep}
          assignmentStartDate={assignmentStartDate}
          assignmentEndDate={assignmentEndDate}
          setAssignmentStartDate={setAssignmentStartDate}
          setAssignmentEndDate={setAssignmentEndDate}
          assignmentStartDatePickerRef={assignmentStartDatePickerRef}
          assignmentEndDatePickerRef={assignmentEndDatePickerRef}
          formatDateEs={formatDateEs}
          getTodayIsoLocal={getTodayIsoLocal}
          isEndAfterStart={isEndAfterStart}
          addDaysIso={addDaysIso}
          getDayCountFromRange={getDayCountFromRange}
          VerticalDayWheelPicker={VerticalDayWheelPicker}
          routineDayCount={routineDayCount}
          routineDayInitialLimit={routineDayInitialLimit}
          setRoutineDayInitialLimit={setRoutineDayInitialLimit}
          currentRoutineDayKey={currentRoutineDayKey}
          currentRoutineDayLabel={currentRoutineDayLabel}
          currentRoutineDayTotalArrows={currentRoutineDayTotalArrows}
          routineDayCursor={routineDayCursor}
          routineExerciseSearch={routineExerciseSearch}
          filteredRoutineExercises={filteredRoutineExercises}
          routineExercisesByDay={routineExercisesByDay}
          toggleRoutineExerciseForDay={toggleRoutineExerciseForDay}
          setCreateModalOpen={(isOpen: boolean) => {
            if (isOpen) openCreateExerciseModal();
            else closeCreateExerciseModal();
          }}
          bowIconUrl={bowIconUrl}
          createRoutineError={createRoutineError}
          createRoutineLoading={createRoutineLoading}
          handleRoutineExerciseContinue={handleRoutineExerciseContinue}
          routineBuilderDays={routineBuilderDays}
          routineSummaryListRef={routineSummaryListRef}
          routineSummaryListMaxH={routineSummaryListMaxH}
          handleRoutineSummaryWheel={handleRoutineSummaryWheel}
          getSummaryDayArrows={getSummaryDayArrows}
          routineCreateExerciseOverridesByDay={routineCreateExerciseOverridesByDay}
          exercises={exercises}
          getRoutineEntryKey={getRoutineEntryKey}
          actionIconButtonSize={actionIconButtonSize}
          actionIconSize={actionIconSize}
          editIconUrl={editIconUrl}
          openRoutineCreateEditExercise={openRoutineCreateEditExercise}
          removeExerciseFromRoutineSummaryDay={removeExerciseFromRoutineSummaryDay}
          openRoutineCreateAddExercise={openRoutineCreateAddExercise}
          requestDeleteRoutineDay={requestDeleteRoutineDay}
          handleAddRoutineDay={handleAddRoutineDay}
          handleCreateOrUpdateRoutineFromSummary={handleCreateOrUpdateRoutineFromSummary}
          assignmentObjective={assignmentObjective}
          setAssignmentObjective={setAssignmentObjective}
          assignmentProfessorNotes={assignmentProfessorNotes}
          setAssignmentProfessorNotes={setAssignmentProfessorNotes}
          isRoutineCreateAddExerciseModalOpen={routineCreateAddExerciseModalOpen}
          isCreateExerciseModalOpen={createModalOpen}
          isRoutineCreateEditExerciseModalOpen={routineCreateEditExerciseModalOpen}
        />
        {false && (
        <Modal isOpen={createRoutineModalOpen} onClose={closeCreateRoutineModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent
            maxW={{ base: "calc(100vw - 1rem)", md: routineModalMaxW }}
            maxH="90vh"
            transition="max-width 0.3s ease, max-height 0.3s ease"
            overflowY="auto"
            overflowX="hidden"
            borderRadius="14px"
            borderTop={routineModalStep === 0 ? "6px solid" : "0 solid"}
            borderTopColor={routineModalStep === 0 ? "#f97316" : "transparent"}
          >
            <Box
              h={routineModalStep === 3 ? "auto" : routineModalBodyHeight ? `${routineModalBodyHeight}px` : `${routineModalMinHeight}px`}
              transition="height 0.3s ease"
              overflowX="hidden"
              overflowY={routineModalStep === 3 ? "visible" : (routineModalStep === 1 || routineModalStep === 4) ? "auto" : "hidden"}
            >
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
                        setRoutineModalStep(1);
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
                        setRoutineModalStep(1);
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
                {routineModalStep === 1 && (
                  <Stack ref={routineStepRef} spacing={5} animation={`${routineStepSlide} 0.3s ease`} px={2} pt={2} pb={4} w="full" maxW="700px" mx="auto">
                    {routineAssignStudentId && !editingRoutineId ? (
                      <>
                        <Stack spacing={1} align="center" textAlign="center">
                          <Heading size="md">Selecciona el rango de la rutina</Heading>
                        </Stack>
                        <Box borderWidth="1px" borderColor="gray.200" borderRadius="10px" p={4}>
                          <Stack spacing={4}>
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
                                    aria-label="Abrir calendario inicio"
                                    onClick={() => {
                                      const picker = assignmentStartDatePickerRef.current;
                                      if (!picker) return;
                                      if ("showPicker" in picker) {
                                        (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                      } else {
                                        (picker as HTMLInputElement).click();
                                      }
                                    }}
                                  >
                                    <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    onChange={(e) => {
                                      const nextStart = e.target.value || getTodayIsoLocal();
                                      setAssignmentStartDate(nextStart);
                                      if (!isEndAfterStart(nextStart, assignmentEndDate)) {
                                        setAssignmentEndDate(addDaysIso(nextStart, 1));
                                      }
                                    }}
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
                                <Box position="relative" maxW="240px">
                                  <Input type="text" value={formatDateEs(assignmentEndDate)} pr="44px" isReadOnly />
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
                                    aria-label="Abrir calendario fin"
                                    onClick={() => {
                                      const picker = assignmentEndDatePickerRef.current;
                                      if (!picker) return;
                                      if ("showPicker" in picker) {
                                        (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                      } else {
                                        (picker as HTMLInputElement).click();
                                      }
                                    }}
                                  >
                                    <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect width="18" height="18" x="3" y="4" rx="2" />
                                      <path d="M16 2v4" />
                                      <path d="M8 2v4" />
                                      <path d="M3 10h18" />
                                    </Box>
                                  </Button>
                                  <Input
                                    ref={assignmentEndDatePickerRef}
                                    type="date"
                                    value={assignmentEndDate}
                                    min={addDaysIso(assignmentStartDate, 1)}
                                    onChange={(e) => {
                                      const nextEnd = e.target.value || addDaysIso(assignmentStartDate, 1);
                                      if (!isEndAfterStart(assignmentStartDate, nextEnd)) {
                                        setAssignmentEndDate(addDaysIso(assignmentStartDate, 1));
                                        return;
                                      }
                                      setAssignmentEndDate(nextEnd);
                                    }}
                                    position="absolute"
                                    inset={0}
                                    opacity={0}
                                    pointerEvents="none"
                                    aria-label="Seleccionar fin de rutina"
                                  />
                                </Box>
                              </FormControl>
                            </SimpleGrid>
                            <Text textAlign="center" color="gray.700" fontWeight="600">
                              Días de rutina: {getDayCountFromRange(assignmentStartDate, assignmentEndDate)}
                            </Text>
                          </Stack>
                        </Box>
                      </>
                    ) : (
                      <Stack spacing={5} align="center" textAlign="center" py={2}>
                        <Heading size="md">Elige cuántos días tendrá la rutina</Heading>
                        <VerticalDayWheelPicker
                          value={routineDayCount}
                          min={1}
                          max={7}
                          onChange={setRoutineDayCount}
                        />
                      </Stack>
                    )}
                    <HStack spacing={3} justify="flex-end" wrap="wrap">
                      <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(0)}>
                        Volver
                      </Button>
                      <Button
                        bg="#f97316"
                        color="white"
                        _hover={{ bg: "#ea580c" }}
                        _active={{ bg: "#c2410c" }}
                        isDisabled={(routineAssignStudentId && !editingRoutineId) ? !isEndAfterStart(assignmentStartDate, assignmentEndDate) : false}
                        onClick={() => {
                          const calculatedDays = routineAssignStudentId && !editingRoutineId
                            ? Math.max(1, Math.min(7, getDayCountFromRange(assignmentStartDate, assignmentEndDate)))
                            : Math.max(1, Math.min(7, routineDayCount));
                          setRoutineDayCount(calculatedDays);
                          setRoutineDayInitialLimit(calculatedDays);
                          setRoutineDayCursor(0);
                          setRoutineExerciseSearch("");
                          setCreateRoutineError(null);
                          setRoutineModalStep(2);
                        }}
                      >
                        Siguiente
                      </Button>
                      <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>
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
                      const selectedForCurrentDay = currentRoutineDayExercises.includes(ex.id);
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
                    <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(1)}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!currentRoutineDayKey || currentRoutineDayExercises.length === 0}
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
                      maxH={{ base: "36vh", md: `${routineSummaryListMaxH}px` }}
                      overflowY="auto"
                      pr={1}
                      px={4}
                      py={3}
                      onWheel={handleRoutineSummaryWheel}
                      sx={{ overscrollBehaviorY: "contain" }}
                    >
                      {routineBuilderDays.map((day) => (
                        <Box key={`summary-${day.key}`} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                          <HStack justify="space-between" align="baseline">
                            <Text color="gray.800" fontWeight="medium">
                              {day.label}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {getSummaryDayArrows(
                                routineExercisesByDay[day.key] || [],
                                day.key,
                                routineCreateExerciseOverridesByDay,
                              )} flechas
                            </Text>
                          </HStack>
                          <Stack spacing={1} mt={2}>
                            {(routineExercisesByDay[day.key] || []).map((exerciseId, itemIndex) => {
                              const base = exercises.find((ex) => ex.id === exerciseId);
                              const override = routineCreateExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, itemIndex)];
                              return (
                                <HStack key={`summary-ex-${day.key}-${itemIndex}-${exerciseId}`} spacing={2} align="center">
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
                                      onClick={() => openRoutineCreateEditExercise(day.key, exerciseId, itemIndex)}
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
                                      onClick={() => removeExerciseFromRoutineSummaryDay(day.key, itemIndex)}
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
                      {routineDayCount < routineDayInitialLimit && (
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
                      {routineAssignStudentId && !editingRoutineId ? (
                        <Button
                          bg="#f97316"
                          color="white"
                          _hover={{ bg: "#ea580c" }}
                          _active={{ bg: "#c2410c" }}
                          isDisabled={routineBuilderDays.some((day) => (routineExercisesByDay[day.key] || []).length === 0)}
                          onClick={() => setRoutineModalStep(4)}
                        >
                          Siguiente
                        </Button>
                      ) : (
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
                      )}
                      <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>
                        Cancelar
                      </Button>
                    </HStack>
                  </Stack>
                )}
                {routineModalStep === 4 && routineAssignStudentId && !editingRoutineId && (
                  <Stack ref={routineStepRef} spacing={4} animation={`${routineStepSlide} 0.3s ease`} px={4} py={4}>
                    <Box borderWidth="1px" borderColor="gray.200" borderRadius="10px" p={4}>
                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>Objetivo</FormLabel>
                          <Input
                            value={assignmentObjective}
                            onChange={(e) => setAssignmentObjective(e.target.value)}
                            placeholder="Ej: Determinante"
                            maxW="320px"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Notas del profesor (opcional)</FormLabel>
                          <Textarea
                            value={assignmentProfessorNotes}
                            onChange={(e) => setAssignmentProfessorNotes(e.target.value)}
                            placeholder="Escribe observaciones para el deportista..."
                            minH="110px"
                            resize="vertical"
                          />
                        </FormControl>
                      </Stack>
                    </Box>
                    {createRoutineError && (
                      <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        {createRoutineError}
                      </Alert>
                    )}
                    <HStack spacing={3} justify="flex-end" pt={1}>
                      <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(3)}>
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
                        Confirmar asignación
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
        )}
        {routineCreateAddExerciseModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button variant="ghost" minW="auto" px={1} color="#334155" _hover={{ bg: "transparent", color: "#0f172a" }} _active={{ bg: "transparent", color: "#0f172a" }} onClick={closeRoutineCreateAddExerciseModal} aria-label="Volver">
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={bowIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Agregar ejercicio al día</Text>
                  </HStack>
                </HStack>
              </Box>
              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="calc(1.5rem + env(safe-area-inset-bottom))">
                <Stack spacing={3}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.500" />
                    </InputLeftElement>
                    <Input placeholder="Buscar ejercicio..." value={routineCreateAddExerciseSearch} onChange={(e) => setRoutineCreateAddExerciseSearch(e.target.value)} bg="#eef3fb" borderColor="transparent" borderRadius="10px" h="42px" fontSize="13px" _hover={{ borderColor: "transparent" }} _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }} />
                  </InputGroup>
                  <Stack ref={routineCreateAddExerciseListRef} spacing={2} overflowY="auto" pr={1} onWheel={handleRoutineCreateAddExerciseListWheel} sx={{ overscrollBehaviorY: "contain" }}>
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
                      .filter((_exercise) => Boolean(routineCreateAddExerciseDayKey))
                      .map((exercise) => (
                        <Box key={`create-day-add-${exercise.id}`} bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="12px" p={3.5} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                          <Stack spacing={3}>
                            <Stack spacing={0.5}>
                              <Text fontSize="sm" color="gray.800" fontWeight="600">{exercise.name}</Text>
                              <Text fontSize="xs" color="gray.500">Flechas: {exercise.arrows_count} | Distancia: {Number(exercise.distance_m)} m</Text>
                            </Stack>
                            <Button size="sm" variant="outline" borderColor="gray.300" borderRadius="10px" bg="white" _hover={{ bg: "gray.50", borderColor: "gray.400" }} onClick={() => routineCreateAddExerciseDayKey && addExerciseToRoutineSummaryDay(routineCreateAddExerciseDayKey, exercise.id)}>
                              Agregar
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </Stack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={routineCreateAddExerciseModalOpen && isDesktopViewport} onClose={closeRoutineCreateAddExerciseModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "620px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Agregar ejercicio al día</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeRoutineCreateAddExerciseModal}>
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
                    .filter((_exercise) => Boolean(routineCreateAddExerciseDayKey))
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
              <Button variant="outline" borderColor="gray.300" bg="white" _hover={{ bg: "gray.50" }} onClick={closeRoutineCreateAddExerciseModal}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {routineCreateEditExerciseModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeRoutineCreateEditExercise}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={editIconUrl} alt="" boxSize="16px" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Editar ejercicio</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Ajusta los valores del ejercicio dentro del resumen de la rutina.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                <Stack spacing={4}>
                  <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" p={4} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                    <Stack spacing={4}>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                        <FormControl>
                          <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={1}
                            step={1}
                            value={routineCreateEditRounds}
                            onChange={(e) => setRoutineCreateEditRounds(normalizeInt(e.target.value))}
                            onKeyDown={(e) => blockInvalidKeys(e, false)}
                            onBeforeInput={handleBeforeInputInt}
                            onPaste={handlePasteInt}
                            borderColor="gray.300"
                            borderRadius="8px"
                            _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
                  </Box>
                </Stack>
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1401} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button
                    flex="1"
                    bg="white"
                    color="black"
                    borderColor="gray.300"
                    borderWidth="1px"
                    _hover={{ bg: "gray.100" }}
                    onClick={closeRoutineCreateEditExercise}
                  >
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isDisabled={routineCreateEditRounds === "" || routineCreateEditArrows === "" || routineCreateEditDistance === ""}
                    onClick={saveRoutineCreateEditExercise}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal
          isOpen={routineCreateEditExerciseModalOpen && isDesktopViewport}
          onClose={closeRoutineCreateEditExercise}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Editar ejercicio</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.400"
                  _hover={{ bg: "gray.100", color: "gray.700" }}
                  onClick={closeRoutineCreateEditExercise}
                >
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody>
              <Stack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      step={1}
                      value={routineCreateEditRounds}
                      onChange={(e) => setRoutineCreateEditRounds(normalizeInt(e.target.value))}
                      onKeyDown={(e) => blockInvalidKeys(e, false)}
                      onBeforeInput={handleBeforeInputInt}
                      onPaste={handlePasteInt}
                      borderColor="gray.300"
                      borderRadius="8px"
                      _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={closeRoutineCreateEditExercise}
                >
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isDisabled={routineCreateEditRounds === "" || routineCreateEditArrows === "" || routineCreateEditDistance === ""}
                  onClick={saveRoutineCreateEditExercise}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deleteRoutineDayConfirmOpen}
            title="¿Eliminar día?"
            message={
              <>
                Se eliminará{" "}
                <Box as="span" fontWeight="700" color="#334155">
                  {deleteRoutineDayTargetNumber ? `Día ${deleteRoutineDayTargetNumber}` : "este día"}
                </Box>{" "}
                de la rutina. Esta acción no se puede deshacer.
              </>
            }
            confirmLabel="Eliminar día"
            onConfirm={confirmDeleteRoutineDay}
            onClose={() => setDeleteRoutineDayConfirmOpen(false)}
          />
        )}
        <Modal isOpen={deleteRoutineDayConfirmOpen && isDesktopViewport} onClose={() => setDeleteRoutineDayConfirmOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "420px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
        {createStudentModalOpen && !isDesktopViewport && (
          <Box
            position="fixed"
            inset={0}
            zIndex={1400}
            bg="#f6f7fb"
            animation={`${isClosingCreateStudentMobileScreen ? createStudentMobileSlideOut : createStudentMobileSlideIn} ${CREATE_STUDENT_MOBILE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`}
          >
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeCreateStudentModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={userPlusIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Crear nuevo deportista</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Crea la cuenta y registra al deportista en un solo flujo.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                {createStudentFormFields}
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1401} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateStudentModal}>
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isLoading={createStudentLoading}
                    isDisabled={!createStudentCanSave}
                    onClick={handleCreateStudentSave}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={createStudentModalOpen && isDesktopViewport} onClose={closeCreateStudentModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <HStack spacing={2}>
                    <Image src={userPlusIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontWeight="700" color="gray.900">Crear nuevo deportista</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">Ingresa la cuenta y los datos del nuevo estudiante de arquería.</Text>
                </Stack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeCreateStudentModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              {createStudentFormFields}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateStudentModal}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isLoading={createStudentLoading}
                  isDisabled={!createStudentCanSave}
                  onClick={handleCreateStudentSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {editStudentModalOpen && !isDesktopViewport && (
          <Box
            position="fixed"
            inset={0}
            zIndex={1400}
            bg="#f6f7fb"
            animation={`${isClosingEditStudentMobileScreen ? createStudentMobileSlideOut : createStudentMobileSlideIn} ${CREATE_STUDENT_MOBILE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`}
          >
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeEditStudentModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={userPlusIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Editar deportista</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Actualiza la información del deportista desde una vista completa.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                {editStudentFormFields}
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1401} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeEditStudentModal}>
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isLoading={editStudentLoading}
                    isDisabled={!editStudentCanSave}
                    onClick={handleEditStudentSave}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={editStudentModalOpen && isDesktopViewport} onClose={closeEditStudentModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="flex-start">
                <Stack spacing={1}>
                  <HStack spacing={2}>
                    <Image src={userPlusIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontWeight="700" color="gray.900">Editar Deportista</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">Actualiza los datos del estudiante.</Text>
                </Stack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeEditStudentModal}>
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              {editStudentFormFields}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeEditStudentModal}>
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isLoading={editStudentLoading}
                  isDisabled={!editStudentCanSave}
                  onClick={handleEditStudentSave}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {studentHistoryModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeStudentHistoryModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <Stack spacing={0} flex="1" align="center" mr="28px">
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Historial del deportista</Text>
                    <Text fontSize="11px" color="#667085" textAlign="center">
                      {studentHistoryTarget ? `${studentHistoryTarget.full_name} · DNI ${studentHistoryTarget.document_number}` : ""}
                    </Text>
                  </Stack>
                </HStack>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="calc(1.5rem + env(safe-area-inset-bottom))">
                <Stack spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" color="#334155">
                      <SearchIcon boxSize={3.5} />
                    </InputLeftElement>
                    <Input
                      value={studentHistorySearch}
                      onChange={(e) => setStudentHistorySearch(e.target.value)}
                      placeholder="Buscar por rutina, objetivo o notas"
                      bg="#eef3fb"
                      borderColor="transparent"
                      borderRadius="10px"
                      h="42px"
                      fontSize="13px"
                      _hover={{ borderColor: "transparent" }}
                      _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }}
                    />
                  </InputGroup>
                  {studentHistoryLoading ? (
                    <HStack py={6} justify="center">
                      <Spinner size="sm" />
                      <Text color="gray.500" fontSize="sm">Cargando historial...</Text>
                    </HStack>
                  ) : (
                    <Stack spacing={3}>
                      {filteredStudentHistoryItems.map((item) => {
                        const isExpanded = expandedHistoryId === item.id;
                        const snapshot = parseHistorySnapshot(item.snapshot_json);
                        const days = (Array.isArray(snapshot?.days) ? snapshot.days : [])
                          .filter((day): day is HistorySnapshotDay => Boolean(day) && typeof day === "object")
                          .map((day, idx) => ({
                            day_number: Number(day.day_number ?? idx + 1),
                            name: day.name ?? null,
                            label: day.label ?? null,
                            exercises: Array.isArray(day.exercises) ? day.exercises : [],
                            items: Array.isArray(day.items) ? day.items : [],
                          }));
                        return (
                          <Box key={item.id} bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="12px" overflow="hidden" boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                            <Box p={4} cursor="pointer" _hover={{ bg: "#f8fafc" }} onClick={() => setExpandedHistoryId((prev) => (prev === item.id ? null : item.id))}>
                              <Stack spacing={3}>
                                <HStack justify="space-between" align="start" spacing={3}>
                                  <Stack spacing={1} minW={0}>
                                    <Text fontWeight="800" color="#1f2937" noOfLines={2}>{getHistoryRoutineDisplayName(item.routine_name)}</Text>
                                    <Text fontSize="12px" color="#667085">
                                      {formatDateEs(item.start_date)} a {formatDateEs(item.end_date)}
                                    </Text>
                                    <Text fontSize="12px" color="#475467">Objetivo: {item.objective || "-"}</Text>
                                  </Stack>
                                  <Box as="span" color="#92400e" fontSize="22px" lineHeight="1" transform={isExpanded ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.18s ease">›</Box>
                                </HStack>
                                <HStack justify="space-between" align="center" spacing={3}>
                                  <Tag size="sm" borderRadius="full" bg="gray.100" color="gray.700">
                                    Flechas: {item.weekly_total_arrows}
                                  </Tag>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    borderColor="gray.300"
                                    color="gray.700"
                                    _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleExportHistoryPdf(item);
                                    }}
                                    isLoading={studentHistoryExportLoadingId === item.id}
                                    isDisabled={studentHistoryExportLoadingId !== null && studentHistoryExportLoadingId !== item.id}
                                    aria-label="Exportar PDF de historial"
                                  >
                                    <HStack spacing={1}>
                                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="14px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 17V3" />
                                        <path d="m6 11 6 6 6-6" />
                                        <path d="M19 21H5" />
                                      </Box>
                                      <Text fontSize="xs" fontWeight="600">PDF</Text>
                                    </HStack>
                                  </Button>
                                </HStack>
                              </Stack>
                            </Box>
                            <Collapse in={isExpanded} animateOpacity>
                              <Box px={4} pb={4} borderTopWidth="1px" borderColor="gray.100">
                                <Stack spacing={3} pt={3}>
                                  {item.professor_notes && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="600" color="gray.800">Notas del profesor</Text>
                                      <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">{item.professor_notes}</Text>
                                    </Box>
                                  )}
                                  {item.student_observations && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="600" color="gray.800">Observaciones del deportista</Text>
                                      <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">{item.student_observations}</Text>
                                    </Box>
                                  )}
                                  {!!days.length && (
                                    <Stack spacing={2}>
                                      <Text fontSize="sm" fontWeight="600" color="gray.800">Días de la rutina</Text>
                                      {days.map((day) => (
                                        <Box key={`history-day-${item.id}-${day.day_number}`} pl={3} borderLeft="2px solid" borderColor="gray.200">
                                          <Text fontSize="sm" fontWeight="600" color="gray.700">
                                            {day.label || day.name || `Día ${day.day_number}`}
                                          </Text>
                                          <Stack as="ul" spacing={1} mt={1}>
                                            {getHistoryDayExerciseNames(day).map((exerciseName, idx) => (
                                              <HStack as="li" key={`history-day-${item.id}-${day.day_number}-ex-${idx}`} align="start" spacing={2}>
                                                <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="orange.400" flexShrink={0} />
                                                <Text fontSize="sm" color="gray.600">{exerciseName}</Text>
                                              </HStack>
                                            ))}
                                          </Stack>
                                        </Box>
                                      ))}
                                    </Stack>
                                  )}
                                </Stack>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                      {!filteredStudentHistoryItems.length && !studentHistoryError && (
                        <Text color="gray.600" textAlign="center" py={6}>No hay rutinas en historial para este deportista.</Text>
                      )}
                    </Stack>
                  )}
                  {studentHistoryError && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {studentHistoryError}
                    </Alert>
                  )}
                </Stack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal
          isOpen={studentHistoryModalOpen && isDesktopViewport}
          onClose={closeStudentHistoryModal}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "760px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between" align="center">
                <Stack spacing={0}>
                  <Text fontWeight="700" color="gray.900">Historial del deportista</Text>
                  <Text fontSize="sm" color="gray.500">
                    {studentHistoryTarget ? `${studentHistoryTarget.full_name} · DNI ${studentHistoryTarget.document_number}` : ""}
                  </Text>
                </Stack>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.400"
                  _hover={{ bg: "gray.100", color: "gray.700" }}
                  onClick={closeStudentHistoryModal}
                >
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody py={4}>
              <Stack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.500">
                    <SearchIcon boxSize={3.5} />
                  </InputLeftElement>
                  <Input
                    value={studentHistorySearch}
                    onChange={(e) => setStudentHistorySearch(e.target.value)}
                    placeholder="Buscar por rutina, objetivo o notas"
                    borderRadius="8px"
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.400" }}
                    _focus={{ borderColor: "gray.500", bg: "white" }}
                  />
                </InputGroup>
                {studentHistoryLoading ? (
                  <HStack py={6} justify="center">
                    <Spinner size="sm" />
                    <Text color="gray.500" fontSize="sm">Cargando historial...</Text>
                  </HStack>
                ) : (
                  <Stack spacing={3} maxH="56vh" overflowY="auto" pr={1}>
                    {filteredStudentHistoryItems.map((item) => {
                      const isExpanded = expandedHistoryId === item.id;
                      const snapshot = parseHistorySnapshot(item.snapshot_json);
                      const days = (Array.isArray(snapshot?.days) ? snapshot.days : [])
                        .filter((day): day is HistorySnapshotDay => Boolean(day) && typeof day === "object")
                        .map((day, idx) => ({
                          day_number: Number(day.day_number ?? idx + 1),
                          name: day.name ?? null,
                          label: day.label ?? null,
                          exercises: Array.isArray(day.exercises) ? day.exercises : [],
                          items: Array.isArray(day.items) ? day.items : [],
                        }));
                      return (
                        <Box
                          key={item.id}
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="12px"
                          bg="white"
                          overflow="hidden"
                        >
                          <Box
                            p={4}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                            onClick={() => setExpandedHistoryId((prev) => (prev === item.id ? null : item.id))}
                          >
                            <HStack justify="space-between" align="start">
                              <Stack spacing={1}>
                                <Text fontWeight="700" color="gray.900">{getHistoryRoutineDisplayName(item.routine_name)}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDateEs(item.start_date)} a {formatDateEs(item.end_date)}
                                </Text>
                                <Text fontSize="sm" color="gray.600">Objetivo: {item.objective || "-"}</Text>
                              </Stack>
                              <Stack spacing={0} align="end">
                                <Text fontSize="xs" color="gray.500">{isExpanded ? "Ocultar" : "Ver detalle"}</Text>
                                <HStack spacing={2}>
                                  <Tag size="sm" borderRadius="full" bg="gray.100" color="gray.700">
                                    Flechas: {item.weekly_total_arrows}
                                  </Tag>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    borderColor="gray.300"
                                    color="gray.700"
                                    _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleExportHistoryPdf(item);
                                    }}
                                    isLoading={studentHistoryExportLoadingId === item.id}
                                    isDisabled={studentHistoryExportLoadingId !== null && studentHistoryExportLoadingId !== item.id}
                                    aria-label="Exportar PDF de historial"
                                  >
                                    <HStack spacing={1}>
                                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="14px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 17V3" />
                                        <path d="m6 11 6 6 6-6" />
                                        <path d="M19 21H5" />
                                      </Box>
                                      <Text fontSize="xs" fontWeight="600">PDF</Text>
                                    </HStack>
                                  </Button>
                                </HStack>
                              </Stack>
                            </HStack>
                          </Box>
                          <Collapse in={isExpanded} animateOpacity>
                            <Box
                              px={4}
                              pb={4}
                              borderTopWidth="1px"
                              borderColor="gray.100"
                              maxH={{ base: "34vh", md: "38vh" }}
                              overflowY="auto"
                              pr={3}
                            >
                              <Stack spacing={3} pt={3}>
                                {item.professor_notes && (
                                  <Box>
                                    <Text fontSize="sm" fontWeight="600" color="gray.800">Notas del profesor</Text>
                                    <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">{item.professor_notes}</Text>
                                  </Box>
                                )}
                                {item.student_observations && (
                                  <Box>
                                    <Text fontSize="sm" fontWeight="600" color="gray.800">Observaciones del deportista</Text>
                                    <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">{item.student_observations}</Text>
                                  </Box>
                                )}
                                {!!days.length && (
                                  <Stack spacing={2}>
                                    <Text fontSize="sm" fontWeight="600" color="gray.800">Días de la rutina</Text>
                                    {days.map((day) => (
                                      <Box key={`history-day-${item.id}-${day.day_number}`} pl={3} borderLeft="2px solid" borderColor="gray.200">
                                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                                          {day.label || day.name || `Día ${day.day_number}`}
                                        </Text>
                                        <Stack as="ul" spacing={1} mt={1}>
                                          {getHistoryDayExerciseNames(day).map((exerciseName, idx) => (
                                            <HStack as="li" key={`history-day-${item.id}-${day.day_number}-ex-${idx}`} align="start" spacing={2}>
                                              <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="orange.400" flexShrink={0} />
                                              <Text fontSize="sm" color="gray.600">{exerciseName}</Text>
                                            </HStack>
                                          ))}
                                        </Stack>
                                      </Box>
                                    ))}
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                    {!filteredStudentHistoryItems.length && !studentHistoryError && (
                      <Text color="gray.600" textAlign="center" py={6}>No hay rutinas en historial para este deportista.</Text>
                    )}
                  </Stack>
                )}
                {studentHistoryError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {studentHistoryError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <Button
                bg="white"
                color="black"
                borderColor="gray.300"
                borderWidth="1px"
                _hover={{ bg: "gray.100" }}
                onClick={closeStudentHistoryModal}
              >
                Cerrar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal
          isOpen={adminAssignModalOpen}
          onClose={closeAdminAssignModal}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "620px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
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
                    placeholder="Buscar deportista activo"
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
                    <Text color="gray.600">No hay deportistas activos para asignar.</Text>
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
        <AssignRoutineModal
          assignRoutineModalOpen={assignRoutineModalOpen}
          closeAssignRoutineModal={closeAssignRoutineModal}
          assignRoutineStep={assignRoutineStep}
          assignRoutineStudent={assignRoutineStudent}
          handleChooseCreateRoutineForStudent={handleChooseCreateRoutineForStudent}
          handleChooseExistingRoutineList={handleChooseExistingRoutineList}
          sortedRoutines={sortedRoutines}
          selectedRoutineIdsToAssign={selectedRoutineIdsToAssign}
          selectedRoutinesToAssign={selectedRoutinesToAssign}
          handleSelectRoutineToAssign={handleSelectRoutineToAssign}
          getRoutineWeekArrows={getRoutineWeekArrows}
          routineOrderContainerRef={routineOrderContainerRef}
          routineOrderItemRefs={routineOrderItemRefs}
          routineOrderButtonAnimationById={routineOrderButtonAnimationById}
          hoveredRoutineOrderId={hoveredRoutineOrderId}
          draggingRoutineOrderId={draggingRoutineOrderId}
          draggingRoutineOrderHeight={draggingRoutineOrderHeight}
          draggingRoutineOrderTop={draggingRoutineOrderTop}
          draggingRoutineOrderLeft={draggingRoutineOrderLeft}
          draggingRoutineOrderWidth={draggingRoutineOrderWidth}
          handleRoutineOrderDragStart={handleRoutineOrderDragStart}
          moveSelectedRoutineOrder={moveSelectedRoutineOrder}
          assignmentStartDate={assignmentStartDate}
          assignmentEndDate={assignmentEndDate}
          setAssignmentStartDate={setAssignmentStartDate}
          setAssignmentEndDate={setAssignmentEndDate}
          assignmentStartDatePickerRef={assignmentStartDatePickerRef}
          assignmentEndDatePickerRef={assignmentEndDatePickerRef}
          formatDateEs={formatDateEs}
          addDaysIso={addDaysIso}
          getTodayIsoLocal={getTodayIsoLocal}
          isEndAfterStart={isEndAfterStart}
          getDayCountFromRange={getDayCountFromRange}
          selectedRoutineToAssign={selectedRoutineToAssign}
          assignRoutineSummaryListRef={assignRoutineSummaryListRef}
          routineAssignSummaryListMaxH={routineAssignSummaryListMaxH}
          handleAssignRoutineSummaryWheel={handleAssignRoutineSummaryWheel}
          routineAssignBuilderDays={routineAssignBuilderDays}
          isAssignPreviewOverDayLimit={isAssignPreviewOverDayLimit}
          assignPreviewExcessDays={assignPreviewExcessDays}
          getSummaryDayArrows={getSummaryDayArrows}
          routineAssignExercisesByDay={routineAssignExercisesByDay}
          routineAssignExerciseOverridesByDay={routineAssignExerciseOverridesByDay}
          getRoutineEntryKey={getRoutineEntryKey}
          exercises={exercises}
          actionIconButtonSize={actionIconButtonSize}
          actionIconSize={actionIconSize}
          editIconUrl={editIconUrl}
          openEditAssignExercise={openEditAssignExercise}
          removeAssignExerciseFromDay={removeAssignExerciseFromDay}
          openAddExerciseForDay={openAddExerciseForDay}
          routineAssignDayCount={routineAssignDayCount}
          requestDeleteAssignRoutineDay={requestDeleteAssignRoutineDay}
          routineAssignDayInitialLimit={routineAssignDayInitialLimit}
          addAssignRoutineDay={addAssignRoutineDay}
          assignmentObjective={assignmentObjective}
          setAssignmentObjective={setAssignmentObjective}
          assignmentProfessorNotes={assignmentProfessorNotes}
          setAssignmentProfessorNotes={setAssignmentProfessorNotes}
          assignRoutineError={assignRoutineError}
          openAdminAssignModal={openAdminAssignModal}
          setAssignRoutineModalOpen={setAssignRoutineModalOpen}
          handleContinueToRoutineOrder={handleContinueToRoutineOrder}
          handleContinueFromRoutineOrder={handleContinueFromRoutineOrder}
          handleAssignExistingRoutine={handleAssignExistingRoutine}
          assignRoutineLoading={assignRoutineLoading}
          setAssignRoutineStep={setAssignRoutineStep}
          isAddExerciseDayModalOpen={addExerciseDayModalOpen}
          isEditAssignExerciseModalOpen={editAssignExerciseModalOpen}
        />
        {false && (
        <Modal isOpen={assignRoutineModalOpen} onClose={closeAssignRoutineModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent
            maxW={{ base: "calc(100vw - 1rem)", md: "760px" }}
            maxH="90vh"
            borderRadius="12px"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Stack spacing={0}>
                  <Text fontWeight="700" color="gray.900">
                    Asignar rutina a{" "}
                    <Text as="span" color={assignRoutineStep === "choice" ? "#f97316" : "gray.900"}>
                      {assignRoutineStudent?.full_name || "deportista"}
                    </Text>
                  </Text>
                  {assignRoutineStep === "choice" && <Text fontSize="sm" color="gray.500">Paso 2 de 4: Selecciona el método de asignación</Text>}
                  {assignRoutineStep === "existing_days" && <Text fontSize="sm" color="gray.500">Paso 3: Selecciona inicio y fin de rutina</Text>}
                  {assignRoutineStep === "existing_list" && <Text fontSize="sm" color="gray.500">Paso 4: Selecciona una o más rutinas pre cargadas.</Text>}
                  {assignRoutineStep === "existing_order" && <Text fontSize="sm" color="gray.500">Paso 5: Ordenar rutinas seleccionadas</Text>}
                  {assignRoutineStep === "existing_preview" && <Text fontSize="sm" color="gray.500">Paso 6: Configurar ejercicios y días</Text>}
                  {assignRoutineStep === "existing_dates" && <Text fontSize="sm" color="gray.500">Paso 7: Seleccionar fechas y notas</Text>}
                </Stack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAssignRoutineModal}>×</Button>
              </HStack>
            </ModalHeader>
            <ModalBody
              py={5}
              overflowY={assignRoutineStep === "existing_preview" || assignRoutineStep === "existing_list" || assignRoutineStep === "existing_order" ? "hidden" : "auto"}
              display="flex"
              flexDirection="column"
              minH={0}
            >
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
                        <Text fontSize="sm" color="gray.500">Diseña una rutina específica desde cero para este deportista.</Text>
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
                <Stack spacing={3} flex="1" minH={0} overflowY="auto" pr={1}>
                  {sortedRoutines.map((routine) => {
                    const isSelected = selectedRoutineIdsToAssign.includes(routine.id);
                    return (
                    <Box
                      key={routine.id}
                      p={3.5}
                      borderWidth="1px"
                      borderColor={isSelected ? "#f97316" : "gray.200"}
                      bg={isSelected ? "#fff7ed" : "white"}
                      borderRadius="8px"
                      cursor="pointer"
                      _hover={{ borderColor: isSelected ? "#f97316" : "gray.400" }}
                      onClick={() => handleSelectRoutineToAssign(routine)}
                    >
                      <HStack justify="space-between" align="center">
                        <Stack spacing={0}>
                          <Text color="gray.900" fontWeight="500">{routine.name}</Text>
                        </Stack>
                        <HStack spacing={3}>
                          <Text color="gray.500" fontSize="sm">
                            Flechas totales: {getRoutineWeekArrows(routine)}
                          </Text>
                          {isSelected && (
                            <Badge bg="#f97316" color="white" borderRadius="full" px={2} py={0.5}>✓</Badge>
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                    );
                  })}
                  {!sortedRoutines.length && <Text color="gray.600">No hay rutinas creadas.</Text>}
                </Stack>
              )}
              {assignRoutineStep === "existing_order" && (
                <Flex ref={routineOrderContainerRef} flex="1" minH={0} py={0}>
                  <Box
                    w="100%"
                    bg="white"
                  >
                    <HStack justify="space-between" px={1} py={1} borderBottomWidth="1px" borderColor="gray.200">
                      <Text fontWeight="700" color="gray.900">Ordenar rutinas</Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedRoutinesToAssign.length} seleccionada{selectedRoutinesToAssign.length === 1 ? "" : "s"}
                      </Text>
                    </HStack>
                    <Stack spacing={4} px={1} py={4}>
                      <Stack spacing={2}>
                        {selectedRoutinesToAssign.map((routine, index) => {
                          const isDragging = draggingRoutineOrderId === routine.id;
                          const buttonAnimation = routineOrderButtonAnimationById[routine.id];
                          const hoveredIndex = hoveredRoutineOrderId !== null ? selectedRoutinesToAssign.findIndex((item) => item.id === hoveredRoutineOrderId) : -1;
                          const draggingIndex = draggingRoutineOrderId !== null ? selectedRoutinesToAssign.findIndex((item) => item.id === draggingRoutineOrderId) : -1;
                          let hoverTranslateY = 0;
                          if (
                            !isDragging &&
                            hoveredIndex !== -1 &&
                            draggingIndex !== -1 &&
                            hoveredIndex !== draggingIndex
                          ) {
                            const shift = draggingRoutineOrderHeight + 8;
                            if (draggingIndex > hoveredIndex) {
                              if (index >= hoveredIndex && index < draggingIndex) {
                                hoverTranslateY = shift;
                              }
                            } else if (draggingIndex < hoveredIndex) {
                              if (index > draggingIndex && index <= hoveredIndex) {
                                hoverTranslateY = -shift;
                              }
                            }
                          }
                          return (
                          <Box
                            key={`selected-order-wrap-${routine.id}`}
                            minH={isDragging ? `${draggingRoutineOrderHeight}px` : undefined}
                          >
                          <Box
                            ref={(node) => {
                              routineOrderItemRefs.current[routine.id] = node;
                            }}
                            p={3.5}
                            borderWidth="1px"
                            borderColor={isDragging ? "#f97316" : hoveredRoutineOrderId === routine.id ? "#fdba74" : "gray.200"}
                            borderRadius="8px"
                            bg={isDragging ? "#fff7ed" : "gray.50"}
                            cursor={isDragging ? "grabbing" : "grab"}
                            userSelect="none"
                            position={isDragging ? "fixed" : "relative"}
                            top={isDragging && draggingRoutineOrderTop !== null ? `${draggingRoutineOrderTop}px` : undefined}
                            left={isDragging && draggingRoutineOrderLeft !== null ? `${draggingRoutineOrderLeft}px` : undefined}
                            width={isDragging && draggingRoutineOrderWidth !== null ? `${draggingRoutineOrderWidth}px` : undefined}
                            zIndex={isDragging ? 20 : 1}
                            opacity={isDragging ? 0.96 : 1}
                            boxShadow={isDragging ? "0 20px 44px rgba(15, 23, 42, 0.20)" : "none"}
                            transform={
                              isDragging
                                ? "translate3d(0, 0, 0) translateZ(0) scale(1.01)"
                                : hoverTranslateY !== 0
                                  ? `translate3d(0, ${hoverTranslateY}px, 0) translateZ(0)`
                                  : "translate3d(0, 0, 0) translateZ(0)"
                            }
                            animation={
                              !isDragging && buttonAnimation
                                ? `${buttonAnimation === "up" ? routineOrderButtonMoveUp : routineOrderButtonMoveDown} 0.28s cubic-bezier(0.22, 1, 0.36, 1)`
                                : undefined
                            }
                            sx={{ backfaceVisibility: "hidden" }}
                            willChange="transform, top, box-shadow"
                            transition={isDragging
                              ? "box-shadow 0.12s ease, border-color 0.12s ease, background-color 0.12s ease, opacity 0.12s ease"
                              : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, opacity 0.22s ease"}
                            visibility={isDragging ? "visible" : "visible"}
                            onMouseDown={(e) => handleRoutineOrderDragStart(e, routine.id)}
                          >
                            <HStack justify="space-between" align="center">
                              <Text color="gray.900" fontWeight="500">{routine.name}</Text>
                              <HStack spacing={1}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  minW="32px"
                                  h="32px"
                                  p={0}
                                  color="gray.500"
                                  _hover={{ bg: "gray.100", color: "gray.700" }}
                                  isDisabled={index === 0}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveSelectedRoutineOrder(routine.id, -1);
                                  }}
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
                                    <path d="m18 15-6-6-6 6" />
                                  </Box>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  minW="32px"
                                  h="32px"
                                  p={0}
                                  color="gray.500"
                                  _hover={{ bg: "gray.100", color: "gray.700" }}
                                  isDisabled={index === selectedRoutinesToAssign.length - 1}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveSelectedRoutineOrder(routine.id, 1);
                                  }}
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
                                    <path d="m6 9 6 6 6-6" />
                                  </Box>
                                </Button>
                              </HStack>
                            </HStack>
                          </Box>
                          </Box>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Box>
                </Flex>
              )}
              {assignRoutineStep === "existing_days" && (
                <Stack spacing={5} py={2}>
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
                          aria-label="Abrir calendario inicio"
                          onClick={() => {
                            const picker = assignmentStartDatePickerRef.current;
                            if (!picker) return;
                            if ("showPicker" in picker) {
                              (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                            } else {
                              (picker as HTMLInputElement).click();
                            }
                          }}
                        >
                          <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                          onChange={(e) => {
                            const nextStart = e.target.value || getTodayIsoLocal();
                            setAssignmentStartDate(nextStart);
                            if (!isEndAfterStart(nextStart, assignmentEndDate)) {
                              setAssignmentEndDate(addDaysIso(nextStart, 1));
                            }
                          }}
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
                      <Box position="relative" maxW="240px">
                        <Input type="text" value={formatDateEs(assignmentEndDate)} pr="44px" isReadOnly />
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
                          aria-label="Abrir calendario fin"
                          onClick={() => {
                            const picker = assignmentEndDatePickerRef.current;
                            if (!picker) return;
                            if ("showPicker" in picker) {
                              (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                            } else {
                              (picker as HTMLInputElement).click();
                            }
                          }}
                        >
                          <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <path d="M16 2v4" />
                            <path d="M8 2v4" />
                            <path d="M3 10h18" />
                          </Box>
                        </Button>
                        <Input
                          ref={assignmentEndDatePickerRef}
                          type="date"
                          value={assignmentEndDate}
                          min={addDaysIso(assignmentStartDate, 1)}
                          onChange={(e) => {
                            const nextEnd = e.target.value || addDaysIso(assignmentStartDate, 1);
                            if (!isEndAfterStart(assignmentStartDate, nextEnd)) {
                              setAssignmentEndDate(addDaysIso(assignmentStartDate, 1));
                              return;
                            }
                            setAssignmentEndDate(nextEnd);
                          }}
                          position="absolute"
                          inset={0}
                          opacity={0}
                          pointerEvents="none"
                          aria-label="Seleccionar fin de rutina"
                        />
                      </Box>
                    </FormControl>
                  </SimpleGrid>
                  <Text color="gray.700" fontWeight="600">
                    Días de rutina: {getDayCountFromRange(assignmentStartDate, assignmentEndDate)}
                  </Text>
                </Stack>
              )}
              {assignRoutineStep === "existing_preview" && selectedRoutineToAssign && (
                <Stack
                  ref={assignRoutineSummaryListRef}
                  spacing={4}
                  flex="1"
                  minH={0}
                  maxH={{ base: "36vh", md: `${routineAssignSummaryListMaxH}px` }}
                  overflowY="auto"
                  pr={1}
                  onWheel={handleAssignRoutineSummaryWheel}
                  sx={{ overscrollBehaviorY: "contain" }}
                >
                  {routineAssignBuilderDays.map((day) => (
                    <Box
                      key={`assign-summary-${day.key}`}
                      borderWidth="1px"
                      borderColor={isAssignPreviewOverDayLimit ? "red.300" : "gray.200"}
                      borderRadius="10px"
                      p={4}
                    >
                      <HStack justify="space-between" align="baseline" mb={2}>
                        <Text color="gray.800" fontWeight="semibold">
                          {day.label}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {getSummaryDayArrows(
                            routineAssignExercisesByDay[day.key] || [],
                            day.key,
                            routineAssignExerciseOverridesByDay,
                          )} flechas
                        </Text>
                      </HStack>
                      <Stack spacing={1} mt={2}>
                        {(routineAssignExercisesByDay[day.key] || []).map((exerciseId, itemIndex) => {
                          const base = exercises.find((ex) => ex.id === exerciseId);
                          const override = routineAssignExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, itemIndex)];
                          return (
                            <HStack key={`assign-summary-ex-${day.key}-${itemIndex}-${exerciseId}`} spacing={2} align="center">
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
                                  onClick={() => openEditAssignExercise(day.key, exerciseId, itemIndex)}
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
                                  onClick={() => removeAssignExerciseFromDay(day.key, itemIndex)}
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
                  {isAssignPreviewOverDayLimit && (
                    <Box
                      borderWidth="1px"
                      borderColor="red.300"
                      bg="red.50"
                      color="red.700"
                      borderRadius="10px"
                      px={4}
                      py={3}
                    >
                      <Text fontSize="sm" fontWeight="600">
                        La rutina ha excedido el máximo de días establecidos. Por favor, elimine al menos {assignPreviewExcessDays} día{assignPreviewExcessDays === 1 ? "" : "s"} para continuar.
                      </Text>
                    </Box>
                  )}
                  <HStack justify="center">
                    {routineAssignDayCount < routineAssignDayInitialLimit && (
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
                    <FormControl>
                      <FormLabel>Objetivo</FormLabel>
                      <Input
                        value={assignmentObjective}
                        onChange={(e) => setAssignmentObjective(e.target.value)}
                        placeholder="Ej: Determinante"
                        maxW="320px"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Notas del profesor (opcional)</FormLabel>
                      <Textarea
                        value={assignmentProfessorNotes}
                        onChange={(e) => setAssignmentProfessorNotes(e.target.value)}
                        placeholder="Escribe observaciones para el deportista..."
                        minH="110px"
                        resize="vertical"
                      />
                    </FormControl>
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
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_days")}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!selectedRoutinesToAssign.length}
                      onClick={handleContinueToRoutineOrder}
                    >
                      Siguiente
                    </Button>
                  </>
                )}
                {assignRoutineStep === "existing_order" && (
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_list")}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!selectedRoutinesToAssign.length}
                      onClick={handleContinueFromRoutineOrder}
                    >
                      Siguiente
                    </Button>
                  </>
                )}
                {assignRoutineStep === "existing_days" && (
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("choice")}>
                      Volver
                    </Button>
                    <Button
                      bg="#f97316"
                      color="white"
                      _hover={{ bg: "#ea580c" }}
                      _active={{ bg: "#c2410c" }}
                      isDisabled={!isEndAfterStart(assignmentStartDate, assignmentEndDate)}
                      onClick={() => setAssignRoutineStep("existing_list")}
                    >
                      Siguiente
                    </Button>
                  </>
                )}
                {assignRoutineStep === "existing_preview" && (
                  <>
                    <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_order")}>
                      Volver
                    </Button>
                    <Button
                      bg={isAssignPreviewOverDayLimit ? "gray.300" : "#f97316"}
                      color={isAssignPreviewOverDayLimit ? "gray.600" : "white"}
                      _hover={isAssignPreviewOverDayLimit ? { bg: "gray.300" } : { bg: "#ea580c" }}
                      _active={isAssignPreviewOverDayLimit ? { bg: "gray.300" } : { bg: "#c2410c" }}
                      isDisabled={isAssignPreviewOverDayLimit}
                      onClick={() => {
                        if (isAssignPreviewOverDayLimit) return;
                        setAssignRoutineStep("existing_dates");
                      }}
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
        )}
        {editAssignExerciseModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button
                    variant="ghost"
                    minW="auto"
                    px={1}
                    color="#334155"
                    _hover={{ bg: "transparent", color: "#0f172a" }}
                    _active={{ bg: "transparent", color: "#0f172a" }}
                    onClick={closeEditAssignExerciseModal}
                    aria-label="Volver"
                  >
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={editIconUrl} alt="" boxSize="16px" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Editar ejercicio temporal</Text>
                  </HStack>
                </HStack>
                <Text mt={2} fontSize="12px" color="#667085">
                  Ajusta los valores del ejercicio dentro del resumen de la asignación.
                </Text>
              </Box>

              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="112px">
                <Stack spacing={4}>
                  <Box bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="16px" p={4} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                    <Stack spacing={4}>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                        <FormControl>
                          <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={1}
                            step={1}
                            value={editAssignRounds}
                            onChange={(e) => setEditAssignRounds(normalizeInt(e.target.value))}
                            onKeyDown={(e) => blockInvalidKeys(e, false)}
                            onBeforeInput={handleBeforeInputInt}
                            onPaste={handlePasteInt}
                            borderColor="gray.300"
                            borderRadius="8px"
                            _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
                            value={editAssignDistance}
                            onChange={(e) => setEditAssignDistance(normalizeFloat(e.target.value))}
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
                          value={editAssignDescription}
                          onChange={(e) => setEditAssignDescription(e.target.value)}
                          minH="120px"
                          resize="vertical"
                          borderColor="gray.300"
                          borderRadius="8px"
                          _hover={{ borderColor: "gray.500" }}
                          _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                          fontSize="md"
                        />
                      </FormControl>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Box position="fixed" left={0} right={0} bottom={0} zIndex={1401} bg="white" borderTopWidth="1px" borderColor="gray.200" px={4} pt={3} pb="calc(0.9rem + env(safe-area-inset-bottom))" boxShadow="0 -10px 24px rgba(15, 23, 42, 0.08)">
                <HStack spacing={3}>
                  <Button flex="1" bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeEditAssignExerciseModal}>
                    Cancelar
                  </Button>
                  <Button
                    flex="1"
                    bg="#f97316"
                    color="white"
                    _hover={{ bg: "#ea580c" }}
                    _active={{ bg: "#c2410c" }}
                    isDisabled={editAssignRounds === "" || editAssignArrows === "" || editAssignDistance === ""}
                    onClick={saveEditAssignExercise}
                  >
                    Guardar
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal
          isOpen={editAssignExerciseModalOpen && isDesktopViewport}
          onClose={closeEditAssignExerciseModal}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Editar ejercicio temporal</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.400"
                  _hover={{ bg: "gray.100", color: "gray.700" }}
                  onClick={closeEditAssignExerciseModal}
                >
                  ×
                </Button>
              </HStack>
            </ModalHeader>
            <ModalBody maxH="70vh" overflowY="auto" py={5}>
              <Stack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Rondas</FormLabel>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={1}
                    step={1}
                    value={editAssignRounds}
                    onChange={(e) => setEditAssignRounds(normalizeInt(e.target.value))}
                    onKeyDown={(e) => blockInvalidKeys(e, false)}
                    onBeforeInput={handleBeforeInputInt}
                    onPaste={handlePasteInt}
                    borderColor="gray.300"
                    borderRadius="8px"
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.700" fontSize="sm">Flechas por ronda</FormLabel>
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
                    value={editAssignDistance}
                    onChange={(e) => setEditAssignDistance(normalizeFloat(e.target.value))}
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
                    value={editAssignDescription}
                    onChange={(e) => setEditAssignDescription(e.target.value)}
                    minH="120px"
                    resize="vertical"
                    borderColor="gray.300"
                    borderRadius="8px"
                    _hover={{ borderColor: "gray.500" }}
                    _focusVisible={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                    fontSize="md"
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderWidth="1px"
                  _hover={{ bg: "gray.100" }}
                  onClick={closeEditAssignExerciseModal}
                >
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  isDisabled={editAssignRounds === "" || editAssignArrows === "" || editAssignDistance === ""}
                  onClick={saveEditAssignExercise}
                >
                  Guardar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {addExerciseDayModalOpen && !isDesktopViewport && (
          <Box position="fixed" inset={0} zIndex={1400} bg="#f6f7fb">
            <Flex direction="column" h="100%">
              <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} pt="calc(0.75rem + env(safe-area-inset-top))" pb={3}>
                <HStack justify="space-between" align="center" spacing={3}>
                  <Button variant="ghost" minW="auto" px={1} color="#334155" _hover={{ bg: "transparent", color: "#0f172a" }} _active={{ bg: "transparent", color: "#0f172a" }} onClick={closeAddExerciseDayModal} aria-label="Volver">
                    <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </Box>
                  </Button>
                  <HStack spacing={2} flex="1" justify="center" mr="28px">
                    <Image src={bowIconUrl} alt="" boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                    <Text fontSize="16px" fontWeight="800" color="#1f2937">Agregar ejercicio al día</Text>
                  </HStack>
                </HStack>
              </Box>
              <Box flex="1" overflowY="auto" px={3.5} py={4} pb="calc(1.5rem + env(safe-area-inset-bottom))">
                <Stack spacing={3}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.500" />
                    </InputLeftElement>
                    <Input placeholder="Buscar ejercicio..." value={addExerciseSearch} onChange={(e) => setAddExerciseSearch(e.target.value)} bg="#eef3fb" borderColor="transparent" borderRadius="10px" h="42px" fontSize="13px" _hover={{ borderColor: "transparent" }} _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }} />
                  </InputGroup>
                  <Stack ref={addExerciseListRef} spacing={2} overflowY="auto" pr={1} onWheel={handleAddExerciseListWheel} sx={{ overscrollBehaviorY: "contain" }}>
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
                      .filter((_exercise) => Boolean(addExerciseTargetDayKey))
                      .map((exercise) => (
                        <Box key={`assign-day-add-${exercise.id}`} bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="12px" p={3.5} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)">
                          <Stack spacing={3}>
                            <Stack spacing={0.5}>
                              <Text fontSize="sm" color="gray.800" fontWeight="600">{exercise.name}</Text>
                              <Text fontSize="xs" color="gray.500">Flechas: {exercise.arrows_count} | Distancia: {Number(exercise.distance_m)} m</Text>
                            </Stack>
                            <Button size="sm" variant="outline" borderColor="gray.300" borderRadius="10px" bg="white" _hover={{ bg: "gray.50", borderColor: "gray.400" }} onClick={() => addExerciseTargetDayKey && addTemporaryExerciseToDay(addExerciseTargetDayKey, exercise.id)}>
                              Agregar
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </Stack>
              </Box>
            </Flex>
          </Box>
        )}
        <Modal isOpen={addExerciseDayModalOpen && isDesktopViewport} onClose={closeAddExerciseDayModal} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "620px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
              <HStack justify="space-between">
                <Text fontWeight="700" color="gray.900">Agregar ejercicio al día</Text>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAddExerciseDayModal}>
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
                    .filter((_exercise) => Boolean(addExerciseTargetDayKey))
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
              <Button variant="outline" borderColor="gray.300" bg="white" _hover={{ bg: "gray.50" }} onClick={closeAddExerciseDayModal}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deleteAssignDayConfirmOpen}
            title="¿Eliminar día?"
            message={
              <>
                Se eliminará{" "}
                <Box as="span" fontWeight="700" color="#334155">
                  {deleteAssignDayTargetNumber ? `Día ${deleteAssignDayTargetNumber}` : "este día"}
                </Box>{" "}
                de la asignación temporal. Esta acción no se puede deshacer.
              </>
            }
            confirmLabel="Eliminar día"
            onConfirm={confirmDeleteAssignRoutineDay}
            onClose={() => setDeleteAssignDayConfirmOpen(false)}
          />
        )}
        <Modal isOpen={deleteAssignDayConfirmOpen && isDesktopViewport} onClose={() => setDeleteAssignDayConfirmOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "420px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deleteModalOpen}
            title="¿Eliminar ejercicio?"
            message="Se eliminará este ejercicio de forma permanente. Esta acción no se puede deshacer."
            confirmLabel="Eliminar ejercicio"
            error={deleteError}
            isLoading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setDeleteModalOpen(false);
              setDeleteError(null);
            }}
          />
        )}
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deleteRoutineModalOpen}
            title="¿Eliminar rutina?"
            message="Se eliminará esta rutina de forma permanente. Esta acción no se puede deshacer."
            confirmLabel="Eliminar rutina"
            error={deleteRoutineError}
            isLoading={deleteRoutineLoading}
            onConfirm={handleDeleteRoutineConfirm}
            onClose={() => {
              setDeleteRoutineModalOpen(false);
              setDeleteRoutineError(null);
            }}
          />
        )}
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deleteAssignedRoutineModalOpen}
            title="¿Eliminar rutina asignada?"
            message="Se eliminará la rutina activa asignada a este deportista. Esta acción no se puede deshacer."
            confirmLabel="Eliminar rutina"
            error={deleteAssignedRoutineError}
            isLoading={deleteAssignedRoutineLoading}
            onConfirm={handleDeleteAssignedRoutineConfirm}
            onClose={() => {
              setDeleteAssignedRoutineModalOpen(false);
              setDeleteAssignedRoutineError(null);
            }}
          />
        )}
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={deactivateModalOpen}
            title="¿Desactivar deportista?"
            message={
              <>
                Se desactivará{" "}
                <Box as="span" fontWeight="700" color="#334155">
                  {deactivateStudent?.full_name || "este deportista"}
                </Box>
                . Esta acción no se puede deshacer.
              </>
            }
            confirmLabel="Desactivar deportista"
            error={deactivateError}
            isLoading={deactivateLoading}
            onConfirm={handleDeactivateConfirm}
            onClose={() => {
              setDeactivateModalOpen(false);
              setDeactivateError(null);
            }}
          />
        )}
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={activateModalOpen}
            title="¿Dar de alta deportista?"
            message={
              <>
                Se dará de alta a{" "}
                <Box as="span" fontWeight="700" color="#334155">
                  {activateStudent?.full_name || "este deportista"}
                </Box>
                .
              </>
            }
            confirmLabel="Dar de alta"
            error={activateError}
            tone="success"
            isLoading={activateLoading}
            onConfirm={handleActivateConfirm}
            onClose={() => {
              setActivateModalOpen(false);
              setActivateError(null);
            }}
          />
        )}
        <Modal isOpen={deleteModalOpen && isDesktopViewport} onClose={() => { setDeleteModalOpen(false); setDeleteError(null); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "420px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
                <Text fontSize="2xl" fontWeight="700" color="gray.900">¿Eliminar ejercicio?</Text>
              {deleteError && (
                <Alert status="error" borderRadius="md" mb={3}>
                  <AlertIcon />
                  {deleteError}
                </Alert>
              )}
                <Text color="gray.500">
                  Se eliminará este ejercicio de forma permanente. Esta acción no se puede deshacer.
                </Text>
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="#ef4444"
                  borderColor="#fecaca"
                  borderWidth="1px"
                  _hover={{ bg: "#fef2f2" }}
                  onClick={handleDeleteConfirm}
                  isLoading={deleteLoading}
                >
                  Eliminar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeleteError(null);
                  }}
                  isDisabled={deleteLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteRoutineModalOpen && isDesktopViewport} onClose={() => { setDeleteRoutineModalOpen(false); setDeleteRoutineError(null); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "420px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
                  Se eliminará esta rutina de forma permanente. Esta acción no se puede deshacer.
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
                    onClick={() => {
                      setDeleteRoutineModalOpen(false);
                      setDeleteRoutineError(null);
                    }}
                    isDisabled={deleteRoutineLoading}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
        <Modal
          isOpen={saveAssignmentModalOpen}
          onClose={() => {
            setSaveAssignmentModalOpen(false);
            setSaveAssignmentTargetId(null);
            setSaveAssignmentStudentObservations("");
            setSaveAssignmentError(null);
          }}
          isCentered
        >
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "560px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
            <ModalHeader borderBottomWidth="1px" borderColor="gray.100">
              Observaciones de deportista
            </ModalHeader>
            <ModalBody py={5}>
              <Stack spacing={4}>
                <Textarea
                  value={saveAssignmentStudentObservations}
                  onChange={(e) => setSaveAssignmentStudentObservations(e.target.value)}
                  placeholder="Escribe aquí las observaciones del deportista..."
                  minH="140px"
                  resize="vertical"
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  _focus={{ borderColor: "#f97316", boxShadow: "0 0 0 1px #f97316" }}
                />
                {saveAssignmentError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {saveAssignmentError}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.100">
              <HStack spacing={3}>
                <Button
                  variant="outline"
                  borderColor="gray.300"
                  bg="white"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => {
                    setSaveAssignmentModalOpen(false);
                    setSaveAssignmentTargetId(null);
                    setSaveAssignmentStudentObservations("");
                    setSaveAssignmentError(null);
                  }}
                  isDisabled={saveAssignmentLoadingId !== null}
                >
                  Cancelar
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  onClick={() => {
                    if (saveAssignmentTargetId === null) return;
                    void handleSaveAssignmentToHistory(saveAssignmentTargetId);
                  }}
                  isLoading={saveAssignmentTargetId !== null && saveAssignmentLoadingId === saveAssignmentTargetId}
                  isDisabled={saveAssignmentTargetId === null}
                >
                  Guardar en historial
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={deleteAssignedRoutineModalOpen && isDesktopViewport} onClose={() => { setDeleteAssignedRoutineModalOpen(false); setDeleteAssignedRoutineError(null); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "420px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
                  Se eliminará la rutina activa asignada a este deportista. Esta acción no se puede deshacer.
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
                    onClick={() => {
                      setDeleteAssignedRoutineModalOpen(false);
                      setDeleteAssignedRoutineError(null);
                    }}
                    isDisabled={deleteAssignedRoutineLoading}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={replaceAssignModalOpen}
            title="¿Reemplazar rutina asignada?"
            message="Este deportista ya tiene una rutina asignada. Se eliminará la actual y se asignará la nueva."
            confirmLabel="Eliminar y asignar nueva"
            error={replaceAssignError}
            isLoading={replaceAssignLoading}
            onConfirm={handleConfirmReplaceAndAssign}
            onClose={() => { void handleCancelReplaceAndAssign(); }}
          />
        )}
        <Modal isOpen={replaceAssignModalOpen && isDesktopViewport} onClose={() => { void handleCancelReplaceAndAssign(); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "460px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </Box>
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Reemplazar rutina asignada?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="320px">
                  Este deportista ya tiene una rutina asignada. Se eliminará la actual y se asignará la nueva.
                </Text>
              {replaceAssignError && (
                <Alert status="error" borderRadius="md" w="100%">
                  <AlertIcon />
                  {replaceAssignError}
                </Alert>
              )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="#ef4444"
                  borderColor="#fecaca"
                  borderWidth="1px"
                  _hover={{ bg: "#fef2f2" }}
                  onClick={handleConfirmReplaceAndAssign}
                  isLoading={replaceAssignLoading}
                >
                  Eliminar y asignar rutina nueva
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
                  onClick={() => { void handleCancelReplaceAndAssign(); }}
                  isDisabled={replaceAssignLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {!isDesktopViewport && (
          <MobileDangerConfirmSheet
            isOpen={preAssignConflictModalOpen}
            title="¿Reemplazar rutina asignada?"
            message="Este deportista ya tiene una rutina asignada. Se eliminará la actual y se asignará la nueva."
            confirmLabel="Eliminar y asignar nueva"
            error={preAssignConflictError}
            isLoading={preAssignConflictLoading}
            onConfirm={handlePreAssignDeleteAndContinue}
            onClose={() => {
              setPreAssignConflictModalOpen(false);
              setPreAssignConflictStudent(null);
              setPreAssignConflictAssignment(null);
            }}
          />
        )}
        <Modal isOpen={preAssignConflictModalOpen && isDesktopViewport} onClose={() => setPreAssignConflictModalOpen(false)} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "460px" }} maxH="90vh" borderRadius="14px" overflow="hidden">
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
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </Box>
                </Box>
                <Heading size="md" color="gray.900">
                  ¿Reemplazar rutina asignada?
                </Heading>
                <Text color="gray.500" fontSize="sm" maxW="320px">
                  Este deportista ya tiene una rutina asignada. Se eliminará la actual y se asignará la nueva.
                </Text>
              {preAssignConflictError && (
                <Alert status="error" borderRadius="md" w="100%">
                  <AlertIcon />
                  {preAssignConflictError}
                </Alert>
              )}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor="gray.100" py={4}>
              <HStack spacing={3}>
                <Button
                  bg="white"
                  color="#ef4444"
                  borderColor="#fecaca"
                  borderWidth="1px"
                  _hover={{ bg: "#fef2f2" }}
                  onClick={handlePreAssignDeleteAndContinue}
                  isLoading={preAssignConflictLoading}
                >
                  Eliminar y asignar rutina nueva
                </Button>
                <Button
                  bg="#f97316"
                  color="white"
                  _hover={{ bg: "#ea580c" }}
                  _active={{ bg: "#c2410c" }}
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
        <Modal isOpen={deactivateModalOpen && isDesktopViewport} onClose={() => { setDeactivateModalOpen(false); setDeactivateError(null); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "460px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
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
                  <Text fontWeight="700" color="gray.900">¿Dar de baja deportista?</Text>
                </HStack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => { setDeactivateModalOpen(false); setDeactivateError(null); }}>
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
                Se desactivará a{" "}
                <Box as="span" fontWeight="600" color="gray.800">
                  {deactivateStudent?.full_name || "este deportista"}
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
                  onClick={() => {
                    setDeactivateModalOpen(false);
                    setDeactivateError(null);
                  }}
                  isDisabled={deactivateLoading}
                >
                  Cancelar
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal isOpen={activateModalOpen && isDesktopViewport} onClose={() => { setActivateModalOpen(false); setActivateError(null); }} isCentered>
          <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
          <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "460px" }} maxH="90vh" borderRadius="12px" overflow="hidden">
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
                  <Text fontWeight="700" color="gray.900">¿Dar de alta deportista?</Text>
                </HStack>
                <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={() => { setActivateModalOpen(false); setActivateError(null); }}>
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
                  {activateStudent?.full_name || "este deportista"}
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
                  onClick={() => {
                    setActivateModalOpen(false);
                    setActivateError(null);
                  }}
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
      <Suspense fallback={<Spinner />}>
        <AdminDashboardSection
          token={token}
          goToProfessor={() => goToView("professor")}
          handleLogout={handleLogout}
          API_BASE={API_BASE}
          loading={loading}
          error={error}
          health={health}
          healthIcon={healthIcon}
          activeUserCount={activeUserCount}
          users={users}
          activeAssignments={activeAssignments}
          activeStudents={activeStudents}
          stats={stats}
          openAdminUserModal={openAdminUserModal}
          adminUserMutationError={adminUserMutationError}
          usersSortedByCreated={usersSortedByCreated}
          handleAdminUserUpdate={handleAdminUserUpdate}
          adminUserMutationId={adminUserMutationId}
          professorUserCount={professorUserCount}
          adminUserCount={adminUserCount}
          students={students}
          routineNameById={routineNameById}
          studentNameById={studentNameById}
          formatDateEs={formatDateEs}
          currentUsername={currentUsername}
          userRole={userRole}
          inactiveUsers={inactiveUsers}
          lastUserUpdate={lastUserUpdate}
          formatDateTimeEs={formatDateTimeEs}
          recentUserChanges={recentUserChanges}
          recentUsers={recentUsers}
          getRoleLabel={getRoleLabel}
        />
      </Suspense>
      <Modal isOpen={adminUserModalOpen} onClose={closeAdminUserModal} isCentered>
        <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
        <ModalContent maxW={{ base: "calc(100vw - 1rem)", md: "480px" }} borderRadius="12px" overflow="hidden">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.200" py={4}>
            <HStack justify="space-between">
              <Text fontWeight="700" color="gray.900">Crear usuario</Text>
              <Button variant="ghost" size="sm" color="gray.400" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={closeAdminUserModal}>
                ×
              </Button>
            </HStack>
          </ModalHeader>
          <ModalBody py={5}>
            <Stack spacing={4}>
              {adminUserCreateError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {adminUserCreateError}
                </Alert>
              )}
              <FormControl isRequired>
                <FormLabel color="gray.700">Usuario</FormLabel>
                <Input
                  value={adminUserUsername}
                  onChange={(e) => {
                    setAdminUserUsername(e.target.value);
                    if (adminUserCreateError) setAdminUserCreateError(null);
                  }}
                  placeholder="Nombre de usuario"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.700">Contraseña inicial</FormLabel>
                <PasswordInput
                  value={adminUserPassword}
                  onChange={(e) => {
                    setAdminUserPassword(e.target.value);
                    if (adminUserCreateError) setAdminUserCreateError(null);
                  }}
                  placeholder="Mínimo 8 caracteres"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel color="gray.700">Rol</FormLabel>
                <Select
                  value={adminUserRole}
                  onChange={(e) => setAdminUserRole(e.target.value as "admin" | "professor" | "student")}
                  isDisabled={!canManageUsers}
                >
                  {canManageUsers ? (
                    <>
                      <option value="professor">Profesor</option>
                      <option value="admin">Administrador</option>
                      <option value="student">Deportista</option>
                    </>
                  ) : (
                    <option value="student">Deportista</option>
                  )}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.200">
            <HStack spacing={3}>
              <Button variant="outline" borderColor="gray.300" onClick={closeAdminUserModal} isDisabled={adminUserCreateLoading}>
                Cancelar
              </Button>
              <Button
                bg="#f97316"
                color="white"
                _hover={{ bg: "#ea580c" }}
                _active={{ bg: "#c2410c" }}
                onClick={() => { void handleCreateAdminUser(); }}
                isLoading={adminUserCreateLoading}
              >
                Crear usuario
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default App;













