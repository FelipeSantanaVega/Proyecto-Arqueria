import { keyframes } from "@emotion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Collapse, Heading, HStack, Image, Input, InputGroup, InputLeftElement, Stack, Text } from "@chakra-ui/react";

type Props = any;

const mobileRoutineSheetSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const mobileRoutineSheetSlideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const MOBILE_ROUTINE_SHEET_ANIMATION_MS = 180;
const MOBILE_ROUTINE_SHEET_CLOSE_DRAG_THRESHOLD = 110;

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
  const [routineSearch, setRoutineSearch] = useState("");
  const [mobileActionRoutine, setMobileActionRoutine] = useState<any | null>(null);
  const [isClosingMobileRoutineSheet, setIsClosingMobileRoutineSheet] = useState(false);
  const [isDraggingMobileRoutineSheet, setIsDraggingMobileRoutineSheet] = useState(false);
  const closeRoutineSheetTimeoutRef = useRef<number | null>(null);
  const mobileRoutineSheetDragStartYRef = useRef<number | null>(null);
  const mobileRoutineSheetDragOffsetRef = useRef(0);
  const mobileRoutineSheetRef = useRef<HTMLDivElement | null>(null);
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
  const filteredRoutineCards = useMemo(() => {
    const term = routineSearch.trim().toLowerCase();
    if (!term) return routineCards;
    return routineCards.filter(({ routine, orderedDays }: any) => {
      const byName = routine.name.toLowerCase().includes(term);
      const byDescription = (routine.description || "").toLowerCase().includes(term);
      const byDay = orderedDays.some((day: any) => {
        const dayName = (day.label || "").toLowerCase();
        const exerciseNames = day.items.some((item: any) => item.name.toLowerCase().includes(term));
        return dayName.includes(term) || exerciseNames;
      });
      return byName || byDescription || byDay;
    });
  }, [routineSearch, routineCards]);

  useEffect(() => () => {
    if (closeRoutineSheetTimeoutRef.current !== null) window.clearTimeout(closeRoutineSheetTimeoutRef.current);
  }, []);

  const openMobileActionSheet = (routine: any) => {
    if (closeRoutineSheetTimeoutRef.current !== null) {
      window.clearTimeout(closeRoutineSheetTimeoutRef.current);
      closeRoutineSheetTimeoutRef.current = null;
    }
    setIsClosingMobileRoutineSheet(false);
    setIsDraggingMobileRoutineSheet(false);
    mobileRoutineSheetDragOffsetRef.current = 0;
    setMobileActionRoutine(routine);
  };

  const closeMobileActionSheet = () => {
    if (!mobileActionRoutine) return;
    setIsClosingMobileRoutineSheet(true);
    setIsDraggingMobileRoutineSheet(false);
    mobileRoutineSheetDragOffsetRef.current = 0;
    closeRoutineSheetTimeoutRef.current = window.setTimeout(() => {
      setMobileActionRoutine(null);
      setIsClosingMobileRoutineSheet(false);
      mobileRoutineSheetDragOffsetRef.current = 0;
      closeRoutineSheetTimeoutRef.current = null;
    }, MOBILE_ROUTINE_SHEET_ANIMATION_MS);
  };

  const handleMobileSheetPointerStart = (clientY: number) => {
    mobileRoutineSheetDragStartYRef.current = clientY;
    mobileRoutineSheetDragOffsetRef.current = 0;
    setIsDraggingMobileRoutineSheet(true);
    setIsClosingMobileRoutineSheet(false);
    if (mobileRoutineSheetRef.current) {
      mobileRoutineSheetRef.current.style.transition = "none";
    }
  };

  const handleMobileSheetPointerMove = (clientY: number) => {
    if (mobileRoutineSheetDragStartYRef.current === null) return;
    const deltaY = Math.max(0, clientY - mobileRoutineSheetDragStartYRef.current);
    mobileRoutineSheetDragOffsetRef.current = deltaY;
    if (mobileRoutineSheetRef.current) {
      mobileRoutineSheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    }
  };

  const handleMobileSheetPointerEnd = () => {
    if (mobileRoutineSheetDragStartYRef.current === null) return;
    mobileRoutineSheetDragStartYRef.current = null;
    setIsDraggingMobileRoutineSheet(false);
    if (!mobileRoutineSheetRef.current) return;
    const sheet = mobileRoutineSheetRef.current;
    const dragOffset = mobileRoutineSheetDragOffsetRef.current;
    sheet.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
    if (dragOffset >= MOBILE_ROUTINE_SHEET_CLOSE_DRAG_THRESHOLD) {
      setIsClosingMobileRoutineSheet(true);
      sheet.style.transform = "translate3d(0, 100%, 0)";
      sheet.style.opacity = "0";
      closeRoutineSheetTimeoutRef.current = window.setTimeout(() => {
        setMobileActionRoutine(null);
        setIsClosingMobileRoutineSheet(false);
        mobileRoutineSheetDragOffsetRef.current = 0;
        if (mobileRoutineSheetRef.current) {
          mobileRoutineSheetRef.current.style.transform = "";
          mobileRoutineSheetRef.current.style.opacity = "";
          mobileRoutineSheetRef.current.style.transition = "";
        }
        closeRoutineSheetTimeoutRef.current = null;
      }, MOBILE_ROUTINE_SHEET_ANIMATION_MS);
      return;
    }
    mobileRoutineSheetDragOffsetRef.current = 0;
    sheet.style.transform = "translate3d(0, 0, 0)";
    sheet.style.opacity = "1";
  };

  return (
    <>
    <Stack spacing={0} display={{ base: "flex", md: "none" }} w="full" minH="calc(100vh - 118px)" bg="#f6f7fb" px={2.5} py={3} position="relative">
      <Stack spacing={3} mt={5}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="#334155"><SearchIcon boxSize={3.5} /></InputLeftElement>
          <Input value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} placeholder="Buscar rutinas" bg="#eef3fb" borderColor="transparent" borderRadius="10px" h="42px" fontSize="13px" _hover={{ borderColor: "transparent" }} _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }} />
        </InputGroup>
        <Text fontSize="11px" fontWeight="800" color="#697386" letterSpacing="0.08em">
          MIS BIBLIOTECA
        </Text>
        {filteredRoutineCards.map(({ routine, orderedDays, weekArrowsTotal }: any) => {
          const isExpanded = expandedRoutine === routine.id;
          return (
            <Box key={routine.id} bg="white" borderWidth="1px" borderColor="#e5e7eb" borderRadius="10px" overflow="hidden" boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)" transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease" _hover={{ borderColor: "#fdba74" }} _active={{ transform: "scale(0.985)", bg: "#f8fafc" }}>
              <HStack p={3.5} align="center" spacing={3} cursor="pointer" onClick={() => setExpandedRoutine((prev: any) => (prev === routine.id ? null : routine.id))}>
                <Box boxSize="28px" borderRadius="8px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Image src={notebookTabsIconUrl} alt="" boxSize="15px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                </Box>
                <Stack spacing={0} flex="1" minW={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="13px" noOfLines={1}>{routine.name}</Text>
                  <Text color="#667085" fontSize="10px" noOfLines={1}>{routine.description || `${weekArrowsTotal} flechas semanales`}</Text>
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
                        openMobileActionSheet(routine);
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
                  <MobileRoutineDays orderedDays={orderedDays} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
        {!filteredRoutineCards.length && <Text color="gray.600">No hay rutinas para mostrar.</Text>}
      </Stack>
      <Button position="fixed" right="18px" bottom="84px" zIndex={40} boxSize="52px" minW="52px" borderRadius="full" bg="#fb5a13" color="white" boxShadow="0 12px 26px rgba(251, 90, 19, 0.35)" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openCreateRoutineModal}>
        <Box as="svg" viewBox="0 0 24 24" boxSize="20px" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </Box>
      </Button>
      {mobileActionRoutine && (
        <Box position="fixed" inset={0} zIndex={60} bg="rgba(15, 23, 42, 0.32)" onClick={closeMobileActionSheet}>
          <Box
            ref={mobileRoutineSheetRef}
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
            animation={isDraggingMobileRoutineSheet ? "none" : `${isClosingMobileRoutineSheet ? mobileRoutineSheetSlideDown : mobileRoutineSheetSlideUp} ${MOBILE_ROUTINE_SHEET_ANIMATION_MS}ms ease-out`}
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
                <MobileRoutineActionButton
                  icon={<Image src={editIconUrl} alt="Editar rutina" boxSize="17px" />}
                  title="Editar rutina"
                  description="Modificar estructura, días y ejercicios"
                  onClick={() => {
                    closeMobileActionSheet();
                    openEditRoutineModal(mobileActionRoutine);
                  }}
                />
                <MobileRoutineActionButton
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
                  title="Eliminar rutina"
                  description="Borrar la rutina de forma permanente"
                  onClick={() => {
                    closeMobileActionSheet();
                    setDeleteRoutineError(null);
                    setDeleteRoutineTarget(mobileActionRoutine);
                    setDeleteRoutineModalOpen(true);
                  }}
                />
              </Stack>
              <HStack spacing={3} px={1} pt={2}>
                <Box boxSize="42px" borderRadius="12px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Image src={notebookTabsIconUrl} alt="" boxSize="18px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                </Box>
                <Stack spacing={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="14px">{mobileActionRoutine.name}</Text>
                  <Text fontSize="11px" color="#667085">{mobileActionRoutine.description || "Rutina predefinida del sistema"}</Text>
                </Stack>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>

    <Stack spacing={6} display={{ base: "none", md: "flex" }}>
      <HStack justify="space-between" align="center" spacing={4} w="full" maxW={{ md: "100%", xl: "980px" }} flexWrap="wrap">
        <InputGroup maxW={{ md: "100%", lg: "420px" }}>
          <InputLeftElement pointerEvents="none" color="gray.500"><SearchIcon boxSize={3.5} /></InputLeftElement>
          <Input value={routineSearch} onChange={(e) => setRoutineSearch(e.target.value)} placeholder="Buscar rutinas" bg="white" borderColor="gray.300" borderRadius="10px" _hover={{ borderColor: "gray.400" }} _focus={{ borderColor: "gray.500", bg: "white" }} />
        </InputGroup>
        <Button bg="#f97316" color="white" borderRadius="10px" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openCreateRoutineModal}>
          <HStack justify="center" spacing={2}>
            <Image src={notebookTabsIconUrl} alt="Agregar rutina" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Agregar rutina</Text>
          </HStack>
        </Button>
      </HStack>
      <Stack spacing={4} w="full" maxW={{ md: "100%", xl: "980px" }}>
        {filteredRoutineCards.map(({ routine, orderedDays, daysPreview, weekArrowsTotal }: any) => {
          const isExpanded = expandedRoutine === routine.id;
          return (
            <Box key={routine.id} borderWidth="1px" borderRadius="12px" borderColor="gray.200" bg="white" overflow="hidden" _hover={{ borderColor: "gray.300", cursor: "pointer" }} onClick={() => setExpandedRoutine((prev: any) => (prev === routine.id ? null : routine.id))}>
              <Box p={{ base: 4, xl: 5 }}>
                <Stack spacing={1.5}>
                  <HStack justify="space-between" align="flex-start" w="full" spacing={4} flexWrap="wrap">
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
                <HStack justify="flex-start" spacing={2} px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" flexWrap="wrap" rowGap={2}>
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
        {!filteredRoutineCards.length && <Text color="gray.600">No hay rutinas para mostrar.</Text>}
      </Stack>
    </Stack>
    </>
  );
}

function MobileRoutineDays({ orderedDays }: { orderedDays: any[] }) {
  return (
    <Stack spacing={3} pt={1}>
      {orderedDays.map((day: any, index: number) => (
        <HStack key={day.id} align="start" spacing={2.5}>
          <Box mt="2px" minW="18px" h="18px" borderRadius="full" bg="#fb5a13" color="white" fontSize="9px" fontWeight="800" display="flex" alignItems="center" justifyContent="center">
            {index + 1}
          </Box>
          <Stack spacing={0.5}>
            <Text fontSize="12px" color="#1f2937" fontWeight="800">{day.label}</Text>
            <Text fontSize="10px" color="#667085" noOfLines={2}>
              {day.items.length ? day.items.map((item: any) => item.name).join(", ") : "Sin ejercicios"}
            </Text>
          </Stack>
        </HStack>
      ))}
    </Stack>
  );
}

function MobileRoutineActionButton({
  icon,
  title,
  description,
  tone = "default",
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  tone?: "default" | "danger";
  onClick: () => void;
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

export default memo(RoutinesSection);
