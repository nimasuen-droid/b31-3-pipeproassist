import { createContext, useContext, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface LearningModeState {
  enabled: boolean;
  toggle: () => void;
}

const LearningModeContext = createContext<LearningModeState>({ enabled: false, toggle: () => {} });

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useLocalStorage<boolean>("ui:learning-mode", false);
  return (
    <LearningModeContext.Provider value={{ enabled, toggle: () => setEnabled(p => !p) }}>
      {children}
    </LearningModeContext.Provider>
  );
}

export function useLearningMode() {
  return useContext(LearningModeContext);
}
