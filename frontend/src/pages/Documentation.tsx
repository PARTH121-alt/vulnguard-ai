import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Brain, Shield, AlertTriangle, Info, Code, Zap } from 'lucide-react';

const sections = [
  {
    id: 'what',
    title: 'What is Vulnerability Detection?',
    icon: Shield,
    content: 'Vulnerability detection is the process of identifying security weaknesses in source code that could be exploited by attackers. VulnGuard AI uses machine learning models trained on patterns of known vulnerabilities to automatically scan your code and flag potential security issues.\n\nThe system analyzes code structure, patterns, and constructs to identify common vulnerability classes such as SQL injection, command injection, cross-site scripting, hardcoded credentials, and more.',
  },
  {
    id: 'how',
    title: 'How AI Analyzes Source Code',
    icon: Brain,
    content: 'VulnGuard AI uses a multi-stage pipeline to analyze code:\n\n1. Preprocessing: The source code is cleaned, normalized, and tokenized.\n2. Feature Extraction: Both textual (TF-IDF) and structural (AST-based) features are extracted.\n3. Pattern Matching: The system identifies dangerous function calls, unsafe string operations, and risky coding patterns.\n4. ML Prediction: Trained models (Random Forest, XGBoost) classify the code as potentially vulnerable or safe.\n5. Explanation: SHAP-based explainability highlights which features contributed most to the prediction.\n\nFor traditional ML models, the system uses TF-IDF vectorization of code tokens combined with hand-crafted structural features.',
  },
  {
    id: 'ml-vs-codebert',
    title: 'Traditional ML vs CodeBERT',
    icon: Zap,
    content: 'Traditional ML (Random Forest, XGBoost):\n- Uses TF-IDF features and hand-crafted structural features\n- Fast inference and training\n- Interpretable with SHAP explanations\n- Requires feature engineering\n- Good baseline performance\n\nCodeBERT:\n- Pre-trained transformer model specifically for code\n- Understands code semantics and context\n- Better at capturing complex vulnerability patterns\n- Requires fine-tuning on vulnerability datasets\n- Higher computational cost\n\nVulnGuard AI currently uses traditional ML models in production. CodeBERT integration is available as a demo module and can be activated after fine-tuning on labeled vulnerability datasets.',
  },
  {
    id: 'confidence',
    title: 'What Confidence Scores Mean',
    icon: Info,
    content: 'The confidence score represents the model certainty in its prediction, ranging from 0% to 100%.\n\n- High confidence (80-100%): The model is very certain about its classification\n- Medium confidence (50-79%): The model has moderate certainty; manual review recommended\n- Low confidence (0-49%): The model is uncertain; results should be treated with caution\n\nImportant: A high confidence score does NOT mean the vulnerability definitely exists. It means the model pattern-matching strongly suggests a vulnerability pattern is present. Always perform manual security review.',
  },
  {
    id: 'shap',
    title: 'What SHAP Explanations Mean',
    icon: Code,
    content: 'SHAP (SHapley Additive exPlanations) is a game-theoretic approach to explain machine learning predictions. It shows how each feature contributes to the model output.\n\nFor tree-based models (Random Forest, XGBoost):\n- Positive SHAP values push the prediction toward vulnerable\n- Negative SHAP values push the prediction toward safe\n- The magnitude indicates the strength of contribution\n\nExample: If dangerous_sql_injection has a high positive SHAP value, it means the presence of SQL injection patterns strongly contributed to the vulnerability classification.\n\nSHAP explanations are available for tree-based models. For CodeBERT (transformer model), standard SHAP is not directly applicable to model internals.',
  },
  {
    id: 'limitations',
    title: 'Limitations',
    icon: AlertTriangle,
    content: 'VulnGuard AI is an AI-assisted screening tool with several important limitations:\n\n1. Pattern-Based Detection: The demo mode uses pattern matching, which can produce false positives and false negatives.\n\n2. Limited Context: The models may not fully understand application context, business logic vulnerabilities, or complex multi-step attack vectors.\n\n3. Training Data Dependence: Model accuracy depends on the quality and diversity of training data.\n\n4. Not a Security Audit: This tool does NOT replace professional security auditing, penetration testing, or comprehensive code review.\n\n5. Language Support: Current models are optimized for Python, with basic support for JavaScript, Java, and C++.\n\n6. False Sense of Security: Using this tool does not guarantee that your code is secure. Always combine automated scanning with manual review.',
  },
  {
    id: 'future',
    title: 'Future Improvements',
    icon: BookOpen,
    content: 'Planned enhancements for VulnGuard AI:\n\n1. Fine-tuned CodeBERT: Train CodeBERT on labeled vulnerability datasets for higher accuracy.\n\n2. Extended Language Support: Add support for Go, Rust, Ruby, PHP, and more.\n\n3. IDE Integration: VS Code and JetBrains plugins for real-time scanning.\n\n4. CI/CD Integration: GitHub Actions and GitLab CI integration for automated scanning in pipelines.\n\n5. Custom Rules: Allow users to define custom vulnerability patterns and rules.\n\n6. Multi-File Analysis: Analyze entire repositories and cross-file dependencies.\n\n7. API Security: Extend to analyze API specifications and configurations.\n\n8. Real Datasets: Train on real-world vulnerability databases like CVE, NVD, and Snyk.',
  },
];

export default function Documentation() {
  const [openSection, setOpenSection] = useState<string | null>('what');

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-400" /> Documentation
          </h1>
          <p className="text-slate-400">Learn how VulnGuard AI works and understand its capabilities</p>
        </div>

        <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(255, 165, 2, 0.05)', border: '1px solid rgba(255, 165, 2, 0.15)' }}>
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            <strong className="text-white">Disclaimer:</strong> This tool assists vulnerability screening and does not guarantee
            complete software security. Always perform thorough security auditing and professional penetration testing.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;
            return (
              <div key={section.id} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <button onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-all">
                  <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="flex-1 font-semibold text-white">{section.title}</span>
                  {isOpen ?
                    <ChevronDown className="w-5 h-5 text-slate-400" /> :
                    <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6">
                    <div className="pl-8 text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
