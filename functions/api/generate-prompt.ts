// OpenRouter API generate-prompt.ts
import type { Language, Domain, OutputLength, PromptType } from '../../types';
import { translations as appTranslations } from '../../constants';
import { SecurityHeadersManager } from '../../lib/security.js';

// JWT verification function (same as prompts.ts)
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const message = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // Parse payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

interface GeneratePromptParams {
  rawRequest: string;
  promptType: PromptType;
  domain: Domain;
  language: Language;
  outputLength: OutputLength;
  expertRole: string;
  mission: string;
  constraints: string;
}

// Expertise suggestion types
interface ExpertiseSuggestion {
  role: string;
  confidence: number;
  rationale: string;
}

interface ExpertiseSuggestionResult {
  suggestions: ExpertiseSuggestion[];
  chosen: ExpertiseSuggestion;
}

// Task analysis types
interface TaskAnalysis {
  complexity: number; // 1-10 scale
  taskType: string;
  archetype: string;
}

/**
 * Analyze task complexity and determine archetype
 */
function analyzeTask(params: GeneratePromptParams): TaskAnalysis {
  const { rawRequest, domain, outputLength } = params;
  const text = rawRequest.toLowerCase();
  
  let complexity = 5; // Default medium complexity
  let taskType = 'general';
  
  // Complexity indicators (increase complexity)
  const complexityIndicators = [
    { patterns: ['stratégie|strategy', 'planning|planification', 'roadmap'], weight: 2 },
    { patterns: ['analyse|analysis', 'évaluation|evaluation', 'audit'], weight: 1.5 },
    { patterns: ['multiple|plusieurs', 'complet|comprehensive', 'détaillé|detailed'], weight: 1 },
    { patterns: ['étapes|steps', 'processus|process', 'méthodologie|methodology'], weight: 1 },
    { patterns: ['risques|risks', 'opportunités|opportunities', 'alternatives'], weight: 1.5 },
    { patterns: ['budget', 'roi', 'kpi', 'metrics|métriques'], weight: 1 },
    { patterns: ['équipe|team', 'organisation|organization', 'gestion|management'], weight: 1 }
  ];
  
  // Simplicity indicators (decrease complexity)
  const simplicityIndicators = [
    { patterns: ['simple', 'basic|basique', 'rapide|quick', 'courte|short'], weight: -1 },
    { patterns: ['liste|list', 'résumé|summary', 'titre|title'], weight: -1.5 },
    { patterns: ['exemple|example', 'modèle|template', 'format'], weight: -1 }
  ];
  
  // Calculate complexity
  [...complexityIndicators, ...simplicityIndicators].forEach(({ patterns, weight }) => {
    patterns.forEach(pattern => {
      if (new RegExp(pattern, 'i').test(text)) {
        complexity += weight;
      }
    });
  });
  
  // Domain adjustments
  const domainComplexityAdjustments = {
    'legal': 1.5,
    'finance': 1.5, 
    'consulting': 1,
    'healthcare': 1,
    'engineering': 1,
    'research': 1,
    'business': 0.5,
    'marketing': 0,
    'sales': -0.5,
    'hr': 0,
    'operations': 0.5,
    'creative': -0.5,
    'technical': 1
  };
  
  complexity += domainComplexityAdjustments[domain] || 0;
  
  // Output length adjustment
  const lengthAdjustments = { 'short': -1, 'medium': 0, 'long': 1 };
  complexity += lengthAdjustments[outputLength] || 0;
  
  // Clamp to 1-10 range
  complexity = Math.max(1, Math.min(10, Math.round(complexity)));
  
  // Determine task type and archetype
  if (complexity <= 3) {
    taskType = 'simple';
    complexity <= 2 ? (taskType = 'quick_task') : null;
  } else if (complexity <= 6) {
    taskType = 'structured';
  } else {
    taskType = 'complex';
    complexity >= 8 ? (taskType = 'strategic') : null;
  }
  
  // Map to internal archetypes
  const archetypeMapping = {
    'quick_task': 'QUICK_TASK',
    'simple': 'STRUCTURED_OUTPUT', 
    'structured': 'ANALYTICAL',
    'complex': 'STRATEGIC_PLANNING',
    'strategic': 'FULL_AGENTIC'
  };
  
  const archetype = archetypeMapping[taskType] || 'ANALYTICAL';
  
  return { complexity, taskType, archetype };
}

/**
 * Map archetype to user-visible level labels
 */
function mapArchetypeToLevel(archetype: string): string {
  const mapping = {
    'QUICK_TASK': 'Rapide & Structuré',
    'STRUCTURED_OUTPUT': 'Rapide & Structuré', 
    'ANALYTICAL': 'Pro & Structuré',
    'CREATIVE_GENERATIVE': 'Pro & Structuré',
    'STRATEGIC_PLANNING': 'Pro & Structuré',
    'FULL_AGENTIC': 'Stratégie & Itérations'
  };
  
  return mapping[archetype] || 'Pro & Structuré';
}

/**
 * Suggest expert roles based on content analysis
 */
function suggestExpertise(rawRequest: string, domain: Domain, language: Language, taskAnalysis: TaskAnalysis): ExpertiseSuggestionResult {
  const text = rawRequest.toLowerCase();
  const { complexity, taskType } = taskAnalysis;
  
  // Domain-based role buckets
  const domainRoles = {
    business: {
      fr: ['Stratège Business', 'Consultant Senior', 'Directeur Stratégie', 'Business Analyst', 'Chef de Projet'],
      en: ['Business Strategist', 'Senior Consultant', 'Strategy Director', 'Business Analyst', 'Project Manager']
    },
    marketing: {
      fr: ['Marketing Manager', 'Growth Hacker', 'Brand Strategist', 'Digital Marketer', 'Content Strategist'],
      en: ['Marketing Manager', 'Growth Hacker', 'Brand Strategist', 'Digital Marketer', 'Content Strategist']
    },
    legal: {
      fr: ['Juriste d\'entreprise', 'Avocat conseil', 'Compliance Officer', 'Legal Advisor', 'Responsable Juridique'],
      en: ['Corporate Lawyer', 'Legal Counsel', 'Compliance Officer', 'Legal Advisor', 'Legal Manager']
    },
    finance: {
      fr: ['Analyste Financier', 'CFO', 'Contrôleur de Gestion', 'Investment Analyst', 'Financial Planner'],
      en: ['Financial Analyst', 'CFO', 'Management Controller', 'Investment Analyst', 'Financial Planner']
    },
    hr: {
      fr: ['DRH', 'HR Business Partner', 'Talent Acquisition', 'Learning & Development', 'Compensation & Benefits'],
      en: ['HR Director', 'HR Business Partner', 'Talent Acquisition', 'Learning & Development', 'Compensation & Benefits']
    },
    sales: {
      fr: ['Sales Manager', 'Business Developer', 'Account Executive', 'Sales Operations', 'Customer Success'],
      en: ['Sales Manager', 'Business Developer', 'Account Executive', 'Sales Operations', 'Customer Success']
    },
    consulting: {
      fr: ['Consultant Strategy', 'Senior Associate', 'Principal Consultant', 'Management Consultant', 'Practice Lead'],
      en: ['Strategy Consultant', 'Senior Associate', 'Principal Consultant', 'Management Consultant', 'Practice Lead']
    },
    research: {
      fr: ['Research Analyst', 'Data Scientist', 'Researcher Senior', 'Innovation Manager', 'Market Researcher'],
      en: ['Research Analyst', 'Data Scientist', 'Senior Researcher', 'Innovation Manager', 'Market Researcher']
    },
    engineering: {
      fr: ['Architecte logiciel', 'Tech Lead', 'DevOps Engineer', 'Solution Architect', 'Engineering Manager'],
      en: ['Software Architect', 'Tech Lead', 'DevOps Engineer', 'Solution Architect', 'Engineering Manager']
    },
    operations: {
      fr: ['Operations Manager', 'Process Improvement', 'Supply Chain Manager', 'Quality Manager', 'COO'],
      en: ['Operations Manager', 'Process Improvement', 'Supply Chain Manager', 'Quality Manager', 'COO']
    },
    healthcare: {
      fr: ['Medical Advisor', 'Health Data Analyst', 'Healthcare Consultant', 'Clinical Research', 'Health Policy'],
      en: ['Medical Advisor', 'Health Data Analyst', 'Healthcare Consultant', 'Clinical Research', 'Health Policy']
    },
    creative: {
      fr: ['Creative Director', 'UX Designer', 'Content Creator', 'Brand Designer', 'Art Director'],
      en: ['Creative Director', 'UX Designer', 'Content Creator', 'Brand Designer', 'Art Director']
    },
    technical: {
      fr: ['Technical Architect', 'Senior Developer', 'System Administrator', 'IT Consultant', 'Technology Lead'],
      en: ['Technical Architect', 'Senior Developer', 'System Administrator', 'IT Consultant', 'Technology Lead']
    }
  };
  
  const roles = domainRoles[domain]?.[language] || domainRoles[domain]?.['en'] || domainRoles['business'][language];
  
  // Keyword-based role boosting
  const keywordBoosts = {
    'saas|software|app|application': ['Software Architect', 'Tech Lead', 'Product Manager'],
    'marketing|campaign|brand|content': ['Marketing Manager', 'Brand Strategist', 'Content Strategist'],
    'finance|budget|roi|investment': ['Financial Analyst', 'CFO', 'Investment Analyst'],
    'strategy|strategic|planning': ['Strategy Consultant', 'Business Strategist', 'Strategic Planner'],
    'legal|contract|compliance|risk': ['Legal Counsel', 'Compliance Officer', 'Risk Manager'],
    'data|analytics|research|analysis': ['Data Scientist', 'Research Analyst', 'Business Analyst'],
    'sales|customer|revenue|pipeline': ['Sales Manager', 'Business Developer', 'Customer Success'],
    'hr|people|talent|recruiting': ['HR Director', 'Talent Acquisition', 'People Operations'],
    'operations|process|efficiency': ['Operations Manager', 'Process Improvement', 'Operational Excellence']
  };
  
  // Calculate confidence for each role
  const suggestions: ExpertiseSuggestion[] = roles.map(role => {
    let confidence = 0.5; // Base confidence
    
    // Domain match boost
    confidence += 0.2;
    
    // Keyword matching boost
    Object.entries(keywordBoosts).forEach(([keywords, boostedRoles]) => {
      if (new RegExp(keywords, 'i').test(text)) {
        if (boostedRoles.some(boostedRole => role.toLowerCase().includes(boostedRole.toLowerCase()) || boostedRole.toLowerCase().includes(role.toLowerCase()))) {
          confidence += 0.15;
        }
      }
    });
    
    // Seniority boost based on complexity
    if (complexity >= 7 && (role.toLowerCase().includes('senior') || role.toLowerCase().includes('director') || role.toLowerCase().includes('lead'))) {
      confidence += 0.1;
    }
    
    // Task type alignment
    if (taskType === 'strategic' && (role.toLowerCase().includes('strategy') || role.toLowerCase().includes('consultant'))) {
      confidence += 0.1;
    }
    
    // Clamp confidence to 0.3-0.95 range
    confidence = Math.max(0.3, Math.min(0.95, confidence));
    
    return {
      role,
      confidence: Math.round(confidence * 100) / 100,
      rationale: generateRationale(role, domain, complexity, language)
    };
  });
  
  // Sort by confidence and take top suggestions
  suggestions.sort((a, b) => b.confidence - a.confidence);
  const topSuggestions = suggestions.slice(0, 4);
  
  return {
    suggestions: topSuggestions,
    chosen: topSuggestions[0]
  };
}

/**
 * Generate rationale for role suggestion
 */
function generateRationale(role: string, domain: Domain, complexity: number, language: Language): string {
  const templates = {
    fr: {
      domain: `Expertise ${domain}`,
      complexity: complexity >= 7 ? 'tâche complexe' : complexity >= 5 ? 'niveau intermédiaire' : 'tâche standard',
      seniority: role.toLowerCase().includes('senior') || role.toLowerCase().includes('director') ? 'niveau senior' : 'spécialisation métier'
    },
    en: {
      domain: `${domain} expertise`,
      complexity: complexity >= 7 ? 'complex task' : complexity >= 5 ? 'intermediate level' : 'standard task',
      seniority: role.toLowerCase().includes('senior') || role.toLowerCase().includes('director') ? 'senior level' : 'domain specialization'
    }
  };
  
  const t = templates[language] || templates.en;
  return `${t.domain}, ${t.complexity}, ${t.seniority}`;
}

/**
 * Generate format hints for UI based on archetype and domain
 */
function generateFormatHints(archetype: string, domain: Domain, language: Language): string[] {
  const hints = {
    fr: {
      'QUICK_TASK': ['Structure simple', 'Réponse directe'],
      'STRUCTURED_OUTPUT': ['Sections claires', 'Format organisé'],
      'ANALYTICAL': ['Plan détaillé', 'Exemples concrets', 'Synthèse'],
      'STRATEGIC_PLANNING': ['Analyse approfondie', 'Multiples options', 'Recommandations'],
      'FULL_AGENTIC': ['Auto-évaluation', 'Itération guidée', 'Amélioration continue']
    },
    en: {
      'QUICK_TASK': ['Simple structure', 'Direct response'],
      'STRUCTURED_OUTPUT': ['Clear sections', 'Organized format'],
      'ANALYTICAL': ['Detailed plan', 'Concrete examples', 'Summary'],
      'STRATEGIC_PLANNING': ['In-depth analysis', 'Multiple options', 'Recommendations'],
      'FULL_AGENTIC': ['Self-assessment', 'Guided iteration', 'Continuous improvement']
    }
  };
  
  const domainHints = {
    fr: {
      'marketing': ['CTA explicite', 'Métriques'],
      'finance': ['Chiffres clés', 'ROI'],
      'legal': ['Conformité', 'Risques'],
      'business': ['KPIs', 'Timeline']
    },
    en: {
      'marketing': ['Clear CTA', 'Metrics'],
      'finance': ['Key figures', 'ROI'],
      'legal': ['Compliance', 'Risks'],
      'business': ['KPIs', 'Timeline']
    }
  };
  
  const baseHints = hints[language]?.[archetype] || hints.en[archetype] || [];
  const extraHints = domainHints[language]?.[domain] || [];
  
  return [...baseHints, ...extraHints].slice(0, 3); // Limit to 3 hints
}

/**
 * NEW: Build adaptive prompt with 8 sections based on complexity level
 */
function buildAdaptivePrompt(params: GeneratePromptParams, analysis: TaskAnalysis, effectiveRole: string): { systemInstruction: string, userQuery: string, hints: string[] } {
  const { rawRequest, domain, language, outputLength, mission, constraints } = params;
  const { complexity, archetype } = analysis;
  
  const levelLabel = mapArchetypeToLevel(archetype);
  const isLevel3 = levelLabel.includes('Stratégie') || levelLabel.includes('Strategy');
  
  // 1. <System> Section
  const systemSection = language === 'fr' 
    ? `<System>:\nVous êtes **${effectiveRole}**. Votre mission : ${mission || "aider efficacement"}.\nPriorité : produire un résultat professionnel, clair, immédiatement exploitable.`
    : `<System>:\nYou are **${effectiveRole}**. Your mission: ${mission || "help effectively"}.\nPriority: deliver a professional, clear, immediately usable result.`;

  // 2. <Context>/<Task> Section  
  const contextSection = language === 'fr'
    ? `<Context>:\n${rawRequest}\n\nÉléments clés détectés : Domaine ${domain}, complexité ${complexity}/10, niveau ${levelLabel}.`
    : `<Context>:\n${rawRequest}\n\nKey elements detected: ${domain} domain, complexity ${complexity}/10, level ${levelLabel}.`;

  // 3. <Methodology> Section - Variable by level
  let methodologySection = '';
  if (levelLabel.includes('Rapide') || levelLabel.includes('Quick')) {
    methodologySection = language === 'fr'
      ? `<Methodology>:\n1) Comprendre le besoin et clarifier l'objectif en 1 phrase\n2) Structurer la réponse avec titres courts\n3) Vérifier concision et utilité immédiate`
      : `<Methodology>:\n1) Understand the need and clarify the objective in 1 sentence\n2) Structure response with short titles\n3) Verify conciseness and immediate utility`;
  } else if (levelLabel.includes('Pro') || levelLabel.includes('Structured')) {
    methodologySection = language === 'fr'
      ? `<Methodology>:\n1) Analyse : objectifs, contraintes, critères de succès\n2) Plan : sections, ordre logique, formats attendus\n3) Exécution : rédiger, illustrer par 1–2 exemples, vérifier contre contraintes\n4) Synthèse : recommandations actionnables`
      : `<Methodology>:\n1) Analysis: objectives, constraints, success criteria\n2) Plan: sections, logical order, expected formats\n3) Execution: write, illustrate with 1-2 examples, verify against constraints\n4) Synthesis: actionable recommendations`;
  } else { // Stratégie & Itérations
    methodologySection = language === 'fr'
      ? `<Methodology>:\n1) Analyse approfondie (objectifs explicites/implicites, risques)\n2) Stratégie (comparaison de 2–3 approches, justification)\n3) Exécution professionnelle (sections + livrables)\n4) Vérification (checklist critères)`
      : `<Methodology>:\n1) In-depth analysis (explicit/implicit objectives, risks)\n2) Strategy (comparison of 2-3 approaches, justification)\n3) Professional execution (sections + deliverables)\n4) Verification (criteria checklist)`;
  }

  // 4. <Constraints> Section
  const constraintsSection = constraints 
    ? (language === 'fr' 
        ? `<Constraints>:\n${constraints.split('\n').map(c => c.trim()).filter(c => c).map(c => `• ${c}`).join('\n')}`
        : `<Constraints>:\n${constraints.split('\n').map(c => c.trim()).filter(c => c).map(c => `• ${c}`).join('\n')}`)
    : '';

  // 5. <Format> Section
  const lengthLabels = {
    fr: { 'short': 'court (≈150 mots)', 'medium': 'moyen (≈300 mots)', 'long': 'long (≈500+ mots)' },
    en: { 'short': 'short (≈150 words)', 'medium': 'medium (≈300 words)', 'long': 'long (≈500+ words)' }
  };
  
  const formatSection = language === 'fr'
    ? `<Format>:\n• Longueur : ${lengthLabels.fr[outputLength]}\n• Style : professionnel et actionnable\n• Structure : sections claires avec titres`
    : `<Format>:\n• Length: ${lengthLabels.en[outputLength]}\n• Style: professional and actionable\n• Structure: clear sections with headings`;

  // 6. <Self-Assessment> Section (Level 3 only)
  const selfAssessmentSection = isLevel3 
    ? (language === 'fr' 
        ? `<Self-Assessment>:\nÀ la fin, demander : "Souhaitez-vous une évaluation contre des critères clés ? (Oui/Non)"\nSi Oui → produire un tableau d'évaluation (Note/10, Justification, Améliorations) sur des critères contextuels (Exactitude, Complétude, Clarté, Impact).`
        : `<Self-Assessment>:\nAt the end, ask: "Would you like an evaluation against key criteria? (Yes/No)"\nIf Yes → produce an evaluation table (Score/10, Justification, Improvements) on contextual criteria (Accuracy, Completeness, Clarity, Impact).`)
    : '';

  // 7. <Iteration> Section (Level 3 only)  
  const iterationSection = isLevel3
    ? (language === 'fr'
        ? `<Iteration>:\nAprès l'évaluation, demander : "Souhaitez-vous que j'améliore le brouillon selon ces recommandations ? (Oui/Non)"`
        : `<Iteration>:\nAfter evaluation, ask: "Would you like me to improve the draft according to these recommendations? (Yes/No)"`)
    : '';

  // 8. <Example> Section - Adapted to level
  let exampleSection = '';
  if (levelLabel.includes('Rapide') || levelLabel.includes('Quick')) {
    exampleSection = language === 'fr'
      ? `<Example>:\nTitre : [Titre concret du livrable]\n[2-3 lignes formatées du début de la réponse]`
      : `<Example>:\nTitle: [Concrete deliverable title]\n[2-3 formatted lines from the beginning of the response]`;
  } else if (levelLabel.includes('Pro') || levelLabel.includes('Structured')) {
    exampleSection = language === 'fr'
      ? `<Example>:\nTitre : [Titre du livrable]\n• [Point clé 1]\n• [Point clé 2]\n• [Point clé 3]`
      : `<Example>:\nTitle: [Deliverable title]\n• [Key point 1]\n• [Key point 2]\n• [Key point 3]`;
  } else { // Strategy level
    exampleSection = language === 'fr'
      ? `<Example>:\nRésumé exécutif : [2-3 lignes de synthèse]\n\n## [Sous-titre principal]\n[Début du développement structuré]`
      : `<Example>:\nExecutive Summary: [2-3 lines of synthesis]\n\n## [Main subtitle]\n[Beginning of structured development]`;
  }

  // Combine all sections
  const sections = [
    systemSection,
    contextSection, 
    methodologySection,
    constraintsSection,
    formatSection,
    selfAssessmentSection,
    iterationSection,
    exampleSection
  ].filter(section => section.trim().length > 0);

  const systemInstruction = sections.join('\n\n');
  const userQuery = rawRequest;
  const hints = generateFormatHints(archetype, domain, language);

  return { systemInstruction, userQuery, hints };
}

// Enhanced metaPromptTranslations with detailed methodology for both approaches
const metaPromptTranslations = {
  en: {
    systemInstructionBase: "You are an expert prompt engineer. Generate a complete, executable prompt following the exact format: <System>, <User>, <Example>. The final prompt must be in {TARGET_LANGUAGE} and ready for immediate use by an AI. Include detailed methodology in the User section and compelling examples. IMPORTANT: Start your response with a concise title (5-8 words maximum) using this EXACT format:\n\nTITLE: [Your concise title here]\n\nPROMPT:\n[Your complete prompt here]\n\nOutput ONLY the title and prompt - no meta-commentary or explanations outside this structure.",
    
    userQueryHeader: "Please generate a structured prompt. Here are the details:",
    rawRequestLabel: "User's Goal / Raw Request:",
    promptTypeLabel: "Chosen Prompt Structure Type:",
    domainLabel: "Domain:",
    outputLengthLabel: "Desired Output Length for the AI using the generated prompt:",
    expertRoleLabel: "Expert Role for the AI using the generated prompt:",
    missionLabel: "Main Mission for the AI using the generated prompt:",
    constraintsLabel: "Constraints for the AI using the generated prompt (one per line):",
    noneSpecified: "None specified",
    finalPromptLangLabel: "The language for the final prompt itself MUST be: {TARGET_LANGUAGE}.",
    constructPromptInstruction: "Now, based on whether the type is MVP or AGENTIC, construct the prompt using the following templates and information.",
    
    // Enhanced MVP Section
    mvpTemplateHeader: "For an \"MVP\" type prompt, generate a complete executable prompt:",
    mvpGenerateInstruction: "Generate a complete, executable prompt using this exact structure:",
    mvpSystemRole: "You are an excellent {expertRolePlaceholder}: knowledgeable, precise, pedagogical. Your mission is to {missionPlaceholder}.",
    mvpExpertPlaceholder: "Expert",
    mvpMissionPlaceholder: "help effectively",
    
    // Enhanced Methodology for MVP
    mvpMethodologyHeader: "DETAILED METHODOLOGY - Follow this structured approach:",
    mvpAnalysisHeader: "1. IN-DEPTH ANALYSIS:",
    mvpAnalysisTasks: [
      "Meticulously analyze all elements provided in the request above",
      "Identify explicit and implicit objectives, quality criteria, and success metrics",
      "Note technical, creative, and logistical constraints to be respected", 
      "Evaluate context, underlying challenges, and optimization opportunities",
      "Determine the most appropriate resources, tools, and approaches"
    ],
    mvpPlanningHeader: "2. STRATEGIC PLANNING:",
    mvpPlanningTasks: [
      "Consider multiple methodological approaches to address the request optimally",
      "Rigorously evaluate advantages, disadvantages, and implications of each strategy",
      "Select the most appropriate approach and formulate clear justification for this choice",
      "Plan logical structure, progression, and optimal organization of the deliverable",
      "Anticipate execution challenges and prepare adaptation strategies if necessary"
    ],
    mvpExecutionHeader: "3. PROFESSIONAL EXECUTION:",
    mvpExecutionTasks: [
      "Produce a deliverable organized according to clear professional architecture",
      "Use premium formatting with appropriate sections, subsections, and structural elements",
      "Integrate concrete examples, evidence, data, and relevant references to support quality",
      "Scrupulously respect all constraints, specifications, and formulated requirements",
      "Systematically aim for professional-level quality that exceeds standard expectations",
      "Personalize content to maximize its specific relevance and added value"
    ],
    
    mvpExpectedOutputFormat: "Expected output format:",
    mvpLength: "Length:",
    mvpStyle: "Style: Clear and structured",
    mvpLanguage: "Language: {TARGET_LANGUAGE}",
    
    // Fixed Example Instruction  
    mvpExampleInstruction: "Show the exact beginning of the expected deliverable - first 3-5 lines of actual output, not process description. Examples: For podcast → 'Voice 1: Welcome everyone to today's show...', for lesson plan → 'LESSON: [Title] | OBJECTIVES: Students will be able to...', for analysis → 'EXECUTIVE SUMMARY: This analysis reveals...'. The example must be a direct sample of the deliverable.",
    
    mvpTitleInstruction: "Create a concise, professional title (5-8 words maximum) that summarizes the prompt's purpose. Focus on the main action and subject. Examples: 'Course Design Marketing Strategy', 'Analysis Customer Feedback', 'Training Module Creation'.",
    
    mvpFooter: "CRITICAL: First provide the title using format 'TITLE: [your title]', then generate the complete prompt with <System>, <User>, and <Example> sections. Do not add meta-commentary or explanations outside this structure.",
    
    // Enhanced AGENTIC Section
    agenticTemplateHeader: "For an \"AGENTIC\" type prompt, generate a complete executable prompt with self-assessment capabilities:",
    agenticGenerateInstruction: "Generate a complete, executable AGENTIC prompt using this exact structure:",
    agenticTitleInstruction: "[Generate a concise and descriptive title (max 5-7 words) derived from the user's raw request.]",
    agenticRole: "{expertRolePlaceholder} (Agentic AI)",
    agenticExpertPlaceholder: "Expert Analyst", 
    agenticNote: "*Note: \"Agentic AI\" means an AI capable of acting autonomously, thinking, and iterating on its work.*",
    agenticContext: "Context:",
    agenticInstructionsHeader: "Instructions:",
    
    // Same detailed methodology for AGENTIC (reusing MVP tasks)
    agenticAnalysisHeader: "1. IN-DEPTH ANALYSIS:",
    agenticAnalysisTasks: [
      "Meticulously analyze all elements provided related to the Context above",
      "Identify explicit and implicit objectives, quality criteria, and success metrics",
      "Note technical, creative, and logistical constraints to be respected",
      "Evaluate context, underlying challenges, and optimization opportunities", 
      "Determine the most appropriate resources, tools, and approaches"
    ],
    agenticThinkingHeader: "2. STRATEGIC PLANNING:",
    agenticThinkingTasks: [
      "Consider multiple methodological approaches to address the Context optimally",
      "Rigorously evaluate advantages, disadvantages, and implications of each strategy",
      "Select the most appropriate approach and formulate clear justification for this choice",
      "Plan logical structure, progression, and optimal organization of the deliverable",
      "Anticipate execution challenges and prepare adaptation strategies if necessary"
    ],
    agenticDevelopmentHeader: "3. PROFESSIONAL EXECUTION:",
    agenticDevelopmentTasks: [
      "Produce a deliverable organized according to clear professional architecture",
      "Use premium formatting with appropriate sections, subsections, and structural elements", 
      "Integrate concrete examples, evidence, data, and relevant references to support quality",
      "Scrupulously respect all constraints, specifications, and formulated requirements",
      "Systematically aim for professional-level quality that exceeds standard expectations",
      "Personalize content to maximize its specific relevance and added value"
    ],
    
    // Self-Assessment (AGENTIC only)
    agenticSelfAssessmentHeader: "4. SELF-ASSESSMENT AND CONTINUOUS IMPROVEMENT:",
    agenticSelfAssessmentQuestion1: "At the end of its work, the AI executing this prompt **must always ask the user verbatim**:\n    \"🤔 Would you like me to evaluate this result against key criteria and provide suggestions for improvement? (Yes/No)\"",
    agenticSelfAssessmentInstruction: "If the user responds \"Yes\" (or similar affirmative), the AI should then perform a self-assessment using the following evaluation method, presenting it in a table:",
    agenticEvaluationCriteria: {
        education: ['Pedagogical Clarity', 'Level Appropriateness', 'Learner Engagement', 'Logical Progression'],
        technical: ['Technical Accuracy', 'Completeness of Analysis', 'Rigorous Methodology', 'Actionable Recommendations'],
        other: ['Originality', 'Coherence', 'Impact', 'Quality of Execution']
    },
    agenticEvalTableHeader: "| Criterion                     | Rating (/10) | Justification for Rating | Concrete Suggestions for Improvement |\n    |-------------------------------|--------------|--------------------------|--------------------------------------|",
    agenticSelfAssessmentQuestion2: "After presenting the evaluation, the AI **must also ask the user verbatim**:\n    \"Based on the evaluation above, would you like me to attempt to improve the draft? (Yes/No)\"",
    agenticTitleInstruction: "Create a concise, professional title (5-8 words maximum) that captures the agentic prompt's purpose. Focus on the main analytical or creative goal. Examples: 'Strategic Marketing Analysis Tool', 'Interactive Learning Module Builder', 'Content Creation Assistant'.",
    
    agenticFooter: "CRITICAL: First provide the title using format 'TITLE: [your title]', then generate the complete prompt with <System>, <User>, and <Example> sections. Do not add meta-commentary or explanations outside this structure.",
  },
  
  fr: {
    systemInstructionBase: "Vous êtes un ingénieur de prompts expert. Générez un prompt complet et exécutable suivant exactement le format : <System>, <User>, <Example>. Le prompt final doit être en {TARGET_LANGUAGE} et prêt à être utilisé immédiatement par une IA. Incluez une méthodologie détaillée dans la section User et des exemples convaincants. IMPORTANT: Commencez votre réponse par un titre concis (5-8 mots maximum) en utilisant ce format EXACT :\n\nTITRE: [Votre titre concis ici]\n\nPROMPT:\n[Votre prompt complet ici]\n\nNe générez QUE le titre et le prompt - aucun méta-commentaire ou explication en dehors de cette structure.",
    
    userQueryHeader: "Veuillez générer un prompt structuré. Voici les détails :",
    rawRequestLabel: "Objectif / Demande brute de l'utilisateur :",
    promptTypeLabel: "Type de structure de prompt choisi :",
    domainLabel: "Domaine :",
    outputLengthLabel: "Longueur de sortie souhaitée pour l'IA utilisant le prompt généré :",
    expertRoleLabel: "Rôle d'expert pour l'IA utilisant le prompt généré :",
    missionLabel: "Mission principale pour l'IA utilisant le prompt généré :",
    constraintsLabel: "Contraintes pour l'IA utilisant le prompt généré (une par ligne) :",
    noneSpecified: "Aucune spécifiée",
    finalPromptLangLabel: "La langue du prompt final lui-même DOIT être : {TARGET_LANGUAGE}.",
    constructPromptInstruction: "Maintenant, selon que le type est MVP ou AGENTIQUE, générez le prompt en utilisant les modèles et informations suivants.",
    
    // Enhanced MVP Section - French
    mvpTemplateHeader: "Pour un prompt de type \"MVP\", générez un prompt exécutable complet :",
    mvpGenerateInstruction: "Générez un prompt complet et exécutable en utilisant exactement cette structure :",
    mvpSystemRole: "Vous êtes un excellent {expertRolePlaceholder} : compétent, précis, pédagogue. Votre mission est d'{missionPlaceholder}.",
    mvpExpertPlaceholder: "Expert",
    mvpMissionPlaceholder: "aider efficacement",
    
    // Enhanced Methodology for MVP - French
    mvpMethodologyHeader: "MÉTHODOLOGIE DÉTAILLÉE - Suivez cette approche structurée :",
    mvpAnalysisHeader: "1. ANALYSE APPROFONDIE :",
    mvpAnalysisTasks: [
      "Analysez méticuleusement tous les éléments fournis dans la demande ci-dessus",
      "Identifiez les objectifs explicites et implicites, critères de qualité et métriques de réussite",
      "Notez les contraintes techniques, créatives et logistiques à respecter",
      "Évaluez le contexte, les défis sous-jacents et les opportunités d'optimisation",
      "Déterminez les ressources, outils et approches les plus appropriés"
    ],
    mvpPlanningHeader: "2. PLANIFICATION STRATÉGIQUE :",
    mvpPlanningTasks: [
      "Considérez de multiples approches méthodologiques pour aborder la demande de manière optimale",
      "Évaluez rigoureusement les avantages, inconvénients et implications de chaque stratégie",
      "Sélectionnez l'approche la plus appropriée et formulez une justification claire de ce choix",
      "Planifiez la structure logique, la progression et l'organisation optimale du livrable",
      "Anticipez les défis d'exécution et préparez des stratégies d'adaptation si nécessaire"
    ],
    mvpExecutionHeader: "3. EXÉCUTION PROFESSIONNELLE :",
    mvpExecutionTasks: [
      "Produisez un livrable organisé selon une architecture professionnelle claire",
      "Utilisez un formatage premium avec sections, sous-sections et éléments de structuration appropriés",
      "Intégrez des exemples concrets, preuves, données et références pertinentes pour étayer la qualité",
      "Respectez scrupuleusement toutes les contraintes, spécifications et exigences formulées",
      "Visez systématiquement un niveau de qualité professionnel qui dépasse les attentes standard",
      "Personnalisez le contenu pour maximiser sa pertinence et sa valeur ajoutée spécifique"
    ],
    
    mvpExpectedOutputFormat: "Format de sortie attendu :",
    mvpLength: "Longueur :",
    mvpStyle: "Style : Clair et structuré",
    mvpLanguage: "Langue : {TARGET_LANGUAGE}",
    
    // Fixed Example Instruction - French
    mvpExampleInstruction: "Montrez le début exact du livrable attendu - les 3-5 premières lignes de sortie réelle, pas une description de processus. Exemples : Pour podcast → 'Voix 1: Bienvenue dans cette émission...', pour plan de cours → 'COURS: [Titre] | OBJECTIFS: Les apprenants seront capables de...', pour analyse → 'SYNTHÈSE EXÉCUTIVE: Cette analyse révèle...'. L'exemple doit être un échantillon direct du livrable.",
    
    mvpTitleInstruction: "Créez un titre concis et professionnel (5-8 mots maximum) qui résume l'objectif du prompt. Concentrez-vous sur l'action principale et le sujet. Exemples : 'Conception Cours Stratégie Marketing', 'Analyse Retours Clients', 'Création Module Formation'.",
    
    mvpFooter: "CRITIQUE: Fournissez d'abord le titre en utilisant le format 'TITRE: [votre titre]', puis générez le prompt complet avec les sections <System>, <User>, et <Example>. N'ajoutez aucun méta-commentaire ou explication en dehors de cette structure.",
    
    // Enhanced AGENTIC Section - French (same structure, with self-assessment)
    agenticTemplateHeader: "Pour un prompt de type \"AGENTIQUE\", générez un prompt exécutable complet avec capacités d'auto-évaluation :",
    agenticGenerateInstruction: "Générez un prompt AGENTIQUE complet et exécutable en utilisant exactement cette structure :",
    agenticTitleInstruction: "[Générez un titre concis et descriptif (max 5-7 mots) dérivé de la demande brute de l'utilisateur.]",
    agenticRole: "{expertRolePlaceholder} (IA Agentique)",
    agenticExpertPlaceholder: "Analyste Expert",
    agenticNote: "*Note : \"IA Agentique\" signifie une IA capable d'agir de manière autonome, de réfléchir et d'itérer sur son travail.*",
    agenticContext: "Contexte :",
    agenticInstructionsHeader: "Instructions :",
    
    // Same detailed methodology for AGENTIC - French
    agenticAnalysisHeader: "1. ANALYSE APPROFONDIE DES INFORMATIONS FOURNIES :",
    agenticAnalysisTasks: [
      "Analysez méticuleusement tous les éléments fournis relatifs au Contexte ci-dessus",
      "Identifiez les objectifs explicites et implicites, critères de qualité et métriques de réussite",
      "Notez les contraintes techniques, créatives et logistiques à respecter",
      "Évaluez le contexte, les défis sous-jacents et les opportunités d'optimisation",
      "Déterminez les ressources, outils et approches les plus appropriés"
    ],
    agenticThinkingHeader: "2. RÉFLEXION APPROFONDIE & PLANIFICATION :",
    agenticThinkingTasks: [
      "Considérez de multiples approches méthodologiques pour aborder le Contexte de manière optimale",
      "Évaluez rigoureusement les avantages, inconvénients et implications de chaque stratégie",
      "Sélectionnez l'approche la plus appropriée et formulez une justification claire de ce choix",
      "Planifiez la structure logique, la progression et l'organisation optimale du livrable",
      "Anticipez les défis d'exécution et préparez des stratégies d'adaptation si nécessaire"
    ],
    agenticDevelopmentHeader: "3. DÉVELOPPEMENT STRUCTURÉ & EXÉCUTION :",
    agenticDevelopmentTasks: [
      "Produisez un livrable organisé selon une architecture professionnelle claire",
      "Utilisez un formatage premium avec sections, sous-sections et éléments de structuration appropriés",
      "Intégrez des exemples concrets, preuves, données et références pertinentes pour étayer la qualité",
      "Respectez scrupuleusement toutes les contraintes, spécifications et exigences formulées",
      "Visez systématiquement un niveau de qualité professionnel qui dépasse les attentes standard",
      "Personnalisez le contenu pour maximiser sa pertinence et sa valeur ajoutée spécifique"
    ],
    
    // Self-Assessment (AGENTIC only) - French
    agenticSelfAssessmentHeader: "4. AUTO-ÉVALUATION ET AMÉLIORATION CONTINUE :",
    agenticSelfAssessmentQuestion1: "À la fin de son travail, l'IA exécutant ce prompt **doit toujours demander à l'utilisateur textuellement** :\n    \"🤔 Souhaitez-vous que j'évalue ce résultat par rapport à des critères clés et que je fournisse des suggestions d'amélioration ? (Oui/Non)\"",
    agenticSelfAssessmentInstruction: "Si l'utilisateur répond \"Oui\" (ou une affirmation similaire), l'IA doit alors effectuer une auto-évaluation en utilisant la méthode d'évaluation suivante, en la présentant dans un tableau :",
    agenticEvaluationCriteria: {
        education: ['Clarté Pédagogique', 'Adéquation au Niveau', 'Engagement de l\'Apprenant', 'Progression Logique'],
        technical: ['Exactitude Technique', 'Complétude de l\'Analyse', 'Méthodologie Rigoureuse', 'Recommandations Actionnables'],
        other: ['Originalité', 'Cohérence', 'Impact', 'Qualité d\'Exécution']
    },
    agenticEvalTableHeader: "| Critère                       | Note (/10)   | Justification de la Note | Suggestions Concrètes d'Amélioration |\n    |-------------------------------|--------------|--------------------------|--------------------------------------|",
    agenticSelfAssessmentQuestion2: "Après avoir présenté l'évaluation, l'IA **doit également demander à l'utilisateur textuellement** :\n    \"Sur la base de l'évaluation ci-dessus, souhaitez-vous que j'essaie d'améliorer le brouillon ? (Oui/Non)\"",
    agenticTitleInstruction: "Créez un titre concis et professionnel (5-8 mots maximum) qui capture l'objectif du prompt agentique. Concentrez-vous sur le but analytique ou créatif principal. Exemples : 'Outil Analyse Marketing Stratégique', 'Constructeur Module Apprentissage', 'Assistant Création Contenu'.",
    
    agenticFooter: "CRITIQUE: Fournissez d'abord le titre en utilisant le format 'TITRE: [votre titre]', puis générez le prompt complet avec les sections <System>, <User>, et <Example>. N'ajoutez aucun méta-commentaire ou explication en dehors de cette structure.",
  }
};

// Model configuration for Google Gemini
const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Simple UUID generator (same as register.ts)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a descriptive title for the prompt based on its parameters
 */
function generatePromptTitle(params: GeneratePromptParams, language: string): string {
  const { rawRequest, domain, promptType, expertRole, mission } = params;
  
  // Domain-specific keywords for title generation
  const domainKeywords = {
    fr: {
      education: ['Cours', 'Formation', 'Apprentissage', 'Pédagogie', 'Enseignement'],
      technical: ['Analyse', 'Développement', 'Système', 'Solution', 'Architecture'],
      creative: ['Création', 'Design', 'Rédaction', 'Conception', 'Innovation'],
      analysis: ['Étude', 'Analyse', 'Évaluation', 'Rapport', 'Recherche'],
      other: ['Projet', 'Tâche', 'Mission', 'Activité', 'Développement']
    },
    en: {
      education: ['Course', 'Training', 'Learning', 'Teaching', 'Instruction'],
      technical: ['Analysis', 'Development', 'System', 'Solution', 'Architecture'],
      creative: ['Creation', 'Design', 'Writing', 'Conception', 'Innovation'],
      analysis: ['Study', 'Analysis', 'Evaluation', 'Report', 'Research'],
      other: ['Project', 'Task', 'Mission', 'Activity', 'Development']
    }
  };

  const keywords = domainKeywords[language] || domainKeywords.en;
  const domainWords = keywords[domain] || keywords.other;
  
  // Extract key concepts from rawRequest
  let title = '';
  
  // Try to identify the main action/goal
  const rawLower = rawRequest.toLowerCase();
  
  // Common action words that might indicate the main task
  const actionPatterns = {
    fr: {
      'créer|génér|développ|concevoir|élabor': 'Création',
      'transform|convert|adapt|modifi': 'Transformation', 
      'analys|évalu|étudi|examin': 'Analyse',
      'enseign|form|apprend|expliqu': 'Formation',
      'organis|planifi|structur': 'Organisation',
      'résoudr|répond|aider|assist': 'Assistance'
    },
    en: {
      'creat|generat|develop|design|build': 'Creation',
      'transform|convert|adapt|modif|change': 'Transformation',
      'analyz|evaluat|study|examin|assess': 'Analysis', 
      'teach|train|learn|explain|instruct': 'Training',
      'organiz|plan|structur|arrang': 'Organization',
      'solv|help|assist|support': 'Assistance'
    }
  };

  const patterns = actionPatterns[language] || actionPatterns.en;
  let actionWord = '';
  
  for (const [pattern, action] of Object.entries(patterns)) {
    if (new RegExp(pattern, 'i').test(rawLower)) {
      actionWord = action;
      break;
    }
  }
  
  // Extract target subject/topic (look for key nouns)
  const subjectMatch = rawRequest.match(/(?:cours|lesson|article|document|activité|exercise|projet|project|système|system|application|app|site|website|rapport|report|analyse|analysis|formation|training|guide|tutorial)[\s\w]*?(?:sur|about|de|on|pour|for)\s+([^,.!?]{5,30})/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  
  // Build title using different strategies
  if (expertRole && mission) {
    // Strategy 1: Use expert role and mission
    const roleShort = expertRole.length > 20 ? expertRole.substring(0, 20) + '...' : expertRole;
    const missionShort = mission.length > 25 ? mission.substring(0, 25) + '...' : mission;
    title = `${roleShort} - ${missionShort}`;
  } else if (actionWord && subject) {
    // Strategy 2: Use detected action and subject
    title = `${actionWord} ${subject}`;
  } else if (actionWord) {
    // Strategy 3: Use action word + domain
    const domainWord = domainWords[Math.floor(Math.random() * domainWords.length)];
    title = `${actionWord} ${domainWord}`;
  } else if (subject) {
    // Strategy 4: Use subject + domain word
    const domainWord = domainWords[Math.floor(Math.random() * domainWords.length)];
    title = `${domainWord} - ${subject}`;
  } else {
    // Strategy 5: Fallback to domain + type
    const domainWord = domainWords[0];
    title = `${domainWord} ${promptType}`;
  }
  
  // Clean up and ensure proper length
  title = title.replace(/[^\w\s\-àâäéèêëîïôöùûüÿç]/gi, '').trim();
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  // Ensure minimum length
  if (title.length < 10) {
    const domainWord = domainWords[0];
    title = `${domainWord} ${promptType}`;
  }
  
  return title;
}

/**
 * Parse AI response to extract title and prompt content
 */
function parseAIResponse(response: string, language: string): { title: string; prompt: string } {
  try {
    // Look for both TITLE: and TITRE: patterns (bilingual support)
    const titlePattern = language === 'fr' 
      ? /^TITRE:\s*(.+?)(?:\n|$)/im 
      : /^TITLE:\s*(.+?)(?:\n|$)/im;
    
    // Also try the other language as fallback
    const fallbackTitlePattern = language === 'fr' 
      ? /^TITLE:\s*(.+?)(?:\n|$)/im 
      : /^TITRE:\s*(.+?)(?:\n|$)/im;
    
    // Look for PROMPT: section
    const promptPattern = /PROMPT:\s*([\s\S]*?)(?:\n\n---|\n\nFin|$)/i;
    
    // Extract title
    let titleMatch = titlePattern.exec(response) || fallbackTitlePattern.exec(response);
    let title = '';
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      // Clean up title
      title = title.replace(/['"\"]/g, '').trim();
      // Ensure reasonable length
      if (title.length > 80) {
        title = title.substring(0, 77) + '...';
      }
      // Validate title has content
      if (title.length < 3) {
        title = '';
      }
    }
    
    // Extract prompt content
    let promptMatch = promptPattern.exec(response);
    let prompt = '';
    
    if (promptMatch && promptMatch[1]) {
      prompt = promptMatch[1].trim();
    } else {
      // Fallback: if no PROMPT: section found, use everything after title
      const titleEnd = titleMatch ? titleMatch.index + titleMatch[0].length : 0;
      prompt = response.substring(titleEnd).trim();
      // Remove any remaining PROMPT: prefix
      prompt = prompt.replace(/^PROMPT:\s*/i, '').trim();
    }
    
    // Validate prompt has content
    if (!prompt || prompt.length < 50) {
      // If parsing failed, use original response as prompt
      prompt = response;
    }
    
    return { title, prompt };
    
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return original response as prompt with empty title
    return { title: '', prompt: response };
  }
}

/**
 * Build prompt query based on parameters
 */
function buildPromptQuery(params: GeneratePromptParams, tMeta: any): { systemInstruction: string; userQuery: string } {
  const {
    rawRequest,
    promptType,
    domain,
    language,
    outputLength,
    expertRole,
    mission,
    constraints,
  } = params;

  const finalPromptTargetLanguageString = language === 'fr' ? 'Français' : 'English';
  const formattedConstraints = constraints ? 
    constraints.split('\n').filter(c => c.trim()).map(c => `- ${c.trim()}`).join('\n') : '';
  
  // Enhanced system instruction with language replacement
  const systemInstruction = tMeta.systemInstructionBase.replace('{TARGET_LANGUAGE}', finalPromptTargetLanguageString);
  
  let userQuery = `
${tMeta.userQueryHeader}

${tMeta.rawRequestLabel}
"${rawRequest}"

${tMeta.promptTypeLabel} ${promptType}
${tMeta.domainLabel} ${domain}
${tMeta.outputLengthLabel} ${outputLength}
${tMeta.expertRoleLabel} ${expertRole || (promptType === 'MVP' ? tMeta.mvpExpertPlaceholder : tMeta.agenticExpertPlaceholder)}
${tMeta.missionLabel} ${mission || tMeta.mvpMissionPlaceholder}
${tMeta.constraintsLabel}
${constraints ? formattedConstraints : tMeta.noneSpecified}
${tMeta.finalPromptLangLabel.replace('{TARGET_LANGUAGE}', finalPromptTargetLanguageString)}

${tMeta.constructPromptInstruction}
`;

  if (promptType === 'MVP') {
    userQuery += `
${tMeta.mvpTemplateHeader}

${tMeta.mvpTitleInstruction}

${tMeta.mvpGenerateInstruction}

<System>:
${tMeta.mvpSystemRole
    .replace('{expertRolePlaceholder}', expertRole || tMeta.mvpExpertPlaceholder)
    .replace('{missionPlaceholder}', mission || tMeta.mvpMissionPlaceholder)}

<User>:
${rawRequest}

${tMeta.mvpMethodologyHeader}

${tMeta.mvpAnalysisHeader}
${tMeta.mvpAnalysisTasks.map((task: string) => `• ${task}`).join('\n')}

${tMeta.mvpPlanningHeader}
${tMeta.mvpPlanningTasks.map((task: string) => `• ${task}`).join('\n')}

${tMeta.mvpExecutionHeader}
${tMeta.mvpExecutionTasks.map((task: string) => `• ${task}`).join('\n')}

Contraintes spécifiques :
${constraints ? formattedConstraints : tMeta.noneSpecified}

Format attendu : ${outputLength}, ${tMeta.mvpStyle.toLowerCase()}, ${tMeta.mvpLanguage.replace('{TARGET_LANGUAGE}', finalPromptTargetLanguageString)}

<Example>:
${tMeta.mvpExampleInstruction}

${tMeta.mvpFooter}
`;
  } else { // AGENTIC
    const criteriaDomain = (domain === 'education' || domain === 'technical') ? domain : 'other';
    const evaluationCriteriaList = tMeta.agenticEvaluationCriteria[criteriaDomain];
    
    const criteriaTableMarkdown = evaluationCriteriaList.map((c: string) => 
      `| ${c.padEnd(29)} |              |                          |                                      |`
    ).join('\n');

    userQuery += `
${tMeta.agenticTemplateHeader}

${tMeta.agenticTitleInstruction}

${tMeta.agenticGenerateInstruction}

<System>:
${tMeta.agenticRole.replace('{expertRolePlaceholder}', expertRole || tMeta.agenticExpertPlaceholder)} ${tMeta.agenticNote} ${language === 'fr' ? 'Votre mission est d\'' : 'Your mission is to '}${mission || tMeta.mvpMissionPlaceholder}.

<User>:
${rawRequest}

${tMeta.agenticInstructionsHeader}

${tMeta.agenticAnalysisHeader}
${tMeta.agenticAnalysisTasks.map((task: string) => `• ${task}`).join('\n')}

${tMeta.agenticThinkingHeader}
${tMeta.agenticThinkingTasks.map((task: string) => `• ${task}`).join('\n')}

${tMeta.agenticDevelopmentHeader}
${tMeta.agenticDevelopmentTasks.map((task: string) => `• ${task}`).join('\n')}

${tMeta.agenticSelfAssessmentHeader}
${tMeta.agenticSelfAssessmentQuestion1}

${tMeta.agenticSelfAssessmentInstruction}
${tMeta.agenticEvalTableHeader}
${criteriaTableMarkdown}

${tMeta.agenticSelfAssessmentQuestion2}

Contraintes spécifiques :
${constraints ? formattedConstraints : tMeta.noneSpecified}

Format attendu : ${outputLength}, ${tMeta.mvpStyle.toLowerCase()}, ${tMeta.mvpLanguage.replace('{TARGET_LANGUAGE}', finalPromptTargetLanguageString)}

<Example>:
${language === 'fr' ? '[Montrez le début exact du livrable attendu avec le format du titre et les premières lignes de contenu réel]' : '[Show the exact beginning of the expected deliverable with the title format and first few lines of actual content]'}

${tMeta.agenticFooter}
`;
  }

  return { systemInstruction, userQuery };
}

/**
 * Call OpenRouter API using OpenAI-compatible interface
 */
async function callGemini(systemInstruction: string, userQuery: string, apiKey: string): Promise<string> {
  // Combine system instruction and user query for Gemini
  const combinedPrompt = `${systemInstruction}\n\n${userQuery}`;
  
  const response = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: combinedPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        topK: 40,
        topP: 0.95,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', response.status, errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
    console.error('Invalid Gemini response structure:', result);
    throw new Error('Invalid response from Gemini API');
  }

  return result.candidates[0].content.parts[0].text;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    console.log('=== GENERATE PROMPT ENDPOINT (Gemini) ===');
    
    // Basic environment check
    if (!env.JWT_SECRET || !env.GEMINI_API_KEY) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'JWT configuration missing'
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }
    
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization token required'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT
    let user;
    try {
      user = await verifyJWT(token, env.JWT_SECRET);
    } catch (error) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }
    
    // Parse JSON
    const params: GeneratePromptParams = await request.json();
    console.log('Generating prompt for user:', user.userId);
    
    // NEW: Analyze task complexity and suggest expertise
    const analysis = analyzeTask(params);
    const { suggestions, chosen } = suggestExpertise(params.rawRequest, params.domain, params.language, analysis);
    
    // Use user-provided role or fall back to AI suggestion
    const effectiveRole = params.expertRole?.trim() ? params.expertRole : chosen.role;
    
    // Override params with effective role for prompt generation
    const enhancedParams = { ...params, expertRole: effectiveRole };
    
    console.log('Task analysis:', { complexity: analysis.complexity, archetype: analysis.archetype, chosenRole: effectiveRole });
    
    // NEW: Build adaptive prompt with 8 sections
    const { systemInstruction, userQuery, hints } = buildAdaptivePrompt(enhancedParams, analysis, effectiveRole);

    // Call Gemini API
    const result = await callGemini(systemInstruction, userQuery, env.GEMINI_API_KEY);
     
    if (!result || typeof result !== 'string') {
      throw new Error('Invalid response from Gemini API');
    }

    console.log('Prompt generated successfully for user:', user.userId);

    // Parse AI response to extract title and prompt content
    const { title: aiTitle, prompt: promptContent } = parseAIResponse(result, params.language);
    
    // Use AI-generated title, fallback to algorithmic generation if needed
    let finalTitle = aiTitle;
    if (!finalTitle || finalTitle.length < 3) {
      console.log('AI title extraction failed, using algorithmic fallback');
      finalTitle = generatePromptTitle(params, params.language);
    }

    // Save prompt to user's library
    if (env.DB) {
      try {
        const promptId = generateUUID();
        
        await env.DB.prepare(`
          INSERT INTO prompts (
            id, user_id, title, raw_request, generated_prompt,
            prompt_type, domain, language, output_length,
            expert_role, mission, constraints, is_favorite,
            chosen_role, expertise_suggestions, complexity,
            archetype, level_label, task_type,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          promptId,
          user.userId,
          finalTitle,
          params.rawRequest,
          completePrompt,
          params.promptType,
          params.domain,
          params.language,
          params.outputLength,
          params.expertRole || null,
          params.mission || null,
          params.constraints || null,
          0, // is_favorite - false by default
          effectiveRole,
          JSON.stringify(suggestions),
          analysis.complexity,
          analysis.archetype,
          mapArchetypeToLevel(analysis.archetype),
          analysis.taskType
        ).run();
        
        console.log('Prompt saved to library with ID:', promptId);
      } catch (error) {
        console.error('Failed to save prompt to library:', error);
        // Don't fail the request if saving fails
      }
    }

    // Combine system instruction and user query into the complete prompt
    const completePrompt = `${systemInstruction}\n\n---\n\n${userQuery}`;

    const response = new Response(JSON.stringify({
      success: true,
      prompt: completePrompt,
      metadata: {
        complexity: analysis.complexity,
        archetype: analysis.archetype,
        levelLabel: mapArchetypeToLevel(analysis.archetype),
        expertiseSuggestions: suggestions,
        chosenRole: effectiveRole,
        formatHints: hints, // Use hints from buildAdaptivePrompt
        taskType: analysis.taskType
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Add security headers
    return SecurityHeadersManager.addSecurityHeaders(response);

  } catch (error: any) {
    console.error('Generate prompt error:', error);
    
    // Handle specific error types
    let errorData = {
      code: 'INTERNAL_ERROR',
      message: 'Unable to generate prompt'
    };

    if (error?.message) {
      if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
        errorData = {
          code: 'API_KEY_ERROR',
          message: 'Service configuration error'
        };
      } else if (error.message.toLowerCase().includes('quota')) {
        errorData = {
          code: 'QUOTA_EXCEEDED',
          message: 'Service temporarily unavailable due to high demand'
        };
      }
    }
    
    const errorResponse = new Response(JSON.stringify({
      success: false,
      error: errorData
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Add security headers even to error responses
    return SecurityHeadersManager.addSecurityHeaders(errorResponse);
  }
};