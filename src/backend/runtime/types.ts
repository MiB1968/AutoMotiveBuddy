
import { UserProfile } from '../services/userService';

export interface DiagnosticAction {
  instruction: string;
  toolRequired?: string;
  expectedOutcome?: string;
  nextStepIfSuccess?: string;
  nextStepIfFailure?: string;
  result?: "normal" | "abnormal" | "not_sure";
}

export interface DiagnosticCase {
  caseId: string;
  timestamp: number;
  userId: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  initialInput: {
    dtcCodes?: string[];
    symptoms: string;
  };
  steps: {
    stepId: string;
    action: string;
    tool?: string;
    expected: string;
    result: "normal" | "abnormal" | "not_sure";
  }[];
  finalDiagnosis: {
    hypothesis: string;
    confidence: number;
  };
  actualFix?: {
    confirmed: boolean;
    description: string;
  };
  isHighValue: boolean;
}

export interface DiagnosticPattern {
  id: string;
  dtc: string;
  vehicleModel: string;
  commonPath: string[]; // List of action instructions
  successRate: number;
  occurrenceCount: number;
}

export interface SkillContext {
  userId: string;
  user?: UserProfile;
  sessionId?: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: number;
  };
  tools: {
    firestore: any;
    ai: any;
  };
  timestamp: string;
}

export interface Skill<Input = any, Output = any> {
  name: string;
  description: string;
  schema: {
    input: any;
    output: any;
  };
  execute(input: Input, context: SkillContext): Promise<Output>;
}
