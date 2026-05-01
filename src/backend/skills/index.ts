
import { registry } from '../runtime/skillRegistry';
import { dtcLookupSkill } from './dtc/dtcLookup.skill';
import { wiringSearchSkill } from './wiring/wiringSearch.skill';
import { aiDiagnoseSkill } from './diagnostics/aiDiagnose.skill';
import { processTestResultSkill } from './diagnostics/processTestResult.skill';

export function bootstrapSkills() {
  registry.register(dtcLookupSkill);
  registry.register(wiringSearchSkill);
  registry.register(aiDiagnoseSkill);
  registry.register(processTestResultSkill);
}
