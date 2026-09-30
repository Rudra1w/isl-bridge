/**
 * ISL Bridge — Interactive Hackathon Demo Simulation Engine
 *
 * TRANSPARENCY REQUIREMENT:
 * This module provides pre-calibrated, verified demonstration sequences
 * for hackathon stage presentations, low-light conference rooms, or offline environments.
 *
 * It is EXPLICITLY labeled as "DEMO MODE (SIMULATION)" across the UI
 * and NEVER misrepresents pre-recorded or synthetic benchmarks as real-time webcam inference.
 */

export interface DemoStep {
  id: string;
  source: 'isl_user' | 'hearing_user';
  actionDescription: string;
  signToken?: string;
  spokenText?: string;
  glossTokens?: string[];
  notes: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  steps: DemoStep[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'healthcare-emergency',
    title: '1. Medical & Emergency Dialogue',
    description: 'Deaf patient expresses emergency distress; hearing doctor/assistant replies with arrival confirmation.',
    steps: [
      {
        id: 's1-1',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures HELP to webcam',
        signToken: 'HELP',
        notes: 'Simulated 3D hand landmarks indicate open palm resting against supporting hand in distress gesture.',
      },
      {
        id: 's1-2',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures PAIN',
        signToken: 'PAIN',
        notes: 'Index finger pointing and oscillating near chest area.',
      },
      {
        id: 's1-3',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures DOCTOR',
        signToken: 'DOCTOR',
        notes: 'Two fingers tapping the wrist (radial pulse check motion).',
      },
      {
        id: 's1-4',
        source: 'hearing_user',
        actionDescription: 'Hearing Doctor speaks via microphone: "Doctor is coming right now"',
        spokenText: 'Doctor is coming right now',
        glossTokens: ['DOCTOR', 'NOW', 'COME'],
        notes: 'NLP transforms English SOV into ISL temporal-fronted gloss: [DOCTOR] [NOW] [COME].',
      },
    ],
  },
  {
    id: 'greetings-courtesy',
    title: '2. Traditional Welcome & Greeting',
    description: 'Polite mutual introduction between ISL signer and hearing peer.',
    steps: [
      {
        id: 's2-1',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures NAMASTE',
        signToken: 'NAMASTE',
        notes: 'Dual palms joined together in standard respectful Indian greeting.',
      },
      {
        id: 's2-2',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures HELLO',
        signToken: 'HELLO',
        notes: 'Upright open hand waving toward conversational partner.',
      },
      {
        id: 's2-3',
        source: 'hearing_user',
        actionDescription: 'Hearing User speaks: "Good morning! How are you?"',
        spokenText: 'Good morning! How are you?',
        glossTokens: ['GOOD-MORNING', 'YOU', 'HOW'],
        notes: 'Copula "are" eliminated, question marker [HOW] placed at clause boundary.',
      },
      {
        id: 's2-4',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures THANK-YOU',
        signToken: 'THANK-YOU',
        notes: 'Flat palm moving forward from chin/mouth.',
      },
    ],
  },
  {
    id: 'daily-travel',
    title: '3. Travel & College Inquiry (Round Trip)',
    description: 'Direct conversational inquiry about schedule and destination.',
    steps: [
      {
        id: 's3-1',
        source: 'hearing_user',
        actionDescription: 'Hearing User speaks: "Where are you going tomorrow?"',
        spokenText: 'Where are you going tomorrow?',
        glossTokens: ['TOMORROW', 'YOU', 'WHERE', 'GO'],
        notes: 'Time marker [TOMORROW] fronted; interrogative [WHERE] placed before verb.',
      },
      {
        id: 's3-2',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures ME to camera',
        signToken: 'ME',
        notes: 'Index finger pointing to self chest.',
      },
      {
        id: 's3-3',
        source: 'isl_user',
        actionDescription: 'Sign Language User gestures HOSPITAL to camera',
        signToken: 'HOSPITAL',
        notes: 'Index and middle fingers forming cross sign on upper arm.',
      },
    ],
  },
];

export class DemoSimulationService {
  private static instance: DemoSimulationService;
  private isDemoActive = false;
  private currentScenarioIndex = 0;
  private currentStepIndex = 0;
  private isAutoPlaying = false;
  private autoPlayTimer: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): DemoSimulationService {
    if (!DemoSimulationService.instance) {
      DemoSimulationService.instance = new DemoSimulationService();
    }
    return DemoSimulationService.instance;
  }

  public get isActive(): boolean {
    return this.isDemoActive;
  }

  public get scenarios(): DemoScenario[] {
    return DEMO_SCENARIOS;
  }

  public get currentScenario(): DemoScenario {
    return DEMO_SCENARIOS[this.currentScenarioIndex] || DEMO_SCENARIOS[0];
  }

  public get currentStep(): DemoStep | null {
    const scenario = this.currentScenario;
    if (!scenario || this.currentStepIndex >= scenario.steps.length) return null;
    return scenario.steps[this.currentStepIndex];
  }

  public get stepIndex(): number {
    return this.currentStepIndex;
  }

  public get isPlaying(): boolean {
    return this.isAutoPlaying;
  }

  public startDemo(scenarioId?: string): void {
    this.isDemoActive = true;
    if (scenarioId) {
      const idx = DEMO_SCENARIOS.findIndex((s) => s.id === scenarioId);
      if (idx !== -1) this.currentScenarioIndex = idx;
    }
    this.currentStepIndex = 0;
    this.notify();
  }

  public stopDemo(): void {
    this.isDemoActive = false;
    this.stopAutoPlay();
    this.currentStepIndex = 0;
    this.notify();
  }

  public setScenario(scenarioId: string): void {
    const idx = DEMO_SCENARIOS.findIndex((s) => s.id === scenarioId);
    if (idx !== -1) {
      this.currentScenarioIndex = idx;
      this.currentStepIndex = 0;
      this.notify();
    }
  }

  public nextStep(): DemoStep | null {
    const scenario = this.currentScenario;
    if (!scenario) return null;

    if (this.currentStepIndex < scenario.steps.length - 1) {
      this.currentStepIndex++;
      this.notify();
      return scenario.steps[this.currentStepIndex];
    } else {
      this.stopAutoPlay();
      return null;
    }
  }

  public previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.notify();
    }
  }

  public resetScenario(): void {
    this.currentStepIndex = 0;
    this.stopAutoPlay();
    this.notify();
  }

  public toggleAutoPlay(onStepCallback?: (step: DemoStep) => void): void {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    } else {
      this.isAutoPlaying = true;
      this.notify();

      const runNext = () => {
        if (!this.isAutoPlaying) return;
        const step = this.nextStep();
        if (step && onStepCallback) {
          onStepCallback(step);
        }
        if (this.currentStepIndex >= this.currentScenario.steps.length - 1) {
          this.stopAutoPlay();
        } else {
          this.autoPlayTimer = setTimeout(runNext, 3500);
        }
      };

      this.autoPlayTimer = setTimeout(runNext, 3500);
    }
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const demoSimulationService = DemoSimulationService.getInstance();
