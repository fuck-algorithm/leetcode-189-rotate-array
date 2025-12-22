import type { AlgorithmSolution } from '../../types';
import styles from './SolutionTabs.module.css';

interface SolutionTabsProps {
  solutions: AlgorithmSolution[];
  currentSolutionId: string;
  onSolutionChange: (id: string) => void;
}

export const SolutionTabs: React.FC<SolutionTabsProps> = ({
  solutions,
  currentSolutionId,
  onSolutionChange,
}) => {
  return (
    <div className={styles.container}>
      {solutions.map((solution) => (
        <button
          key={solution.id}
          className={`${styles.tab} ${currentSolutionId === solution.id ? styles.active : ''}`}
          onClick={() => onSolutionChange(solution.id)}
        >
          <span className={styles.name}>{solution.name}</span>
          <span className={styles.complexity}>
            时间 {solution.timeComplexity} · 空间 {solution.spaceComplexity}
          </span>
        </button>
      ))}
    </div>
  );
};
