import { Badge, Box, Button, Collapse, Heading, HStack, Image, Input, InputGroup, InputLeftElement, Stack, Text } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { useProfessorLists } from "../context/ProfessorListsContext";

const mobileSheetSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const mobileSheetSlideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const MOBILE_SHEET_ANIMATION_MS = 180;
const MOBILE_SHEET_CLOSE_DRAG_THRESHOLD = 110;

type Props = any;

function StudentsSection({
  expandedStudent,
  setExpandedStudent,
  setCreateStudentModalOpen,
  userPlusIconUrl,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  openEditStudentModal,
  setDeactivateStudent,
  setDeactivateError,
  setDeactivateModalOpen,
  openAssignRoutineModal,
  openStudentHistoryModal,
  setActivateStudent,
  setActivateError,
  setActivateModalOpen,
}: Props) {
  const [mobileActionStudent, setMobileActionStudent] = useState<any | null>(null);
  const [isClosingMobileSheet, setIsClosingMobileSheet] = useState(false);
  const [isDraggingMobileSheet, setIsDraggingMobileSheet] = useState(false);
  const closeSheetTimeoutRef = useRef<number | null>(null);
  const mobileSheetDragStartYRef = useRef<number | null>(null);
  const mobileSheetDragOffsetRef = useRef(0);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const {
    studentSearch,
    setStudentSearch,
    visibleActiveStudents,
    filteredActiveStudents,
    showMoreActiveStudents,
    visibleInactiveStudents,
    filteredInactiveStudents,
    showMoreInactiveStudents,
  } = useProfessorLists();

  useEffect(() => () => {
    if (closeSheetTimeoutRef.current !== null) window.clearTimeout(closeSheetTimeoutRef.current);
  }, []);

  const openMobileActionSheet = (student: any) => {
    if (closeSheetTimeoutRef.current !== null) {
      window.clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }
    setIsClosingMobileSheet(false);
    setIsDraggingMobileSheet(false);
    mobileSheetDragOffsetRef.current = 0;
    setMobileActionStudent(student);
  };

  const closeMobileActionSheet = () => {
    if (!mobileActionStudent) return;
    setIsClosingMobileSheet(true);
    setIsDraggingMobileSheet(false);
    mobileSheetDragOffsetRef.current = 0;
    closeSheetTimeoutRef.current = window.setTimeout(() => {
      setMobileActionStudent(null);
      setIsClosingMobileSheet(false);
      mobileSheetDragOffsetRef.current = 0;
      closeSheetTimeoutRef.current = null;
    }, MOBILE_SHEET_ANIMATION_MS);
  };

  const handleMobileSheetPointerStart = (clientY: number) => {
    mobileSheetDragStartYRef.current = clientY;
    mobileSheetDragOffsetRef.current = 0;
    setIsDraggingMobileSheet(true);
    setIsClosingMobileSheet(false);
    if (mobileSheetRef.current) {
      mobileSheetRef.current.style.transition = "none";
    }
  };

  const handleMobileSheetPointerMove = (clientY: number) => {
    if (mobileSheetDragStartYRef.current === null) return;
    const deltaY = Math.max(0, clientY - mobileSheetDragStartYRef.current);
    mobileSheetDragOffsetRef.current = deltaY;
    if (mobileSheetRef.current) {
      mobileSheetRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`;
    }
  };

  const handleMobileSheetPointerEnd = () => {
    if (mobileSheetDragStartYRef.current === null) return;
    mobileSheetDragStartYRef.current = null;
    setIsDraggingMobileSheet(false);
    if (!mobileSheetRef.current) return;
    const sheet = mobileSheetRef.current;
    const dragOffset = mobileSheetDragOffsetRef.current;
    sheet.style.transition = "transform 180ms ease-out, opacity 180ms ease-out";
    if (dragOffset >= MOBILE_SHEET_CLOSE_DRAG_THRESHOLD) {
      setIsClosingMobileSheet(true);
      sheet.style.transform = "translate3d(0, 100%, 0)";
      sheet.style.opacity = "0";
      closeSheetTimeoutRef.current = window.setTimeout(() => {
        setMobileActionStudent(null);
        setIsClosingMobileSheet(false);
        mobileSheetDragOffsetRef.current = 0;
        if (mobileSheetRef.current) {
          mobileSheetRef.current.style.transform = "";
          mobileSheetRef.current.style.opacity = "";
          mobileSheetRef.current.style.transition = "";
        }
        closeSheetTimeoutRef.current = null;
      }, MOBILE_SHEET_ANIMATION_MS);
      return;
    }
    mobileSheetDragOffsetRef.current = 0;
    sheet.style.transform = "translate3d(0, 0, 0)";
    sheet.style.opacity = "1";
  };

  return (
    <>
    <Stack spacing={4} display={{ base: "flex", md: "none" }} w="full" minH="calc(100vh - 118px)" bg="#f6f7fb" px={3.5} py={4} position="relative">
      <InputGroup>
        <InputLeftElement pointerEvents="none" color="#334155"><SearchIcon boxSize={3.5} /></InputLeftElement>
        <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Buscar deportistas" bg="#eef3fb" borderColor="transparent" borderRadius="10px" h="42px" fontSize="13px" _hover={{ borderColor: "transparent" }} _focusVisible={{ borderColor: "#fb5a13", boxShadow: "0 0 0 1px #fb5a13", bg: "white" }} />
      </InputGroup>

      <Stack spacing={3}>
        <HStack justify="space-between" align="center">
          <Heading size="sm" color="#1f2937">Deportistas activos</Heading>
          <Text fontSize="10px" color="#92400e" fontWeight="700">{filteredActiveStudents.length} deportistas</Text>
        </HStack>
        <Stack spacing={2.5}>
          {visibleActiveStudents.map((st: any) => (
            <MobileStudentCard
              key={st.id}
              student={st}
              status="active"
              isExpanded={expandedStudent === st.id}
              onClick={() => setExpandedStudent((prev: any) => (prev === st.id ? null : st.id))}
              onOpenActions={() => openMobileActionSheet(st)}
            />
          ))}
          {!filteredActiveStudents.length && (
            <Box bg="white" borderRadius="10px" borderWidth="1px" borderColor="#e5e7eb" p={4}>
              <Text color="#667085" fontSize="sm">No hay deportistas activos.</Text>
            </Box>
          )}
          {filteredActiveStudents.length > visibleActiveStudents.length && (
            <Button alignSelf="center" size="sm" variant="outline" borderColor="gray.300" onClick={showMoreActiveStudents}>
              Mostrar más
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={3} pb={8}>
        <Heading size="sm" color="#1f2937">Deportistas inactivos</Heading>
        {!!visibleInactiveStudents.length && (
          <Stack spacing={2.5}>
            {visibleInactiveStudents.map((st: any) => (
              <MobileStudentCard
                key={st.id}
                student={st}
                status="inactive"
                isExpanded={expandedStudent === st.id}
                onClick={() => setExpandedStudent((prev: any) => (prev === st.id ? null : st.id))}
                onOpenActions={() => openMobileActionSheet(st)}
              />
            ))}
          </Stack>
        )}
        {!filteredInactiveStudents.length && (
          <Box minH="122px" borderWidth="1px" borderStyle="dashed" borderColor="#fdba74" borderRadius="12px" bg="#eef3fb" display="flex" alignItems="center" justifyContent="center">
            <Stack spacing={2} align="center" color="#92400e">
              <Box as="svg" viewBox="0 0 24 24" boxSize="26px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.45}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="m2 2 20 20" />
              </Box>
              <Text color="#334155" fontSize="12px">No hay deportistas inactivos.</Text>
            </Stack>
          </Box>
        )}
        {filteredInactiveStudents.length > visibleInactiveStudents.length && (
          <Button alignSelf="center" size="sm" variant="outline" borderColor="gray.300" onClick={showMoreInactiveStudents}>
            Mostrar más
          </Button>
        )}
      </Stack>

      <Button position="fixed" right="18px" bottom="84px" zIndex={40} boxSize="52px" minW="52px" borderRadius="full" bg="#fb5a13" color="white" boxShadow="0 12px 26px rgba(251, 90, 19, 0.35)" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => setCreateStudentModalOpen(true)}>
        <Image src={userPlusIconUrl} alt="Crear nuevo deportista" boxSize="20px" filter="brightness(0) invert(1)" />
      </Button>
      {mobileActionStudent && (
        <Box position="fixed" inset={0} zIndex={60} bg="rgba(15, 23, 42, 0.32)" onClick={closeMobileActionSheet}>
          <Box
            ref={mobileSheetRef}
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
            animation={isDraggingMobileSheet ? "none" : `${isClosingMobileSheet ? mobileSheetSlideDown : mobileSheetSlideUp} ${MOBILE_SHEET_ANIMATION_MS}ms ease-out`}
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
              <Heading size="md" color="#1f2937">Acciones de deportista</Heading>
              <Stack spacing={3}>
                <MobileActionButton
                  icon={<Image src={editIconUrl} alt="Editar deportista" boxSize="17px" />}
                  iconTone="neutral"
                  title="Editar deportista"
                  description="Modificar información personal y técnica"
                  onClick={() => {
                    closeMobileActionSheet();
                    openEditStudentModal(mobileActionStudent);
                  }}
                />
                {mobileActionStudent.is_active ? (
                  <>
                    <MobileActionButton
                      icon={
                        <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </Box>
                      }
                      iconTone="neutral"
                      title="Asignar rutina"
                      description="Programar sesiones de tiro y técnica"
                      onClick={() => {
                        closeMobileActionSheet();
                        openAssignRoutineModal(mobileActionStudent);
                      }}
                    />
                    <MobileActionButton
                      icon={
                        <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M12 7v5l4 2" />
                        </Box>
                      }
                      iconTone="neutral"
                      title="Ver historial"
                      description="Consultar rutinas y progreso reciente"
                      onClick={() => {
                        closeMobileActionSheet();
                        openStudentHistoryModal(mobileActionStudent);
                      }}
                    />
                    <MobileActionButton
                      tone="danger"
                      icon={
                        <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                          <path d="m14.5 9.5-5 5" />
                          <path d="m9.5 9.5 5 5" />
                        </Box>
                      }
                      iconTone="danger"
                      title="Desactivar deportista"
                      description="Quitar acceso y ocultarlo de los activos"
                      onClick={() => {
                        closeMobileActionSheet();
                        setDeactivateStudent(mobileActionStudent);
                        setDeactivateError(null);
                        setDeactivateModalOpen(true);
                      }}
                    />
                  </>
                ) : (
                  <MobileActionButton
                    icon={
                      <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                        <path d="m9 12 2 2 4-4" />
                      </Box>
                    }
                    iconTone="neutral"
                    title="Activar deportista"
                    description="Volver a habilitar acceso y mostrarlo en activos"
                    onClick={() => {
                      closeMobileActionSheet();
                      setActivateStudent(mobileActionStudent);
                      setActivateError(null);
                      setActivateModalOpen(true);
                    }}
                  />
                )}
              </Stack>
              <HStack spacing={3} px={1} pt={2}>
                <Box boxSize="42px" borderRadius="full" bg="#e8eefc" color="#475569" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="800" flexShrink={0}>
                  {getStudentInitials(mobileActionStudent.full_name) || "AA"}
                </Box>
                <Stack spacing={0}>
                  <Text fontWeight="800" color="#1f2937" fontSize="14px">{mobileActionStudent.full_name}</Text>
                  <Text fontSize="11px" color="#667085">{mobileActionStudent.contact || mobileActionStudent.document_number}</Text>
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
          <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Buscar deportistas" bg="white" borderColor="gray.300" borderRadius="10px" _hover={{ borderColor: "gray.400" }} _focus={{ borderColor: "gray.500", bg: "white" }} />
        </InputGroup>
        <Button bg="#f97316" color="white" borderRadius="10px" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => setCreateStudentModalOpen(true)}>
          <HStack justify="center" spacing={2}>
            <Image src={userPlusIconUrl} alt="Crear nuevo deportista" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Crear nuevo deportista</Text>
          </HStack>
        </Button>
      </HStack>
      <Stack spacing={6} w="full" maxW={{ md: "100%", xl: "980px" }}>
        <Stack spacing={3}>
          <Heading size="md" color="black">Deportistas activos</Heading>
          {!!visibleActiveStudents.length && visibleActiveStudents.map((st: any) => {
            const isExpanded = expandedStudent === st.id;
            return (
              <Box key={st.id} borderWidth="1px" borderRadius="12px" borderColor="gray.200" bg="white" overflow="hidden" transition="border-color 0.2s ease, background-color 0.2s ease" _hover={{ borderColor: "gray.300", bg: "gray.50", cursor: "pointer" }} onClick={() => setExpandedStudent((prev: any) => (prev === st.id ? null : st.id))}>
                <Box p={{ base: 4, xl: 5 }}>
                  <HStack justify="space-between" align="start">
                    <Heading size="md" color="gray.900" fontWeight="normal">{st.full_name}</Heading>
                    <HStack spacing={3} align="center">
                      <Badge colorScheme="green">Activo</Badge>
                      <Box as="span" color="gray.400" fontSize="xl" lineHeight="1" transition="transform 0.22s ease, color 0.22s ease" transform={isExpanded ? "rotate(90deg)" : "rotate(0deg)"}>
                        ▸
                      </Box>
                    </HStack>
                  </HStack>
                  <Collapse in={isExpanded} animateOpacity>
                    <Stack spacing={1.5} mt={2} color="gray.600" fontSize="sm" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease">
                      <Text>DNI: {st.document_number}</Text>
                      {st.contact && <Text>Contacto: {st.contact}</Text>}
                      {typeof st.bow_pounds === "number" && <Text>Arco: {st.bow_pounds} lb</Text>}
                      {typeof st.arrows_available === "number" && <Text>Flechas: {st.arrows_available}</Text>}
                    </Stack>
                  </Collapse>
                </Box>
                <Collapse in={isExpanded} animateOpacity>
                  <HStack justify="space-between" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease" flexWrap="wrap" rowGap={3}>
                    <HStack spacing={2} flexWrap="wrap">
                      <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "gray.100", color: "blue.600" }} onClick={(e) => { e.stopPropagation(); openEditStudentModal(st); }}>
                        <Image src={editIconUrl} alt="Editar deportista" boxSize={actionIconSize} />
                      </Button>
                      <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "red.50", color: "red.600" }} onClick={(e) => { e.stopPropagation(); setDeactivateStudent(st); setDeactivateError(null); setDeactivateModalOpen(true); }}>
                        <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m14.5 9.5-5 5" /><path d="m9.5 9.5 5 5" /></Box>
                      </Button>
                    </HStack>
                    <HStack spacing={2}>
                      <Button
                        size={actionIconButtonSize}
                        variant="outline"
                        borderRadius="lg"
                        borderColor="gray.300"
                        color="gray.700"
                        _hover={{ borderColor: "gray.500", bg: "gray.50" }}
                        onClick={(e) => { e.stopPropagation(); openStudentHistoryModal(st); }}
                      >
                        <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize={actionIconSize} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                          <path d="M12 7v5l4 2" />
                        </Box>
                      </Button>
                      <Button size={{ base: "sm", xl: "md", "2xl": "lg" }} variant="outline" borderRadius="lg" borderColor="gray.300" color="gray.800" _hover={{ borderColor: "gray.500", bg: "gray.50" }} onClick={(e) => { e.stopPropagation(); openAssignRoutineModal(st); }} h="40px" px={3}>
                        <HStack spacing={2}>
                          <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M8 12h8" /><path d="M12 8v8" /></Box>
                          <Text fontSize="sm" fontWeight="bold">Asignar rutina</Text>
                        </HStack>
                      </Button>
                    </HStack>
                  </HStack>
                </Collapse>
              </Box>
            );
          })}
          {!filteredActiveStudents.length && <Text color="gray.600">No hay deportistas activos.</Text>}
          {filteredActiveStudents.length > visibleActiveStudents.length && (
            <Button alignSelf="center" variant="outline" borderColor="gray.300" onClick={showMoreActiveStudents}>
              Mostrar más deportistas activos
            </Button>
          )}
        </Stack>

        <Stack spacing={3}>
          <Heading size="md" color="black">Deportistas inactivos</Heading>
          {!!visibleInactiveStudents.length && visibleInactiveStudents.map((st: any) => {
            const isExpanded = expandedStudent === st.id;
            return (
              <Box key={st.id} borderWidth="1px" borderRadius="12px" borderColor="gray.200" bg="white" overflow="hidden" transition="border-color 0.2s ease, background-color 0.2s ease" _hover={{ borderColor: "gray.300", bg: "gray.50", cursor: "pointer" }} onClick={() => setExpandedStudent((prev: any) => (prev === st.id ? null : st.id))}>
                <Box p={{ base: 4, xl: 5 }}>
                  <HStack justify="space-between" align="start">
                    <Heading size="md" color="gray.900" fontWeight="normal">{st.full_name}</Heading>
                    <HStack spacing={3} align="center">
                      <Badge colorScheme="red">Inactivo</Badge>
                      <Box as="span" color="gray.400" fontSize="xl" lineHeight="1" transition="transform 0.22s ease, color 0.22s ease" transform={isExpanded ? "rotate(90deg)" : "rotate(0deg)"}>
                        ▸
                      </Box>
                    </HStack>
                  </HStack>
                  <Collapse in={isExpanded} animateOpacity>
                    <Stack spacing={1.5} mt={2} color="gray.600" fontSize="sm" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease">
                      <Text>DNI: {st.document_number}</Text>
                      {st.contact && <Text>Contacto: {st.contact}</Text>}
                      {typeof st.bow_pounds === "number" && <Text>Arco: {st.bow_pounds} lb</Text>}
                      {typeof st.arrows_available === "number" && <Text>Flechas: {st.arrows_available}</Text>}
                    </Stack>
                  </Collapse>
                </Box>
                <Collapse in={isExpanded} animateOpacity>
                  <HStack justify="space-between" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease" flexWrap="wrap" rowGap={3}>
                    <HStack spacing={2}>
                      <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "gray.100", color: "blue.600" }} onClick={(e) => { e.stopPropagation(); openEditStudentModal(st); }}>
                        <Image src={editIconUrl} alt="Editar deportista" boxSize={actionIconSize} />
                      </Button>
                      <Button size={actionIconButtonSize} variant="ghost" color="gray.400" _hover={{ bg: "green.50", color: "green.600" }} onClick={(e) => { e.stopPropagation(); setActivateStudent(st); setActivateError(null); setActivateModalOpen(true); }}>
                        <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" boxSize="16px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></Box>
                      </Button>
                    </HStack>
                  </HStack>
                </Collapse>
              </Box>
            );
          })}
          {!filteredInactiveStudents.length && <Text color="gray.600">No hay deportistas inactivos.</Text>}
          {filteredInactiveStudents.length > visibleInactiveStudents.length && (
            <Button alignSelf="center" variant="outline" borderColor="gray.300" onClick={showMoreInactiveStudents}>
              Mostrar más deportistas inactivos
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
    </>
  );
}

function MobileStudentCard({ student, status, isExpanded, onClick, onOpenActions }: { student: any; status: "active" | "inactive"; isExpanded: boolean; onClick: () => void; onOpenActions: () => void }) {
  const initials = getStudentInitials(student.full_name);

  return (
    <Box bg="white" borderRadius="10px" borderWidth="1px" borderColor="#e5e7eb" borderLeftWidth="3px" borderLeftColor="#fb5a13" boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)" overflow="hidden" cursor="pointer" transition="transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease" _hover={{ borderColor: "#fdba74" }} _active={{ transform: "scale(0.985)", bg: "#f8fafc" }} onClick={onClick}>
      <HStack align="center" spacing={3} p={3}>
        <Box boxSize="36px" borderRadius="full" bg="#e8eefc" color="#475569" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="800" flexShrink={0}>
          {initials || "AA"}
        </Box>
        <Stack spacing={1} flex="1" minW={0}>
          <Text fontSize="12px" fontWeight="800" color="#1f2937" noOfLines={1}>{student.full_name}</Text>
          <Badge alignSelf="start" bg={status === "active" ? "green.100" : "red.100"} color={status === "active" ? "green.800" : "red.700"} borderRadius="4px" px={1.5} py={0.5} fontSize="9px">
            {status === "active" ? "ACTIVO" : "INACTIVO"}
          </Badge>
        </Stack>
        <Stack spacing={1} align="center" flexShrink={0}>
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
                onOpenActions();
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
        <Stack spacing={2} px={3} pb={3} pl="54px" color="#667085" fontSize="11px">
          <Text>DNI: {student.document_number}</Text>
          {student.contact && <Text>Contacto: {student.contact}</Text>}
          {typeof student.bow_pounds === "number" && <Text>Arco: {student.bow_pounds} lb</Text>}
          {typeof student.arrows_available === "number" && <Text>Flechas: {student.arrows_available}</Text>}
        </Stack>
      </Collapse>
    </Box>
  );
}

function MobileActionButton({
  icon,
  iconTone = "orange",
  title,
  description,
  tone = "default",
  onClick,
}: {
  icon: ReactNode;
  iconTone?: "neutral" | "orange" | "danger";
  title: string;
  description: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  const danger = tone === "danger";
  const iconColor = iconTone === "danger" ? "#dc2626" : iconTone === "orange" ? "#fb5a13" : "#64748b";

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
        <Box boxSize="38px" borderRadius="10px" bg="white" color={iconColor} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
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

function getStudentInitials(fullName: string) {
  return fullName
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("");
}

export default memo(StudentsSection);

