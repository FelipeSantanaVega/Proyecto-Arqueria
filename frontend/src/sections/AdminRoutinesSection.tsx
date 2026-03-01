import { memo, useState } from "react";
import { Badge, Box, Button, Collapse, Heading, HStack, Stack, Text } from "@chakra-ui/react";

type Props = any;

function AdminRoutinesSection({
  activeAssignments,
  routines,
  studentNameById,
  routineNameById,
  formatDateEs,
  formatDay,
  getRoutineDayArrows,
  exerciseNameById,
  actionIconButtonSize,
  exportAssignmentLoadingId,
  saveAssignmentLoadingId,
  openSaveAssignmentModal,
  handleExportAssignmentPdf,
  openAdminAssignModal,
  setDeleteAssignedRoutineError,
  setDeleteAssignedRoutineTarget,
  setDeleteAssignedRoutineModalOpen,
}: Props) {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const getProfessorNotes = (notes: unknown): string => {
    if (typeof notes !== "string" || !notes.trim()) return "";
    try {
      const parsed = JSON.parse(notes) as { professor_notes?: unknown };
      if (typeof parsed?.professor_notes === "string") return parsed.professor_notes.trim();
      return "";
    } catch {
      return notes.trim();
    }
  };

  return (
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
            <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        {activeAssignments.map((assignment: any) => {
          const routine = routines.find((r: any) => r.id === assignment.routine_id);
          const orderedDays = routine ? [...routine.days].sort((a: any, b: any) => a.day_number - b.day_number) : [];
          const isExpanded = expandedAssignmentId === assignment.id;
          const professorNotes = getProfessorNotes(assignment.notes);
          return (
            <Box key={assignment.id} borderWidth="1px" borderColor="gray.200" borderRadius="xl" bg="white" overflow="hidden">
              <Box
                p={6}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={() => setExpandedAssignmentId((prev) => (prev === assignment.id ? null : assignment.id))}
              >
                <HStack justify="space-between" align="start">
                  <Stack spacing={1}>
                    <Heading size="md" color="gray.900">
                      {studentNameById.get(assignment.student_id) || `Alumno #${assignment.student_id}`}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">
                      Semana: {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                    </Text>
                  </Stack>
                  <Text color="gray.400" fontSize="xl" lineHeight="1">
                    {isExpanded ? "▾" : "▸"}
                  </Text>
                </HStack>
              </Box>
              <Collapse in={isExpanded} animateOpacity>
                <Box px={6} pb={6}>
                  <HStack justify="space-between" align="start" mb={4}>
                    <Text color="gray.600" fontSize="sm" fontWeight="medium">
                      {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                    </Text>
                    <Badge bg="green.100" color="green.800" borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="700">
                      ACTIVA
                    </Badge>
                  </HStack>
                  <Stack spacing={5}>
                    {orderedDays.map((day: any) => (
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
                          {day.exercises.map((dayExercise: any) => (
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
                  {professorNotes && (
                    <Box mt={5} pt={4} borderTopWidth="1px" borderColor="gray.200">
                      <Text color="gray.700" fontSize="sm" fontWeight="semibold" mb={1}>
                        Notas del profesor
                      </Text>
                      <Text color="gray.600" fontSize="sm" whiteSpace="pre-wrap">
                        {professorNotes}
                      </Text>
                    </Box>
                  )}
                </Box>
                <HStack justify="space-between" spacing={2} px={6} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
                  <Button
                    size={actionIconButtonSize}
                    variant="ghost"
                    color="gray.400"
                    _hover={{ bg: "gray.100", color: "green.600" }}
                    w="30px"
                    minW="30px"
                    px={1}
                    justifyContent="center"
                    overflow="hidden"
                    transition="width 0.22s ease, padding 0.22s ease"
                    _groupHover={{}}
                    sx={{
                      "& .save-icon": {
                        transform: "translateX(-2px)",
                        transition: "transform 0.24s ease",
                      },
                      "& .save-label": {
                        maxWidth: "0px",
                        opacity: 0,
                        marginRight: "0px",
                        whiteSpace: "nowrap",
                        transition: "max-width 0.24s ease, opacity 0.2s ease, margin-right 0.24s ease",
                      },
                      "&:hover": {
                        width: "156px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        justifyContent: "space-between",
                      },
                      "&:hover .save-icon": {
                        transform: "translateX(0px)",
                      },
                      "&:hover .save-label": {
                        maxWidth: "108px",
                        opacity: 1,
                        marginRight: "2px",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSaveAssignmentModal(assignment.id);
                    }}
                    isLoading={saveAssignmentLoadingId === assignment.id}
                    isDisabled={saveAssignmentLoadingId !== null && saveAssignmentLoadingId !== assignment.id}
                    aria-label="Marcar rutina"
                  >
                    <HStack spacing={0} align="center" w="full" justify="space-between">
                      <Text className="save-label" fontSize="sm" fontWeight="600">
                        Finalizar rutina
                      </Text>
                      <Box className="save-icon" as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
                        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                        <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                      </Box>
                    </HStack>
                  </Button>
                  <HStack spacing={2}>
                    <Button
                      size={actionIconButtonSize}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ bg: "gray.100", color: "gray.700" }}
                      isLoading={exportAssignmentLoadingId === assignment.id}
                      isDisabled={exportAssignmentLoadingId !== null && exportAssignmentLoadingId !== assignment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleExportAssignmentPdf(assignment.id);
                      }}
                      aria-label="Exportar rutina"
                    >
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 17V3" />
                        <path d="m6 11 6 6 6-6" />
                        <path d="M19 21H5" />
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
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </Box>
                    </Button>
                  </HStack>
                </HStack>
              </Collapse>
            </Box>
          );
        })}
        {!activeAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
      </Stack>
    </Stack>
  );
}

export default memo(AdminRoutinesSection);
