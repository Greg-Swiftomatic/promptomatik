// import type { Language, Domain, OutputLength, Translations } from './types'; // TS types removed

export const DEFAULT_LANGUAGE = 'fr';
export const MIN_RAW_REQUEST_LENGTH = 10;
export const MAX_RAW_REQUEST_LENGTH = 2000;

export const DOMAIN_OPTIONS = [
  { value: 'business', labelToken: 'business' },
  { value: 'marketing', labelToken: 'marketing' },
  { value: 'legal', labelToken: 'legal' },
  { value: 'healthcare', labelToken: 'healthcare' },
  { value: 'finance', labelToken: 'finance' },
  { value: 'hr', labelToken: 'hr' },
  { value: 'consulting', labelToken: 'consulting' },
  { value: 'research', labelToken: 'research' },
  { value: 'engineering', labelToken: 'engineering' },
  { value: 'sales', labelToken: 'sales' },
  { value: 'operations', labelToken: 'operations' },
  { value: 'creative', labelToken: 'creative' },
  { value: 'technical', labelToken: 'technical' },
];

export const OUTPUT_LENGTH_OPTIONS = [
  { value: 'short', labelToken: 'short' },
  { value: 'medium', labelToken: 'medium' },
  { value: 'long', labelToken: 'long' },
];

export const translations = {
  fr: {
    app: {
      title: "Prompt Builder Promptomatik",
      subtitle: "Transformez vos idées en prompts structurés efficaces"
    },
    input: {
      label: "Que voulez-vous que l'IA fasse pour vous ?",
      placeholder: "Exemple: Créer une stratégie de lancement pour un produit SaaS B2B, avec analyse concurrentielle et plan d'action sur 6 mois...",
      button: "Analyser ma demande",
      charCount: "caractères",
      minCharWarning: `Minimum ${MIN_RAW_REQUEST_LENGTH} caractères requis`
    },
    analysis: {
      title: "Analyse de votre demande",
      domain: "Domaine détecté",
      complexity: "Complexité estimée",
      recommendation: "Approche recommandée",
      simple: "Simple",
      complex: "Complexe"
    },
    approach: {
      title: "Choisissez votre approche",
      mvp: {
        title: "MVP",
        subtitle: "(Recommandé pour tâches simples)",
        description: "Structure simple System-User-Exemple"
      },
      agentique: {
        title: "AGENTIQUE",
        subtitle: "(Pour tâches complexes)",
        description: "Avec auto-évaluation et itération"
      }
    },
    variables: {
      title: "Affiner votre prompt",
      domain: "Domaine",
      outputLength: "Longueur de sortie",
      expertRole: "Rôle de l'expert",
      expertRoleDescription: "Préciser le rôle que vous voulez donner à l'IA pour cette tâche - sa fonction.",
      expertRolePlaceholder: "Ex: Stratège Business",
      mission: "Mission principale",
      missionDescription: "Préciser les tâches que vous voulez que l'IA exécute - sa mission.",
      missionPlaceholder: "Ex: développer des stratégies marketing",
      constraints: "Contraintes (une par ligne)",
      next: "Suivant",
      back: "Retour",
      constraintsPlaceholder: "Ex:\nBudget: 10k€\nÉchéance: T1 2024\nÉquipe: 5 personnes"
    },
    generation: {
      generating: "Génération en cours...",
      title: "Votre prompt structuré",
      error: "Erreur de génération. Veuillez réessayer."
    },
    actions: {
      copy: "Copier",
      save: "Sauvegarder",
      export: "Exporter",
      generate: "Générer le prompt",
      newPrompt: "Nouveau prompt",
      viewLibrary: "📚 Ma Bibliothèque",
      copiedSuccess: "Copié!",
      copyError: "Erreur de copie",
      savedSuccess: "Sauvegardé!",
      usePrompt: "Utiliser",
      delete: "Supprimer",
      backToDashboard: "Tableau de bord",
      backToDashboardFull: "Retour tableau de bord"
    },
    library: {
      title: "Bibliothèque de prompts",
      empty: "Aucun prompt sauvegardé",
      close: "Fermer",
      searchPlaceholder: "Rechercher dans mes prompts...",
      promptsAvailable: "disponible",
      promptsAvailablePlural: "disponibles",
      noResultsFound: "Aucun résultat trouvé",
      noResultsMessage: "Aucun prompt ne correspond à",
      tryOtherSearch: "Essayez un autre terme de recherche.",
      emptyMessage: "Vous n'avez pas encore sauvegardé de prompts. Commencez par créer votre premier prompt !"
    },
    domains: {
      business: "Business",
      marketing: "Marketing",
      legal: "Juridique",
      healthcare: "Santé",
      finance: "Finance", 
      hr: "Ressources Humaines",
      consulting: "Conseil",
      research: "Recherche",
      engineering: "Ingénierie",
      sales: "Ventes",
      operations: "Opérations",
      creative: "Créatif",
      technical: "Technique"
    },
    lengths: {
      short: "Court",
      medium: "Moyen",
      long: "Long"
    },
    notifications: {
      copied: "Prompt copié dans le presse-papiers!",
      copyFailed: "Échec de la copie du prompt.",
      saved: "Prompt sauvegardé dans la bibliothèque!",
      apiError: "Erreur de l'API Gemini. Veuillez vérifier votre clé API et réessayer.",
      deleted: "Prompt supprimé !",
      saveError: "Échec de la sauvegarde du prompt.",
      deleteError: "Échec de la suppression du prompt."
    },
    auth: {
      loading: "Chargement...",
      login: {
        title: "Connexion",
        subtitle: "Connectez-vous à votre compte Promptomatik",
        signIn: "Se connecter",
        signingIn: "Connexion...",
        noAccount: "Pas encore de compte ?",
        signUpLink: "Créer un compte"
      },
      register: {
        title: "Créer un compte",
        subtitle: "Rejoignez Promptomatik pour sauvegarder vos prompts",
        createAccount: "Créer le compte",
        creatingAccount: "Création...",
        hasAccount: "Déjà un compte ?",
        signInLink: "Se connecter",
        passwordRequirements: "Exigences du mot de passe :",
        requirements: {
          length: "Au moins 8 caractères",
          lowercase: "Une lettre minuscule",
          uppercase: "Une lettre majuscule",
          number: "Un chiffre"
        }
      },
      fields: {
        firstName: "Prénom",
        email: "Adresse e-mail",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe"
      },
      placeholders: {
        firstName: "Votre prénom",
        email: "votre@email.com",
        password: "Votre mot de passe",
        confirmPassword: "Confirmez votre mot de passe"
      },
      validation: {
        firstNameRequired: "Le prénom est requis",
        emailRequired: "L'adresse e-mail est requise",
        emailInvalid: "Adresse e-mail invalide",
        passwordRequired: "Le mot de passe est requis",
        passwordMinLength: "Minimum 6 caractères",
        passwordMinLength8: "Minimum 8 caractères",
        confirmPasswordRequired: "Veuillez confirmer votre mot de passe",
        passwordsDoNotMatch: "Les mots de passe ne correspondent pas"
      },
      errors: {
        loginFailed: "Échec de la connexion. Vérifiez vos identifiants.",
        registrationFailed: "Échec de l'inscription. Veuillez réessayer.",
        networkError: "Erreur réseau. Vérifiez votre connexion.",
        serverError: "Erreur serveur. Veuillez réessayer plus tard."
      },
      forgotPassword: {
        title: "Mot de passe oublié",
        subtitle: "Entrez votre adresse e-mail pour recevoir un lien de réinitialisation",
        emailLabel: "Adresse e-mail",
        emailPlaceholder: "votre@email.com",
        emailRequired: "L'adresse e-mail est requise",
        sendButton: "Envoyer le lien",
        sending: "Envoi en cours...",
        backToLogin: "Retour à la connexion",
        successTitle: "E-mail envoyé !",
        successMessage: "Si cette adresse e-mail existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.",
        errorGeneric: "Une erreur s'est produite. Veuillez réessayer."
      },
      resetPassword: {
        title: "Nouveau mot de passe",
        subtitle: "Saisissez votre nouveau mot de passe",
        passwordLabel: "Nouveau mot de passe",
        passwordPlaceholder: "Votre nouveau mot de passe",
        confirmPasswordLabel: "Confirmer le mot de passe",
        confirmPasswordPlaceholder: "Confirmez votre nouveau mot de passe",
        resetButton: "Réinitialiser le mot de passe",
        resetting: "Réinitialisation...",
        backToLogin: "Retour à la connexion",
        successTitle: "Mot de passe réinitialisé !",
        successMessage: "Votre mot de passe a été réinitialisé avec succès. Vous êtes maintenant connecté.",
        redirecting: "Redirection en cours...",
        noToken: "Lien de réinitialisation invalide ou expiré",
        fieldsRequired: "Tous les champs sont requis",
        passwordMismatch: "Les mots de passe ne correspondent pas",
        weakPassword: "Le mot de passe ne respecte pas les exigences de sécurité",
        passwordRequirements: "Exigences du mot de passe :",
        errorGeneric: "Une erreur s'est produite. Veuillez réessayer.",
        validation: {
          minLength: "Au moins 12 caractères",
          uppercase: "Une lettre majuscule",
          lowercase: "Une lettre minuscule",
          number: "Un chiffre",
          special: "Un caractère spécial (!@#$%^&*)"
        }
      },
      user: {
        unknown: "Utilisateur",
        signedInAs: "Connecté en tant que",
        settings: "Paramètres",
        signOut: "Se déconnecter"
      },
      migration: {
        title: "Migration des prompts",
        description: "Nous transférons vos prompts sauvegardés vers votre compte...",
        progress: "Migration en cours: {completed}/{total} prompts",
        success: "Migration réussie! {migrated} prompts transférés",
        successWithErrors: "Migration terminée avec {migrated} prompts transférés et {failed} échecs",
        failed: "Échec de la migration. Veuillez réessayer.",
        retry: "Réessayer la migration",
        skip: "Ignorer pour l'instant",
        detecting: "Détection des prompts à migrer...",
        backup: "Sauvegarde des données en cours...",
        uploading: "Envoi des prompts...",
        finalizing: "Finalisation...",
        noPromptsFound: "Aucun prompt à migrer trouvé",
        partialSuccess: "Migration partiellement réussie",
        errors: {
          networkError: "Erreur réseau lors de la migration",
          validationError: "Erreur de validation des données",
          serverError: "Erreur serveur lors de la migration",
          backupFailed: "Échec de la sauvegarde des données",
          unknown: "Erreur inconnue lors de la migration"
        }
      }
    }
  },
  en: {
    app: {
      title: "Promptomatik Prompt Builder",
      subtitle: "Transform your ideas into structured, effective prompts"
    },
    input: {
      label: "What do you want the AI to do for you?",
      placeholder: "Example: Create a go-to-market strategy for a B2B SaaS product, with competitive analysis and 6-month action plan...",
      button: "Analyze my request",
      charCount: "characters",
      minCharWarning: `Minimum ${MIN_RAW_REQUEST_LENGTH} characters required`
    },
    analysis: {
      title: "Analysis of your request",
      domain: "Detected domain",
      complexity: "Estimated complexity",
      recommendation: "Recommended approach",
      simple: "Simple",
      complex: "Complex"
    },
    approach: {
      title: "Choose your approach",
      mvp: {
        title: "MVP",
        subtitle: "(Recommended for simple tasks)",
        description: "Simple System-User-Example structure"
      },
      agentique: {
        title: "AGENTIC",
        subtitle: "(For complex tasks)",
        description: "With self-assessment and iteration"
      }
    },
    variables: {
      title: "Refine your prompt",
      domain: "Domain",
      outputLength: "Output length",
      expertRole: "Expert role",
      expertRoleDescription: "Specify the role you want the AI to play for this task - its function.",
      expertRolePlaceholder: "Ex: Business Strategist",
      mission: "Main mission",
      missionDescription: "Specify the tasks you want the AI to perform - its mission.",
      missionPlaceholder: "Ex: develop marketing strategies",
      constraints: "Constraints (one per line)",
      next: "Next",
      back: "Back",
      constraintsPlaceholder: "Ex:\nBudget: $10k\nTimeline: Q1 2024\nTeam: 5 people"
    },
    generation: {
      generating: "Generating...",
      title: "Your structured prompt",
      error: "Generation error. Please try again."
    },
    actions: {
      copy: "Copy",
      save: "Save",
      export: "Export",
      generate: "Generate prompt",
      newPrompt: "New prompt",
      viewLibrary: "📚 My Library",
      copiedSuccess: "Copied!",
      copyError: "Copy failed",
      savedSuccess: "Saved!",
      usePrompt: "Use",
      delete: "Delete",
      backToDashboard: "Dashboard",
      backToDashboardFull: "Back to Dashboard"
    },
    library: {
      title: "Prompt Library",
      empty: "No saved prompts",
      close: "Close",
      searchPlaceholder: "Search in my prompts...",
      promptsAvailable: "available",
      promptsAvailablePlural: "available",
      noResultsFound: "No results found",
      noResultsMessage: "No prompts match",
      tryOtherSearch: "Try a different search term.",
      emptyMessage: "You haven't saved any prompts yet. Start by creating your first prompt!"
    },
    domains: {
      business: "Business",
      marketing: "Marketing", 
      legal: "Legal",
      healthcare: "Healthcare",
      finance: "Finance",
      hr: "Human Resources",
      consulting: "Consulting",
      research: "Research",
      engineering: "Engineering",
      sales: "Sales",
      operations: "Operations",
      creative: "Creative",
      technical: "Technical"
    },
    lengths: {
      short: "Short",
      medium: "Medium",
      long: "Long"
    },
    notifications: {
      copied: "Prompt copied to clipboard!",
      copyFailed: "Failed to copy prompt.",
      saved: "Prompt saved to library!",
      apiError: "Gemini API error. Please check your API key and try again.",
      deleted: "Prompt deleted!",
      saveError: "Failed to save prompt.",
      deleteError: "Failed to delete prompt."
    },
    auth: {
      loading: "Loading...",
      login: {
        title: "Sign In",
        subtitle: "Sign in to your Promptomatik account",
        signIn: "Sign In",
        signingIn: "Signing in...",
        noAccount: "Don't have an account?",
        signUpLink: "Create account"
      },
      register: {
        title: "Create Account",
        subtitle: "Join Promptomatik to save your prompts",
        createAccount: "Create Account",
        creatingAccount: "Creating...",
        hasAccount: "Already have an account?",
        signInLink: "Sign in",
        passwordRequirements: "Password requirements:",
        requirements: {
          length: "At least 8 characters",
          lowercase: "One lowercase letter",
          uppercase: "One uppercase letter",
          number: "One number"
        }
      },
      fields: {
        firstName: "First Name",
        email: "Email Address",
        password: "Password",
        confirmPassword: "Confirm Password"
      },
      placeholders: {
        firstName: "Your first name",
        email: "your@email.com",
        password: "Your password",
        confirmPassword: "Confirm your password"
      },
      validation: {
        firstNameRequired: "First name is required",
        emailRequired: "Email address is required",
        emailInvalid: "Invalid email address",
        passwordRequired: "Password is required",
        passwordMinLength: "Minimum 6 characters",
        passwordMinLength8: "Minimum 8 characters",
        confirmPasswordRequired: "Please confirm your password",
        passwordsDoNotMatch: "Passwords do not match"
      },
      errors: {
        loginFailed: "Login failed. Check your credentials.",
        registrationFailed: "Registration failed. Please try again.",
        networkError: "Network error. Check your connection.",
        serverError: "Server error. Please try again later."
      },
      forgotPassword: {
        title: "Forgot Password",
        subtitle: "Enter your email address to receive a reset link",
        emailLabel: "Email Address",
        emailPlaceholder: "your@email.com",
        emailRequired: "Email address is required",
        sendButton: "Send Reset Link",
        sending: "Sending...",
        backToLogin: "Back to Sign In",
        successTitle: "Email Sent!",
        successMessage: "If this email exists in our system, you will receive a reset link within a few minutes.",
        errorGeneric: "An error occurred. Please try again."
      },
      resetPassword: {
        title: "New Password",
        subtitle: "Enter your new password",
        passwordLabel: "New Password",
        passwordPlaceholder: "Your new password",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your new password",
        resetButton: "Reset Password",
        resetting: "Resetting...",
        backToLogin: "Back to Sign In",
        successTitle: "Password Reset!",
        successMessage: "Your password has been reset successfully. You are now signed in.",
        redirecting: "Redirecting...",
        noToken: "Invalid or expired reset link",
        fieldsRequired: "All fields are required",
        passwordMismatch: "Passwords do not match",
        weakPassword: "Password does not meet security requirements",
        passwordRequirements: "Password requirements:",
        errorGeneric: "An error occurred. Please try again.",
        validation: {
          minLength: "At least 12 characters",
          uppercase: "One uppercase letter",
          lowercase: "One lowercase letter",
          number: "One number",
          special: "One special character (!@#$%^&*)"
        }
      },
      user: {
        unknown: "User",
        signedInAs: "Signed in as",
        settings: "Settings",
        signOut: "Sign Out"
      },
      migration: {
        title: "Prompt Migration",
        description: "We're transferring your saved prompts to your account...",
        progress: "Migration in progress: {completed}/{total} prompts",
        success: "Migration successful! {migrated} prompts transferred",
        successWithErrors: "Migration completed with {migrated} prompts transferred and {failed} failures",
        failed: "Migration failed. Please try again.",
        retry: "Retry Migration",
        skip: "Skip for now",
        detecting: "Detecting prompts to migrate...",
        backup: "Backing up data...",
        uploading: "Uploading prompts...",
        finalizing: "Finalizing...",
        noPromptsFound: "No prompts found to migrate",
        partialSuccess: "Migration partially successful",
        errors: {
          networkError: "Network error during migration",
          validationError: "Data validation error",
          serverError: "Server error during migration",
          backupFailed: "Failed to backup data",
          unknown: "Unknown error during migration"
        }
      }
    }
  }
};


// ✅ AJOUT UX: Helpers contextuels pour guider l'utilisateur dans l'étape 3
export const CONTEXTUAL_HELPERS = {
  business: {
    expertRole: {
      suggestions: ["Stratège Business", "Consultant Senior", "Directeur Stratégie", "Business Analyst"],
      tip: "Le rôle influence l'approche stratégique et la méthodologie du prompt généré"
    },
    mission: {
      suggestions: [
        "Développer une stratégie de croissance",
        "Optimiser les processus opérationnels", 
        "Créer un plan d'expansion marché",
        "Analyser la performance business"
      ],
      tip: "Décrivez précisément l'objectif business que vous voulez atteindre"
    },
    constraints: {
      suggestions: [
        "Budget: 50k€",
        "Échéance: 6 mois", 
        "Équipe: 10 personnes",
        "Marché: B2B"
      ],
      tip: "Les contraintes aident l'IA à créer une stratégie adaptée à votre contexte"
    }
  },
  marketing: {
    expertRole: {
      suggestions: ["Marketing Manager", "Growth Hacker", "Brand Strategist", "Digital Marketer"],
      tip: "Le rôle définit l'expertise marketing et l'approche créative"
    },
    mission: {
      suggestions: [
        "Développer une campagne de lancement",
        "Optimiser le funnel de conversion",
        "Créer une stratégie de contenu",
        "Analyser la performance des campagnes"
      ],
      tip: "Précisez l'objectif marketing et les résultats attendus"
    },
    constraints: {
      suggestions: [
        "Budget publicitaire: 20k€",
        "Audience: 25-45 ans",
        "Canaux: LinkedIn, Google Ads",
        "KPI: +30% leads qualifiés"
      ],
      tip: "Définissez budget, audience cible et objectifs mesurables"
    }
  },
  legal: {
    expertRole: {
      suggestions: ["Juriste d'entreprise", "Avocat conseil", "Compliance Officer", "Legal Advisor"],
      tip: "Le rôle juridique influence la précision légale et le niveau de détail"
    },
    mission: {
      suggestions: [
        "Rédiger un contrat commercial",
        "Analyser la conformité réglementaire",
        "Créer une politique de confidentialité",
        "Évaluer les risques juridiques"
      ],
      tip: "Précisez le domaine de droit et l'objectif juridique"
    },
    constraints: {
      suggestions: [
        "Juridiction: France/UE",
        "Secteur: SaaS/Tech",
        "Conformité: RGPD",
        "Urgence: 2 semaines"
      ],
      tip: "Indiquez la juridiction, le secteur et les règlements applicables"
    }
  },
  finance: {
    expertRole: {
      suggestions: ["Analyste Financier", "CFO", "Contrôleur de Gestion", "Investment Analyst"],
      tip: "Le rôle finance détermine le niveau d'analyse et les métriques utilisées"
    },
    mission: {
      suggestions: [
        "Créer un modèle de prévision financière",
        "Analyser la rentabilité d'un projet",
        "Optimiser la structure de coûts",
        "Préparer un business plan financier"
      ],
      tip: "Définissez l'objectif financier et les métriques clés"
    },
    constraints: {
      suggestions: [
        "Période: 3 ans",
        "Croissance ciblée: 25% annuel",
        "Marge brute: >70%",
        "Financement: Series A"
      ],
      tip: "Précisez la période, les objectifs de croissance et contraintes budgétaires"
    }
  },
  hr: {
    expertRole: {
      suggestions: ["DRH", "HR Business Partner", "Talent Acquisition", "Learning & Development"],
      tip: "Le rôle RH influence l'approche humaine et les processus"
    },
    mission: {
      suggestions: [
        "Développer un plan de recrutement",
        "Créer un programme de formation",
        "Optimiser l'expérience collaborateur",
        "Concevoir une politique de rémunération"
      ],
      tip: "Décrivez l'objectif RH et l'impact sur les équipes"
    },
    constraints: {
      suggestions: [
        "Effectif cible: 50 personnes",
        "Budget formation: 15k€",
        "Délai recrutement: 3 mois",
        "Remote: 50% du temps"
      ],
      tip: "Indiquez l'effectif, le budget et les contraintes organisationnelles"
    }
  },
  sales: {
    expertRole: {
      suggestions: ["Sales Manager", "Business Developer", "Account Executive", "Sales Operations"],
      tip: "Le rôle commercial définit l'approche vente et les techniques utilisées"
    },
    mission: {
      suggestions: [
        "Développer un processus de vente",
        "Créer un script de prospection",
        "Optimiser le cycle de vente",
        "Analyser les performances commerciales"
      ],
      tip: "Précisez l'objectif commercial et le type de vente (B2B/B2C)"
    },
    constraints: {
      suggestions: [
        "Cycle de vente: 3 mois",
        "Ticket moyen: 5k€",
        "Taux conversion: 15%",
        "Pipeline: 50 prospects"
      ],
      tip: "Définissez les métriques commerciales et objectifs de performance"
    }
  },
  technical: {
    expertRole: {
      suggestions: ["Architecte logiciel", "DevOps engineer", "Tech lead", "Développeur senior"],
      tip: "Choisissez l'expertise technique qui correspond à votre projet"
    },
    mission: {
      suggestions: [
        "Optimiser les performances du système",
        "Concevoir une architecture scalable",
        "Implémenter des bonnes pratiques de sécurité",
        "Automatiser les processus de déploiement"
      ],
      tip: "Précisez l'objectif technique que vous souhaitez atteindre"
    },
    constraints: {
      suggestions: [
        "Technologies: React, Node.js",
        "Budget: 3 mois développeur",
        "Performance: < 200ms",
        "Compatibilité: Chrome, Firefox"
      ],
      tip: "Définissez les contraintes techniques et business de votre projet"
    }
  },
  creative: {
    expertRole: {
      suggestions: ["Créateur de contenu", "Rédacteur créatif", "Designer UX", "Directeur artistique"],
      tip: "Le rôle créatif oriente le style et l'approche du contenu généré"
    },
    mission: {
      suggestions: [
        "Créer un contenu viral et engageant",
        "Développer une identité de marque cohérente",
        "Concevoir une expérience utilisateur intuitive",
        "Produire du contenu multimédia impactant"
      ],
      tip: "Exprimez votre vision créative et les émotions à transmettre"
    },
    constraints: {
      suggestions: [
        "Ton: Moderne et accessible",
        "Audience: 25-35 ans",
        "Format: Post réseaux sociaux",
        "Longueur: 150 mots max"
      ],
      tip: "Précisez le style, l'audience et les formats souhaités"
    }
  },
  analysis: {
    expertRole: {
      suggestions: ["Analyste de données", "Consultant stratégique", "Chercheur", "Business analyst"],
      tip: "Le rôle d'expert définit la méthodologie et la profondeur d'analyse"
    },
    mission: {
      suggestions: [
        "Analyser les tendances et identifier les opportunités",
        "Évaluer la performance et proposer des améliorations",
        "Synthétiser des données complexes en insights",
        "Créer des recommandations stratégiques"
      ],
      tip: "Définissez le type d'analyse et les livrables attendus"
    },
    constraints: {
      suggestions: [
        "Données: 12 mois historique",
        "Focus: Metrics de conversion",
        "Format: Présentation exécutive",
        "Délai: Analyse express"
      ],
      tip: "Précisez les sources de données et le format de restitution"
    }
  },
  other: {
    expertRole: {
      suggestions: ["Consultant expert", "Spécialiste métier", "Professionnel expérimenté", "Expert reconnu"],
      tip: "Choisissez un rôle qui correspond à votre domaine d'expertise"
    },
    mission: {
      suggestions: [
        "Résoudre un problème spécifique",
        "Optimiser un processus existant",
        "Créer une solution innovante",
        "Améliorer une situation actuelle"
      ],
      tip: "Décrivez clairement l'objectif que vous souhaitez atteindre"
    },
    constraints: {
      suggestions: [
        "Contexte: Environnement professionnel",
        "Ressources: Limitées",
        "Urgence: Priorité haute",
        "Impact: Maximum"
      ],
      tip: "Précisez le contexte et les contraintes de votre situation"
    }
  }
};
