import { memo } from "react";
import { Badge, Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";

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
  handleExportAssignmentPdf,
  openAdminAssignModal,
  setDeleteAssignedRoutineError,
  setDeleteAssignedRoutineTarget,
  setDeleteAssignedRoutineModalOpen,
}: Props) {
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
              </Box>
              <HStack justify="flex-end" spacing={2} px={6} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
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
                  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  );
}

export default memo(AdminRoutinesSection);
