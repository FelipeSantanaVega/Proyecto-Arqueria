import { memo } from "react";
import { Alert, AlertIcon, Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";

function ProfileSection({
  username,
  userRole,
  changePasswordSuccess,
  openChangePasswordModal,
  openCreateUserModal,
}: {
  username?: string | null;
  userRole?: string | null;
  changePasswordSuccess?: string | null;
  openChangePasswordModal: () => void;
  openCreateUserModal?: (() => void) | null;
}) {
  const roleLabel =
    userRole === "admin"
      ? "Administrador"
      : userRole === "professor"
        ? "Profesor"
        : userRole === "student"
          ? "Deportista"
          : "Usuario";

  return (
    <Stack spacing={5}>
      <Stack spacing={1}>
        <Heading size="lg">Perfil</Heading>
        <Text color="gray.600">Resumen del usuario y opciones de cuenta.</Text>
      </Stack>
      <Box borderWidth="1px" borderColor="gray.200" borderRadius="12px" bg="white" p={5}>
        <Stack spacing={4}>
          <Heading size="sm">Cuenta</Heading>
          <HStack justify="space-between" align="start">
            <Text color="gray.500">Usuario</Text>
            <Text color="gray.800" fontWeight="600">{username || "-"}</Text>
          </HStack>
          <HStack justify="space-between" align="start">
            <Text color="gray.500">Rol</Text>
            <Text color="gray.800" fontWeight="600">{roleLabel}</Text>
          </HStack>
          <HStack justify="space-between" align="start">
            <Text color="gray.500">Estado</Text>
            <Text color="green.600" fontWeight="600">Activo</Text>
          </HStack>
        </Stack>
      </Box>
      <HStack spacing={3} align="start">
        <Button alignSelf="flex-start" variant="outline" borderColor="gray.300" onClick={openChangePasswordModal}>
          Cambiar contraseña
        </Button>
        {openCreateUserModal && (
          <Button alignSelf="flex-start" bg="#f97316" color="white" _hover={{ bg: "#ea580c" }} _active={{ bg: "#c2410c" }} onClick={openCreateUserModal}>
            Crear usuario deportista
          </Button>
        )}
      </HStack>
      {changePasswordSuccess && (
        <Alert status="success" borderRadius="12px">
          <AlertIcon />
          {changePasswordSuccess}
        </Alert>
      )}
    </Stack>
  );
}

export default memo(ProfileSection);
