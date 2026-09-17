import React, { createContext, useContext, useState, ReactNode } from "react";
import { UIState, UIStateContext as UIStateContextType } from "../types/ui";

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [currentState, setCurrentState] = useState<UIState>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);

  const setState = (state: UIState) => {
    setCurrentState(state);
  };

  const addTranscript = (text: string) => {
    setTranscript((prev) => [...prev, text]);
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return (
    <UIStateContext.Provider
      value={{
        currentState,
        setState,
        micLevel,
        setMicLevel,
        transcript,
        addTranscript,
        clearTranscript,
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useUIState must be used within UIStateProvider");
  }
  return context;
}
