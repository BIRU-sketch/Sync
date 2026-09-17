import React, { useEffect, useRef } from "react";
import { UIStateProvider, useUIState } from "./context/UIStateContext";
import { IdleUI } from "./components/IdleUI";
import { ListeningUI } from "./components/ListeningUI";
import { ThinkingUI } from "./components/ThinkingUI";
import { TalkingUI } from "./components/TalkingUI";
import { StatusBar } from "./components/StatusBar";
import { Transcript } from "./components/Transcript";
import { VoxideWidget } from "@voxide/react";
import { ai, setVoxideUiState } from "./voxide/client";
import { refreshVoxideProjectState } from "./voxide/state";

function AppContent() {
  const uiState = useUIState();
  const { currentState, setState, setMicLevel } = uiState;
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setVoxideUiState(uiState);
  }, [uiState]);

  useEffect(() => {
    void refreshVoxideProjectState();
  }, []);

  // Simulate mic level for listening and talking states
  useEffect(() => {
    if (currentState === "listening" || currentState === "talking") {
      intervalRef.current = setInterval(() => {
        const level = Math.random() * 0.6 + 0.3;
        setMicLevel(level);
      }, 100);
    } else {
      setMicLevel(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentState, setMicLevel]);

  const renderCurrentState = () => {
    switch (currentState) {
      case "idle":
        return <IdleUI />;
      case "listening":
        return <ListeningUI />;
      case "thinking":
        return <ThinkingUI />;
      case "talking":
        return <TalkingUI />;
      case "executing":
        return <ThinkingUI />;
      default:
        return <IdleUI />;
    }
  };

  const handleStateCycle = () => {
    const states: Array<
      "idle" | "listening" | "thinking" | "talking" | "executing"
    > = ["idle", "listening", "thinking", "talking", "executing"];
    const currentIndex = states.indexOf(currentState as any);
    const nextIndex = (currentIndex + 1) % states.length;
    setState(states[nextIndex]);
  };

  return (
    <div className="app-container" onClick={handleStateCycle}>
      <StatusBar />
      <main className="main-content">{renderCurrentState()}</main>
      <Transcript />
    </div>
  );
}

function App() {
  return (
    <UIStateProvider>
      <AppContent />
      <VoxideWidget client={ai} />
    </UIStateProvider>
  );
}

export default App;
