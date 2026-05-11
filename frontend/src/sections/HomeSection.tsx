import { Badge, Box, Button, Grid, Heading, HStack, Image, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { memo, useMemo } from "react";
import bowIconUrl from "../assets/bow.svg";
import notebookTabsIconUrl from "../assets/notebook-tabs.svg";
import userPlusIconUrl from "../assets/user-plus.svg";
import type { Assignment, Exercise, Routine, Student } from "../context/useAppDataController";

type ProfessorSection = "inicio" | "administrar_rutinas" | "perfil" | "rutina" | "ejercicio" | "alumno";

type Props = {
  activeAssignments: Assignment[];
  activeStudents: Student[];
  assignments: Assignment[];
  exercises: Exercise[];
  routines: Routine[];
  students: Student[];
  studentNameById: Map<number, string>;
  routineNameById: Map<number, string>;
  formatDateEs: (date?: string | null) => string;
  goToSection: (section: ProfessorSection) => void;
  openAdminAssignModal: () => void;
  openCreateRoutineModal: () => void;
  openCreateStudentModal: () => void;
  openCreateExerciseModal: () => void;
};

function HomeSection({
  activeAssignments,
  activeStudents,
  assignments,
  exercises,
  routines,
  students,
  studentNameById,
  routineNameById,
  formatDateEs,
  goToSection,
  openAdminAssignModal,
  openCreateRoutineModal,
  openCreateStudentModal,
  openCreateExerciseModal,
}: Props) {
  const templateRoutines = useMemo(() => routines.filter((routine) => routine.is_template !== false), [routines]);
  const activeAssignmentStudentIds = useMemo(
    () => new Set(activeAssignments.map((assignment) => assignment.student_id)),
    [activeAssignments],
  );
  const studentsWithoutRoutine = useMemo(
    () => activeStudents.filter((student) => !activeAssignmentStudentIds.has(student.id)),
    [activeAssignmentStudentIds, activeStudents],
  );
  const finishedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "finished"),
    [assignments],
  );
  const nextAssignments = useMemo(
    () =>
      [...activeAssignments]
        .sort((a, b) => (a.end_date || "").localeCompare(b.end_date || ""))
        .slice(0, 4),
    [activeAssignments],
  );

  return (
    <>
    <Stack spacing={4} display={{ base: "flex", md: "none" }} w="full" minH="calc(100vh - 118px)" bg="#f6f7fb" px={3.5} py={4}>
      <SimpleGrid columns={2} spacing={3}>
        <MobileSummaryCard title="DEPORTISTAS ACTIVOS" value={activeStudents.length.toString()} tone="orange" />
        <MobileSummaryCard title="RUTINAS ACTIVAS" value={activeAssignments.length.toString()} />
        <MobileSummaryCard title="SIN RUTINA" value={studentsWithoutRoutine.length.toString()} tone="warning" />
        <MobileSummaryCard title="PLANTILLAS" value={templateRoutines.length.toString()} />
      </SimpleGrid>

      <Stack spacing={3}>
        <Heading size="sm" color="#1f2937">Acciones rápidas</Heading>
        <SimpleGrid columns={2} spacing={2.5}>
          <MobileQuickPill icon="student" label="Deportista" onClick={() => openAfterSectionChange("alumno", goToSection, openCreateStudentModal)} />
          <MobileQuickPill icon="clipboard" label="Asignar" onClick={() => openAfterSectionChange("administrar_rutinas", goToSection, openAdminAssignModal)} />
          <MobileQuickPill icon="list" label="Rutina" onClick={() => openAfterSectionChange("rutina", goToSection, openCreateRoutineModal)} />
          <MobileQuickPill icon="bow" label="Ejercicio" onClick={() => openAfterSectionChange("ejercicio", goToSection, openCreateExerciseModal)} />
        </SimpleGrid>
      </Stack>

      <Stack spacing={3}>
        <HStack justify="space-between" align="center">
          <Heading size="sm" color="#1f2937">Rutinas en curso</Heading>
          <Button variant="ghost" size="xs" color="#fb5a13" fontSize="10px" fontWeight="700" _hover={{ bg: "#fff1e8" }} onClick={() => goToSection("administrar_rutinas")}>
            Ver todo
          </Button>
        </HStack>
        <Stack spacing={3}>
          {nextAssignments.map((assignment) => (
            <MobileAssignmentCard
              key={assignment.id}
              assignment={assignment}
              studentName={studentNameById.get(assignment.student_id) || `Deportista #${assignment.student_id}`}
              routineName={formatDisplayRoutineName(routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`)}
              formatDateEs={formatDateEs}
            />
          ))}
          {!nextAssignments.length && (
            <Box bg="white" borderRadius="10px" borderWidth="1px" borderColor="#e5e7eb" p={4}>
              <Text color="#667085" fontSize="sm">No hay rutinas activas asignadas.</Text>
            </Box>
          )}
        </Stack>
      </Stack>
    </Stack>

    <Stack spacing={{ base: 5, xl: 7 }} display={{ base: "none", md: "flex" }} w="full" maxW={{ md: "100%", xl: "1180px" }}>
      <HStack justify="space-between" align={{ base: "start", md: "center" }} gap={4} flexWrap="wrap">
        <Heading size="lg" color="#0f1f38" letterSpacing="-0.03em">
          Inicio
        </Heading>
        <Button
          bg="#ff7900"
          color="white"
          borderRadius="8px"
          px={5}
          h="40px"
          fontSize="sm"
          fontWeight="700"
          _hover={{ bg: "#ea580c" }}
          _active={{ bg: "#c2410c" }}
          onClick={() => openAfterSectionChange("alumno", goToSection, openCreateStudentModal)}
        >
          <HStack justify="center" spacing={2}>
            <Image src={userPlusIconUrl} alt="Crear nuevo deportista" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Crear nuevo deportista</Text>
          </HStack>
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={{ base: 3, md: 4, xl: 5 }}>
        <SummaryCard title="Deportistas activos" value={activeStudents.length.toString()} helper={`${students.length} registrados`} />
        <SummaryCard title="Rutinas activas" value={activeAssignments.length.toString()} helper={`${finishedAssignments.length} finalizadas`} />
        <SummaryCard title="Sin rutina asignada" value={studentsWithoutRoutine.length.toString()} helper="disponibles" tone={studentsWithoutRoutine.length ? "warning" : "neutral"} />
        <SummaryCard title="Plantillas" value={templateRoutines.length.toString()} helper={`${exercises.length} ejercicios`} />
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", md: "minmax(0, 1.45fr) minmax(250px, 0.95fr)", xl: "minmax(0, 2fr) minmax(280px, 0.95fr)" }} gap={{ base: 5, md: 4, xl: 7 }} alignItems="start">
        <Box p={{ base: 4, xl: 6 }} borderRadius="10px" bg="white" boxShadow="0 18px 45px rgba(15, 23, 42, 0.05)">
          <HStack justify="space-between" align="start" mb={4}>
            <Stack spacing={1}>
              <Heading size="md" color="#0f1f38" letterSpacing="-0.03em">
                Rutinas en curso
              </Heading>
              <Text fontSize="xs" color="#536179">
                Próximas asignaciones según fecha de término.
              </Text>
            </Stack>
            <Button size="sm" variant="ghost" color="#b45309" fontSize="xs" fontWeight="700" _hover={{ bg: "orange.50" }} onClick={() => goToSection("administrar_rutinas")}>
              Ver todas
            </Button>
          </HStack>
          <Stack spacing={3.5}>
            {nextAssignments.map((assignment) => (
              <Box key={assignment.id} p={{ base: 3.5, xl: 4 }} borderWidth="1px" borderColor="#e5e7eb" borderRadius="7px" bg="#f7f8fb">
                <HStack justify="space-between" align="start" gap={4}>
                  <Stack spacing={1}>
                    <Text fontWeight="800" color="#12213a" fontSize="sm">
                      {studentNameById.get(assignment.student_id) || `Deportista #${assignment.student_id}`}
                    </Text>
                    <Text fontSize="xs" color="#536179">
                      {formatDisplayRoutineName(routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`)}
                    </Text>
                    <Text fontSize="xs" color="#334155">
                      {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                    </Text>
                  </Stack>
                  <Badge bg="#dcfce7" color="#15803d" borderRadius="4px" px={2} py={0.5} fontSize="10px">
                    EN CURSO
                  </Badge>
                </HStack>
              </Box>
            ))}
            {!nextAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
          </Stack>
        </Box>

        <Box p={{ base: 4, xl: 6 }} borderRadius="10px" bg="white" boxShadow="0 18px 45px rgba(15, 23, 42, 0.05)">
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Heading size="md" color="#0f1f38" letterSpacing="-0.03em">
                Acciones rápidas
              </Heading>
              <Text fontSize="xs" color="#536179">
                Atajos para las tareas más frecuentes del panel.
              </Text>
            </Stack>

            <Stack spacing={3}>
              <QuickAction
                icon="student"
                label="Crear deportista"
                helper="Agregar cuenta y ficha"
                onClick={() => openAfterSectionChange("alumno", goToSection, openCreateStudentModal)}
              />
              <QuickAction
                icon="clipboard"
                label="Asignar rutina"
                helper="Gestionar rutinas activas"
                onClick={() => openAfterSectionChange("administrar_rutinas", goToSection, openAdminAssignModal)}
              />
              <QuickAction
                icon="list"
                label="Crear rutina"
                helper="Plantillas reutilizables"
                onClick={() => openAfterSectionChange("rutina", goToSection, openCreateRoutineModal)}
              />
              <QuickAction
                icon="bow"
                label="Crear ejercicio"
                helper="Catálogo de ejercicios"
                onClick={() => openAfterSectionChange("ejercicio", goToSection, openCreateExerciseModal)}
              />
            </Stack>
          </Stack>
        </Box>
      </Grid>
    </Stack>
    </>
  );
}

function MobileSummaryCard({ title, value, tone = "neutral" }: { title: string; value: string; tone?: "neutral" | "orange" | "warning" }) {
  return (
    <Box bg="white" minH="92px" borderRadius="8px" p={3.5} borderLeftWidth={tone === "orange" || tone === "warning" ? "3px" : "0"} borderLeftColor={tone === "warning" ? "#fb5a13" : "#fb5a13"} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)" transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease" _active={{ transform: "scale(0.985)", bg: "#f8fafc" }}>
      <Text fontSize="10px" color="#334155" letterSpacing="0.06em" lineHeight="1.2">{title}</Text>
      <Heading size="md" mt={2.5} color="#fb5a13" fontWeight="500">
        {value}
      </Heading>
    </Box>
  );
}

function MobileQuickPill({ icon, label, onClick }: { icon: "student" | "clipboard" | "list" | "bow"; label: string; onClick: () => void }) {
  return (
    <Button w="full" h="42px" px={3.5} borderRadius="999px" bg="#e8eef8" color="#475569" _hover={{ bg: "#dde7f5" }} onClick={onClick}>
      <HStack spacing={2} align="center" justify="center" w="full">
        <Box boxSize="16px" color={icon === "clipboard" ? "#fb5a13" : "#64748b"} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
          <ActionIcon icon={icon} />
        </Box>
        <Text fontSize="12px" fontWeight="700">{label}</Text>
      </HStack>
    </Button>
  );
}

function MobileAssignmentCard({ assignment, studentName, routineName, formatDateEs }: { assignment: Assignment; studentName: string; routineName: string; formatDateEs: (date?: string | null) => string }) {
  const initials = studentName
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Box bg="white" borderRadius="10px" borderWidth="1px" borderColor="#e5e7eb" borderLeftWidth="3px" borderLeftColor="#fb5a13" p={3} boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)" transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease" _hover={{ borderColor: "#fdba74" }} _active={{ transform: "scale(0.985)", bg: "#f8fafc" }}>
      <HStack align="center" spacing={3}>
        <Box boxSize="34px" borderRadius="full" bg="#e8eefc" color="#475569" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="800" flexShrink={0}>
          {initials || "AA"}
        </Box>
        <Stack spacing={0.5} flex="1" minW={0}>
          <HStack justify="space-between" align="start" gap={2}>
            <Text fontSize="12px" fontWeight="800" color="#1f2937" noOfLines={1}>{studentName}</Text>
            <Badge bg="#dcfce7" color="#15803d" borderRadius="3px" px={1.5} py={0.5} fontSize="9px" flexShrink={0}>
              EN CURSO
            </Badge>
          </HStack>
          <Text fontSize="10px" color="#334155" noOfLines={1}>{routineName}</Text>
          <Text fontSize="9px" color="#667085">Iniciado: {formatDateEs(assignment.start_date)}</Text>
        </Stack>
      </HStack>
    </Box>
  );
}

function SummaryCard({ title, value, helper, tone = "neutral" }: { title: string; value: string; helper: string; tone?: "neutral" | "warning" }) {
  return (
    <Box
      p={{ base: 4, xl: 5 }}
      minH="86px"
      borderWidth="1px"
      borderColor={tone === "warning" ? "#fed7aa" : "transparent"}
      borderLeftWidth="4px"
      borderLeftColor={tone === "warning" ? "#f97316" : "transparent"}
      borderRadius="7px"
      bg="white"
      boxShadow="0 16px 38px rgba(15, 23, 42, 0.04)"
    >
      <Text fontSize="xs" color="#334155" mb={2}>
        {title}
      </Text>
      <HStack align="baseline" spacing={2}>
        <Heading size="lg" color={tone === "warning" ? "#b45309" : "#0f1f38"} letterSpacing="-0.05em">
          {value}
        </Heading>
        <Text fontSize="xs" color="#536179">
          {helper}
        </Text>
      </HStack>
    </Box>
  );
}

function QuickAction({ icon, label, helper, onClick }: { icon: "student" | "clipboard" | "list" | "bow"; label: string; helper: string; onClick: () => void }) {
  return (
    <Button h="56px" justifyContent="flex-start" whiteSpace="normal" variant="ghost" borderRadius="8px" bg="#edf2fb" _hover={{ bg: "orange.50" }} onClick={onClick}>
      <HStack spacing={3} w="full">
        <Box flex="0 0 auto" boxSize="30px" borderRadius="full" bg="white" color="#ff7900" display="flex" alignItems="center" justifyContent="center">
          <ActionIcon icon={icon} />
        </Box>
        <Stack spacing={0} align="start">
          <Text fontWeight="800" color="#12213a" fontSize="sm">
            {label}
          </Text>
          <Text fontSize="10px" color="#536179">
            {helper}
          </Text>
        </Stack>
      </HStack>
    </Button>
  );
}

function openAfterSectionChange(section: ProfessorSection, goToSection: (section: ProfessorSection) => void, openModal: () => void) {
  goToSection(section);
  window.setTimeout(openModal, 120);
}

function formatDisplayRoutineName(name: string) {
  return name.replace(/\s*(?:[-·•|]\s*)?tmp\b.*$/i, "").trim();
}

function ActionIcon({ icon }: { icon: "student" | "clipboard" | "list" | "bow" }) {
  if (icon === "student") {
    return <AssetIcon src={userPlusIconUrl} label="Crear deportista" />;
  }
  if (icon === "clipboard") {
    return (
      <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 14h6" />
        <path d="M12 17v-6" />
      </Box>
    );
  }
  if (icon === "list") {
    return <AssetIcon src={notebookTabsIconUrl} label="Crear rutina" />;
  }
  return <AssetIcon src={bowIconUrl} label="Crear ejercicio" />;
}

function AssetIcon({ src, label }: { src: string; label: string }) {
  return <Image src={src} alt={label} boxSize="16px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />;
}

export default memo(HomeSection);
