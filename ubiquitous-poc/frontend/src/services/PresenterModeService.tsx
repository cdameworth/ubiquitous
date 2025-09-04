interface PresentationSettings {
  autoAdvance: boolean;
  speed: number;
  showNotes: boolean;
  fullscreen: boolean;
  scenarioOrder: string[];
  customTiming: Record<string, number>;
}

interface PresentationState {
  isActive: boolean;
  currentScenario: string | null;
  startTime: number;
  totalElapsedTime: number;
  scenarioProgress: Record<string, number>;
}

interface ScenarioTiming {
  id: string;
  targetDuration: number;
  stepTimings: number[];
  autoAdvanceDelay: number;
}

class PresenterModeService {
  private settings: PresentationSettings;
  private state: PresentationState;
  private timers: Map<string, NodeJS.Timeout>;
  private scenarioTimings: Map<string, ScenarioTiming>;

  constructor() {
    this.settings = {
      autoAdvance: true,
      speed: 1.0,
      showNotes: false,
      fullscreen: false,
      scenarioOrder: ['trading-crisis', 'cost-spiral', 'security-breach', 'executive-value'],
      customTiming: {}
    };

    this.state = {
      isActive: false,
      currentScenario: null,
      startTime: 0,
      totalElapsedTime: 0,
      scenarioProgress: {}
    };

    this.timers = new Map();
    this.scenarioTimings = new Map();
    
    this.initializeScenarioTimings();
  }

  private initializeScenarioTimings() {
    // Trading Crisis Scenario (5 minutes)
    this.scenarioTimings.set('trading-crisis', {
      id: 'trading-crisis',
      targetDuration: 300,
      stepTimings: [30, 45, 60, 45, 60, 60], // seconds per step
      autoAdvanceDelay: 3 // seconds between auto-advance
    });

    // Cost Spiral Scenario (4 minutes)
    this.scenarioTimings.set('cost-spiral', {
      id: 'cost-spiral',
      targetDuration: 240,
      stepTimings: [25, 35, 30, 30, 35, 30, 30, 25],
      autoAdvanceDelay: 3
    });

    // Security Breach Scenario (4.5 minutes)
    this.scenarioTimings.set('security-breach', {
      id: 'security-breach',
      targetDuration: 270,
      stepTimings: [30, 40, 45, 40, 35, 30, 50],
      autoAdvanceDelay: 2
    });

    // Executive Value Scenario (3 minutes)
    this.scenarioTimings.set('executive-value', {
      id: 'executive-value',
      targetDuration: 180,
      stepTimings: [35, 40, 35, 35, 35],
      autoAdvanceDelay: 4
    });
  }

  // Presentation control methods
  startPresentation(): boolean {
    try {
      this.state.isActive = true;
      this.state.startTime = Date.now();
      this.state.currentScenario = this.settings.scenarioOrder[0];
      
      console.log('Presentation started');
      return true;
    } catch (error) {
      console.error('Failed to start presentation:', error);
      return false;
    }
  }

  stopPresentation(): boolean {
    try {
      this.state.isActive = false;
      this.state.currentScenario = null;
      this.clearAllTimers();
      
      console.log('Presentation stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop presentation:', error);
      return false;
    }
  }

  // Scenario navigation
  navigateToScenario(scenarioId: string): boolean {
    if (!this.settings.scenarioOrder.includes(scenarioId)) {
      console.error(`Invalid scenario ID: ${scenarioId}`);
      return false;
    }

    this.state.currentScenario = scenarioId;
    this.clearTimersForScenario(scenarioId);
    
    console.log(`Navigated to scenario: ${scenarioId}`);
    return true;
  }

  nextScenario(): string | null {
    if (!this.state.currentScenario) return null;

    const currentIndex = this.settings.scenarioOrder.indexOf(this.state.currentScenario);
    if (currentIndex < this.settings.scenarioOrder.length - 1) {
      const nextScenario = this.settings.scenarioOrder[currentIndex + 1];
      this.navigateToScenario(nextScenario);
      return nextScenario;
    }
    
    return null;
  }

  previousScenario(): string | null {
    if (!this.state.currentScenario) return null;

    const currentIndex = this.settings.scenarioOrder.indexOf(this.state.currentScenario);
    if (currentIndex > 0) {
      const prevScenario = this.settings.scenarioOrder[currentIndex - 1];
      this.navigateToScenario(prevScenario);
      return prevScenario;
    }
    
    return null;
  }

  // Auto-advance functionality
  setupAutoAdvance(scenarioId: string, currentStep: number): void {
    if (!this.settings.autoAdvance) return;

    const timing = this.scenarioTimings.get(scenarioId);
    if (!timing) return;

    const nextStep = currentStep + 1;
    if (nextStep >= timing.stepTimings.length) {
      // End of scenario - advance to next scenario if available
      if (this.settings.autoAdvance) {
        const nextScenarioId = this.nextScenario();
        if (nextScenarioId) {
          this.scheduleScenarioStart(nextScenarioId, timing.autoAdvanceDelay * 1000);
        }
      }
      return;
    }

    // Schedule next step
    const stepDuration = (timing.stepTimings[currentStep] * 1000) / this.settings.speed;
    const timerId = setTimeout(() => {
      this.advanceToNextStep(scenarioId, nextStep);
    }, stepDuration);

    this.timers.set(`${scenarioId}_step_${currentStep}`, timerId);
  }

  private advanceToNextStep(scenarioId: string, stepIndex: number): void {
    // This would integrate with the WebSocket to advance the step
    // For now, we'll emit a custom event that components can listen to
    const event = new CustomEvent('presenter_advance_step', {
      detail: { scenarioId, stepIndex }
    });
    window.dispatchEvent(event);
    
    // Setup auto-advance for next step
    this.setupAutoAdvance(scenarioId, stepIndex);
  }

  private scheduleScenarioStart(scenarioId: string, delay: number): void {
    const timerId = setTimeout(() => {
      const event = new CustomEvent('presenter_start_scenario', {
        detail: { scenarioId }
      });
      window.dispatchEvent(event);
    }, delay);

    this.timers.set(`${scenarioId}_start`, timerId);
  }

  // Speed control
  setSpeed(speed: number): void {
    this.settings.speed = Math.max(0.25, Math.min(3.0, speed));
    
    // Adjust existing timers
    this.recalculateTimers();
  }

  private recalculateTimers(): void {
    // Clear and restart timers with new speed
    this.clearAllTimers();
    
    if (this.state.currentScenario && this.settings.autoAdvance) {
      // Restart auto-advance with new speed
      const currentScenarioData = this.getCurrentScenarioData();
      if (currentScenarioData) {
        this.setupAutoAdvance(this.state.currentScenario, currentScenarioData.currentStep);
      }
    }
  }

  // Timer management
  private clearAllTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  private clearTimersForScenario(scenarioId: string): void {
    this.timers.forEach((timer, key) => {
      if (key.startsWith(scenarioId)) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    });
  }

  // Settings management
  updateSettings(newSettings: Partial<PresentationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PresentationSettings {
    return { ...this.settings };
  }

  // State management
  updateScenarioProgress(scenarioId: string, progress: number): void {
    this.state.scenarioProgress[scenarioId] = progress;
  }

  getOverallProgress(): number {
    const totalScenarios = this.settings.scenarioOrder.length;
    const completedProgress = Object.values(this.state.scenarioProgress).reduce((sum, progress) => sum + progress, 0);
    
    return Math.round(completedProgress / totalScenarios);
  }

  // Helper methods
  private getCurrentScenarioData(): any {
    // This would normally come from the scenario components
    // For now, return mock data
    return {
      currentStep: 0,
      totalSteps: 6,
      isRunning: false
    };
  }

  // Export presentation data
  exportPresentationMetrics(): any {
    return {
      settings: this.settings,
      state: this.state,
      scenarios: Array.from(this.scenarioTimings.values()),
      totalValue: 23200000,
      totalDuration: Array.from(this.scenarioTimings.values()).reduce((sum, timing) => sum + timing.targetDuration, 0)
    };
  }

  // Cleanup
  destroy(): void {
    this.clearAllTimers();
  }
}

export const presenterModeService = new PresenterModeService();
export default presenterModeService;