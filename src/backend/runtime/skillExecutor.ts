
import { registry } from './skillRegistry';
import { SkillContext } from './types';

export async function executeSkill(
  name: string,
  input: any,
  context: SkillContext
) {
  const skill = registry.get(name);

  if (!skill) {
    throw new Error(`Skill ${name} not found in registry`);
  }

  console.log(`[SKILL EXECUTOR] Executing ${name} for user ${context.userId}`);

  try {
    const result = await skill.execute(input, context);
    return {
      status: 'success',
      skill: name,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error(`[SKILL EXECUTOR] Failure in ${name}:`, error);
    throw {
      status: 'error',
      skill: name,
      message: error.message || 'Internal skill execution failure',
      timestamp: new Date().toISOString()
    };
  }
}
