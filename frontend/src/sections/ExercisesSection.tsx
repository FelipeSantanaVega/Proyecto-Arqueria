import { keyframes } from "@emotion/react";
import { memo, useEffect, useRef, useState } from "react";
import { Box, Button, Collapse, Heading, HStack, Image, Input, InputGroup, InputLeftElement, Stack, Text } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useLayoutEffect } from "react";
import { useProfessorLists } from "../context/ProfessorListsContext";

type Props = any;

const mobileExerciseSheetSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const mobileExerciseSheetSlideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const MOBILE_EXERCISE_SHEET_ANIMATION_MS = 180;
const MOBILE_EXERCISE_SHEET_CLOSE_DRAG_THRESHOLD = 110;

function ExercisesSection({
  expandedExercise,
  setExpandedExercise,
  setCreateModalOpen,
  openEditExerciseModal,
  setDeleteExercise,
  setDeleteModalOpen,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  bowIconUrl,
}: Props) {
  const [mobileActionExercise, setMobileActionExercise] = useState<any | null>(null);
  const [isClosingMobileExerciseSheet, setIsClosingMobileExerciseSheet] = useState(false);
  const [isDraggingMobileExerciseSheet, setIsDraggingMobileExerciseSheet] = useState(false);
  const closeExerciseSheetTimeoutRef = useRef<number | null>(null);
  const mobileExerciseSheetDragStartYRef = useRef<number | null>(null);
  const mobileExerciseSheetDragOffsetRef = useRef(0);
  const mobileExerciseSheetRef = useRef<HTMLDivElement | null>(null);
  const { exerciseSearch, setExerciseSearch, visibleExercises, filteredExercises, showMoreExercises } = useProfessorLists();
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [, setListWidth] = useState(900);

  useLayoutEffect(() => {
    const node = listContainerRef.current;
    if (!node) return;
    const update = () => setListWidth(Math.max(320, node.clientWidth));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (closeExerciseSheetTimeoutRef.current !== null) window.clearTimeout(closeExerciseSheetTimeoutRef.current);
  }, []);

  const openMobileActionSheet = (exercise: any) => {
    if (closeExerciseSheetTimeoutRef.current !== null) {
      window.clearTimeout(closeExerciseSheetTimeoutRef.current);
      closeExerciseSheetTimeoutRef.current = null;
    }
    setIsClosingMobileExerciseSheet(false);
    setIsDraggingMobileExerciseSheet(false);
    mobileExerciseSheetDragOffsetRef.current = 0;
    setMobileActionExercise(exercise);
  };

  const closeMobileActionSheet = () => {
    if (!mobileActionExercise) return;
    setIsClosingMobileExerciseSheet(true);
    setIsDraggingMobileExerciseSheet(false);
    mobileExerciseSheetDragOffsetRef.current = 0;
    closeExerciseSheetTimeoutRef.current = window.setTimeout(() => {
      setMobileActionExercise(null);
      setIsClosingMobileExerciseSheet(false);
      mobileExerciseSheetDragOffsetRef.current = 0;
      closeExerciseSheetTimeoutRef.current = null;
    }, MOBILE_EXERCISE_SHEET_ANIMATION_MS);
  };

  const handleMobileSheetPointerStart = (clientY: number) => {
    mobileExerciseSheetDragStartYRef.current = clientY;
    mobileExerciseSheetDragOffsetRef.current = 0;
    setIsDraggingMobileExerciseSheet(true);
    setIsClosingMobileExerciseSheet(false);
    if (mobileExerciseSheetRef.current) {
      mobileExerciseSheetRef.current.style.transition = "none";
    }
  };

  const handleMobileSheetPointerMove = (clientY: number) => {
    if (mobileExerciseSheetDragStartYRef.current === null) return;
    const deltaY = Math.max(0, clientY - mobileExerciseSheetDragStartYRef.current);
    mobileExerciseSheetDragOffsetRef.current = deltaY;
    if (mobileExerciseSheetRef.current) {
      mobileExerciseSheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    }
  };

  const handleMobileSheetPointerEnd = () => {
    if (mobileExerciseSheetDragStartYRef.current === null) return;
    mobileExerciseSheetDragStartYRef.current = null;
    setIsDraggingMobileExerciseSheet(false);
    if (!mobileExerciseSheetRef.current) return;
    const sheet = mobileExerciseSheetRef.current;
    const dragOffset = mobileExerciseSheetDragOffsetRef.current;
    sheet.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
    if (dragOffset >= MOBILE_EXERCISE_SHEET_CLOSE_DRAG_THRESHOLD) {
      setIsClosingMobileExerciseSheet(true);
      sheet.style.transform = "translate3d(0, 100%, 0)";
      sheet.style.opacity = "0";
      closeExerciseSheetTimeoutRef.current = window.setTimeout(() => {
        setMobileActionExercise(null);
        setIsClosingMobileExerciseSheet(false);
        mobileExerciseSheetDragOffsetRef.current = 0;
        if (mobileExerciseSheetRef.current) {
          mobileExerciseSheetRef.current.style.transform = "";
          mobileExerciseSheetRef.current.style.opacity = "";
          mobileExerciseSheetRef.current.style.transition = "";
        }
        closeExerciseSheetTimeoutRef.current = null;
      }, MOBILE_EXERCISE_SHEET_ANIMATION_MS);
      return;
    }
    mobileExerciseSheetDragOffsetRef.current = 0;
    sheet.style.transform = "translate3d(0, 0, 0)";
    sheet.style.opacity = "1";
  };

  return (
    <>
    <Stack spacing={0} display={{ base: "flex", md: "none" }} w="full" minH="calc(100vh - 118px)" bg="#f6f7fb" px={2.5} py={3} position="relative">
      <Stack spacing={3} mt={5}>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="#334155"><SearchIcon boxSize={3.5} /></InputLeftElement>
          <Input value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} placeholder="Buscar ejercicios" bg="#eef3fb" borderColor="transparent" borderRadius="10px" h="42px" fontSize="13px" _hover={{ borderColor: "transparent" }} _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }} />
        </InputGroup>
        <Text fontSize="11px" fontWeight="800" color="#697386" letterSpacing="0.08em">
          MIS EJERCICIOS
        </Text>
        {!!visibleExercises.length && visibleExercises.map((ex: any) => {
          const isExpanded = expandedExercise === ex.id;
          return (
            <Box
              key={ex.id}
              bg="white"
              borderWidth="1px"
              borderColor="#e5e7eb"
              borderRadius="10px"
              overflow="hidden"
              boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)"
              transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease"
              _hover={{ borderColor: "#fdba74" }}
              _active={{ transform: "scale(0.985)", bg: "#f8fafc" }}
            >
              <HStack p={3.5} align="center" spacing={3} cursor="pointer" onClick={() => setExpandedExercise((prev: any) => (prev === ex.id ? null : ex.id))}>
                <Box boxSize="28px" borderRadius="8px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Image src={bowIconUrl} alt="" boxSize="15px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                </Box>
                <Stack spacing={0} flex="1" minW={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="13px" noOfLines={1}>{ex.name}</Text>
                  <Text color="#667085" fontSize="10px" noOfLines={1}>{ex.arrows_count} flechas · {ex.distance_m} m</Text>
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
                        openMobileActionSheet(ex);
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
                  <Stack spacing={2.5} color="#667085" fontSize="11px">
                    <Text>Distancia: {ex.distance_m} m</Text>
                    <Text>Flechas: {ex.arrows_count}</Text>
                    <Text>Descripción: {ex.description || "Sin descripción"}</Text>
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
        {!filteredExercises.length && <Text color="gray.600">No hay ejercicios para mostrar.</Text>}
        {filteredExercises.length > visibleExercises.length && (
          <Button alignSelf="center" variant="outline" borderColor="gray.300" onClick={showMoreExercises}>
            Mostrar más ejercicios
          </Button>
        )}
      </Stack>
      <Button position="fixed" right="18px" bottom="84px" zIndex={40} boxSize="52px" minW="52px" borderRadius="full" bg="#fb5a13" color="white" boxShadow="0 12px 26px rgba(251, 90, 19, 0.35)" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => setCreateModalOpen(true)}>
        <Image src={bowIconUrl} alt="Crear ejercicio" boxSize="20px" filter="brightness(0) invert(1)" />
      </Button>
      {mobileActionExercise && (
        <Box position="fixed" inset={0} zIndex={60} bg="rgba(15, 23, 42, 0.32)" onClick={closeMobileActionSheet}>
          <Box
            ref={mobileExerciseSheetRef}
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
            animation={isDraggingMobileExerciseSheet ? "none" : `${isClosingMobileExerciseSheet ? mobileExerciseSheetSlideDown : mobileExerciseSheetSlideUp} ${MOBILE_EXERCISE_SHEET_ANIMATION_MS}ms ease-out`}
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
              <Heading size="md" color="#1f2937">Acciones de ejercicio</Heading>
              <Stack spacing={3}>
                <MobileExerciseActionButton
                  icon={<Image src={editIconUrl} alt="Editar ejercicio" boxSize="17px" />}
                  title="Editar ejercicio"
                  description="Modificar nombre, distancia y configuración"
                  onClick={() => {
                    closeMobileActionSheet();
                    openEditExerciseModal(mobileActionExercise);
                  }}
                />
                <MobileExerciseActionButton
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
                  title="Eliminar ejercicio"
                  description="Borrar el ejercicio de forma permanente"
                  onClick={() => {
                    closeMobileActionSheet();
                    setDeleteExercise(mobileActionExercise);
                    setDeleteModalOpen(true);
                  }}
                />
              </Stack>
              <HStack spacing={3} px={1} pt={2}>
                <Box boxSize="42px" borderRadius="12px" bg="#fff1e8" color="#fb5a13" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Image src={bowIconUrl} alt="" boxSize="18px" filter="brightness(0) saturate(100%) invert(52%) sepia(94%) saturate(2602%) hue-rotate(1deg) brightness(103%) contrast(105%)" />
                </Box>
                <Stack spacing={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="14px">{mobileActionExercise.name}</Text>
                  <Text fontSize="11px" color="#667085">{mobileActionExercise.distance_m} m · {mobileActionExercise.arrows_count} flechas</Text>
                </Stack>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>

    <Stack spacing={6} display={{ base: "none", md: "flex" }}>
      <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
        <InputGroup maxW="420px">
          <InputLeftElement pointerEvents="none" color="gray.500"><SearchIcon boxSize={3.5} /></InputLeftElement>
          <Input value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} placeholder="Buscar ejercicios" bg="white" borderColor="gray.300" borderRadius="10px" _hover={{ borderColor: "gray.400" }} _focus={{ borderColor: "gray.500", bg: "white" }} />
        </InputGroup>
        <Button bg="#f97316" color="white" borderRadius="10px" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => setCreateModalOpen(true)}>
          <HStack justify="center" spacing={2}>
            <Image src={bowIconUrl} alt="Bow icon" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Crear ejercicio</Text>
          </HStack>
        </Button>
      </HStack>
      <HStack align="flex-start" spacing={8} justify="space-between" w="full">
        <Stack spacing={4} flex="1" maxW="980px" ref={listContainerRef}>
          {!!visibleExercises.length && visibleExercises.map((ex: any) => {
            const isExpanded = expandedExercise === ex.id;
            return (
              <Box
                key={ex.id}
                w="full"
                borderWidth="1px"
                borderRadius="12px"
                borderColor="gray.200"
                bg="white"
                overflow="hidden"
                transition="border-color 0.2s ease, background-color 0.2s ease"
                _hover={{ borderColor: "gray.300", bg: "gray.50", cursor: "pointer" }}
                onClick={() => setExpandedExercise((prev: any) => (prev === ex.id ? null : ex.id))}
              >
                <Box p={{ base: 4, xl: 5 }}>
                  <Stack spacing={2}>
                    <HStack justify="space-between" align="flex-start">
                      <Heading size="md" color="gray.900">{ex.name}</Heading>
                      <Box
                        as="span"
                        color="gray.400"
                        fontSize="xl"
                        lineHeight="1"
                        transition="transform 0.22s ease, color 0.22s ease"
                        transform={isExpanded ? "rotate(90deg)" : "rotate(0deg)"}
                      >
                        ▸
                      </Box>
                    </HStack>
                    <Text color="gray.500">{ex.arrows_count} flechas</Text>
                    <Collapse in={isExpanded} animateOpacity>
                      <Stack
                        spacing={1.5}
                        color="gray.700"
                        pt={1}
                        opacity={isExpanded ? 1 : 0}
                        transform={isExpanded ? "translateY(0)" : "translateY(-4px)"}
                        transition="opacity 0.22s ease, transform 0.22s ease"
                      >
                        <Text color="gray.500">Distancia: {ex.distance_m} m</Text>
                        <Text color="gray.500" fontSize="95%">Descripción: {ex.description || "Sin descripción"}</Text>
                      </Stack>
                    </Collapse>
                  </Stack>
                </Box>
                <Collapse in={isExpanded} animateOpacity>
                  <HStack
                    justify="flex-start"
                    spacing={2}
                    px={5}
                    py={3}
                    bg="gray.50"
                    borderTopWidth="1px"
                    borderColor="gray.200"
                    opacity={isExpanded ? 1 : 0}
                    transform={isExpanded ? "translateY(0)" : "translateY(-4px)"}
                    transition="opacity 0.22s ease, transform 0.22s ease"
                  >
                    <Button
                      size={actionIconButtonSize}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ bg: "gray.100", color: "blue.600" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditExerciseModal(ex);
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
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </Box>
                    </Button>
                  </HStack>
                </Collapse>
              </Box>
            );
          })}
          {!filteredExercises.length && <Text color="gray.600">No hay ejercicios para mostrar.</Text>}
          {filteredExercises.length > visibleExercises.length && (
            <Button alignSelf="center" variant="outline" borderColor="gray.300" onClick={showMoreExercises}>
              Mostrar más ejercicios
            </Button>
          )}
        </Stack>
      </HStack>
    </Stack>
    </>
  );
}

function MobileExerciseActionButton({
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

export default memo(ExercisesSection);
