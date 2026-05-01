
import { Skill } from './types';

class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(skill: Skill) {
    this.skills.set(skill.name, skill);
    console.log(`[SKILL REGISTRY] Registered: ${skill.name}`);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }
}

export const registry = new SkillRegistry();
