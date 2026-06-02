import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";
import { logger } from "./logger";

// In dev+prod: dist/index.mjs lives in dist/, skills are copied to dist/skills/ by build.mjs
// Falls back to src/skills/ for direct ts-node/tsx execution
const DIST_SKILLS = join(import.meta.dirname, "skills");
const SRC_SKILLS = join(import.meta.dirname, "..", "src", "skills");
const SKILLS_DIR = existsSync(DIST_SKILLS) ? DIST_SKILLS : SRC_SKILLS;

export interface Skill {
  name: string;
  category: string;
  content: string;
  path: string;
}

let cachedSkills: Skill[] | null = null;

function loadSkillsFromDir(dir: string, baseCategory = ""): Skill[] {
  if (!existsSync(dir)) return [];

  const skills: Skill[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const category = baseCategory || entry.name;
      const subSkills = loadSkillsFromDir(join(dir, entry.name), category);
      skills.push(...subSkills);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      try {
        const filePath = join(dir, entry.name);
        const content = readFileSync(filePath, "utf-8");
        const name = entry.name.replace(".md", "").replace(/_/g, " ");
        skills.push({
          name,
          category: baseCategory,
          content,
          path: relative(SKILLS_DIR, filePath),
        });
      } catch (err) {
        logger.warn({ err, file: entry.name }, "Failed to load skill file");
      }
    }
  }

  return skills;
}

export function getAllSkills(): Skill[] {
  if (!cachedSkills) {
    cachedSkills = loadSkillsFromDir(SKILLS_DIR);
    logger.info({ count: cachedSkills.length }, "Skills loaded");
  }
  return cachedSkills;
}

export function getSkillsByCategory(category: string): Skill[] {
  return getAllSkills().filter(
    (s) =>
      s.category.toLowerCase().includes(category.toLowerCase()) ||
      s.path.toLowerCase().includes(category.toLowerCase())
  );
}

export function getRelevantSkillContent(domains: string[]): string {
  const domainToCategory: Record<string, string[]> = {
    BUDGET: ["budget_and_saving", "personal_finance_intro"],
    INVESTMENT: ["investments_and_retirement_7"],
    DEBT: ["loans_and_debt", "consumer_credit"],
    TAX: ["taxes_and_tax_forms_10"],
    INSURANCE: ["insurance-6"],
    HOUSING: ["housing_14"],
    CAREER: ["careers_and_education_9", "employement_11"],
    FRAUD: ["scams_and_fraud_8"],
    GENERAL: ["personal_finance_intro", "financial_goal"],
    BANKING: ["banking_12"],
  };

  const allSkills = getAllSkills();
  const relevantSkills: Skill[] = [];

  for (const domain of domains) {
    const categories = domainToCategory[domain] || [];
    for (const cat of categories) {
      const found = allSkills.filter(
        (s) =>
          s.category.toLowerCase() === cat.toLowerCase() ||
          s.path.toLowerCase().startsWith(cat.toLowerCase())
      );
      relevantSkills.push(...found);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = relevantSkills.filter((s) => {
    if (seen.has(s.path)) return false;
    seen.add(s.path);
    return true;
  });

  if (unique.length === 0) {
    // Fall back to personal finance intro
    const intro = allSkills.filter((s) =>
      s.category.toLowerCase().includes("personal_finance_intro")
    );
    return intro.map((s) => `### ${s.name}\n${s.content}`).join("\n\n");
  }

  return unique
    .slice(0, 6) // Limit context size
    .map((s) => `### ${s.name}\n${s.content}`)
    .join("\n\n");
}
