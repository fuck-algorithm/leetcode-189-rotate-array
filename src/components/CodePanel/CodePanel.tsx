import { useEffect, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { ProgrammingLanguage, AlgorithmStep } from '../../types';
import { saveLanguagePreference, getLanguagePreference } from '../../utils/indexedDB';
import styles from './CodePanel.module.css';

const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  java: 'Java',
  python: 'Python',
  golang: 'Go',
  javascript: 'JavaScript',
};

const PRISM_LANGUAGES: Record<ProgrammingLanguage, string> = {
  java: 'java',
  python: 'python',
  golang: 'go',
  javascript: 'javascript',
};

interface CodePanelProps {
  code: Record<ProgrammingLanguage, string>;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
  currentStep: AlgorithmStep | null;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  language,
  onLanguageChange,
  currentStep,
}) => {
  // 加载保存的语言偏好
  useEffect(() => {
    getLanguagePreference().then(onLanguageChange);
  }, [onLanguageChange]);

  const handleLanguageChange = useCallback((lang: ProgrammingLanguage) => {
    onLanguageChange(lang);
    saveLanguagePreference(lang);
  }, [onLanguageChange]);

  const highlightedLines = currentStep?.codeLines[language] || [];
  const variables = currentStep?.variables || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>代码</span>
        <div className={styles.languageTabs}>
          {(Object.keys(LANGUAGE_LABELS) as ProgrammingLanguage[]).map((lang) => (
            <button
              key={lang}
              className={`${styles.langTab} ${language === lang ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.codeWrapper}>
        <Highlight
          theme={themes.nightOwl}
          code={code[language]}
          language={PRISM_LANGUAGES[language]}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className={styles.pre} style={{ ...style, background: 'transparent' }}>
              {tokens.map((line, i) => {
                const lineNumber = i + 1;
                const isHighlighted = highlightedLines.includes(lineNumber);
                const lineVars = variables.filter(() => isHighlighted);
                
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
                  >
                    <span className={styles.lineNumber}>{lineNumber}</span>
                    <span className={styles.lineContent}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                    {isHighlighted && lineVars.length > 0 && (
                      <span className={styles.varHint}>
                        {lineVars.map((v, idx) => (
                          <span key={idx} className={styles.varItem}>
                            {v.name}={String(v.value)}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
};
