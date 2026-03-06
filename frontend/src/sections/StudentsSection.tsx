import { Badge, Box, Button, Collapse, Heading, HStack, Image, Input, InputGroup, InputLeftElement, Stack, Text } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { memo } from "react";
import { useProfessorLists } from "../context/ProfessorListsContext";

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

  return (
    <Stack spacing={6}>
      <HStack justify="space-between" align="center" spacing={4} w="full" maxW="980px">
        <InputGroup maxW="420px">
          <InputLeftElement pointerEvents="none" color="gray.500"><SearchIcon boxSize={3.5} /></InputLeftElement>
          <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Buscar deportistas" bg="white" borderColor="gray.300" borderRadius="10px" _hover={{ borderColor: "gray.400" }} _focus={{ borderColor: "gray.500", bg: "white" }} />
        </InputGroup>
        <Button bg="#f97316" color="white" borderRadius="10px" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={() => setCreateStudentModalOpen(true)}>
          <HStack justify="center" spacing={2}>
            <Image src={userPlusIconUrl} alt="Agregar deportista" boxSize="16px" filter="brightness(0) invert(1)" />
            <Text>Agregar deportista</Text>
          </HStack>
        </Button>
      </HStack>
      <Stack spacing={6} w="full" maxW="980px">
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
                  <HStack justify="space-between" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease">
                    <HStack spacing={2}>
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
                  <HStack justify="space-between" align="center" px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200" opacity={isExpanded ? 1 : 0} transform={isExpanded ? "translateY(0)" : "translateY(-4px)"} transition="opacity 0.22s ease, transform 0.22s ease">
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
  );
}

export default memo(StudentsSection);

