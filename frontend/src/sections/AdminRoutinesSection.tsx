import { keyframes } from "@emotion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertIcon, Badge, Box, Button, Collapse, Heading, HStack, Stack, Text } from "@chakra-ui/react";

type Props = any;

const mobileAdminSheetSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const mobileAdminSheetSlideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const MOBILE_ADMIN_SHEET_ANIMATION_MS = 180;
const MOBILE_ADMIN_SHEET_CLOSE_DRAG_THRESHOLD = 110;

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
  exportAssignmentError,
  setExportAssignmentError,
  getAssignmentPdfDownloadUrl,
  saveAssignmentLoadingId,
  openSaveAssignmentModal,
  handleExportAssignmentPdf,
  openAdminAssignModal,
  setDeleteAssignedRoutineError,
  setDeleteAssignedRoutineTarget,
  setDeleteAssignedRoutineModalOpen,
}: Props) {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [mobileActionAssignment, setMobileActionAssignment] = useState<any | null>(null);
  const [isClosingMobileAdminSheet, setIsClosingMobileAdminSheet] = useState(false);
  const [isDraggingMobileAdminSheet, setIsDraggingMobileAdminSheet] = useState(false);
  const closeAdminSheetTimeoutRef = useRef<number | null>(null);
  const mobileAdminSheetDragStartYRef = useRef<number | null>(null);
  const mobileAdminSheetDragOffsetRef = useRef(0);
  const mobileAdminSheetRef = useRef<HTMLDivElement | null>(null);
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

  const assignmentCards = useMemo(
    () =>
      activeAssignments.map((assignment: any) => {
        const routine = routines.find((r: any) => r.id === assignment.routine_id);
        const orderedDays = routine ? [...routine.days].sort((a: any, b: any) => a.day_number - b.day_number) : [];
        return {
          assignment,
          routine,
          orderedDays,
          professorNotes: getProfessorNotes(assignment.notes),
        };
      }),
    [activeAssignments, routines],
  );

  useEffect(() => () => {
    if (closeAdminSheetTimeoutRef.current !== null) window.clearTimeout(closeAdminSheetTimeoutRef.current);
  }, []);

  const openMobileActionSheet = (assignment: any) => {
    if (closeAdminSheetTimeoutRef.current !== null) {
      window.clearTimeout(closeAdminSheetTimeoutRef.current);
      closeAdminSheetTimeoutRef.current = null;
    }
    setIsClosingMobileAdminSheet(false);
    setIsDraggingMobileAdminSheet(false);
    mobileAdminSheetDragOffsetRef.current = 0;
    setMobileActionAssignment(assignment);
  };

  const closeMobileActionSheet = () => {
    if (!mobileActionAssignment) return;
    setIsClosingMobileAdminSheet(true);
    setIsDraggingMobileAdminSheet(false);
    mobileAdminSheetDragOffsetRef.current = 0;
    closeAdminSheetTimeoutRef.current = window.setTimeout(() => {
      setMobileActionAssignment(null);
      setIsClosingMobileAdminSheet(false);
      mobileAdminSheetDragOffsetRef.current = 0;
      closeAdminSheetTimeoutRef.current = null;
    }, MOBILE_ADMIN_SHEET_ANIMATION_MS);
  };

  const handleMobileSheetPointerStart = (clientY: number) => {
    mobileAdminSheetDragStartYRef.current = clientY;
    mobileAdminSheetDragOffsetRef.current = 0;
    setIsDraggingMobileAdminSheet(true);
    setIsClosingMobileAdminSheet(false);
    if (mobileAdminSheetRef.current) mobileAdminSheetRef.current.style.transition = "none";
  };

  const handleMobileSheetPointerMove = (clientY: number) => {
    if (mobileAdminSheetDragStartYRef.current === null) return;
    const deltaY = Math.max(0, clientY - mobileAdminSheetDragStartYRef.current);
    mobileAdminSheetDragOffsetRef.current = deltaY;
    if (mobileAdminSheetRef.current) {
      mobileAdminSheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    }
  };

  const handleMobileSheetPointerEnd = () => {
    if (mobileAdminSheetDragStartYRef.current === null) return;
    mobileAdminSheetDragStartYRef.current = null;
    setIsDraggingMobileAdminSheet(false);
    if (!mobileAdminSheetRef.current) return;
    const sheet = mobileAdminSheetRef.current;
    const dragOffset = mobileAdminSheetDragOffsetRef.current;
    sheet.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
    if (dragOffset >= MOBILE_ADMIN_SHEET_CLOSE_DRAG_THRESHOLD) {
      setIsClosingMobileAdminSheet(true);
      sheet.style.transform = "translate3d(0, 100%, 0)";
      sheet.style.opacity = "0";
      closeAdminSheetTimeoutRef.current = window.setTimeout(() => {
        setMobileActionAssignment(null);
        setIsClosingMobileAdminSheet(false);
        mobileAdminSheetDragOffsetRef.current = 0;
        if (mobileAdminSheetRef.current) {
          mobileAdminSheetRef.current.style.transform = "";
          mobileAdminSheetRef.current.style.opacity = "";
          mobileAdminSheetRef.current.style.transition = "";
        }
        closeAdminSheetTimeoutRef.current = null;
      }, MOBILE_ADMIN_SHEET_ANIMATION_MS);
      return;
    }
    mobileAdminSheetDragOffsetRef.current = 0;
    sheet.style.transform = "translate3d(0, 0, 0)";
    sheet.style.opacity = "1";
  };

  return (
    <>
      <Stack spacing={0} display={{ base: "flex", md: "none" }} w="full" minH="calc(100vh - 118px)" bg="#f6f7fb" px={2.5} py={3} position="relative">
      <Stack spacing={3} mt={5}>
        <Text fontSize="11px" fontWeight="800" color="#697386" letterSpacing="0.08em">
          RUTINAS EN CURSO
        </Text>
        {exportAssignmentError && (
          <Alert status="error" borderRadius="14px">
            <AlertIcon />
            <HStack justify="space-between" w="full" spacing={3}>
              <Text fontSize="13px">{exportAssignmentError}</Text>
              <Button size="xs" variant="ghost" onClick={() => setExportAssignmentError(null)}>
                Cerrar
              </Button>
            </HStack>
          </Alert>
        )}
        {assignmentCards.map(({ assignment, routine, orderedDays, professorNotes }: any) => {
          const isExpanded = expandedAssignmentId === assignment.id;
          return (
            <Box key={assignment.id} bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="10px" overflow="hidden" boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)" transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease" _hover={{ borderColor: "#fdba74" }} _active={{ transform: "scale(0.985)", bg: "#f8fafc" }}>
              <HStack p={3.5} align="center" spacing={3} cursor="pointer" onClick={() => setExpandedAssignmentId((prev) => (prev === assignment.id ? null : assignment.id))}>
                <Box boxSize="28px" borderRadius="8px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Box as="svg" viewBox="0 0 24 24" boxSize="15px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M9 14h6" />
                    <path d="M12 17v-6" />
                  </Box>
                </Box>
                <Stack spacing={0} flex="1" minW={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="13px" noOfLines={1}>
                    {studentNameById.get(assignment.student_id) || `Deportista #${assignment.student_id}`}
                  </Text>
                  <Text color="#667085" fontSize="10px" noOfLines={1}>
                    {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                  </Text>
                </Stack>
                <Stack spacing={1} align="center" justify="center" minW="24px" flexShrink={0}>
                  <Box as="span" color="#92400e" fontSize="22px" lineHeight="1" transform={isExpanded ? "rotate(90deg)" : "rotate(0deg)"} transition="transform 0.18s ease">›</Box>
                  {isExpanded && (
                    <Button
                      variant="ghost"
                      minW="auto"
                      h="24px"
                      px={1}
                      color="#64748b"
                      _hover={{ bg: "transparent", color: "#334155" }}
                      _active={{ bg: "transparent", color: "#0f172a" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMobileActionSheet(assignment);
                      }}
                      aria-label="Más opciones"
                    >
                      <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </Box>
                    </Button>
                  )}
                </Stack>
              </HStack>
              <Collapse in={isExpanded} animateOpacity>
                <Box px={3.5} pb={3.5}>
                  <HStack justify="space-between" align="start" mb={3}>
                    <Text color="#334155" fontSize="11px" fontWeight="700" noOfLines={1}>
                      {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                    </Text>
                    <Badge bg="#dcfce7" color="#15803d" borderRadius="4px" px={2} py={0.5} fontSize="10px">
                      EN CURSO
                    </Badge>
                  </HStack>
                  <Stack spacing={3}>
                    {orderedDays.map((day: any) => (
                      <Box key={day.id} pl={3} borderLeft="2px solid" borderColor="#e5e7eb">
                        <HStack justify="space-between" align="start" mb={1}>
                          <Text color="#1f2937" fontSize="12px" fontWeight="800">
                            {day.name || formatDay(day)}
                          </Text>
                          <Text color="#94a3b8" fontSize="10px">
                            {getRoutineDayArrows(day)} flechas
                          </Text>
                        </HStack>
                        <Stack spacing={1}>
                          {day.exercises.map((dayExercise: any) => (
                            <Text key={dayExercise.id} fontSize="10px" color="#667085">
                              {exerciseNameById.get(dayExercise.exercise_id) || `Ejercicio #${dayExercise.exercise_id}`}
                            </Text>
                          ))}
                          {!day.exercises.length && <Text fontSize="10px" color="#667085">Sin ejercicios</Text>}
                        </Stack>
                      </Box>
                    ))}
                    {!routine && <Text color="#667085" fontSize="11px">No se encontró la rutina asociada.</Text>}
                    {professorNotes && (
                      <Box pt={1}>
                        <Text color="#334155" fontSize="11px" fontWeight="700" mb={1}>Notas del profesor</Text>
                        <Text color="#667085" fontSize="10px" whiteSpace="pre-wrap">{professorNotes}</Text>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
        {!activeAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
      </Stack>
      <Button position="fixed" right="18px" bottom="84px" zIndex={40} boxSize="52px" minW="52px" borderRadius="full" bg="#fb5a13" color="white" boxShadow="0 12px 26px rgba(251, 90, 19, 0.35)" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openAdminAssignModal}>
        <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 14h6" />
          <path d="M12 17v-6" />
        </Box>
      </Button>
      {mobileActionAssignment && (
        <Box position="fixed" inset={0} zIndex={60} bg="rgba(15, 23, 42, 0.32)" onClick={closeMobileActionSheet}>
          <Box
            ref={mobileAdminSheetRef}
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
            animation={isDraggingMobileAdminSheet ? "none" : `${isClosingMobileAdminSheet ? mobileAdminSheetSlideDown : mobileAdminSheetSlideUp} ${MOBILE_ADMIN_SHEET_ANIMATION_MS}ms ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            <Stack spacing={4}>
              <Box
                alignSelf="center"
                w="52px"
                h="5px"
                borderRadius="full"
                bg="#e5d5ca"
                style={{ touchAction: "none" }}
                onTouchStart={(e) => handleMobileSheetPointerStart(e.touches[0]?.clientY ?? 0)}
                onTouchMove={(e) => handleMobileSheetPointerMove(e.touches[0]?.clientY ?? 0)}
                onTouchEnd={handleMobileSheetPointerEnd}
                onTouchCancel={handleMobileSheetPointerEnd}
              />
              <Heading size="md" color="#1f2937">Acciones de rutina</Heading>
              <Stack spacing={3}>
                <MobileAdminActionButton
                  icon={
                    <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                    </Box>
                  }
                  title="Finalizar rutina"
                  description="Marcar la rutina como completada"
                  onClick={() => {
                    closeMobileActionSheet();
                    openSaveAssignmentModal(mobileActionAssignment.id);
                  }}
                  isLoading={saveAssignmentLoadingId === mobileActionAssignment.id}
                  isDisabled={saveAssignmentLoadingId !== null && saveAssignmentLoadingId !== mobileActionAssignment.id}
                />
                <MobileAdminActionButton
                  icon={
                    <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 17V3" />
                      <path d="m6 11 6 6 6-6" />
                      <path d="M19 21H5" />
                    </Box>
                  }
                  title="Exportar rutina"
                  description="Descargar el PDF de la rutina asignada"
                  onClick={() => {
                    setExportAssignmentError(null);
                    const downloadUrl = getAssignmentPdfDownloadUrl(mobileActionAssignment.id);
                    if (downloadUrl && downloadUrl !== "#") {
                      window.location.href = downloadUrl;
                    }
                  }}
                  isLoading={exportAssignmentLoadingId === mobileActionAssignment.id}
                  isDisabled={exportAssignmentLoadingId !== null && exportAssignmentLoadingId !== mobileActionAssignment.id}
                />
                <MobileAdminActionButton
                  tone="danger"
                  icon={
                    <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </Box>
                  }
                  title="Eliminar rutina activa"
                  description="Quitar la asignación actual del deportista"
                  onClick={() => {
                    closeMobileActionSheet();
                    setDeleteAssignedRoutineError(null);
                    setDeleteAssignedRoutineTarget(mobileActionAssignment);
                    setDeleteAssignedRoutineModalOpen(true);
                  }}
                />
              </Stack>
              <HStack spacing={3} px={1} pt={2}>
                <Box boxSize="42px" borderRadius="12px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M9 14h6" />
                    <path d="M12 17v-6" />
                  </Box>
                </Box>
                <Stack spacing={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="14px">
                    {studentNameById.get(mobileActionAssignment.student_id) || `Deportista #${mobileActionAssignment.student_id}`}
                  </Text>
                  <Text fontSize="11px" color="#667085">
                    {routineNameById.get(mobileActionAssignment.routine_id) || `Rutina #${mobileActionAssignment.routine_id}`}
                  </Text>
                </Stack>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}
      </Stack>
      <Stack spacing={6} maxW={{ md: "100%", xl: "980px" }} display={{ base: "none", md: "flex" }}>
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" rowGap={3}>
          <Stack spacing={1}>
            <Heading size="lg">Rutinas en curso</Heading>
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
          {exportAssignmentError && (
            <Alert status="error" borderRadius="14px">
              <AlertIcon />
              <HStack justify="space-between" w="full" spacing={3}>
                <Text fontSize="sm">{exportAssignmentError}</Text>
                <Button size="xs" variant="ghost" onClick={() => setExportAssignmentError(null)}>
                  Cerrar
                </Button>
              </HStack>
            </Alert>
          )}
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
                  <HStack justify="space-between" align="start" spacing={4} flexWrap="wrap">
                    <Stack spacing={1}>
                      <Heading size="md" color="gray.900">
                        {studentNameById.get(assignment.student_id) || `Deportista #${assignment.student_id}`}
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
                        EN CURSO
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
                  <HStack justify="space-between" spacing={2} px={6} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" flexWrap="wrap" rowGap={2}>
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
                          setExportAssignmentError(null);
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
    </>
  );
}

function MobileAdminActionButton({
  icon,
  title,
  description,
  tone = "default",
  onClick,
  isLoading = false,
  isDisabled = false,
}: {
  icon: any;
  title: string;
  description: string;
  tone?: "default" | "danger";
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}) {
  const danger = tone === "danger";

  return (
    <Button
      variant="ghost"
      h="auto"
      p={0}
      bg={danger ? "#fff7f5" : "#eef3fb"}
      borderWidth="1px"
      borderColor={danger ? "#fecaca" : "transparent"}
      borderRadius="12px"
      _hover={{ bg: danger ? "#fff1ee" : "#e8eef8" }}
      _active={{ bg: danger ? "#ffe8e3" : "#dfe8f6" }}
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={isDisabled}
    >
      <HStack w="full" spacing={3} align="center" p={4}>
        <Box boxSize="38px" borderRadius="10px" bg="white" color={danger ? "#dc2626" : "#64748b"} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
          {icon}
        </Box>
        <Stack spacing={0.5} flex="1" align="start" minW={0}>
          <Text color={danger ? "#dc2626" : "#1f2937"} fontWeight="800" fontSize="14px" noOfLines={1}>{title}</Text>
          <Text color={danger ? "#b91c1c" : "#667085"} fontSize="11px" textAlign="left" whiteSpace="normal">{description}</Text>
        </Stack>
        <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke={danger ? "#f87171" : "#c2410c"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" flexShrink={0}>
          <path d="m9 18 6-6-6-6" />
        </Box>
      </HStack>
    </Button>
  );
}

export default memo(AdminRoutinesSection);


