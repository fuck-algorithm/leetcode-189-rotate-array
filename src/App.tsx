import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { DataInput } from './components/DataInput';
import { SolutionTabs } from './components/SolutionTabs';
import { CodePanel } from './components/CodePanel';
import { Canvas } from './components/Canvas';
import { ControlPanel } from './components/ControlPanel';
import { AlgorithmModal } from './components/AlgorithmModal';
import { AlgorithmButton } from './components/AlgorithmButton';
import { WeChatFloat } from './components/WeChatFloat';
import { solutions } from './algorithms';
import type { InputData, ProgrammingLanguage, AlgorithmStep } from './types';
import './styles/global.css';
import styles from './App.module.css';

const DEFAULT_DATA: InputData = {
  nums: [1, 2, 3, 4, 5, 6, 7],
  k: 3,
};

function App() {
  const [inputData, setInputData] = useState<InputData>(DEFAULT_DATA);
  const [currentSolutionId, setCurrentSolutionId] = useState(solutions[0].id);
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 用于追踪数据变化的 key
  const [dataKey, setDataKey] = useState(0);
  
  const playIntervalRef = useRef<number | null>(null);

  // 获取当前解法
  const currentSolution = useMemo(() => {
    return solutions.find((s) => s.id === currentSolutionId) || solutions[0];
  }, [currentSolutionId]);

  // 生成步骤
  const steps = useMemo<AlgorithmStep[]>(() => {
    return currentSolution.generateSteps([...inputData.nums], inputData.k);
  }, [currentSolution, inputData]);

  // 当前步骤
  const currentStep = steps[currentStepIndex] || null;

  // 重置步骤
  const resetSteps = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // 处理数据变化 - 包装 setInputData
  const handleDataChange = useCallback((data: InputData) => {
    setInputData(data);
    setDataKey(k => k + 1);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // 处理解法变化 - 包装 setCurrentSolutionId
  const handleSolutionChange = useCallback((id: string) => {
    setCurrentSolutionId(id);
    setDataKey(k => k + 1);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // 播放控制
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, speed, steps.length]);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  const handlePlayPause = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying((prev) => !prev);
  }, [currentStepIndex, steps.length]);

  const handleReset = useCallback(() => {
    resetSteps();
  }, [resetSteps]);

  const handleSeek = useCallback((step: number) => {
    setCurrentStepIndex(step);
    setIsPlaying(false);
  }, []);

  // 使用 dataKey 来确保组件正确更新
  void dataKey;

  return (
    <div className={styles.app}>
      <Header />
      
      <div className={styles.subHeader}>
        <DataInput onDataChange={handleDataChange} currentData={inputData} />
        <div className={styles.solutionRow}>
          <SolutionTabs
            solutions={solutions}
            currentSolutionId={currentSolutionId}
            onSolutionChange={handleSolutionChange}
          />
          <AlgorithmButton onClick={() => setIsModalOpen(true)} />
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.codeSection}>
          <CodePanel
            code={currentSolution.code}
            language={language}
            onLanguageChange={setLanguage}
            currentStep={currentStep}
          />
        </div>
        <div className={styles.canvasSection}>
          <Canvas step={currentStep} solutionId={currentSolutionId} />
        </div>
      </div>

      <ControlPanel
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        speed={speed}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onSeek={handleSeek}
      />

      <AlgorithmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        solution={currentSolution}
      />

      <WeChatFloat />
    </div>
  );
}

export default App;
