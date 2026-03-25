import { memo, useLayoutEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

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

function AssignRoutineModal({
  assignRoutineModalOpen,
  closeAssignRoutineModal,
  assignRoutineStep,
  assignRoutineStudent,
  handleChooseCreateRoutineForStudent,
  handleChooseExistingRoutineList,
  sortedRoutines,
  selectedRoutineIdsToAssign,
  selectedRoutinesToAssign,
  handleSelectRoutineToAssign,
  getRoutineWeekArrows,
  routineOrderContainerRef,
  routineOrderItemRefs,
  routineOrderButtonAnimationById,
  hoveredRoutineOrderId,
  draggingRoutineOrderId,
  draggingRoutineOrderHeight,
  draggingRoutineOrderTop,
  draggingRoutineOrderLeft,
  draggingRoutineOrderWidth,
  handleRoutineOrderDragStart,
  moveSelectedRoutineOrder,
  assignmentStartDate,
  assignmentEndDate,
  setAssignmentStartDate,
  setAssignmentEndDate,
  assignmentStartDatePickerRef,
  assignmentEndDatePickerRef,
  formatDateEs,
  addDaysIso,
  getTodayIsoLocal,
  isEndAfterStart,
  getDayCountFromRange,
  selectedRoutineToAssign,
  assignRoutineSummaryListRef,
  routineAssignSummaryListMaxH,
  handleAssignRoutineSummaryWheel,
  routineAssignBuilderDays,
  isAssignPreviewOverDayLimit,
  assignPreviewExcessDays,
  getSummaryDayArrows,
  routineAssignExercisesByDay,
  routineAssignExerciseOverridesByDay,
  getRoutineEntryKey,
  exercises,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  openEditAssignExercise,
  removeAssignExerciseFromDay,
  openAddExerciseForDay,
  routineAssignDayCount,
  requestDeleteAssignRoutineDay,
  routineAssignDayInitialLimit,
  addAssignRoutineDay,
  assignmentObjective,
  setAssignmentObjective,
  assignmentProfessorNotes,
  setAssignmentProfessorNotes,
  assignRoutineError,
  openAdminAssignModal,
  setAssignRoutineModalOpen,
  handleContinueToRoutineOrder,
  handleContinueFromRoutineOrder,
  handleAssignExistingRoutine,
  assignRoutineLoading,
  setAssignRoutineStep,
}: Props) {
  const previewMeasureRef = useRef<HTMLDivElement | null>(null);
  const [measuredPreviewHeight, setMeasuredPreviewHeight] = useState<number | null>(null);
  const existingOrderHeight = `${Math.min(520, Math.max(180, 84 + selectedRoutinesToAssign.length * 74))}px`;
  const existingPreviewHeight = `${Math.min(620, Math.max(360, measuredPreviewHeight ?? 360))}px`;
  const stepBodyHeight =
    assignRoutineStep === "choice"
      ? "300px"
      : assignRoutineStep === "existing_days"
        ? "190px"
        : assignRoutineStep === "existing_dates"
          ? "360px"
          : assignRoutineStep === "existing_list" || assignRoutineStep === "existing_order"
            ? assignRoutineStep === "existing_list"
              ? "430px"
              : existingOrderHeight
            : existingPreviewHeight;

  useLayoutEffect(() => {
    if (assignRoutineStep !== "existing_preview") return;
    const node = previewMeasureRef.current;
    if (!node) return;

    const updateHeight = () => {
      const contentHeight = node.scrollHeight;
      setMeasuredPreviewHeight(contentHeight + 16);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    assignRoutineStep,
    routineAssignBuilderDays.length,
    routineAssignExercisesByDay,
    routineAssignExerciseOverridesByDay,
    isAssignPreviewOverDayLimit,
    routineAssignDayCount,
    routineAssignDayInitialLimit,
  ]);

  return (
    <Modal isOpen={assignRoutineModalOpen} onClose={closeAssignRoutineModal} isCentered>
      <ModalOverlay bg="rgba(17, 24, 39, 0.55)" />
      <ModalContent
        maxW={{ base: "calc(100vw - 1rem)", md: "760px" }}
        maxH="90vh"
        borderRadius="12px"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        transition="max-width 0.3s ease, min-height 0.3s ease"
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
        <Box
          h={stepBodyHeight}
          transition="height 0.3s ease"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
        <ModalBody
          py={5}
          overflowY={assignRoutineStep === "existing_preview" || assignRoutineStep === "existing_list" || assignRoutineStep === "existing_order" ? "hidden" : "auto"}
          display="flex"
          flexDirection="column"
          minH={0}
          flex="1"
        >
          {assignRoutineStep === "choice" && (
            <Stack spacing={5} animation={`${routineStepSlide} 0.3s ease`}>
              <Text color="gray.700" textAlign="center">
                ¿Deseas crear una rutina temporal nueva o asignar una que ya tengas guardada en tu biblioteca?
              </Text>
              <HStack spacing={4} align="stretch">
                <Box flex="1" role="group" borderWidth="1px" borderColor="gray.300" bg="white" borderRadius="12px" p={5} cursor="pointer" _hover={{ borderColor: "#f97316", bg: "#fff7ed" }} onClick={handleChooseCreateRoutineForStudent}>
                  <Stack spacing={3} align="center" textAlign="center">
                    <Box w="44px" h="44px" borderRadius="full" bg="gray.100" display="flex" alignItems="center" justifyContent="center" color="gray.500" _groupHover={{ bg: "orange.100", color: "orange.500" }}>
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                      </Box>
                    </Box>
                    <Text fontWeight="700" color="gray.900">Crear rutina</Text>
                    <Text fontSize="sm" color="gray.500">Diseña una rutina específica desde cero para este deportista.</Text>
                  </Stack>
                </Box>
                <Box flex="1" role="group" borderWidth="1px" borderColor="gray.300" borderRadius="12px" p={5} cursor="pointer" _hover={{ borderColor: "#f97316", bg: "#fff7ed" }} onClick={handleChooseExistingRoutineList}>
                  <Stack spacing={3} align="center" textAlign="center">
                    <Box w="44px" h="44px" borderRadius="full" bg="gray.100" display="flex" alignItems="center" justifyContent="center" color="gray.500" _groupHover={{ bg: "orange.100", color: "orange.500" }}>
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <Stack spacing={3} flex="1" minH={0} overflowY="auto" pr={1} animation={`${routineStepSlide} 0.3s ease`}>
              {sortedRoutines.map((routine: any) => {
                const isSelected = selectedRoutineIdsToAssign.includes(routine.id);
                return (
                  <Box key={routine.id} p={3.5} borderWidth="1px" borderColor={isSelected ? "#f97316" : "gray.200"} bg={isSelected ? "#fff7ed" : "white"} borderRadius="8px" cursor="pointer" _hover={{ borderColor: isSelected ? "#f97316" : "gray.400" }} onClick={() => handleSelectRoutineToAssign(routine)}>
                    <HStack justify="space-between" align="center">
                      <Stack spacing={0}>
                        <Text color="gray.900" fontWeight="500">{routine.name}</Text>
                      </Stack>
                      <HStack spacing={3}>
                        <Text color="gray.500" fontSize="sm">Flechas totales: {getRoutineWeekArrows(routine)}</Text>
                        {isSelected && <Badge bg="#f97316" color="white" borderRadius="full" px={2} py={0.5}>✓</Badge>}
                      </HStack>
                    </HStack>
                  </Box>
                );
              })}
              {!sortedRoutines.length && <Text color="gray.600">No hay rutinas creadas.</Text>}
            </Stack>
          )}
          {assignRoutineStep === "existing_order" && (
            <Flex ref={routineOrderContainerRef} flex="1" minH={0} py={0} animation={`${routineStepSlide} 0.3s ease`}>
              <Box w="100%" bg="white">
                <HStack justify="space-between" px={1} py={1} borderBottomWidth="1px" borderColor="gray.200">
                  <Text fontWeight="700" color="gray.900">Ordenar rutinas</Text>
                  <Text fontSize="sm" color="gray.500">{selectedRoutinesToAssign.length} seleccionada{selectedRoutinesToAssign.length === 1 ? "" : "s"}</Text>
                </HStack>
                <Stack spacing={4} px={1} py={4}>
                  <Stack spacing={2}>
                    {selectedRoutinesToAssign.map((routine: any, index: number) => {
                      const isDragging = draggingRoutineOrderId === routine.id;
                      const buttonAnimation = routineOrderButtonAnimationById[routine.id];
                      const hoveredIndex = hoveredRoutineOrderId !== null ? selectedRoutinesToAssign.findIndex((item: any) => item.id === hoveredRoutineOrderId) : -1;
                      const draggingIndex = draggingRoutineOrderId !== null ? selectedRoutinesToAssign.findIndex((item: any) => item.id === draggingRoutineOrderId) : -1;
                      let hoverTranslateY = 0;
                      if (!isDragging && hoveredIndex !== -1 && draggingIndex !== -1 && hoveredIndex !== draggingIndex) {
                        const shift = draggingRoutineOrderHeight + 8;
                        if (draggingIndex > hoveredIndex) {
                          if (index >= hoveredIndex && index < draggingIndex) hoverTranslateY = shift;
                        } else if (draggingIndex < hoveredIndex) {
                          if (index > draggingIndex && index <= hoveredIndex) hoverTranslateY = -shift;
                        }
                      }
                      return (
                        <Box key={`selected-order-wrap-${routine.id}`} minH={isDragging ? `${draggingRoutineOrderHeight}px` : undefined}>
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
                            transform={isDragging ? "translate3d(0, 0, 0) translateZ(0) scale(1.01)" : hoverTranslateY !== 0 ? `translate3d(0, ${hoverTranslateY}px, 0) translateZ(0)` : "translate3d(0, 0, 0) translateZ(0)"}
                            animation={!isDragging && buttonAnimation ? `${buttonAnimation === "up" ? routineOrderButtonMoveUp : routineOrderButtonMoveDown} 0.28s cubic-bezier(0.22, 1, 0.36, 1)` : undefined}
                            sx={{ backfaceVisibility: "hidden" }}
                            willChange="transform, top, box-shadow"
                            transition={isDragging ? "box-shadow 0.12s ease, border-color 0.12s ease, background-color 0.12s ease, opacity 0.12s ease" : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, opacity 0.22s ease"}
                            onMouseDown={(e) => handleRoutineOrderDragStart(e, routine.id)}
                          >
                            <HStack justify="space-between" align="center">
                              <Text color="gray.900" fontWeight="500">{routine.name}</Text>
                              <HStack spacing={1}>
                                <Button size="sm" variant="ghost" minW="32px" h="32px" p={0} color="gray.500" _hover={{ bg: "gray.100", color: "gray.700" }} isDisabled={index === 0} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); moveSelectedRoutineOrder(routine.id, -1); }}>
                                  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></Box>
                                </Button>
                                <Button size="sm" variant="ghost" minW="32px" h="32px" p={0} color="gray.500" _hover={{ bg: "gray.100", color: "gray.700" }} isDisabled={index === selectedRoutinesToAssign.length - 1} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); moveSelectedRoutineOrder(routine.id, 1); }}>
                                  <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></Box>
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
            <Stack spacing={5} py={2} animation={`${routineStepSlide} 0.3s ease`}>
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
                      if (!isEndAfterStart(nextStart, assignmentEndDate)) setAssignmentEndDate(addDaysIso(nextStart, 1));
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
              <Text color="gray.700" fontWeight="600">Días de rutina: {getDayCountFromRange(assignmentStartDate, assignmentEndDate)}</Text>
            </Stack>
          )}
          {assignRoutineStep === "existing_preview" && selectedRoutineToAssign && (
            <Stack ref={assignRoutineSummaryListRef} spacing={4} flex="1" minH={0} maxH={{ base: "36vh", md: `${routineAssignSummaryListMaxH}px` }} overflowY="auto" pr={1} animation={`${routineStepSlide} 0.3s ease`} onWheel={handleAssignRoutineSummaryWheel} sx={{ overscrollBehaviorY: "contain" }}>
              <Stack ref={previewMeasureRef} spacing={4}>
                {routineAssignBuilderDays.map((day: any) => (
                  <Box key={`assign-summary-${day.key}`} borderWidth="1px" borderColor={isAssignPreviewOverDayLimit ? "red.300" : "gray.200"} borderRadius="10px" p={4}>
                    <HStack justify="space-between" align="baseline" mb={2}>
                      <Text color="gray.800" fontWeight="semibold">{day.label}</Text>
                      <Text fontSize="sm" color="gray.500">{getSummaryDayArrows(routineAssignExercisesByDay[day.key] || [], day.key, routineAssignExerciseOverridesByDay)} flechas</Text>
                    </HStack>
                    <Stack spacing={1} mt={2}>
                      {(routineAssignExercisesByDay[day.key] || []).map((exerciseId: number, itemIndex: number) => {
                        const base = exercises.find((ex: any) => ex.id === exerciseId);
                        const override = routineAssignExerciseOverridesByDay[day.key]?.[getRoutineEntryKey(exerciseId, itemIndex)];
                        return (
                          <HStack key={`assign-summary-ex-${day.key}-${itemIndex}-${exerciseId}`} spacing={2} align="center">
                            <Stack spacing={0} flex="1">
                              <Text fontSize="sm" color="gray.700">{base?.name || `Ejercicio #${exerciseId}`}</Text>
                              <Text fontSize="xs" color="gray.500">Flechas: {override?.arrows_override ?? base?.arrows_count ?? "-"} | Distancia: {override?.distance_override_m ?? Number(base?.distance_m ?? 0) ?? "-"} m</Text>
                            </Stack>
                            <HStack spacing={1}>
                              <Button size={actionIconButtonSize} variant="ghost" minW="auto" px={2} onClick={() => openEditAssignExercise(day.key, exerciseId, itemIndex)}>
                                <Image src={editIconUrl} alt="Editar" boxSize={actionIconSize} />
                              </Button>
                              <Button size={actionIconButtonSize} variant="outline" borderRadius="xl" borderColor="gray.300" color="black" _hover={{ bg: "red.700", borderColor: "red.800", color: "white" }} onClick={() => removeAssignExerciseFromDay(day.key, itemIndex)}>
                                <Box as="svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Box>
                              </Button>
                            </HStack>
                          </HStack>
                        );
                      })}
                      {(routineAssignExercisesByDay[day.key] || []).length === 0 && <Text fontSize="sm" color="gray.500">Sin ejercicios</Text>}
                    </Stack>
                    <HStack mt={4} justify="space-between" align="center">
                      <Button size="sm" variant="ghost" color="#f97316" _hover={{ bg: "orange.50" }} onClick={() => openAddExerciseForDay(day.key)} leftIcon={<Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></Box>}>Agregar ejercicio</Button>
                      {routineAssignDayCount > 1 && <Button size="sm" variant="ghost" color="red.500" _hover={{ bg: "red.50", color: "red.600" }} onClick={() => requestDeleteAssignRoutineDay(day.dayNumber)} leftIcon={<Box as="svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></Box>}>Eliminar día</Button>}
                    </HStack>
                  </Box>
                ))}
                {isAssignPreviewOverDayLimit && <Box borderWidth="1px" borderColor="red.300" bg="red.50" color="red.700" borderRadius="10px" px={4} py={3}><Text fontSize="sm" fontWeight="600">La rutina ha excedido el máximo de días establecidos. Por favor, elimine al menos {assignPreviewExcessDays} día{assignPreviewExcessDays === 1 ? "" : "s"} para continuar.</Text></Box>}
                <HStack justify="center">
                  {routineAssignDayCount < routineAssignDayInitialLimit && <Button variant="ghost" color="gray.600" _hover={{ bg: "gray.100", color: "gray.700" }} onClick={addAssignRoutineDay}>Agregar día</Button>}
                </HStack>
              </Stack>
            </Stack>
          )}
          {assignRoutineStep === "existing_dates" && selectedRoutineToAssign && (
            <Stack spacing={4} animation={`${routineStepSlide} 0.3s ease`}>
              <FormControl>
                <FormLabel>Objetivo</FormLabel>
                <Input value={assignmentObjective} onChange={(e) => setAssignmentObjective(e.target.value)} placeholder="Ej: Determinante" maxW="320px" />
              </FormControl>
              <FormControl>
                <FormLabel>Notas del profesor (opcional)</FormLabel>
                <Textarea value={assignmentProfessorNotes} onChange={(e) => setAssignmentProfessorNotes(e.target.value)} placeholder="Escribe observaciones para el deportista..." minH="110px" resize="vertical" />
              </FormControl>
            </Stack>
          )}
          {assignRoutineError && <Alert status="error" borderRadius="md" mt={3}><AlertIcon />{assignRoutineError}</Alert>}
        </ModalBody>
        </Box>
        <ModalFooter borderTopWidth="1px" borderColor="gray.200" py={3}>
          <HStack spacing={3}>
            {assignRoutineStep === "choice" && <Button variant="outline" borderColor="gray.300" onClick={() => { setAssignRoutineModalOpen(false); openAdminAssignModal(); }}>Volver</Button>}
            {assignRoutineStep === "existing_list" && (
              <>
                <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_days")}>Volver</Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isDisabled={!selectedRoutinesToAssign.length} onClick={handleContinueToRoutineOrder}>Siguiente</Button>
              </>
            )}
            {assignRoutineStep === "existing_order" && (
              <>
                <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_list")}>Volver</Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isDisabled={!selectedRoutinesToAssign.length} onClick={handleContinueFromRoutineOrder}>Siguiente</Button>
              </>
            )}
            {assignRoutineStep === "existing_days" && (
              <>
                <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("choice")}>Volver</Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isDisabled={!isEndAfterStart(assignmentStartDate, assignmentEndDate)} onClick={() => setAssignRoutineStep("existing_list")}>Siguiente</Button>
              </>
            )}
            {assignRoutineStep === "existing_preview" && (
              <>
                <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_order")}>Volver</Button>
                <Button bg={isAssignPreviewOverDayLimit ? "gray.300" : "#f97316"} color={isAssignPreviewOverDayLimit ? "gray.600" : "white"} _hover={isAssignPreviewOverDayLimit ? { bg: "gray.300" } : { bg: "#ea580c" }} _active={isAssignPreviewOverDayLimit ? { bg: "gray.300" } : { bg: "#c2410c" }} isDisabled={isAssignPreviewOverDayLimit} onClick={() => { if (isAssignPreviewOverDayLimit) return; setAssignRoutineStep("existing_dates"); }}>Siguiente</Button>
              </>
            )}
            {assignRoutineStep === "existing_dates" && (
              <>
                <Button variant="outline" borderColor="gray.300" onClick={() => setAssignRoutineStep("existing_preview")}>Volver</Button>
                <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} isLoading={assignRoutineLoading} onClick={handleAssignExistingRoutine}>Confirmar asignación</Button>
              </>
            )}
            <Button bg="white" color="black" borderColor="gray.300" borderWidth="1px" _hover={{ bg: "gray.100" }} onClick={closeAssignRoutineModal}>Cancelar</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default memo(AssignRoutineModal);
