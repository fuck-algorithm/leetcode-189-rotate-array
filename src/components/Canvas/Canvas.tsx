import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { AlgorithmStep } from '../../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  step: AlgorithmStep | null;
  solutionId: string;
}

const COLORS = {
  default: '#3b82f6',
  highlight: '#f59e0b',
  swap: '#ef4444',
  complete: '#10b981',
  empty: '#475569',
  text: '#f1f5f9',
  secondary: '#94a3b8',
  arrow: '#f59e0b',
};

export const Canvas: React.FC<CanvasProps> = ({ step, solutionId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // 绘制数组
  const drawArray = useCallback((
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    array: number[],
    y: number,
    label: string,
    highlightIndices: number[],
    swapIndices: number[],
    pointers: AlgorithmStep['pointers'],
    arrows: AlgorithmStep['arrows'],
    isExtra: boolean = false
  ) => {
    const { width } = dimensions;
    const boxSize = Math.min(50, (width - 200) / Math.max(array.length, 1));
    const gap = 4;
    const totalWidth = array.length * (boxSize + gap) - gap;
    const startX = (width - totalWidth) / 2;

    // 数组标签
    svg.append('text')
      .attr('x', startX - 60)
      .attr('y', y + boxSize / 2 + 5)
      .attr('fill', COLORS.secondary)
      .attr('font-size', '14px')
      .attr('font-weight', '500')
      .text(label);

    // 绘制数组元素
    const boxes = svg.selectAll(`.box-${label}`)
      .data(array)
      .enter()
      .append('g')
      .attr('class', `box-${label}`)
      .attr('transform', (_, i) => `translate(${startX + i * (boxSize + gap)}, ${y})`);

    // 方框
    boxes.append('rect')
      .attr('width', boxSize)
      .attr('height', boxSize)
      .attr('rx', 6)
      .attr('fill', (_, i) => {
        if (swapIndices?.includes(i)) return COLORS.swap;
        if (highlightIndices?.includes(i)) return COLORS.highlight;
        if (isExtra && array[i] === null) return COLORS.empty;
        return COLORS.default;
      })
      .attr('stroke', (_, i) => {
        if (swapIndices?.includes(i)) return '#fca5a5';
        if (highlightIndices?.includes(i)) return '#fcd34d';
        return 'transparent';
      })
      .attr('stroke-width', 2);

    // 数值
    boxes.append('text')
      .attr('x', boxSize / 2)
      .attr('y', boxSize / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', boxSize > 35 ? '14px' : '12px')
      .attr('font-weight', '600')
      .text((d) => d !== null ? String(d) : '');

    // 索引
    boxes.append('text')
      .attr('x', boxSize / 2)
      .attr('y', boxSize + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.secondary)
      .attr('font-size', '11px')
      .text((_, i) => String(i));

    // 绘制指针
    if (pointers && !isExtra) {
      pointers.forEach((pointer) => {
        const px = startX + pointer.index * (boxSize + gap) + boxSize / 2;
        const py = y - 10;

        svg.append('polygon')
          .attr('points', `${px},${py} ${px - 6},${py - 12} ${px + 6},${py - 12}`)
          .attr('fill', pointer.color);

        svg.append('text')
          .attr('x', px)
          .attr('y', py - 18)
          .attr('text-anchor', 'middle')
          .attr('fill', pointer.color)
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .text(pointer.name);
      });
    }

    // 绘制箭头
    if (arrows && !isExtra) {
      arrows.forEach((arrow) => {
        const fromX = startX + arrow.from * (boxSize + gap) + boxSize / 2;
        const toX = startX + arrow.to * (boxSize + gap) + boxSize / 2;
        const arrowY = y + boxSize + 40;

        // 曲线箭头
        const midX = (fromX + toX) / 2;
        const curveY = arrowY + Math.abs(toX - fromX) / 4;

        svg.append('path')
          .attr('d', `M ${fromX} ${arrowY} Q ${midX} ${curveY} ${toX} ${arrowY}`)
          .attr('fill', 'none')
          .attr('stroke', COLORS.arrow)
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');

        if (arrow.label) {
          svg.append('text')
            .attr('x', midX)
            .attr('y', curveY + 5)
            .attr('text-anchor', 'middle')
            .attr('fill', COLORS.arrow)
            .attr('font-size', '11px')
            .text(arrow.label);
        }
      });
    }

    return { startX, boxSize, gap };
  }, [dimensions]);

  // 主绘制函数
  useEffect(() => {
    if (!svgRef.current || !step) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // 添加缩放和拖动功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 定义箭头标记
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', COLORS.arrow);

    const g = svg.append('g');

    // 根据解法类型决定布局
    const hasExtraArray = step.extraArray && solutionId === 'extra-array';
    const mainArrayY = hasExtraArray ? height / 2 - 80 : height / 2 - 30;
    const extraArrayY = height / 2 + 40;

    // 绘制主数组
    drawArray(
      g,
      step.arrayState,
      mainArrayY,
      'nums',
      step.highlightIndices,
      step.swapIndices || [],
      step.pointers,
      step.arrows
    );

    // 绘制额外数组（方法一）
    if (hasExtraArray && step.extraArray) {
      drawArray(
        g,
        step.extraArray,
        extraArrayY,
        'newArr',
        [],
        [],
        undefined,
        undefined,
        true
      );
    }

    // 绘制变量面板
    if (step.variables && step.variables.length > 0) {
      const varPanel = g.append('g')
        .attr('transform', `translate(${width - 150}, 20)`);

      varPanel.append('rect')
        .attr('width', 130)
        .attr('height', step.variables.length * 24 + 16)
        .attr('rx', 6)
        .attr('fill', 'rgba(30, 41, 59, 0.9)')
        .attr('stroke', COLORS.secondary)
        .attr('stroke-width', 1);

      varPanel.append('text')
        .attr('x', 10)
        .attr('y', 18)
        .attr('fill', COLORS.secondary)
        .attr('font-size', '11px')
        .text('变量');

      step.variables.forEach((v, i) => {
        varPanel.append('text')
          .attr('x', 10)
          .attr('y', 38 + i * 24)
          .attr('fill', COLORS.text)
          .attr('font-size', '13px')
          .attr('font-family', 'monospace')
          .text(`${v.name} = ${v.value}`);
      });
    }

    // 步骤描述
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 30)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.text)
      .attr('font-size', '14px')
      .text(step.description);

  }, [step, dimensions, drawArray, solutionId]);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      />
      <div className={styles.hint}>
        拖动平移 · 滚轮缩放
      </div>
    </div>
  );
};
