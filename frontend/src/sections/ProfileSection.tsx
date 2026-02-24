import { memo } from "react";
import { Heading, Stack, Text } from "@chakra-ui/react";

function ProfileSection() {
  return (
    <Stack spacing={2}>
      <Heading size="lg">Perfil</Heading>
      <Text color="gray.600">Resumen del usuario y opciones de cuenta.</Text>
    </Stack>
  );
}

export default memo(ProfileSection);
