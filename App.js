
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Copy, Save, Download, Languages, Sparkles, Brain, Check, X, AlertCircle, FileText, Clock, Star, Loader2, Trash2 } from 'lucide-react'; // Added Trash2
// Removed type imports: PromptType, Language, Domain, Complexity, OutputLength, SavedPrompt, Translations
import { translations, DEFAULT_LANGUAGE, MIN_RAW_REQUEST_LENGTH, MAX_RAW_REQUEST_LENGTH, DOMAIN_OPTIONS, OUTPUT_LENGTH_OPTIONS, CONTEXTUAL_HELPERS } from './constants.js';
import { generateStructuredPromptWithOpenRouter } from './services/openrouterService.js';
import { AuthProvider } from './auth/AuthContext.js';
import AuthWrapper from './auth/AuthWrapper.js';
import UserMenu from './components/UserMenu.js';
import LibraryPage from './components/LibraryPage.js';
import ContextualHelper from './components/ContextualHelper.js';
// QuickStartSelector supprimé - trop complexe
import apiService from './services/apiService.js';
import { useAuth } from './auth/AuthContext.js';

const MainApp = ({ initialLanguage, onLanguageChange }) => {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState(initialLanguage || DEFAULT_LANGUAGE);
  
  // Update language when prop changes
  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);
  
  // Handle language change and propagate to parent
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };
  const [step, setStep] = useState(1);
  const [rawRequest, setRawRequest] = useState('');
  const [promptType, setPromptType] = useState('MVP');
  
  const [analyzedDomain, setAnalyzedDomain] = useState('other');
  const [analyzedComplexity, setAnalyzedComplexity] = useState('simple');
  const [recommendedType, setRecommendedType] = useState('MVP');

  const [selectedDomain, setSelectedDomain] = useState('business');
  const [outputLength, setOutputLength] = useState('medium');
  const [expertRole, setExpertRole] = useState('');
  const [mission, setMission] = useState('');
  const [constraints, setConstraints] = useState('');
  
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLibraryPage, setShowLibraryPage] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [notification, setNotification] = useState('');
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  
  // NEW: Enhanced metadata from API
  const [promptMetadata, setPromptMetadata] = useState(null);
  const [expertiseSuggestions, setExpertiseSuggestions] = useState([]);
  const [chosenRole, setChosenRole] = useState('');
  const [levelLabel, setLevelLabel] = useState('');
  const [customExpertRole, setCustomExpertRole] = useState('');
  const [showCustomExpertInput, setShowCustomExpertInput] = useState(false);
  
  const t = translations[language];

  // Load prompts from API instead of localStorage
  useEffect(() => {
    const loadPrompts = async () => {
      if (!user) return;
      
      setIsLoadingPrompts(true);
      try {
        const response = await apiService.getPrompts(1, 50); // Load first 50 prompts
        setSavedPrompts(response.prompts || []);
      } catch (error) {
        console.error("Failed to load prompts:", error);
        showNotification(t.notifications.apiError, 'error');
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    loadPrompts();
  }, [user, t]);

  const analyzeUserRequest = useCallback((request) => {
    const educationKeywords = ['cours', 'leçon', 'lesson', 'élève', 'student', 'apprendre', 'learn', 'enseigner', 'teach', 'pédagogie', 'pedagogy'];
    const technicalKeywords = ['code', 'algorithm', 'database', 'api', 'système', 'system', 'technique', 'software', 'hardware', 'network'];
    const creativeKeywords = ['story', 'histoire', 'créer', 'create', 'design', 'art', 'écrire', 'write', 'roman', 'poème', 'scénario'];
    const analysisKeywords = ['analyser', 'analyze', 'rapport', 'report', 'données', 'data', 'évaluer', 'evaluate', 'recherche', 'research'];
    
    const requestLower = request.toLowerCase();
    
    let detectedDomain = 'other';
    if (educationKeywords.some(k => requestLower.includes(k))) detectedDomain = 'education';
    else if (technicalKeywords.some(k => requestLower.includes(k))) detectedDomain = 'technical';
    else if (creativeKeywords.some(k => requestLower.includes(k))) detectedDomain = 'creative';
    else if (analysisKeywords.some(k => requestLower.includes(k))) detectedDomain = 'analysis';
    
    const complexIndicators = ['plusieurs', 'multiple', 'complexe', 'complex', 'détaillé', 'detailed', 'approfondi', 'comprehensive', 'stratégie', 'strategy'];
    const isComplex = complexIndicators.some(k => requestLower.includes(k)) || request.length > 250;
    
    return {
      domain: detectedDomain,
      complexity: isComplex ? 'complex' : 'simple',
      recommendedType: isComplex ? 'AGENTIC' : 'MVP'
    };
  }, []);

  const handleAnalyzeRequest = async () => {
    if (rawRequest.length >= MIN_RAW_REQUEST_LENGTH) {
      // Use local analysis for now and call API during generation for metadata
      const analysis = analyzeUserRequest(rawRequest);
      setAnalyzedDomain(analysis.domain);
      setAnalyzedComplexity(analysis.complexity);
      setRecommendedType(analysis.recommendedType);
      setSelectedDomain(analysis.domain);
      setPromptType(analysis.recommendedType);
      setStep(2);
    }
  };
  
  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    setStep(4);

    try {
      // Use custom expert role if provided, otherwise use the chosen role from suggestions
      const effectiveExpertRole = customExpertRole.trim() || chosenRole || expertRole;
      
      const result = await generateStructuredPromptWithOpenRouter({
        rawRequest,
        promptType,
        domain: selectedDomain,
        language,
        outputLength,
        expertRole: effectiveExpertRole,
        mission,
        constraints,
      });
      
      // NEW: Handle enhanced API response with metadata
      if (result && typeof result === 'object' && result.prompt) {
        setGeneratedPrompt(result.prompt);
        setPromptMetadata(result.metadata || null);
      } else {
        // Backward compatibility for string responses
        setGeneratedPrompt(typeof result === 'string' ? result : result.prompt || result);
        setPromptMetadata(null);
      }
    } catch (error) {
      console.error("Error in handleGeneratePrompt:", error);
      setGeneratedPrompt(t.generation.error + (error instanceof Error ? ` ${error.message}` : ''));
      showNotification(t.notifications.apiError, 'error');
      setPromptMetadata(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const copyToClipboard = async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      showNotification(t.notifications.copied, 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showNotification(t.notifications.copyFailed, 'error');
    }
  };

  const savePrompt = async () => {
    if (!generatedPrompt) return;
    
    try {
      // Since prompts are automatically saved during generation,
      // we just need to refresh the prompts list to show the latest
      const response = await apiService.getPrompts(1, 50);
      setSavedPrompts(response.prompts || []);
      showNotification(t.notifications.saved, 'success');
    } catch (error) {
      console.error("Failed to refresh prompts:", error);
      showNotification(error.message || t.notifications.saveError || 'Failed to save prompt', 'error');
    }
  };

  const exportPrompt = () => {
    if (!generatedPrompt) return;
    const blob = new Blob([generatedPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachinspire-prompt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset form to start a new prompt
  const resetForm = () => {
    setStep(1);
    setRawRequest('');
    setPromptType('MVP');
    setAnalyzedDomain('other');
    setAnalyzedComplexity('simple');
    setRecommendedType('MVP');
    setSelectedDomain('business'); // Changed from 'education' to 'business'
    setOutputLength('medium');
    setExpertRole('');
    setMission('');
    setConstraints('');
    setGeneratedPrompt('');
    setIsGenerating(false);
    // NEW: Reset enhanced metadata
    setPromptMetadata(null);
    setExpertiseSuggestions([]);
    setChosenRole('');
    setLevelLabel('');
    setCustomExpertRole('');
    setShowCustomExpertInput(false);
  };

  // Back to dashboard (same as reset but explicit)
  const backToDashboard = () => {
    resetForm();
  };

  // Function to handle navigation to step 3 with auto-fill
  const goToStep3WithAutoFill = () => {
    // Auto-fill mission with rawRequest if mission is empty
    if (!mission.trim() && rawRequest.trim()) {
      setMission(rawRequest);
    }
    setStep(3);
  };


  const loadPromptFromLibrary = (promptData) => {
    // Map API response fields to local state
    setRawRequest(promptData.raw_request || promptData.rawRequest || '');
    setGeneratedPrompt(promptData.generated_prompt || promptData.generatedPrompt || '');
    setPromptType(promptData.prompt_type || promptData.type || 'MVP');
    setSelectedDomain(promptData.domain || 'education');
    setLanguage(promptData.language || DEFAULT_LANGUAGE);
    setExpertRole(promptData.expert_role || '');
    setMission(promptData.mission || '');
    setConstraints(promptData.constraints || '');
    setOutputLength(promptData.output_length || 'medium');
    setShowLibrary(false);
    setShowLibraryPage(false);
    setStep(4);
    setIsGenerating(false);
  };

  const handleDeletePrompt = async (promptIdToDelete) => {
    try {
      await apiService.deletePrompt(promptIdToDelete);
      const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== promptIdToDelete);
      setSavedPrompts(updatedPrompts);
      showNotification(t.notifications.deleted, 'success');
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      showNotification(error.message || t.notifications.deleteError || 'Failed to delete prompt', 'error');
    }
  };


  const variableFormFields = [
    { 
      id: 'expertRole',
      labelToken: 'expertRole', 
      value: expertRole, 
      onChange: (e) => setExpertRole(e.target.value), 
      placeholderToken: 'expertRolePlaceholder', 
      descriptionToken: 'expertRoleDescription', // New field for description
      type: 'input' 
    },
    { 
      id: 'mission',
      labelToken: 'mission', 
      value: mission, 
      onChange: (e) => setMission(e.target.value), 
      placeholderToken: 'missionPlaceholder',
      descriptionToken: 'missionDescription', // New field for description
      type: 'input' 
    },
    { 
      id: 'constraints',
      labelToken: 'constraints', 
      value: constraints, 
      onChange: (e) => setConstraints(e.target.value), 
      placeholderToken: 'constraintsPlaceholder', 
      type: 'textarea' 
    }
  ];


  // If library page is active, render only the library page
  if (showLibraryPage) {
    return React.createElement(LibraryPage, {
      translations: t,
      onNavigateBack: () => setShowLibraryPage(false),
      onLoadPrompt: loadPromptFromLibrary,
      // Pass the prompts data and loading state from App.js
      initialPrompts: savedPrompts,
      isLoadingPrompts: isLoadingPrompts,
      // Pass function to refresh prompts
      onRefreshPrompts: () => {
        const loadPrompts = async () => {
          if (!user) return;
          
          setIsLoadingPrompts(true);
          try {
            const response = await apiService.getPrompts(1, 50);
            setSavedPrompts(response.prompts || []);
          } catch (error) {
            console.error("Failed to load prompts:", error);
            showNotification(t.notifications.apiError, 'error');
          } finally {
            setIsLoadingPrompts(false);
          }
        };
        loadPrompts();
      },
      // Pass function to update prompts after delete
      onUpdatePrompts: (updatedPrompts) => setSavedPrompts(updatedPrompts)
    });
  }

  return React.createElement("div", { className: "min-h-screen bg-brand-bg text-brand-text font-inter" },
    React.createElement("header", { className: "bg-brand-card-bg shadow-brand" },
      React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center" },
        React.createElement("img", {
          src: "https://res.cloudinary.com/ducvoebot/image/upload/v1747991665/Teachinspire_logo_transparent_yjt3uf.png",
          alt: "Teachinspire Logo",
          className: "h-12 md:h-16 w-auto"
        }),
        React.createElement("div", { className: "flex items-center gap-4" },
          React.createElement("button", {
            onClick: () => handleLanguageChange(language === 'fr' ? 'en' : 'fr'),
            className: "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-primary/10 text-brand-primary transition-colors",
            "aria-label": language === 'fr' ? 'Switch to English' : 'Passer au Français'
          },
            React.createElement(Languages, { className: "w-5 h-5" }),
            React.createElement("span", { className: "font-medium" }, language.toUpperCase())
          ),
          React.createElement(UserMenu, { translations: t })
        )
      )
    ),
    React.createElement("main", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl" },
      React.createElement("div", { className: "text-center mb-10" },
        React.createElement("h1", { className: "font-playfair text-3xl md:text-4xl font-bold text-brand-text mb-3" }, t.app.title),
        React.createElement("p", { className: "text-brand-muted-text text-base mb-2" }, 
          language === 'fr' 
            ? `Bonjour ${user?.firstName || user?.email?.split('@')[0] || 'Utilisateur'}!`
            : `Hello ${user?.firstName || user?.email?.split('@')[0] || 'User'}!`
        ),
        React.createElement("p", { className: "text-brand-primary text-lg" }, t.app.subtitle)
      ),
      step === 1 && React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
        React.createElement("label", { htmlFor: "rawRequestInput", className: "block text-xl font-semibold text-brand-text mb-4 pb-2 border-b-2 border-brand-primary/50" }, t.input.label),
        React.createElement("textarea", {
          id: "rawRequestInput",
          value: rawRequest,
          onChange: (e) => setRawRequest(e.target.value),
          placeholder: t.input.placeholder,
          className: "w-full h-40 p-3 border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none font-inter text-base",
          maxLength: MAX_RAW_REQUEST_LENGTH
        }),
        React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0" },
          React.createElement("span", { className: `text-sm ${rawRequest.length < MIN_RAW_REQUEST_LENGTH && rawRequest.length > 0 ? 'text-brand-error' : 'text-brand-muted-text'}` },
            rawRequest.length, "/", MAX_RAW_REQUEST_LENGTH, " ", t.input.charCount,
            rawRequest.length > 0 && rawRequest.length < MIN_RAW_REQUEST_LENGTH && React.createElement("span", { className: "ml-2" }, "(", t.input.minCharWarning, ")")
          ),
          React.createElement("div", {className: "flex gap-3"},
            React.createElement("button", {
              onClick: () => setShowLibraryPage(true),
              className: "px-5 py-2.5 border-2 border-brand-primary text-brand-primary rounded-lg font-semibold hover:bg-brand-primary hover:text-white transition-colors flex items-center gap-2 text-sm relative"
            },
              React.createElement(FileText, { className: "w-4 h-4" }),
              React.createElement("span", null, t.actions.viewLibrary),
              // Compteur de prompts si > 0
              savedPrompts.length > 0 && React.createElement("span", {
                className: "ml-1 bg-brand-secondary-accent text-brand-text text-xs rounded-full px-2 py-0.5 font-bold"
              }, savedPrompts.length.toString())
            ),
            React.createElement("button", {
              onClick: handleAnalyzeRequest,
              disabled: rawRequest.length < MIN_RAW_REQUEST_LENGTH,
              className: `px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm ${rawRequest.length < MIN_RAW_REQUEST_LENGTH ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-opacity-80 cursor-pointer'}`
            },
              t.input.button,
              React.createElement(ChevronRight, { className: "w-4 h-4" })
            )
          )
        )
      ),
      step === 2 && React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
          React.createElement("h2", { className: "text-xl font-semibold text-brand-text mb-5 pb-2 border-b-2 border-brand-primary/50" }, t.analysis.title),
          React.createElement("div", { className: "grid md:grid-cols-3 gap-4 text-center" },
            [
              { Icon: Brain, label: t.analysis.domain, value: t.domains[analyzedDomain], color: 'text-brand-primary' },
              { Icon: Sparkles, label: t.analysis.complexity, value: analyzedComplexity === 'complex' ? t.analysis.complex : t.analysis.simple, color: 'text-brand-secondary' },
              { Icon: AlertCircle, label: t.analysis.recommendation, value: levelLabel || recommendedType, color: 'text-brand-accent' }
            ].map(item => React.createElement("div", { key: item.label, className: "p-4 bg-brand-bg/50 rounded-lg" },
              React.createElement(item.Icon, { className: `w-8 h-8 mx-auto mb-2 ${item.color}` }),
              React.createElement("p", { className: "font-semibold text-sm text-brand-text" }, item.label),
              React.createElement("p", { className: "text-lg text-brand-text" }, item.value)
            ))
          )
        ),
        
        // NEW: Expertise Suggestion Card
        expertiseSuggestions.length > 0 && React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
          React.createElement("h2", { className: "text-xl font-semibold text-brand-text mb-5 pb-2 border-b-2 border-brand-primary/50" }, 
            language === 'fr' ? 'Suggestion d\'Expertise' : 'Expertise Suggestion'
          ),
          React.createElement("div", { className: "space-y-4" },
            React.createElement("div", { className: "flex flex-wrap gap-2" },
              expertiseSuggestions.map((suggestion, index) => 
                React.createElement("button", {
                  key: index,
                  onClick: () => {
                    setChosenRole(suggestion.role);
                    setCustomExpertRole(''); // Clear custom role when selecting suggestion
                    setShowCustomExpertInput(false);
                  },
                  className: `px-4 py-2 rounded-full border-2 transition-all ${
                    chosenRole === suggestion.role 
                      ? 'border-brand-primary bg-brand-primary text-white' 
                      : 'border-brand-primary text-brand-primary hover:bg-brand-primary/10'
                  }`
                },
                  React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("span", { className: "font-medium" }, suggestion.role),
                    React.createElement("span", { className: `text-xs px-2 py-1 rounded-full ${
                      chosenRole === suggestion.role ? 'bg-white/20' : 'bg-brand-primary/20'
                    }` },
                      Math.round(suggestion.confidence * 100) + '%'
                    )
                  )
                )
              )
            ),
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement("button", {
                onClick: () => setShowCustomExpertInput(!showCustomExpertInput),
                className: "text-brand-primary hover:text-brand-primary/70 font-medium text-sm underline"
              },
                language === 'fr' ? 'Personnaliser le rôle' : 'Customize role'
              )
            ),
            showCustomExpertInput && React.createElement("div", { className: "space-y-2" },
              React.createElement("input", {
                type: "text",
                value: customExpertRole,
                onChange: (e) => {
                  setCustomExpertRole(e.target.value);
                  if (e.target.value.trim()) {
                    setChosenRole(''); // Clear chosen role when typing custom
                  }
                },
                placeholder: language === 'fr' ? 'Ex: Consultant en Stratégie Digitale' : 'Ex: Digital Strategy Consultant',
                className: "w-full p-3 border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-base"
              }),
              React.createElement("p", { className: "text-sm text-brand-muted-text italic" },
                language === 'fr' 
                  ? 'Décrivez le rôle d\'expert que vous souhaitez que l\'IA adopte'
                  : 'Describe the expert role you want the AI to adopt'
              )
            ),
            chosenRole && React.createElement("div", { className: "mt-4 p-3 bg-brand-secondary/10 rounded-lg" },
              React.createElement("p", { className: "text-sm text-brand-text" },
                React.createElement("span", { className: "font-semibold" },
                  language === 'fr' ? 'Rôle sélectionné : ' : 'Selected role: '
                ),
                React.createElement("span", { className: "text-brand-primary font-medium" }, chosenRole)
              )
            )
          )
        ),
        React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
          React.createElement("h2", { className: "text-xl font-semibold text-brand-text mb-5 pb-2 border-b-2 border-brand-primary/50" }, 
            language === 'fr' ? 'Niveau de Structure' : 'Structure Level'
          ),
          promptMetadata && React.createElement("div", { className: "mb-4 p-3 bg-brand-tertiary/10 rounded-lg" },
            React.createElement("p", { className: "text-sm text-brand-text" },
              React.createElement("span", { className: "font-semibold" },
                language === 'fr' ? 'Recommandé : ' : 'Recommended: '
              ),
              React.createElement("span", { className: "text-brand-primary font-medium" }, 
                levelLabel || (
                  language === 'fr' ? 'Pro & Structuré' : 'Pro & Structured'
                )
              ),
              React.createElement("span", { className: "ml-2 text-brand-muted-text" },
                promptMetadata && `(${language === 'fr' ? 'Complexité' : 'Complexity'}: ${promptMetadata.complexity}/10)`
              )
            )
          ),
          React.createElement("div", { className: "grid md:grid-cols-3 gap-4" },
            [
              { 
                type: 'QUICK_TASK', 
                title: language === 'fr' ? 'Rapide & Structuré' : 'Quick & Structured',
                subtitle: language === 'fr' ? 'Tâches simples et directes' : 'Simple and direct tasks',
                description: language === 'fr' ? 'Réponse structurée sans complexité excessive. Parfait pour des demandes courtes et précises.' : 'Structured response without excessive complexity. Perfect for short and precise requests.'
              },
              { 
                type: 'ANALYTICAL', 
                title: language === 'fr' ? 'Pro & Structuré' : 'Pro & Structured',
                subtitle: language === 'fr' ? 'Projets professionnels' : 'Professional projects',
                description: language === 'fr' ? 'Analyse détaillée avec sections, exemples et recommandations actionnables.' : 'Detailed analysis with sections, examples and actionable recommendations.'
              },
              { 
                type: 'FULL_AGENTIC', 
                title: language === 'fr' ? 'Stratégie & Itérations' : 'Strategy & Iterations',
                subtitle: language === 'fr' ? 'Complexité maximale' : 'Maximum complexity',
                description: language === 'fr' ? 'Auto-évaluation, itération guidée et amélioration continue du résultat.' : 'Self-assessment, guided iteration and continuous improvement of the result.'
              }
            ].map(item => React.createElement("button", {
              key: item.type,
              onClick: () => {
                // Map new types to old promptType for backward compatibility
                const mappedType = item.type === 'FULL_AGENTIC' ? 'AGENTIC' : 'MVP';
                setPromptType(mappedType);
                setLevelLabel(item.title); // Store the visible level label
              },
              className: `p-5 rounded-lg border-2 text-left transition-all ${
                levelLabel === item.title || (!levelLabel && ((item.type === 'FULL_AGENTIC' && promptType === 'AGENTIC') || (item.type !== 'FULL_AGENTIC' && promptType === 'MVP')))
                  ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary' 
                  : 'border-gray-300 hover:border-brand-primary/70 hover:bg-brand-primary/5'
              }`
            },
              React.createElement("h3", { className: "text-lg font-semibold text-brand-text mb-1" }, item.title),
              React.createElement("p", { className: "text-xs text-brand-muted-text mb-2" }, item.subtitle),
              React.createElement("p", { className: "text-sm text-brand-text" }, item.description)
            ))
          ),
          React.createElement("div", { className: "flex justify-between items-center mt-6" },
            React.createElement("div", { className: "flex gap-3" },
              React.createElement("button", {
                onClick: () => setStep(1),
                className: "px-5 py-2.5 border-2 border-gray-300 text-brand-muted-text rounded-lg font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm"
              }, t.variables.back),
              React.createElement("button", {
                onClick: backToDashboard,
                className: "px-5 py-2.5 border-2 border-brand-error text-brand-error rounded-lg font-semibold hover:bg-brand-error hover:text-white transition-colors text-sm"
              }, t.actions.backToDashboard)
            ),
            React.createElement("button", {
              onClick: goToStep3WithAutoFill,
              className: "px-5 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-80 transition-all flex items-center gap-2 text-sm"
            },
              t.variables.next,
              React.createElement(ChevronRight, { className: "w-4 h-4" })
            )
          )
        )
      ),
      step === 3 && React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
        React.createElement("h2", { className: "text-xl font-semibold text-brand-text mb-5 pb-2 border-b-2 border-brand-primary/50" }, t.variables.title),
        React.createElement("div", { className: "space-y-5" },
          [ // Dropdowns
            { labelToken: 'domain', value: selectedDomain, onChange: (e) => setSelectedDomain(e.target.value), optionsSource: DOMAIN_OPTIONS, optionsLabelNamespace: 'domains' },
            { labelToken: 'outputLength', value: outputLength, onChange: (e) => setOutputLength(e.target.value), optionsSource: OUTPUT_LENGTH_OPTIONS, optionsLabelNamespace: 'lengths' }
          ].map(item => React.createElement("div", { key: item.labelToken },
            React.createElement("label", { className: "block text-sm font-medium text-brand-text mb-1.5" }, t.variables[item.labelToken]),
            React.createElement("select", { 
              value: item.value, 
              onChange: item.onChange, 
              className: "w-full p-3 border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-base" 
            },
              item.optionsSource.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, t[item.optionsLabelNamespace][opt.labelToken]))
            )
          )),
          variableFormFields.map(item => React.createElement("div", { key: item.id },
            // ✅ AJOUT UX: Label avec ContextualHelper intégré
            React.createElement("div", { className: "flex items-center gap-2 mb-1.5" },
              React.createElement("label", { htmlFor: item.id, className: "text-sm font-medium text-brand-text" }, t.variables[item.labelToken]),
              React.createElement(ContextualHelper, {
                field: item.id,
                domain: selectedDomain,
                helpers: CONTEXTUAL_HELPERS,
                onSuggestionClick: (suggestion) => item.onChange({ target: { value: suggestion } }),
                language: language
              })
            ),
            item.descriptionToken && React.createElement("p", { 
              className: "text-sm text-brand-info italic -mt-1 mb-1.5" // Blue, italic, adjusted margin
            }, t.variables[item.descriptionToken]),
            item.type === 'input' 
              ? React.createElement("input", { 
                  id: item.id,
                  type: "text", 
                  value: item.value, 
                  onChange: item.onChange, 
                  placeholder: t.variables[item.placeholderToken], 
                  className: "w-full p-3 border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-base" 
                })
              : React.createElement("textarea", { 
                  id: item.id,
                  value: item.value, 
                  onChange: item.onChange, 
                  placeholder: t.variables[item.placeholderToken], 
                  className: "w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none text-base" 
                })
          ))
        ),
        React.createElement("div", { className: "flex justify-between items-center mt-6" },
          React.createElement("div", { className: "flex gap-3" },
            React.createElement("button", { onClick: () => setStep(2), className: "px-5 py-2.5 border-2 border-gray-300 text-brand-muted-text rounded-lg font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm" }, t.variables.back),
            React.createElement("button", {
              onClick: backToDashboard,
              className: "px-5 py-2.5 border-2 border-brand-error text-brand-error rounded-lg font-semibold hover:bg-brand-error hover:text-white transition-colors text-sm"
            }, t.actions.backToDashboard)
          ),
          React.createElement("button", { onClick: handleGeneratePrompt, className: "px-5 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-80 transition-all flex items-center gap-2 text-sm" },
            t.actions.generate, React.createElement(ChevronRight, { className: "w-4 h-4" })
          )
        )
      ),
      step === 4 && React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand p-6 md:p-8" },
        React.createElement("h2", { className: "text-xl font-semibold text-brand-text mb-5 pb-2 border-b-2 border-brand-primary/50" }, t.generation.title),
        
        // NEW: Enhanced metadata display
        !isGenerating && promptMetadata && React.createElement("div", { className: "mb-6 p-4 bg-brand-light rounded-lg border border-brand-primary/20" },
          React.createElement("div", { className: "flex flex-wrap items-center gap-4 text-sm" },
            React.createElement("span", { className: "flex items-center gap-2" },
              React.createElement("span", { className: "font-semibold text-brand-text" },
                language === 'fr' ? 'Rôle appliqué:' : 'Applied role:'
              ),
              React.createElement("span", { className: "text-brand-primary font-medium" },
                customExpertRole || chosenRole || promptMetadata.chosenRole
              )
            ),
            React.createElement("span", { className: "text-brand-muted-text" }, '|'),
            React.createElement("span", { className: "flex items-center gap-2" },
              React.createElement("span", { className: "font-semibold text-brand-text" },
                language === 'fr' ? 'Niveau:' : 'Level:'
              ),
              React.createElement("span", { className: "text-brand-primary font-medium" },
                levelLabel || promptMetadata.levelLabel
              )
            ),
            promptMetadata.formatHints && promptMetadata.formatHints.length > 0 && React.createElement(React.Fragment, null,
              React.createElement("span", { className: "text-brand-muted-text" }, '|'),
              React.createElement("span", { className: "flex items-center gap-2" },
                React.createElement("span", { className: "font-semibold text-brand-text" },
                  language === 'fr' ? 'Format:' : 'Format:'
                ),
                React.createElement("span", { className: "text-brand-tertiary font-medium" },
                  promptMetadata.formatHints.join(', ')
                )
              )
            )
          )
        ),
        
        isGenerating ? React.createElement("div", { className: "text-center py-12" },
          React.createElement(Loader2, { className: "w-12 h-12 mx-auto animate-spin text-brand-primary mb-4" }),
          React.createElement("p", { className: "text-brand-muted-text text-lg" }, t.generation.generating)
        ) : React.createElement(React.Fragment, null,
          React.createElement("div", { className: "bg-brand-bg/50 rounded-lg border-l-4 border-brand-primary p-4 font-courier text-sm text-brand-text whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner" },
            generatedPrompt || "No prompt generated yet."
          ),
          // NEW: Show iteration button for Stratégie & Itérations level
          (levelLabel && (levelLabel.includes('Stratégie') || levelLabel.includes('Strategy'))) && React.createElement("div", { className: "mt-4 p-4 bg-brand-accent/10 rounded-lg border border-brand-accent/30" },
            React.createElement("h3", { className: "text-lg font-semibold text-brand-text mb-2" },
              language === 'fr' ? 'Évaluation & Amélioration' : 'Evaluation & Improvement'
            ),
            React.createElement("p", { className: "text-sm text-brand-muted-text mb-3" },
              language === 'fr' 
                ? 'Pour ce niveau avancé, vous pouvez demander à l\'IA d\'évaluer et d\'améliorer le résultat.'
                : 'For this advanced level, you can ask the AI to evaluate and improve the result.'
            ),
            React.createElement("button", {
              onClick: () => {
                const iterationPrompt = language === 'fr' 
                  ? '🤔 Souhaitez-vous que j\'évalue ce résultat par rapport à des critères clés et que je fournisse des suggestions d\'amélioration ? (Oui/Non)'
                  : '🤔 Would you like me to evaluate this result against key criteria and provide suggestions for improvement? (Yes/No)';
                setGeneratedPrompt(generatedPrompt + '\n\n' + iterationPrompt);
              },
              className: "px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors flex items-center gap-2"
            },
              React.createElement(Brain, { className: "w-4 h-4" }),
              language === 'fr' ? 'Évaluer & Améliorer' : 'Evaluate & Improve'
            )
          ),
          
          React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6" },
            React.createElement("button", { onClick: copyToClipboard, className: "w-full px-4 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:bg-opacity-80 transition-all flex items-center justify-center gap-2 text-sm" }, React.createElement(Copy, { className: "w-4 h-4" }), t.actions.copy),
            React.createElement("button", { onClick: savePrompt, className: "w-full px-4 py-2.5 border-2 border-brand-primary text-brand-primary rounded-lg font-semibold hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2 text-sm" }, React.createElement(Save, { className: "w-4 h-4" }), t.actions.save),
            React.createElement("button", { onClick: exportPrompt, className: "w-full px-4 py-2.5 border-2 border-brand-primary text-brand-primary rounded-lg font-semibold hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2 text-sm" }, React.createElement(Download, { className: "w-4 h-4" }), t.actions.export)
          ),
          React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4" },
            React.createElement("button", { onClick: resetForm, className: "w-full px-5 py-3 bg-brand-secondary-accent text-brand-text rounded-lg font-semibold hover:bg-opacity-80 transition-all text-base" }, t.actions.newPrompt),
            React.createElement("button", { 
              onClick: backToDashboard, 
              className: "w-full px-5 py-3 border-2 border-brand-error text-brand-error rounded-lg font-semibold hover:bg-brand-error hover:text-white transition-colors text-base" 
            }, t.actions.backToDashboardFull)
          )
        )
      )
    ), // End of main element
    showLibrary && React.createElement("div", { className: "fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" },
      React.createElement("div", { className: "bg-brand-card-bg rounded-lg shadow-brand-lg max-w-2xl w-full max-h-[85vh] flex flex-col" },
        React.createElement("div", { className: "p-5 border-b border-gray-200 flex justify-between items-center" },
          React.createElement("h2", { className: "text-xl font-semibold text-brand-text" }, t.library.title),
          React.createElement("button", { onClick: () => setShowLibrary(false), className: "p-2 hover:bg-gray-100 rounded-full text-brand-muted-text hover:text-brand-text" }, React.createElement(X, { className: "w-5 h-5" }))
        ),
        React.createElement("div", { className: "p-5 overflow-y-auto flex-grow" },
          isLoadingPrompts ? React.createElement("div", { className: "text-center py-10" },
            React.createElement(Loader2, { className: "w-6 h-6 mx-auto animate-spin text-brand-primary-accent mb-2" }),
            React.createElement("p", { className: "text-brand-muted-text" }, t.auth.loading || 'Loading prompts...')
          )
          : savedPrompts.length === 0 ? React.createElement("p", { className: "text-center text-brand-muted-text py-10" }, t.library.empty)
          : React.createElement("div", { className: "space-y-3" },
            savedPrompts.map((prompt) => {
              const title = prompt.title || '';
              const rawRequest = prompt.raw_request || prompt.rawRequest || '';
              const promptType = prompt.prompt_type || prompt.type || 'MVP';
              const domain = prompt.domain || 'other';
              const timestamp = prompt.created_at || prompt.timestamp || Date.now();
              
              // Use proper title, fallback to truncated raw request if no title
              const displayTitle = title || 
                (rawRequest.length > 70 ? rawRequest.substring(0, 70) + '...' : rawRequest) || 
                (language === 'fr' ? 'Prompt sans titre' : 'Untitled Prompt');
              
              return React.createElement("div", { key: prompt.id, className: "border border-gray-200 rounded-lg p-4 hover:bg-brand-bg/50 transition-colors" },
                React.createElement("div", { className: "flex justify-between items-start mb-1.5" },
                  React.createElement("p", { className: "font-semibold text-brand-text text-sm break-all mr-2 flex-grow" }, 
                    displayTitle
                  ),
                  React.createElement("div", { className: "flex-shrink-0 flex items-center gap-2 ml-2" },
                     React.createElement("button", { 
                        onClick: () => loadPromptFromLibrary(prompt), 
                        className: "px-3 py-1.5 bg-brand-primary-accent text-white rounded-md text-xs hover:bg-opacity-80 whitespace-nowrap flex items-center gap-1",
                        title: t.actions.usePrompt,
                        "aria-label": t.actions.usePrompt
                      }, 
                      React.createElement(FileText, {className: "w-3 h-3"}),
                      t.actions.usePrompt
                    ),
                    React.createElement("button", { 
                        onClick: () => handleDeletePrompt(prompt.id), 
                        className: "px-3 py-1.5 bg-brand-error/10 text-brand-error rounded-md text-xs hover:bg-brand-error hover:text-white whitespace-nowrap flex items-center gap-1",
                        title: t.actions.delete,
                        "aria-label": t.actions.delete
                      }, 
                      React.createElement(Trash2, {className: "w-3 h-3"}),
                      t.actions.delete
                    )
                  )
                ),
                React.createElement("p", { className: "text-xs text-brand-muted-text" },
                  new Date(timestamp).toLocaleDateString(language), " • ", promptType, " • ", t.domains[domain]
                )
              );
            })
          )
        )
      )
    ), // End of library modal element
    
    notification && React.createElement("div", { className: "fixed bottom-6 right-6 bg-brand-text text-white px-5 py-3 rounded-lg shadow-brand-lg flex items-center gap-3 z-[100]" },
      React.createElement(Check, { className: "w-5 h-5 text-brand-success" }),
      React.createElement("span", null, notification)
    ) // End of notification element
  ); // End of outermost div's React.createElement call
};

// Main App component that provides authentication context
const App = () => {
  const [globalLanguage, setGlobalLanguage] = useState(DEFAULT_LANGUAGE);
  
  // Make API service available globally for the auth context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.apiService = apiService;
    }
  }, []);

  return React.createElement(AuthProvider, null,
    React.createElement(AuthWrapper, { 
      translations: translations,
      language: globalLanguage,
      onLanguageChange: setGlobalLanguage
    },
      React.createElement(MainApp, {
        initialLanguage: globalLanguage,
        onLanguageChange: setGlobalLanguage
      })
    )
  );
};

export default App;
