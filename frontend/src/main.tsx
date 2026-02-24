import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript, Center, Spinner, extendTheme } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'

const App = lazy(() => import('./App.tsx'))

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: '"Inter", system-ui, -apple-system, sans-serif',
    body: '"Inter", system-ui, -apple-system, sans-serif',
  },
  components: {
    Modal: {
      baseStyle: {
        dialogContainer: {
          px: { base: 2, md: 4 },
          py: { base: 2, md: 4 },
        },
        dialog: {
          maxH: "90vh",
        },
        body: {
          overflowY: "auto",
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <BrowserRouter>
        <Suspense
          fallback={(
            <Center minH="100vh">
              <Spinner />
            </Center>
          )}
        >
          <App />
        </Suspense>
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>
)
