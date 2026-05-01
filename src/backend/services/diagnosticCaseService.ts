
import { firestore } from '../../../server';
import { DiagnosticCase, DiagnosticPattern } from '../runtime/types';

export class DiagnosticCaseService {
  private get db() {
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    return firestore;
  }

  async logCase(session: Partial<DiagnosticCase>) {
    if (!session.caseId) return;
    
    await this.db.collection('diagnostic_cases').doc(session.caseId).set({
      ...session,
      timestamp: Date.now(),
      isHighValue: !!session.actualFix?.confirmed
    }, { merge: true });
    
    // If high value, trigger pattern re-calculation (or mark for batch processing)
    if (session.actualFix?.confirmed) {
      await this.updatePatterns(session as DiagnosticCase);
    }
  }

  async getPatterns(dtc?: string, model?: string): Promise<DiagnosticPattern[]> {
    let query = this.db.collection('diagnostic_patterns') as any;
    
    if (dtc) query = query.where('dtc', '==', dtc);
    if (model) query = query.where('vehicleModel', '==', model);
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }

  private async updatePatterns(session: DiagnosticCase) {
    const dtc = session.initialInput.dtcCodes?.[0];
    const model = session.vehicle.model;
    
    if (!dtc || !model) return;
    
    const patternId = `${dtc}_${model}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const docRef = this.db.collection('diagnostic_patterns').doc(patternId);
    const existing = await docRef.get();
    
    const path = session.steps.map(s => s.action);
    
    if (!existing.exists) {
      await docRef.set({
        dtc,
        vehicleModel: model,
        commonPath: path,
        successRate: 1.0,
        occurrenceCount: 1
      });
    } else {
      const data = existing.data() as DiagnosticPattern;
      const newCount = data.occurrenceCount + 1;
      // Simple moving average for success rate (in this case, all logged here are 'success' because we only trigger on confirmed fix)
      // but in real world we'd track fail/pass ratio.
      await docRef.update({
        occurrenceCount: newCount,
        // For now, if we found a successful path, we append/refine
        commonPath: path // In a real system, we'd do path merging/frequency analysis
      });
    }
  }
}

export const diagnosticCaseService = new DiagnosticCaseService();
