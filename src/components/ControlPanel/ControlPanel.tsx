import { useEffect, useCallback, useRef } from 'react';
import { savePlaybackSpeed, getPlaybackSpeed } from '../../utils/indexedDB';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (step: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPrev,
  onNext,
  onPlayPause,
  onReset,
  onSpeedChange,
  onSeek,
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 加载保存的播放速度
  useEffect(() => {
    getPlaybackSpeed().then(onSpeedChange);
  }, [onSpeedChange]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onPlayPause, onReset]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    onSpeedChange(newSpeed);
    savePlaybackSpeed(newSpeed);
  }, [onSpeedChange]);

  // 进度条拖动
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || totalSteps <= 1) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const step = Math.round(percentage * (totalSteps - 1));
    onSeek(step);
  }, [totalSteps, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleProgressClick(e);
  }, [handleProgressClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    handleProgressClick(e);
  }, [handleProgressClick]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          onClick={onPrev}
          disabled={currentStep === 0}
          className={styles.btn}
          title="上一步 (←)"
        >
          <span className={styles.icon}>⏮</span>
          <span className={styles.shortcut}>←</span>
        </button>

        <button
          onClick={onPlayPause}
          className={`${styles.btn} ${styles.playBtn}`}
          title={isPlaying ? '暂停 (空格)' : '播放 (空格)'}
        >
          <span className={styles.icon}>{isPlaying ? '⏸' : '▶'}</span>
          <span className={styles.shortcut}>空格</span>
        </button>

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          className={styles.btn}
          title="下一步 (→)"
        >
          <span className={styles.icon}>⏭</span>
          <span className={styles.shortcut}>→</span>
        </button>

        <button
          onClick={onReset}
          className={styles.btn}
          title="重置 (R)"
        >
          <span className={styles.icon}>⟲</span>
          <span className={styles.shortcut}>R</span>
        </button>

        <div className={styles.divider} />

        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>速度</span>
          <div className={styles.speedButtons}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`${styles.speedBtn} ${speed === s ? styles.active : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.stepInfo}>
          步骤 {currentStep + 1} / {totalSteps}
        </div>
      </div>

      <div
        ref={progressRef}
        className={styles.progressBar}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
        <div
          className={styles.progressHandle}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};
