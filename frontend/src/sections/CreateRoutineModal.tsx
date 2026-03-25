import { memo } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";

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

type Props = any;

function CreateRoutineModal({
  createRoutineModalOpen,
  closeCreateRoutineModal,
  routineModalMaxW,
  routineModalStep,
  routineModalBodyHeight,
  routineModalMinHeight,
  routineStepRef,
  editingRoutineId,
  routineName,
  setRoutineName,
  routineAssignStudentId,
  handleBackToAssignOptionsFromCreate,
  setRoutineDayCount,
  setRoutineDayCursor,
  setRoutineExerciseSearch,
  setCreateRoutineError,
  setRoutineModalStep,
  assignmentStartDate,
  assignmentEndDate,
  setAssignmentStartDate,
  setAssignmentEndDate,
  assignmentStartDatePickerRef,
  assignmentEndDatePickerRef,
  formatDateEs,
  getTodayIsoLocal,
  isEndAfterStart,
  addDaysIso,
  getDayCountFromRange,
  VerticalDayWheelPicker,
  routineDayCount,
  routineDayInitialLimit,
  setRoutineDayInitialLimit,
  currentRoutineDayKey,
  currentRoutineDayLabel,
  routineDayCursor,
  routineExerciseSearch,
  filteredRoutineExercises,
  routineExercisesByDay,
  toggleRoutineExerciseForDay,
  setCreateModalOpen,
  bowIconUrl,
  createRoutineError,
  createRoutineLoading,
  handleRoutineExerciseContinue,
  routineBuilderDays,
  routineSummaryListRef,
  routineSummaryListMaxH,
  handleRoutineSummaryWheel,
  getSummaryDayArrows,
  routineCreateExerciseOverridesByDay,
  exercises,
  getRoutineEntryKey,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  openRoutineCreateEditExercise,
  removeExerciseFromRoutineSummaryDay,
  openRoutineCreateAddExercise,
  requestDeleteRoutineDay,
  handleAddRoutineDay,
  handleCreateOrUpdateRoutineFromSummary,
  assignmentObjective,
  setAssignmentObjective,
  assignmentProfessorNotes,
  setAssignmentProfessorNotes,
}: Props) {
  return (
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
                    <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      setRoutineDayCount((prev: number) => Math.max(1, Math.min(7, prev)));
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
                      setRoutineDayCount((prev: number) => Math.max(1, Math.min(7, prev)));
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
                              <Button size="sm" variant="ghost" position="absolute" right="6px" top="50%" transform="translateY(-50%)" minW="30px" h="30px" p={0} aria-label="Abrir calendario inicio" onClick={() => {
                                const picker = assignmentStartDatePickerRef.current;
                                if (!picker) return;
                                if ("showPicker" in picker) {
                                  (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                } else {
                                  (picker as HTMLInputElement).click();
                                }
                              }}>
                                <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></Box>
                              </Button>
                              <Input ref={assignmentStartDatePickerRef} type="date" value={assignmentStartDate} onChange={(e) => {
                                const nextStart = e.target.value || getTodayIsoLocal();
                                setAssignmentStartDate(nextStart);
                                if (!isEndAfterStart(nextStart, assignmentEndDate)) {
                                  setAssignmentEndDate(addDaysIso(nextStart, 1));
                                }
                              }} position="absolute" inset={0} opacity={0} pointerEvents="none" aria-label="Seleccionar inicio de rutina" />
                            </Box>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Fin de rutina</FormLabel>
                            <Box position="relative" maxW="240px">
                              <Input type="text" value={formatDateEs(assignmentEndDate)} pr="44px" isReadOnly />
                              <Button size="sm" variant="ghost" position="absolute" right="6px" top="50%" transform="translateY(-50%)" minW="30px" h="30px" p={0} aria-label="Abrir calendario fin" onClick={() => {
                                const picker = assignmentEndDatePickerRef.current;
                                if (!picker) return;
                                if ("showPicker" in picker) {
                                  (picker as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                                } else {
                                  (picker as HTMLInputElement).click();
                                }
                              }}>
                                <Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></Box>
                              </Button>
                              <Input ref={assignmentEndDatePickerRef} type="date" value={assignmentEndDate} min={addDaysIso(assignmentStartDate, 1)} onChange={(e) => {
                                const nextEnd = e.target.value || addDaysIso(assignmentStartDate, 1);
                                if (!isEndAfterStart(assignmentStartDate, nextEnd)) {
                                  setAssignmentEndDate(addDaysIso(assignmentStartDate, 1));
                                  return;
                                }
                                setAssignmentEndDate(nextEnd);
                              }} position="absolute" inset={0} opacity={0} pointerEvents="none" aria-label="Seleccionar fin de rutina" />
                            </Box>
                          </FormControl>
                        </SimpleGrid>
                        <Text textAlign="center" color="gray.700" fontWeight="600">Días de rutina: {getDayCountFromRange(assignmentStartDate, assignmentEndDate)}</Text>
                      </Stack>
                    </Box>
                  </>
                ) : (
                  <Stack spacing={5} align="center" textAlign="center" py={2}>
                    <Heading size="md">Elige cuántos días tendrá la rutina</Heading>
                    <VerticalDayWheelPicker value={routineDayCount} min={1} max={7} onChange={setRoutineDayCount} />
                  </Stack>
                )}
                <HStack spacing={3} justify="flex-end" wrap="wrap">
                  <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(0)}>Volver</Button>
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
                  <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>Cancelar</Button>
                </HStack>
              </Stack>
            )}
            {routineModalStep === 2 && (
              <Stack ref={routineStepRef} key={`${currentRoutineDayKey || "dia"}-${routineDayCursor}`} spacing={6} animation={`${routineDaySlide} 0.3s ease`}>
                <Box p={4}>
                  <Heading size="md" mb={4}>{currentRoutineDayLabel || "Día"}</Heading>
                  <InputGroup maxW={{ base: "360px", xl: "480px", "2xl": "560px" }}>
                    <InputLeftElement pointerEvents="none" color="gray.500"><SearchIcon boxSize={3.5} /></InputLeftElement>
                    <Input value={routineExerciseSearch} onChange={(e) => setRoutineExerciseSearch(e.target.value)} placeholder="Buscar ejercicios" bg="white" borderColor="gray.300" borderRadius="8px" _hover={{ borderColor: "gray.400" }} _focus={{ borderColor: "#f97316", bg: "white" }} />
                  </InputGroup>
                  <Stack spacing={2} maxH="300px" overflowY="auto" pr={1} mt={4}>
                    {filteredRoutineExercises.map((ex: any) => {
                      const selectedForCurrentDay = !!currentRoutineDayKey && (routineExercisesByDay[currentRoutineDayKey] || []).includes(ex.id);
                      return (
                        <Box key={ex.id} p={3} borderWidth="1px" borderColor={selectedForCurrentDay ? "#f97316" : "gray.200"} borderRadius="md" bg={selectedForCurrentDay ? "#fff7ed" : "white"} cursor="pointer" _hover={{ borderColor: selectedForCurrentDay ? "#f97316" : "gray.400" }} onClick={() => currentRoutineDayKey && toggleRoutineExerciseForDay(currentRoutineDayKey, ex.id)}>
                          <HStack justify="space-between" align="center" spacing={3}>
                            <Stack spacing={0.5} minW={0}>
                              <Text fontSize="sm" noOfLines={1}>{ex.name}</Text>
                              <Text fontSize="xs" color="gray.500">{ex.arrows_count} flechas</Text>
                            </Stack>
                            <Checkbox isChecked={selectedForCurrentDay} onClick={(e) => e.stopPropagation()} onChange={() => currentRoutineDayKey && toggleRoutineExerciseForDay(currentRoutineDayKey, ex.id)} colorScheme="orange" sx={{ transform: "scale(1.25)", transformOrigin: "center" }} />
                          </HStack>
                        </Box>
                      );
                    })}
                    {!filteredRoutineExercises.length && <Text fontSize="sm" color="gray.600">No hay ejercicios para mostrar.</Text>}
                  </Stack>
                  <Button variant="outline" borderColor="gray.300" borderRadius="lg" color="gray.800" _hover={{ borderColor: "gray.500" }} onClick={() => setCreateModalOpen(true)} w="fit-content">
                    <HStack justify="center" spacing={2}>
                      <Image src={bowIconUrl} alt="Bow icon" boxSize="18px" />
                      <Text>Crear ejercicio</Text>
                    </HStack>
                  </Button>
                </Box>
                {createRoutineError && <Alert status="error" borderRadius="md"><AlertIcon />{createRoutineError}</Alert>}
                <HStack spacing={3} justify="flex-end" p={4}>
                  <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(1)}>Volver</Button>
                  <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isDisabled={!currentRoutineDayKey || (routineExercisesByDay[currentRoutineDayKey] || []).length === 0} isLoading={createRoutineLoading} onClick={handleRoutineExerciseContinue}>Siguiente</Button>
                  <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>Cancelar</Button>
                </HStack>
              </Stack>
            )}
            {routineModalStep === 3 && (
              <Stack ref={routineStepRef} spacing={4} animation={`${routineStepSlide} 0.3s ease`}>
                <HStack justify="space-between" px={6} py={4} borderBottomWidth="1px" borderColor="gray.200">
                  <Heading size="md">Resumen de la rutina</Heading>
                  <Button variant="ghost" size="sm" color="gray.500" onClick={closeCreateRoutineModal}>×</Button>
                </HStack>
                <Stack ref={routineSummaryListRef} spacing={3} maxH={{ base: "36vh", md: `${routineSummaryListMaxH}px` }} overflowY="auto" pr={1} px={4} py={3} onWheel={handleRoutineSummaryWheel} sx={{ overscrollBehaviorY: "contain" }}>
                  {routineBuilderDays.map((day: any) => (
                    <Box key={`summary-${day.key}`} borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                      <HStack justify="space-between" align="baseline">
                        <Text color="gray.800" fontWeight="medium">{day.label}</Text>
                        <Text fontSize="sm" color="gray.500">{getSummaryDayArrows(routineExercisesByDay[day.key] || [], day.key, routineCreateExerciseOverridesByDay)} flechas</Text>
                      </HStack>
                      <Stack spacing={1} mt={2}>
                        {(routineExercisesByDay[day.key] || []).map((exerciseId: number, itemIndex: number) => {
                          const base = exercises.find((ex: any) => ex.id === exerciseId);
                          const override = routineCreateExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, itemIndex)];
                          return (
                            <HStack key={`summary-ex-${day.key}-${itemIndex}-${exerciseId}`} spacing={2} align="center">
                              <Stack spacing={0} flex="1">
                                <Text fontSize="sm" color="gray.700">{base?.name || `Ejercicio #${exerciseId}`}</Text>
                                <Text fontSize="xs" color="gray.500">Flechas: {override?.arrows_override ?? base?.arrows_count ?? "-"} | Distancia: {override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "-"} m</Text>
                              </Stack>
                              <HStack spacing={1}>
                                <Button size={actionIconButtonSize} variant="ghost" minW="auto" px={2} onClick={() => openRoutineCreateEditExercise(day.key, exerciseId, itemIndex)}>
                                  <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                                </Button>
                                <Button size={actionIconButtonSize} variant="outline" borderRadius="xl" borderColor="gray.300" color="black" _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }} onClick={() => removeExerciseFromRoutineSummaryDay(day.key, itemIndex)}>
                                  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Box>
                                </Button>
                              </HStack>
                            </HStack>
                          );
                        })}
                        {(routineExercisesByDay[day.key] || []).length === 0 && <Text fontSize="sm" color="gray.500">Sin ejercicios</Text>}
                      </Stack>
                      <HStack mt={3} justify="space-between" align="center">
                        <Button size="sm" variant="outline" borderColor="gray.300" borderRadius="lg" onClick={() => openRoutineCreateAddExercise(day.key)} leftIcon={<Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></Box>}>Agregar ejercicio</Button>
                        {routineDayCount > 1 && <Button size="sm" variant="outline" borderColor="gray.300" borderRadius="lg" color="black" _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }} onClick={() => requestDeleteRoutineDay(day.dayNumber)} leftIcon={<Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></Box>}>Eliminar día</Button>}
                      </HStack>
                    </Box>
                  ))}
                  {routineDayCount < routineDayInitialLimit && <HStack justify="center"><Button variant="ghost" color="gray.600" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={handleAddRoutineDay}>Agregar día</Button></HStack>}
                </Stack>
                {createRoutineError && <Alert status="error" borderRadius="md" mx={4}><AlertIcon />{createRoutineError}</Alert>}
                <HStack spacing={3} justify="flex-end" p={4}>
                  <Button variant="outline" borderColor="gray.300" onClick={() => { setRoutineDayCursor(Math.max(routineBuilderDays.length - 1, 0)); setRoutineModalStep(2); }}>Volver</Button>
                  {routineAssignStudentId && !editingRoutineId ? (
                    <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isDisabled={routineBuilderDays.some((day: any) => (routineExercisesByDay[day.key] || []).length === 0)} onClick={() => setRoutineModalStep(4)}>Siguiente</Button>
                  ) : (
                    <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isLoading={createRoutineLoading} isDisabled={routineBuilderDays.some((day: any) => (routineExercisesByDay[day.key] || []).length === 0)} onClick={handleCreateOrUpdateRoutineFromSummary}>{editingRoutineId ? "Guardar cambios" : "Crear rutina"}</Button>
                  )}
                  <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>Cancelar</Button>
                </HStack>
              </Stack>
            )}
            {routineModalStep === 4 && routineAssignStudentId && !editingRoutineId && (
              <Stack ref={routineStepRef} spacing={4} animation={`${routineStepSlide} 0.3s ease`} px={4} py={4}>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="10px" p={4}>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel>Objetivo</FormLabel>
                      <Input value={assignmentObjective} onChange={(e) => setAssignmentObjective(e.target.value)} placeholder="Ej: Determinante" maxW="320px" />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Notas del profesor (opcional)</FormLabel>
                      <Textarea value={assignmentProfessorNotes} onChange={(e) => setAssignmentProfessorNotes(e.target.value)} placeholder="Escribe observaciones para el deportista..." minH="110px" resize="vertical" />
                    </FormControl>
                  </Stack>
                </Box>
                {createRoutineError && <Alert status="error" borderRadius="md"><AlertIcon />{createRoutineError}</Alert>}
                <HStack spacing={3} justify="flex-end" pt={1}>
                  <Button variant="outline" borderColor="gray.300" onClick={() => setRoutineModalStep(3)}>Volver</Button>
                  <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isLoading={createRoutineLoading} isDisabled={routineBuilderDays.some((day: any) => (routineExercisesByDay[day.key] || []).length === 0)} onClick={handleCreateOrUpdateRoutineFromSummary}>Confirmar asignación</Button>
                  <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeCreateRoutineModal}>Cancelar</Button>
                </HStack>
              </Stack>
            )}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

export default memo(CreateRoutineModal);
