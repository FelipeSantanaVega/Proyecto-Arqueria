import { memo } from "react";
import type { ReactNode } from "react";
import { Alert, AlertIcon, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";

function ProfileActionCard({
  icon,
  title,
  description,
  accentBg,
  accentColor,
  borderColor,
  titleColor = "#1f2937",
  descriptionColor = "#667085",
  hoverBg = "gray.50",
  hoverBorderColor,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  accentBg: string;
  accentColor: string;
  borderColor: string;
  titleColor?: string;
  descriptionColor?: string;
  hoverBg?: string;
  hoverBorderColor?: string;
  onClick: () => void;
}) {
  return (
    <Button
      justifyContent="space-between"
      variant="outline"
      borderColor={borderColor}
      borderRadius="18px"
      h={{ base: "64px", md: "72px" }}
      px={{ base: 4, md: 5 }}
      bg="white"
      _hover={{ bg: hoverBg, borderColor: hoverBorderColor ?? borderColor }}
      _active={{ transform: "scale(0.99)" }}
      onClick={onClick}
    >
      <HStack spacing={3.5} minW={0}>
        <Box
          boxSize={{ base: "38px", md: "44px" }}
          borderRadius="14px"
          bg={accentBg}
          color={accentColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {icon}
        </Box>
        <Stack spacing={0.5} align="start" minW={0}>
          <Text color={titleColor} fontWeight="800" fontSize={{ base: "14px", md: "15px" }} noOfLines={1}>
            {title}
          </Text>
          <Text color={descriptionColor} fontSize={{ base: "11px", md: "12px" }} noOfLines={1}>
            {description}
          </Text>
        </Stack>
      </HStack>
      <Box
        as="svg"
        viewBox="0 0 24 24"
        boxSize="16px"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        flexShrink={0}
      >
        <path d="m9 18 6-6-6-6" />
      </Box>
    </Button>
  );
}

function ProfileSection({
  username,
  userRole,
  changePasswordSuccess,
  openChangePasswordModal,
  handleLogout,
}: {
  username?: string | null;
  userRole?: string | null;
  changePasswordSuccess?: string | null;
  openChangePasswordModal: () => void;
  handleLogout: () => void;
}) {
  const roleLabel =
    userRole === "admin"
      ? "Administrador"
      : userRole === "professor"
        ? "Profesor"
        : userRole === "student"
          ? "Deportista"
          : "Usuario";

  const userInitial = (username || roleLabel || "U").trim().charAt(0).toUpperCase();

  return (
    <Stack spacing={{ base: 4, md: 5 }} maxW={{ base: "100%", md: "760px" }}>
      <Box
        borderWidth="1px"
        borderColor="#e5e7eb"
        borderRadius={{ base: "20px", md: "24px" }}
        bg="white"
        p={{ base: 5, md: 6 }}
        boxShadow="0 14px 34px rgba(15, 23, 42, 0.06)"
      >
        <Stack spacing={{ base: 4, md: 5 }}>
          <HStack spacing={4} align="center">
            <Box
              boxSize={{ base: "58px", md: "72px" }}
              borderRadius={{ base: "18px", md: "22px" }}
              bg="#fff1e8"
              color="#fb5a13"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="800"
              fontSize={{ base: "22px", md: "28px" }}
              flexShrink={0}
            >
              {userInitial}
            </Box>
            <Stack spacing={0.5} minW={0}>
              <Text fontSize={{ base: "18px", md: "26px" }} fontWeight="800" color="#1f2937" noOfLines={1}>
                {username || "-"}
              </Text>
              <Text fontSize={{ base: "13px", md: "15px" }} color="#667085">
                {roleLabel}
              </Text>
              <Text fontSize={{ base: "12px", md: "13px" }} color="#16a34a" fontWeight="700">
                Cuenta activa
              </Text>
            </Stack>
          </HStack>

          <Stack
            spacing={3}
            direction={{ base: "column", md: "row" }}
            align="stretch"
          >
            {[
              { label: "Usuario", value: username || "-" },
              { label: "Rol", value: roleLabel },
              { label: "Estado", value: "Activo", color: "#16a34a" },
            ].map((item) => (
              <Box
                key={item.label}
                bg="#f8fafc"
                borderRadius="16px"
                px={4}
                py={3.5}
                flex="1"
              >
                <Text fontSize="11px" color="#667085" mb={0.5}>
                  {item.label}
                </Text>
                <Text fontSize={{ base: "14px", md: "15px" }} color={item.color ?? "#1f2937"} fontWeight="700">
                  {item.value}
                </Text>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Stack spacing={3} px={{ base: 2, md: 0 }}>
        <ProfileActionCard
          icon={
            <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="12" x="3" y="10" rx="2" />
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
            </Box>
          }
          title="Cambiar contraseña"
          description="Actualizar acceso de la cuenta"
          accentBg="#fff1e8"
          accentColor="#fb5a13"
          borderColor="#d1d5db"
          onClick={openChangePasswordModal}
        />

        <ProfileActionCard
          icon={
            <Box as="svg" viewBox="0 0 24 24" boxSize="18px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            </Box>
          }
          title="Cerrar sesión"
          description="Salir de la cuenta actual"
          accentBg="#fff1f2"
          accentColor="#dc2626"
          borderColor="#fecaca"
          titleColor="#dc2626"
          descriptionColor="#f87171"
          hoverBg="red.50"
          hoverBorderColor="#fca5a5"
          onClick={handleLogout}
        />
      </Stack>

      {changePasswordSuccess && (
        <Alert status="success" borderRadius="14px" mx={{ base: 2, md: 0 }} w={{ base: "auto", md: "100%" }}>
          <AlertIcon />
          {changePasswordSuccess}
        </Alert>
      )}
    </Stack>
  );
}

export default memo(ProfileSection);
