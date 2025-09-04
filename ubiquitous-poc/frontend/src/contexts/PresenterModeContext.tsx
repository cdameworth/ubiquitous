import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';
import { demoScenarioService } from '../services/DemoScenarioService';

interface ScenarioState {
  id: string;
  name: string;
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  elapsedTime: number;
  duration: number;
  autoAdvance: boolean;
  businessValue?: number;
  category?: string;
}

interface PresenterModeContextType {
  isPresenterMode: boolean;
  currentScenario: string | null;
  scenarios: ScenarioState[];
  globalControls: {
    isPlaying: boolean;
    isPaused: boolean;
    speed: number;
    autoAdvance: boolean;
    showNotes: boolean;
    fullscreen: boolean;
  };
  
  // Presenter controls
  activatePresenterMode: () => void;
  deactivatePresenterMode: () => void;
  selectScenario: (scenarioId: string) => void;
  
  // Global playback controls
  playAll: () => void;
  pauseAll: () => void;
  stopAll: () => void;
  nextScenario: () => void;
  previousScenario: () => void;
  
  // Speed and timing controls
  setSpeed: (speed: number) => void;
  setAutoAdvance: (enabled: boolean) => void;
  
  // Display controls
  toggleNotes: () => void;
  toggleFullscreen: () => void;
  
  // Navigation
  jumpToScenario: (scenarioId: string, stepIndex?: number) => void;
  jumpToStep: (stepIndex: number) => void;
  
  // Scenario management
  updateScenarioState: (scenarioId: string, state: Partial<ScenarioState>) => void;
  getScenarioProgress: () => number;
}

const PresenterModeContext = createContext<PresenterModeContextType | null>(null);

export const usePresenterMode = () => {
  const context = useContext(PresenterModeContext);
  if (!context) {
    throw new Error('usePresenterMode must be used within a PresenterModeProvider');
  }
  return context;
};

interface PresenterModeProviderProps {
  children: React.ReactNode;
}

export const PresenterModeProvider: React.FC<PresenterModeProviderProps> = ({ children }) => {
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  
  // Initialize scenarios from DemoScenarioService
  const [scenarios, setScenarios] = useState<ScenarioState[]>(() => {
    return demoScenarioService.getAllScenarios().map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: scenario.steps.length,
      elapsedTime: 0,
      duration: scenario.totalDuration,
      autoAdvance: false,
      businessValue: scenario.businessValue,
      category: scenario.category
    }));
  });
  
  const [globalControls, setGlobalControls] = useState({
    isPlaying: false,
    isPaused: false,
    speed: 1.0,
    autoAdvance: true,
    showNotes: false,
    fullscreen: false
  });

  const { send, subscribeToEvent, connected } = useWebSocket();

  // Subscribe to scenario updates from WebSocket
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToEvent('presenter_update', (data) => {
      if (data.type === 'scenario_state') {
        updateScenarioState(data.scenarioId, data.state);
      } else if (data.type === 'global_controls') {
        setGlobalControls(prev => ({ ...prev, ...data.controls }));
      }
    });

    return unsubscribe;
  }, [connected, subscribeToEvent]);

  // Presenter mode activation
  const activatePresenterMode = useCallback(() => {
    setIsPresenterMode(true);
    setCurrentScenario(scenarios[0]?.id || null);
    
    // Enable fullscreen if supported
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(console.error);
      setGlobalControls(prev => ({ ...prev, fullscreen: true }));
    }
    
    // Send WebSocket message
    send({ type: 'activate_presenter_mode' });
    
    console.log('Presenter mode activated');
  }, [scenarios, send]);

  const deactivatePresenterMode = useCallback(() => {
    setIsPresenterMode(false);
    setCurrentScenario(null);
    
    // Stop all running scenarios
    stopAll();
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    setGlobalControls(prev => ({ ...prev, fullscreen: false }));
    
    // Send WebSocket message
    send({ type: 'deactivate_presenter_mode' });
    
    console.log('Presenter mode deactivated');
  }, [send]);

  // Scenario selection
  const selectScenario = useCallback((scenarioId: string) => {
    setCurrentScenario(scenarioId);
    send({ type: 'select_scenario', scenarioId });
  }, [send]);

  // Global playback controls
  const playAll = useCallback(() => {
    setGlobalControls(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    
    if (currentScenario) {
      // Start scenario in backend via WebSocket
      send({ type: 'start_scenario', scenarioId: currentScenario });
      
      // Start local scenario service
      demoScenarioService.startScenario(currentScenario);
      
      // Update local state
      setScenarios(prev => prev.map(scenario =>
        scenario.id === currentScenario
          ? { ...scenario, isRunning: true, isPaused: false }
          : scenario
      ));
    }
  }, [currentScenario, send]);

  const pauseAll = useCallback(() => {
    setGlobalControls(prev => ({ ...prev, isPaused: true }));
    
    if (currentScenario) {
      // Pause scenario in backend via WebSocket
      send({ type: 'pause_scenario', scenarioId: currentScenario });
      
      // Pause local scenario service
      demoScenarioService.pauseScenario();
      
      // Update local state
      setScenarios(prev => prev.map(scenario =>
        scenario.id === currentScenario
          ? { ...scenario, isPaused: true }
          : scenario
      ));
    }
  }, [currentScenario, send]);

  const stopAll = useCallback(() => {
    setGlobalControls(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    
    // Stop all scenarios in backend
    scenarios.forEach(scenario => {
      if (scenario.isRunning) {
        send({ type: 'stop_scenario', scenarioId: scenario.id });
      }
    });
    
    // Stop local scenario service
    demoScenarioService.stopScenario();
    
    // Reset all scenario states
    setScenarios(prev => prev.map(scenario => ({
      ...scenario,
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      elapsedTime: 0
    })));
  }, [scenarios, send]);

  // Navigation controls
  const nextScenario = useCallback(() => {
    const currentIndex = scenarios.findIndex(s => s.id === currentScenario);
    if (currentIndex < scenarios.length - 1) {
      const nextScenarioId = scenarios[currentIndex + 1].id;
      selectScenario(nextScenarioId);
    }
  }, [currentScenario, scenarios, selectScenario]);

  const previousScenario = useCallback(() => {
    const currentIndex = scenarios.findIndex(s => s.id === currentScenario);
    if (currentIndex > 0) {
      const prevScenarioId = scenarios[currentIndex - 1].id;
      selectScenario(prevScenarioId);
    }
  }, [currentScenario, scenarios, selectScenario]);

  // Speed and timing controls
  const setSpeed = useCallback((speed: number) => {
    setGlobalControls(prev => ({ ...prev, speed }));
    send({ type: 'set_presentation_speed', speed });
  }, [send]);

  const setAutoAdvance = useCallback((enabled: boolean) => {
    setGlobalControls(prev => ({ ...prev, autoAdvance: enabled }));
    
    // Update all scenarios
    setScenarios(prev => prev.map(scenario => ({
      ...scenario,
      autoAdvance: enabled
    })));
    
    send({ type: 'set_auto_advance', enabled });
  }, [send]);

  // Display controls
  const toggleNotes = useCallback(() => {
    setGlobalControls(prev => ({ ...prev, showNotes: !prev.showNotes }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setGlobalControls(prev => ({ ...prev, fullscreen: true }));
    } else {
      document.exitFullscreen().catch(console.error);
      setGlobalControls(prev => ({ ...prev, fullscreen: false }));
    }
  }, []);

  // Advanced navigation
  const jumpToScenario = useCallback((scenarioId: string, stepIndex = 0) => {
    selectScenario(scenarioId);
    
    if (stepIndex > 0) {
      send({ type: 'jump_to_step', scenarioId, stepIndex });
    }
  }, [selectScenario, send]);

  const jumpToStep = useCallback((stepIndex: number) => {
    if (currentScenario) {
      send({ type: 'jump_to_step', scenarioId: currentScenario, stepIndex });
      
      // Update local state
      setScenarios(prev => prev.map(scenario => 
        scenario.id === currentScenario 
          ? { ...scenario, currentStep: stepIndex }
          : scenario
      ));
    }
  }, [currentScenario, send]);

  // Scenario state management
  const updateScenarioState = useCallback((scenarioId: string, state: Partial<ScenarioState>) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? { ...scenario, ...state }
        : scenario
    ));
  }, []);

  // Progress calculation
  const getScenarioProgress = useCallback(() => {
    if (!scenarios.length) return 0;
    
    const totalSteps = scenarios.reduce((sum, scenario) => sum + scenario.totalSteps, 0);
    const completedSteps = scenarios.reduce((sum, scenario) => sum + scenario.currentStep, 0);
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [scenarios]);

  // Keyboard shortcuts for presenter mode
  useEffect(() => {
    if (!isPresenterMode) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior for presenter shortcuts
      if (event.ctrlKey || event.metaKey) return;
      
      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          if (globalControls.isPaused || !globalControls.isPlaying) {
            playAll();
          } else {
            pauseAll();
          }
          break;
        case 'Escape':
          event.preventDefault();
          stopAll();
          break;
        case 'ArrowRight':
        case 'n':
          event.preventDefault();
          nextScenario();
          break;
        case 'ArrowLeft':
        case 'p':
          event.preventDefault();
          previousScenario();
          break;
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          event.preventDefault();
          const scenarioIndex = parseInt(event.key) - 1;
          if (scenarios[scenarioIndex]) {
            selectScenario(scenarios[scenarioIndex].id);
          }
          break;
        case '+':
        case '=':
          event.preventDefault();
          setSpeed(Math.min(globalControls.speed + 0.25, 3.0));
          break;
        case '-':
          event.preventDefault();
          setSpeed(Math.max(globalControls.speed - 0.25, 0.25));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPresenterMode, globalControls, playAll, pauseAll, stopAll, nextScenario, previousScenario, toggleFullscreen, selectScenario, scenarios, setSpeed]);

  const contextValue: PresenterModeContextType = {
    isPresenterMode,
    currentScenario,
    scenarios,
    globalControls,
    
    activatePresenterMode,
    deactivatePresenterMode,
    selectScenario,
    
    playAll,
    pauseAll,
    stopAll,
    nextScenario,
    previousScenario,
    
    setSpeed,
    setAutoAdvance,
    
    toggleNotes,
    toggleFullscreen,
    
    jumpToScenario,
    jumpToStep,
    
    updateScenarioState,
    getScenarioProgress
  };

  return (
    <PresenterModeContext.Provider value={contextValue}>
      {children}
    </PresenterModeContext.Provider>
  );
};