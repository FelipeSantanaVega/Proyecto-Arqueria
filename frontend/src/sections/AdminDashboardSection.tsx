import { Alert, AlertIcon, Badge, Box, Button, Container, FormControl, FormLabel, Heading, HStack, SimpleGrid, Spinner, Stack, Tag, Text, Select } from "@chakra-ui/react";
import { memo, type ReactNode } from "react";

type Props = any;

function AdminDashboardSection({
  token,
  goToProfessor,
  handleLogout,
  API_BASE,
  loading,
  error,
  health,
  healthIcon,
  activeUserCount,
  users,
  activeAssignments,
  activeStudents,
  stats,
  openAdminUserModal,
  adminUserMutationError,
  usersSortedByCreated,
  handleAdminUserUpdate,
  adminUserMutationId,
  professorUserCount,
  adminUserCount,
  students,
  routineNameById,
  studentNameById,
  formatDateEs,
  currentUsername,
  userRole,
  inactiveUsers,
  lastUserUpdate,
  formatDateTimeEs,
  recentUserChanges,
  recentUsers,
  getRoleLabel,
}: Props) {
  return (
    <Box bgGradient="linear(to-b, gray.50, white)">
      <Container maxW="6xl" py={10}>
        <Stack spacing={8}>
          <HStack spacing={3}>
            <Button alignSelf="flex-start" variant="outline" onClick={() => goToProfessor()}>
              Volver al panel
            </Button>
            {token && (
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </HStack>
          <Stack spacing={3}>
            <Heading size="lg">Panel de administración</Heading>
            <Text color="gray.600">
              Vista administrativa accesible desde <Text as="span" fontWeight="600">Ver conexiones</Text>. Conectado a la API FastAPI en{" "}
              <Tag colorScheme="blue" variant="subtle">
                {API_BASE}
              </Tag>
              .
            </Text>
          </Stack>

          {loading && (
            <HStack color="gray.600">
              <Spinner />
              <Text>Cargando datos...</Text>
            </HStack>
          )}

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Stack spacing={6}>
            <HStack justify="space-between" align={{ base: "start", md: "center" }} flexWrap="wrap">
              <Heading size="md">Estado del sistema</Heading>
              <Tag colorScheme={health?.status === "ok" ? "green" : "orange"} variant="subtle">
                {health?.status === "ok" ? "Base y API operativas" : "Sin respuesta de health"}
              </Tag>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
              <StatCard title="Estado API" value={health?.status === "ok" ? "Online" : "Desconocido"} icon={healthIcon} helper={health ? `Entorno: ${health.env}` : "Sin respuesta"} />
              <StatCard title="Usuarios activos" value={activeUserCount.toString()} helper={`${users.length} cuentas registradas`} />
              <StatCard title="Asignaciones activas" value={activeAssignments.length.toString()} helper={`${activeStudents.length} deportistas activos`} />
              <StatCard title="Plantillas de rutina" value={stats.routines.toString()} helper={`${stats.exercises} ejercicios disponibles`} />
            </SimpleGrid>
          </Stack>

          <Stack spacing={6}>
            <HStack justify="space-between" align={{ base: "start", md: "center" }} flexWrap="wrap">
              <Stack spacing={1}>
                <Heading size="md">Gestión de usuarios</Heading>
                <Text color="gray.600" fontSize="sm">
                  Alta de cuentas, cambio de rol y activación o desactivación de acceso.
                </Text>
              </Stack>
              <Button bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openAdminUserModal}>
                Crear usuario
              </Button>
            </HStack>
            {adminUserMutationError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {adminUserMutationError}
              </Alert>
            )}
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
              {usersSortedByCreated.map((user: any) => (
                <Box key={user.id} p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                  <Stack spacing={4}>
                    <HStack justify="space-between" align="start">
                      <Stack spacing={1}>
                        <Text fontWeight="700" color="gray.900">{user.username}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Creado: {formatDateTimeEs(user.created_at)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Actualizado: {formatDateTimeEs(user.updated_at)}
                        </Text>
                      </Stack>
                      <HStack spacing={2}>
                        <Badge colorScheme={user.is_active ? "green" : "gray"}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge colorScheme={user.role === "admin" ? "purple" : user.role === "professor" ? "blue" : "orange"}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </HStack>
                    </HStack>
                    <HStack align="end" spacing={3} flexWrap="wrap">
                      <FormControl maxW="220px">
                        <FormLabel fontSize="sm" color="gray.600" mb={1}>Rol</FormLabel>
                        <Select
                          size="sm"
                          value={user.role}
                          onChange={(e) => {
                            const nextRole = e.target.value;
                            void handleAdminUserUpdate(user.id, { role: nextRole, is_active: user.is_active });
                          }}
                          isDisabled={adminUserMutationId === user.id}
                        >
                          <option value="admin">Administrador</option>
                          <option value="professor">Profesor</option>
                          <option value="student">Deportista</option>
                        </Select>
                      </FormControl>
                      <Button
                        size="sm"
                        variant={user.is_active ? "outline" : "solid"}
                        borderColor={user.is_active ? "red.300" : "green.300"}
                        color={user.is_active ? "red.600" : "white"}
                        bg={user.is_active ? "transparent" : "green.500"}
                        _hover={user.is_active ? { bg: "red.50" } : { bg: "green.600" }}
                        isLoading={adminUserMutationId === user.id}
                        onClick={() => {
                          void handleAdminUserUpdate(user.id, { role: user.role, is_active: !user.is_active });
                        }}
                      >
                        {user.is_active ? "Desactivar acceso" : "Activar acceso"}
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              ))}
              {!usersSortedByCreated.length && !loading && (
                <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white">
                  <Text color="gray.600">No hay cuentas registradas.</Text>
                </Box>
              )}
            </SimpleGrid>
          </Stack>

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
            <Stack spacing={6}>
              <Heading size="md">Resumen operativo</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <StatCard title="Profesores" value={professorUserCount.toString()} helper="Usuarios con acceso docente" />
                <StatCard title="Administradores" value={adminUserCount.toString()} helper="Cuentas con gestión global" />
                <StatCard title="Deportistas activos" value={activeStudents.length.toString()} helper={`${students.length} deportistas totales`} />
                <StatCard title="Rutinas en curso" value={activeAssignments.length.toString()} helper="Asignaciones con estado activo" />
              </SimpleGrid>
              <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                <Heading size="sm" mb={4}>Rutinas activas</Heading>
                <Stack spacing={3}>
                  {activeAssignments.slice(0, 5).map((assignment: any) => (
                    <Box key={assignment.id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                      <HStack justify="space-between" align="start">
                        <Stack spacing={1}>
                          <Text fontWeight="600">
                            {routineNameById.get(assignment.routine_id) || `Rutina #${assignment.routine_id}`}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Deportista: {studentNameById.get(assignment.student_id) || `Deportista #${assignment.student_id}`}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Semana: {formatDateEs(assignment.start_date)} a {formatDateEs(assignment.end_date)}
                          </Text>
                        </Stack>
                        <Badge colorScheme="green">Activa</Badge>
                      </HStack>
                    </Box>
                  ))}
                  {!activeAssignments.length && <Text color="gray.600">No hay rutinas activas asignadas.</Text>}
                </Stack>
              </Box>
            </Stack>

            <Stack spacing={6}>
              <Heading size="md">Seguridad y auditoría</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <StatCard title="Sesión actual" value={currentUsername || "-"} helper={getRoleLabel(userRole)} />
                <StatCard title="Usuarios inactivos" value={inactiveUsers.length.toString()} helper={lastUserUpdate ? `Último cambio: ${formatDateTimeEs(lastUserUpdate.updated_at)}` : "Sin movimientos"} />
              </SimpleGrid>
              <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                <Heading size="sm" mb={4}>Actividad reciente de cuentas</Heading>
                <Stack spacing={3}>
                  {recentUserChanges.map((user: any) => (
                    <HStack key={`audit-${user.id}`} justify="space-between" align="start" p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                      <Stack spacing={1}>
                        <Text fontWeight="600">{user.username}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {getRoleLabel(user.role)} · {user.is_active ? "Cuenta activa" : "Cuenta inactiva"}
                        </Text>
                      </Stack>
                      <Text fontSize="xs" color="gray.500">{formatDateTimeEs(user.updated_at)}</Text>
                    </HStack>
                  ))}
                  {!recentUserChanges.length && <Text color="gray.600">Sin actividad reciente de cuentas.</Text>}
                </Stack>
              </Box>
              <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
                <Heading size="sm" mb={4}>Altas recientes</Heading>
                <Stack spacing={3}>
                  {recentUsers.map((user: any) => (
                    <HStack key={`created-${user.id}`} justify="space-between" align="start" p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                      <Stack spacing={1}>
                        <Text fontWeight="600">{user.username}</Text>
                        <Text fontSize="sm" color="gray.600">{getRoleLabel(user.role)}</Text>
                      </Stack>
                      <Text fontSize="xs" color="gray.500">{formatDateTimeEs(user.created_at)}</Text>
                    </HStack>
                  ))}
                  {!recentUsers.length && <Text color="gray.600">Sin altas recientes.</Text>}
                </Stack>
              </Box>
            </Stack>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
};

function StatCard({ title, value, helper, icon }: StatCardProps) {
  return (
    <Box p={{ base: 4, xl: 5 }} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="gray.500">
          {title}
        </Text>
        {icon}
      </HStack>
      <Heading size="md">{value}</Heading>
      {helper && (
        <Text fontSize="sm" color="gray.600" mt={1}>
          {helper}
        </Text>
      )}
    </Box>
  );
}

export default memo(AdminDashboardSection);
