import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SourceRegistryProvider } from "@/stores/sourceRegistry";
import { AuthProvider } from "@/hooks/useAuth";
import { LearningModeProvider } from "@/stores/learningMode";
import { DatasetManagerProvider } from "@/stores/datasetManager";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

const queryClient = new QueryClient();

// Use HashRouter when running under file:// (packaged Electron desktop build),
// since there is no SPA fallback server. Web/PWA continues to use BrowserRouter.
const Router =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? HashRouter
    : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <SourceRegistryProvider>
    <DatasetManagerProvider>
    <LearningModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </LearningModeProvider>
    </DatasetManagerProvider>
    </SourceRegistryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
