import { memo, useMemo } from "react";
import { Box, Button, Collapse, Heading, HStack, Image, Stack, Text } from "@chakra-ui/react";

type Props = any;

function RoutinesSection({
  sortedRoutines,
  expandedRoutine,
  setExpandedRoutine,
  getRoutineWeekArrows,
  getRoutineDayArrows,
  exerciseNameById,
  formatDay,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  notebookTabsIconUrl,
  openCreateRoutineModal,
  openEditRoutineModal,
  setDeleteRoutineError,
  setDeleteRoutineTarget,
  setDeleteRoutineModalOpen,
}: Props) {
  const routineCards = useMemo(
    () =>
      sortedRoutines.map((routine: any) => {
        const orderedDays = [...routine.days].sort((a: any, b: any) => a.day_number - b.day_number);
        return {
          routine,
          daysPreview: `${orderedDays.length} Días`,
          weekArrowsTotal: getRoutineWeekArrows(routine),
          orderedDays: orderedDays.map((day: any) => ({
            ...day,
            label: day.name || formatDay(day),
            arrowsTotal: getRoutineDayArrows(day),
            items: day.exercises.length
              ? day.exercises.map((dayExercise: any) => ({
                  id: dayExercise.id,
                  name: exerciseNameById.get(dayExercise.exercise_id) || `Ejercicio #${dayExercise.exercise_id}`,
                }))
              : [],
          })),
        };
      }),
    [sortedRoutines, getRoutineWeekArrows, formatDay, getRoutineDayArrows, exerciseNameById],
  );

  return (
    <Stack spacing={6}>
      <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
        <Stack spacing={1}>
          <Heading size="lg">Rutinas</Heading>
          <Text color="gray.500" fontSize="sm">Gestiona tus rutinas predefinidas.</Text>
        </Stack>
        <Button bg="#f97316" color="white" borderRadius="10px" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openCreateRoutineModal}>
          <HStack justify="center" spacing={2}>
            <Image src={notebookTabsIconUrl} alt="Agregar rutina" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Agregar rutina</Text>
          </HStack>
        </Button>
      </HStack>
      <Stack spacing={4} w="full" maxW="980px">
        {routineCards.map(({ routine, orderedDays, daysPreview, weekArrowsTotal }: any) => {
          const isExpanded = expandedRoutine === routine.id;
          return (
            <Box key={routine.id} borderWidth="1px" borderRadius="12px" borderColor="gray.200" bg="white" overflow="hidden" _hover={{ borderColor: "gray.300", cursor: "pointer" }} onClick={() => setExpandedRoutine((prev: any) => (prev === routine.id ? null : routine.id))}>
              <Box p={{ base: 4, xl: 5 }}>
                <Stack spacing={1.5}>
                  <HStack justify="space-between" align="flex-start" w="full" spacing={4}>
                    <Heading size="md" color="gray.900">{routine.name}</Heading>
                    <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">Flechas totales: {weekArrowsTotal}</Text>
                  </HStack>
                  <Text color="gray.500">{daysPreview}</Text>
                  <Collapse in={isExpanded} animateOpacity>
                    <Stack spacing={4} pt={2}>
                      {orderedDays.map((day: any) => (
                        <Box key={day.id} pl={3} borderLeft="2px solid" borderColor="gray.200">
                          <HStack spacing={2} align="baseline" w="full">
                            <Text color="gray.700" fontWeight="medium">{day.label}</Text>
                            <Text color="gray.400" fontSize="sm">•</Text>
                            <Text color="gray.500" fontSize="sm">Flechas totales: {day.arrowsTotal}</Text>
                          </HStack>
                          <Stack as="ul" spacing={0.75} mt={1}>
                            {day.items.map((item: any) => (
                              <HStack as="li" key={item.id} align="flex-start" spacing={2}>
                                <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="orange.400" flexShrink={0} />
                                <Text fontSize="sm" color="gray.500">{item.name}</Text>
                              </HStack>
                            ))}
                            {!day.items.length && (
                              <HStack as="li" align="flex-start" spacing={2}>
                                <Box w="5px" h="5px" mt="7px" borderRadius="full" bg="gray.300" flexShrink={0} />
                                <Text fontSize="sm" color="gray.500">Sin ejercicios</Text>
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
                  <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "gray.100", color: "blue.600" }} onClick={(e) => { e.stopPropagation(); openEditRoutineModal(routine); }}>
                    <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                  </Button>
                  <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "red.50", color: "red.600" }} onClick={(e) => { e.stopPropagation(); setDeleteRoutineError(null); setDeleteRoutineTarget(routine); setDeleteRoutineModalOpen(true); }}>
                    <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
  );
}

export default memo(RoutinesSection);
