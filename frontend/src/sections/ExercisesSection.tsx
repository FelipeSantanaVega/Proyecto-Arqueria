import { memo } from "react";
import { Box, Button, Collapse, Heading, HStack, Image, Input, InputGroup, InputLeftElement, Stack, Text } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useLayoutEffect, useRef, useState } from "react";
import { VariableSizeList as List, type ListChildComponentProps, type VariableSizeList } from "react-window";
import { useProfessorLists } from "../context/ProfessorListsContext";

type Props = any;

function ExercisesSection({
  expandedExercise,
  setExpandedExercise,
  setCreateModalOpen,
  setEditExercise,
  setEditName,
  setEditArrows,
  setEditDistance,
  setEditDescription,
  setEditError,
  setEditModalOpen,
  setDeleteExercise,
  setDeleteModalOpen,
  actionIconButtonSize,
  actionIconSize,
  editIconUrl,
  bowIconUrl,
}: Props) {
  const { exerciseSearch, setExerciseSearch, visibleExercises, filteredExercises, showMoreExercises } = useProfessorLists();
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<VariableSizeList | null>(null);
  const [listWidth, setListWidth] = useState(900);
  const EXERCISE_ROW_GAP = 12;
  const EXERCISE_COLLAPSED_SIZE = 98;
  const EXERCISE_EXPANDED_SIZE = 248;

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

  const getItemSize = (index: number) => {
    const ex: any = visibleExercises[index];
    if (!ex) return EXERCISE_COLLAPSED_SIZE + EXERCISE_ROW_GAP;
    return (expandedExercise === ex.id ? EXERCISE_EXPANDED_SIZE : EXERCISE_COLLAPSED_SIZE) + EXERCISE_ROW_GAP;
  };

  const listHeight = Math.min(
    680,
    Math.max(160, visibleExercises.reduce((sum, _ex, idx) => sum + getItemSize(idx), 0)),
  );

  useLayoutEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [expandedExercise, visibleExercises.length]);

  const ExerciseRow = ({ index, style }: ListChildComponentProps) => {
    const ex: any = visibleExercises[index];
    return (
      <Box style={style} px={0} pt={0} pb={`${EXERCISE_ROW_GAP}px`}>
        <Box
          w="full"
          borderWidth="1px"
          borderRadius="12px"
          borderColor="gray.200"
          bg="white"
          overflow="hidden"
          _hover={{ borderColor: "gray.300", cursor: "pointer" }}
          onClick={() => setExpandedExercise((prev: any) => (prev === ex.id ? null : ex.id))}
        >
          <Box p={{ base: 4, xl: 5 }}>
            <Stack spacing={2}>
              <Heading size="md" color="gray.900">{ex.name}</Heading>
              <Text color="gray.500">{ex.arrows_count} flechas</Text>
              <Collapse in={expandedExercise === ex.id} animateOpacity>
                <Stack spacing={1.5} color="gray.700" pt={1}>
                  <Text color="gray.500">Distancia: {ex.distance_m} m</Text>
                  <Text color="gray.500" fontSize="95%">Descripción: {ex.description || "Sin descripción"}</Text>
                </Stack>
              </Collapse>
            </Stack>
          </Box>
          <Collapse in={expandedExercise === ex.id} animateOpacity>
            <HStack justify="flex-start" spacing={2} px={5} py={3} bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
              <Button
                size={actionIconButtonSize}
                variant="ghost"
                color="gray.400"
                _hover={{ bg: "gray.100", color: "blue.600" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditExercise(ex);
                  setEditName(ex.name);
                  setEditArrows(ex.arrows_count);
                  setEditDistance(ex.distance_m);
                  setEditDescription(ex.description || "");
                  setEditError(null);
                  setEditModalOpen(true);
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
      </Box>
    );
  };

  return (
    <Stack spacing={6}>
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
          {!!visibleExercises.length && (
            <List
              ref={listRef}
              height={listHeight}
              itemCount={visibleExercises.length}
              itemSize={getItemSize}
              estimatedItemSize={EXERCISE_COLLAPSED_SIZE + EXERCISE_ROW_GAP}
              width={listWidth}
            >
              {ExerciseRow}
            </List>
          )}
          {!filteredExercises.length && <Text color="gray.600">No hay ejercicios para mostrar.</Text>}
          {filteredExercises.length > visibleExercises.length && (
            <Button alignSelf="center" variant="outline" borderColor="gray.300" onClick={showMoreExercises}>
              Mostrar más ejercicios
            </Button>
          )}
        </Stack>
      </HStack>
    </Stack>
  );
}

export default memo(ExercisesSection);
