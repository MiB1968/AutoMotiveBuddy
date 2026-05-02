import { 
  DiagnosticSession, 
  DiagnosticStep, 
  DTCRecord, 
  Equipment, 
  saveSession, 
  getSession, 
  getAllEquipment,
  getActiveSessions 
} from "./db";

export class SessionService {
  /**
   * Initializes a new diagnostic session from a DTC result or record.
   */
  static async startSession(dtc: DTCRecord, vehicleId?: string): Promise<DiagnosticSession> {
    const sessionId = crypto.randomUUID();
    
    // Check if the record already has a workflow. If not, create a basic one from recommendedActions.
    let steps: DiagnosticStep[] = dtc.workflow || [];
    
    if (steps.length === 0 && dtc.recommendedActions) {
      steps = dtc.recommendedActions.map((action, idx) => ({
        id: `step-${idx}`,
        title: `Action ${idx + 1}`,
        instruction: action,
        toolRequired: dtc.toolRequirements?.[idx] || "Standard Scan Tool",
        status: "pending"
      }));
    }

    const session: DiagnosticSession = {
      id: sessionId,
      vehicleId,
      dtcCode: dtc.code,
      status: "active",
      currentStepIndex: 0,
      steps,
      startTime: Date.now(),
      riskAcknowledged: false
    };

    await saveSession(session);
    return session;
  }

  /**
   * Advances the session to the next step or updates a step's status.
   */
  static async updateStep(
    sessionId: string, 
    stepId: string, 
    update: Partial<DiagnosticStep>
  ): Promise<DiagnosticSession | null> {
    const session = await getSession(sessionId);
    if (!session) return null;

    const stepIndex = session.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return session;

    session.steps[stepIndex] = { ...session.steps[stepIndex], ...update };
    
    // Automatically advance currentStepIndex if current step is completed/failed
    if (update.status === "completed" || update.status === "failed" || update.status === "skipped") {
       if (session.currentStepIndex === stepIndex && session.currentStepIndex < session.steps.length - 1) {
          session.currentStepIndex++;
       }
       
       // Check if all steps done
       const allDone = session.steps.every(s => s.status !== "pending" && s.status !== "in_progress");
       if (allDone) {
          session.status = "completed";
          session.endTime = Date.now();
       }
    }

    await saveSession(session);
    return session;
  }

  /**
   * Retrieves all currently active diagnostic sessions.
   */
  static async getActiveSessions(): Promise<DiagnosticSession[]> {
    return getActiveSessions();
  }

  /**
   * Evaluates if the user has the required equipment for the session.
   */
  static async checkEquipmentFeasibility(session: DiagnosticSession): Promise<{
    hasRequiredTools: boolean;
    missingTools: string[];
  }> {
    const userEquipment = await getAllEquipment();
    const requiredTools = new Set<string>();
    
    session.steps.forEach(step => {
      if (step.toolRequired) requiredTools.add(step.toolRequired);
    });

    const missingTools: string[] = [];
    requiredTools.forEach(tool => {
      const toolLower = (tool || "").toLowerCase();
      const hasTool = userEquipment.some(e => 
        (e.name || "").toLowerCase().includes(toolLower) || 
        toolLower.includes((e.type || "").toLowerCase())
      );
      if (!hasTool) missingTools.push(tool);
    });

    return {
      hasRequiredTools: missingTools.length === 0,
      missingTools
    };
  }

  /**
   * Logic to handle STOP refusal or safety gates.
   */
  static shouldRefuseGuidance(session: DiagnosticSession, dtc: DTCRecord): { 
    refuse: boolean; 
    reason?: string 
  } {
    // If risk score is too high and user hasn't acknowledged yet (or it's terminal)
    // We can implement strict logic here.
    if (dtc.operationalAction?.includes("🛑 STOP")) {
       return { 
         refuse: true, 
         reason: dtc.operationalAction 
       };
    }

    // Example safety gate: Multiple HV codes
    // (This would be more complex if we had active session history / multi-DTC scans)

    return { refuse: false };
  }
}
