import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { AlgorithmStep } from '../../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  step: AlgorithmStep | null;
  solutionId: string;
}

const COLORS = {
  default: '#3b82f6',
  current: '#f59e0b',
  compare: '#ef4444',
  done: '#10b981',
  empty: '#475569',
  text: '#f1f5f9',
  secondary: '#94a3b8',
  arrow: '#f59e0b',
};

const MOTION_MS = 240;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPERATION_LABELS: Record<string, string> = {
  init: '初始化', read: '读取', compare: '比较', swap: '交换', move: '移动',
  copy: '复制', done: '完成', step: '步骤',
};

interface ArrayLayout {
  boxSize: number;
  gap: number;
  startX: number;
  y: number;
  pitch: number;
}

interface Point {
  x: number;
  y: number;
}

const nodeCenter = (layout: ArrayLayout, index: number): Point => ({
  x: layout.startX + index * layout.pitch + layout.boxSize / 2,
  y: layout.y + layout.boxSize / 2,
});

const nodeEdge = (center: Point, toward: Point, size: number): Point => {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale = Math.max(Math.abs(dx), Math.abs(dy), 1);
  const half = size / 2;
  return { x: center.x + dx / scale * half, y: center.y + dy / scale * half };
};

const friendlyVariableName = (name: string): string => ({
  n: '数组长度',
  k: '右移格数',
  i: '当前索引',
  start: '本圈起点',
  current: '当前索引',
  next: '目标索引',
  prev: '手里要放的数',
  temp: '暂存的数',
  count: '圈数',
  newIndex: '新位置',
  newIndexFormula: '新位置怎么算',
}[name] ?? name);

const wrapText = (text: string, maxChars: number, maxLines = 2): string[] => {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && line.length + word.length > maxChars) {
      lines.push(line.trim());
      line = '';
    }
    if (word.length > maxChars) {
      for (let index = 0; index < word.length; index += maxChars) {
        if (line) lines.push(line.trim());
        line = word.slice(index, index + maxChars);
      }
    } else {
      line += word;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, maxLines);
};

const getArrayLayout = (width: number, height: number, length: number, row: number, rows: number): ArrayLayout => {
  const sidePadding = length > 24 ? 20 : 40;
  const gap = length > 24 ? 2 : length > 14 ? 3 : 6;
  const boxSize = Math.max(14, Math.min(50, (width - sidePadding * 2 - gap * Math.max(length - 1, 0)) / Math.max(length, 1)));
  const pitch = boxSize + gap;
  const totalWidth = length * boxSize + Math.max(length - 1, 0) * gap;
  const startX = Math.max((width - totalWidth) / 2, sidePadding);
  const top = Math.max(74, height * 0.2);
  const bottom = Math.max(top + 1, height * 0.76);
  const y = rows > 1 ? top + (bottom - top) * row / (rows - 1) : height * 0.48;
  return { boxSize, gap, startX, y, pitch };
};

export const Canvas: React.FC<CanvasProps> = ({ step, solutionId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.attr('viewBox', `0 0 ${Math.max(dimensions.width, 1)} ${Math.max(dimensions.height, 1)}`);
    if (svg.select('.zoom-layer').empty()) {
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient').attr('id', 'array-node-gradient')
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4387f5');
      gradient.append('stop').attr('offset', '100%').attr('stop-color', COLORS.default);
      const focusGlow = defs.append('filter').attr('id', 'array-focus-glow')
        .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
      focusGlow.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur');
      const merge = focusGlow.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
      defs.append('marker').attr('id', 'arrowhead').attr('viewBox', '0 -5 10 10')
        .attr('refX', 8).attr('refY', 0).attr('markerWidth', 6)
        .attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', COLORS.arrow);
      defs.append('marker').attr('id', 'flow-arrowhead').attr('viewBox', '0 -5 10 10')
        .attr('refX', 8).attr('refY', 0).attr('markerWidth', 5)
        .attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#fecaca');
      defs.append('marker').attr('id', 'pointer-arrowhead').attr('viewBox', '0 -5 10 10')
        .attr('refX', 8).attr('refY', 0).attr('markerWidth', 5)
        .attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#94a3b8');

      const layer = svg.append('g').attr('class', 'zoom-layer');
      layer.append('g').attr('class', 'layer-tracks');
      layer.append('g').attr('class', 'layer-ranges');
      layer.append('g').attr('class', 'layer-arrays');
      layer.append('g').attr('class', 'layer-pointers');
      layer.append('g').attr('class', 'layer-arrows');
      layer.append('g').attr('class', 'layer-flow');
      layer.append('g').attr('class', 'layer-variables');
      layer.append('g').attr('class', 'layer-guidance');
      layer.append('g').attr('class', 'layer-teaching');

      svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 3])
        .on('zoom', (event) => layer.attr('transform', event.transform.toString())));
      svg.on('dblclick.zoom', null);
    }

    const root = svg.select<SVGGElement>('.zoom-layer');
    const arraysLayer = root.select<SVGGElement>('.layer-arrays');
    const width = dimensions.width;
    const height = dimensions.height;
    const duration = REDUCED_MOTION ? 0 : MOTION_MS;
    const hasExtraArray = Boolean(step?.extraArray && solutionId === 'extra-array');
    const arrays = step ? [
      { id: 'nums', values: step.arrayState as (number | null)[], row: 0, label: 'nums', extra: false },
      ...(hasExtraArray ? [{ id: 'newArr', values: step.extraArray as (number | null)[], row: 1, label: 'newArr', extra: true }] : []),
    ] : [];

    const extraArrow = hasExtraArray ? step?.arrows?.[0] : undefined;
    const sourceIndices = new Set(extraArrow ? [extraArrow.from] : []);
    const targetIndices = new Set(extraArrow ? [extraArrow.to] : []);
    const cycleArrow = solutionId === 'cycle-replace' ? step?.arrows?.[0] : undefined;
    const readFromIndices = new Set(cycleArrow && step?.operation === 'read' ? [cycleArrow.from] : []);
    const writeToIndices = new Set(cycleArrow && step?.operation === 'move' ? [cycleArrow.to] : []);
    const arrayGroups = arraysLayer.selectAll<SVGGElement, typeof arrays[number]>('.array-group')
      .data(arrays, (d) => d.id)
      .join(
        (enter) => enter.append('g').attr('class', 'array-group'),
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );

    const tracks = root.select<SVGGElement>('.layer-tracks')
      .selectAll<SVGGElement, typeof arrays[number]>('.array-track')
      .data(arrays, (array) => array.id)
      .join(
        (enter) => {
          const track = enter.append('g').attr('class', 'array-track');
          track.append('rect').attr('class', 'track-line');
          track.append('text').attr('class', 'track-title');
          return track;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    tracks.each(function (array) {
      const layout = getArrayLayout(width, height, array.values.length, array.row, arrays.length);
      const groupWidth = array.values.length * layout.pitch - layout.gap;
      const labelX = array.values.length > 14 ? groupWidth / 2 : -58;
      const track = d3.select(this).attr('transform', `translate(${layout.startX}, ${layout.y})`);
      track.select('rect').attr('x', -8).attr('y', -8)
        .attr('width', groupWidth + 16).attr('height', layout.boxSize + 16).attr('rx', 12);
      track.select('text').attr('x', labelX).attr('y', -18)
        .attr('text-anchor', array.values.length > 14 ? 'middle' : 'start').text(array.label);
    });

    arrayGroups.each(function (array) {
      const group = d3.select(this);
      const layout = getArrayLayout(width, height, array.values.length, array.row, arrays.length);
      const { boxSize, startX, y } = layout;
      group.attr('transform', `translate(${startX}, ${y})`);

      const nodes = group.selectAll<SVGGElement, number | null>('.array-node')
        .data(array.values, (_, index) => `${array.id}-${index}`)
        .join(
          (enter) => {
            const node = enter.append('g').attr('class', 'array-node').attr('opacity', 0);
            node.append('rect').attr('class', 'node-shadow').attr('rx', 9);
            node.append('rect').attr('class', 'node-body').attr('rx', 8).attr('stroke-width', 1.5);
            node.append('path').attr('class', 'node-sheen');
            node.append('text').attr('class', 'value').attr('text-anchor', 'middle');
            node.append('circle').attr('class', 'status-dot');
            return node;
          },
          (update) => update.interrupt(),
          (exit) => exit.interrupt().remove(),
        );

      nodes.interrupt('move').interrupt('exit');
      const currentValues = new Set(step?.highlightIndices ?? []);
      const comparedValues = new Set(step?.swapIndices ?? []);
      const completedValues = new Set(array.extra ? array.values.flatMap((value, index) => value === null ? [] : [index]) : []);
      nodes.attr('opacity', 1).transition('move').duration(duration).ease(d3.easeCubicOut)
        .attr('transform', (_, index) => `translate(${index * layout.pitch}, 0)`);
      nodes.select<SVGRectElement>('rect.node-shadow').attr('width', boxSize).attr('height', boxSize)
        .attr('fill', 'rgba(0, 0, 0, 0.28)').attr('transform', 'translate(0, 3)');
      const targetIndex = !array.extra && hasExtraArray ? step?.arrows?.[0]?.to : undefined;
      const targetPulse = targetIndex === undefined ? nodes.filter(() => false) : nodes.filter((_, index) => index === targetIndex);
      targetPulse.select<SVGRectElement>('rect.node-body').interrupt('pulse').attr('stroke-width', 2.5)
        .transition('pulse').duration(duration).ease(d3.easeSinInOut).attr('stroke-width', 4)
        .transition().duration(duration).attr('stroke-width', 1.5);
      nodes.select<SVGRectElement>('rect.node-body').interrupt('state').transition('state').duration(duration)
        .attr('width', boxSize).attr('height', boxSize)
        .attr('fill', (_, index) => {
          if (array.extra && array.values[index] === null && !targetIndices.has(index)) return COLORS.empty;
          if (comparedValues.has(index)) return COLORS.compare;
          if (readFromIndices.has(index)) return '#e8b04b';
          if (currentValues.has(index) || sourceIndices.has(index)) return COLORS.current;
          if (writeToIndices.has(index)) return COLORS.done;
          if (targetIndices.has(index)) return array.values[index] === null ? '#475569' : COLORS.done;
          return completedValues.has(index) ? COLORS.done : 'url(#array-node-gradient)';
        })
        .attr('stroke', (_, index) => comparedValues.has(index) ? '#ffd08a' : currentValues.has(index) ? '#ffe0a3' : targetIndices.has(index) ? '#6ee7b7' : 'rgba(255,255,255,.18)')
        .attr('stroke-width', (_, index) => comparedValues.has(index) ? 2.5 : targetIndices.has(index) ? 2.5 : 1.5)
        .attr('filter', (_, index) => currentValues.has(index) || comparedValues.has(index) || sourceIndices.has(index) || readFromIndices.has(index) || writeToIndices.has(index) ? 'url(#array-focus-glow)' : null);
      nodes.select<SVGPathElement>('path.node-sheen').attr('d', `M8,1 H${Math.max(8, boxSize - 8)} Q${boxSize - 1},1 ${boxSize - 1},8 V${Math.min(18, boxSize / 2)} H1 V8 Q1,1 8,1`)
        .attr('fill', 'rgba(255,255,255,.11)').attr('pointer-events', 'none');
      nodes.select<SVGTextElement>('text.value').attr('x', boxSize / 2).attr('y', boxSize / 2 + Math.min(5, boxSize * 0.12))
        .attr('fill', COLORS.text).attr('font-size', Math.max(9, Math.min(14, boxSize * 0.3)))
        .attr('font-weight', 650).attr('pointer-events', 'none')
        .text((d) => d === null ? '∅' : String(d));
      nodes.select<SVGCircleElement>('circle.status-dot').attr('cx', boxSize - 7).attr('cy', 7).attr('r', Math.max(2, boxSize * 0.055))
        .attr('fill', (_, index) => sourceIndices.has(index) || readFromIndices.has(index) ? '#fff3d6' : targetIndices.has(index) || writeToIndices.has(index) ? '#d1fae5' : currentValues.has(index) ? '#fff3d6' : comparedValues.has(index) ? '#fff' : 'rgba(255,255,255,.48)');
    });

    const pointers = step?.pointers ?? [];
    const pointerGroups = root.select<SVGGElement>('.layer-pointers')
      .selectAll<SVGGElement, NonNullable<AlgorithmStep['pointers']>[number]>('.pointer')
      .data(pointers, (d) => d.name)
      .join(
        (enter) => {
          const pointer = enter.append('g').attr('class', 'pointer');
          pointer.append('path').attr('class', 'pointer-stem');
          pointer.append('path').attr('class', 'pointer-head');
          pointer.append('text');
          return pointer;
        },
        (update) => update.interrupt(),
        (exit) => exit.interrupt().remove(),
      );
    pointerGroups.interrupt('pointer-move').attr('data-index', (pointer) => pointer.index)
      .attr('transform', 'translate(0, 0)');
    pointerGroups.each(function (pointer) {
      const layout = getArrayLayout(width, height, step?.arrayState.length ?? 1, 0, hasExtraArray ? 2 : 1);
      const center = nodeCenter(layout, pointer.index);
      const startY = layout.y - layout.boxSize * 0.92;
      const endY = layout.y - 3;
      const group = d3.select(this);
      group.select('path.pointer-stem').attr('d', `M${center.x},${startY + 9} L${center.x},${endY}`)
        .attr('fill', 'none').attr('stroke', pointer.color).attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 3').attr('opacity', 0.8);
      group.select('path.pointer-head').attr('d', `M${center.x - 5},${endY - 7} L${center.x},${endY} L${center.x + 5},${endY - 7}`)
        .attr('fill', 'none').attr('stroke', pointer.color).attr('stroke-width', 2)
        .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      group.select('text').attr('x', center.x).attr('y', startY).attr('text-anchor', 'middle')
        .attr('fill', pointer.color).attr('font-size', 10).attr('font-weight', 700)
        .attr('paint-order', 'stroke').attr('stroke', '#0f172a').attr('stroke-width', 4)
        .text(pointer.name);
    });

    const activeIndices = [...new Set([
      ...(step?.highlightIndices ?? []),
      ...(step?.swapIndices ?? []),
    ])].filter((index) => Number.isInteger(index) && index >= 0 && index < (step?.arrayState.length ?? 0));
    const activeRanges: Array<{ start: number; end: number; label: string; tone: string }> = [];
    const rangeBounds = step?.description.match(/\[(\d+),\s*(\d+)\]/);
    if (solutionId === 'reverse' && rangeBounds && ['init', 'done'].includes(step?.operation ?? '')) {
      const start = Number(rangeBounds[1]);
      const end = Number(rangeBounds[2]);
      if (start <= end && end < (step?.arrayState.length ?? 0)) {
        activeRanges.push({ start, end, label: '本轮翻转区间', tone: 'range' });
      }
    }
    if (solutionId === 'reverse' && step?.operation === 'compare' && activeIndices.length === 2) {
      activeRanges.push({ start: Math.min(...activeIndices), end: Math.max(...activeIndices), label: '交换这对对称元素', tone: 'range' });
    }
    const rangeLayer = root.select<SVGGElement>('.layer-ranges');
    const rangeGroups = rangeLayer.selectAll<SVGGElement, typeof activeRanges[number]>('.active-range')
      .data(activeRanges, (range) => `${range.start}-${range.end}`)
      .join(
        (enter) => {
          const range = enter.append('g').attr('class', 'active-range').attr('opacity', 0);
          range.append('rect').attr('class', 'range-outline').attr('rx', 10);
          range.append('text').attr('class', 'range-label');
          return range;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    rangeGroups.each(function (range) {
      const layout = getArrayLayout(width, height, step?.arrayState.length ?? 1, 0, hasExtraArray ? 2 : 1);
      const left = nodeCenter(layout, range.start).x - layout.boxSize / 2 - 7;
      const right = nodeCenter(layout, range.end).x + layout.boxSize / 2 + 7;
      const group = d3.select(this);
      group.interrupt('enter').interrupt('update')
        .attr('transform', `translate(${left}, ${layout.y - 7})`)
        .attr('opacity', 0.92);
      group.select('rect').attr('width', Math.max(layout.boxSize + 14, right - left))
        .attr('height', layout.boxSize + 14).attr('stroke', '#60a5fa')
        .attr('fill', 'rgba(96, 165, 250, .055)');
      group.select('text').attr('x', 0).attr('y', -8).attr('fill', '#93c5fd')
        .attr('font-size', 10).attr('font-weight', 650).text(`${range.label} [${range.start}, ${range.end}]`);
    });

    const swapBase = step && !hasExtraArray && solutionId === 'reverse' && step.operation === 'compare' && activeIndices.length === 2
      ? { id: `swap-${step.id}`, first: Math.min(...activeIndices), second: Math.max(...activeIndices) }
      : undefined;
    const flowData = swapBase ? [
      { id: `${swapBase.id}-forward`, from: swapBase.first, to: swapBase.second, lane: -1, label: `nums[${swapBase.first}] → nums[${swapBase.second}]` },
      { id: `${swapBase.id}-backward`, from: swapBase.second, to: swapBase.first, lane: 1, label: `nums[${swapBase.second}] → nums[${swapBase.first}]` },
    ] : [];
    const swapCues = root.select<SVGGElement>('.layer-flow')
      .selectAll<SVGGElement, typeof flowData[number]>('.swap-cue')
      .data(flowData, (item) => item.id)
      .join(
        (enter) => {
          const cue = enter.append('g').attr('class', 'swap-cue');
          cue.append('path').attr('class', 'swap-halo');
          cue.append('path').attr('class', 'swap-path');
          cue.append('text').attr('class', 'swap-label');
          return cue;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    swapCues.each(function (cueData) {
      const layout = getArrayLayout(width, height, step?.arrayState.length ?? 1, 0, 1);
      const sourceCenter = nodeCenter(layout, cueData.from);
      const targetCenter = nodeCenter(layout, cueData.to);
      const verticalLane = layout.y - layout.boxSize / 2 - 12;
      const start = nodeEdge(sourceCenter, { x: 0, y: -1 }, layout.boxSize);
      const end = nodeEdge(targetCenter, { x: 0, y: -1 }, layout.boxSize);
      const control = { x: (start.x + end.x) / 2, y: verticalLane + cueData.lane * 14 };
      const d = `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`;
      const cue = d3.select(this).interrupt('draw');
      cue.select('path.swap-halo').attr('d', d).attr('fill', 'none').attr('stroke', '#0f172a')
        .attr('stroke-width', 6).attr('stroke-linecap', 'round');
      cue.select('path.swap-path').attr('d', d).attr('fill', 'none')
        .attr('stroke', cueData.lane < 0 ? '#fb7185' : '#60a5fa').attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '4 3').attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#pointer-arrowhead)');
      cue.select('text.swap-label').attr('x', control.x).attr('y', control.y - 3)
        .attr('text-anchor', 'middle').attr('fill', cueData.lane < 0 ? '#fecdd3' : '#bfdbfe')
        .attr('font-size', 9).attr('font-weight', 600)
        .attr('paint-order', 'stroke').attr('stroke', '#0f172a').attr('stroke-width', 4)
        .text(cueData.label);
    });
    const flowGroups = root.select<SVGGElement>('.layer-flow')
      .selectAll<SVGGElement, typeof flowData[number]>('.flow-cue')
      .data(flowData, (flow) => flow.id)
      .join(
        (enter) => {
          const cue = enter.append('g').attr('class', 'flow-cue').attr('opacity', 0);
          cue.append('path').attr('class', 'flow-halo');
          cue.append('path').attr('class', 'flow-path');
          cue.append('text').attr('class', 'flow-label');
          return cue;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    flowGroups.each(function (flow) {
      const layout = getArrayLayout(width, height, step?.arrayState.length ?? 1, 0, 1);
      const left = nodeCenter(layout, flow.from);
      const right = nodeCenter(layout, flow.to);
      const gap = Math.max(26, Math.min(48, Math.abs(right.x - left.x) * 0.28));
      const midpoint = (left.x + right.x) / 2;
      const arcY = left.y - layout.boxSize - gap;
      const path = `M${left.x},${left.y - layout.boxSize / 2} C${left.x},${arcY} ${midpoint},${arcY} ${midpoint},${arcY} S${right.x},${arcY} ${right.x},${right.y - layout.boxSize / 2}`;
      const labelX = midpoint;
      const labelY = arcY - 3;
      const cue = d3.select(this).interrupt('flow').attr('opacity', 1);
      cue.select('path.flow-halo').attr('d', path).attr('fill', 'none').attr('stroke', '#0f172a')
        .attr('stroke-width', 7).attr('stroke-linecap', 'round');
      cue.select('path.flow-path').attr('d', path).attr('fill', 'none').attr('stroke', '#fca5a5')
        .attr('stroke-width', 2.5).attr('stroke-dasharray', '5 4').attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#flow-arrowhead)');
      cue.select('text.flow-label').attr('x', labelX).attr('y', labelY).attr('text-anchor', 'middle')
        .attr('fill', '#fecaca').attr('font-size', 10).attr('font-weight', 650)
        .attr('paint-order', 'stroke').attr('stroke', '#0f172a').attr('stroke-width', 4)
        .text(`${flow.label} · ${flow.from} ↔ ${flow.to}`);
    });

    const arrows = step?.arrows ?? [];
    const arrowGroups = root.select<SVGGElement>('.layer-arrows')
      .selectAll<SVGGElement, NonNullable<AlgorithmStep['arrows']>[number]>('.arrow')
      .data(arrows, (_, index) => `${step?.id}-${index}`)
      .join(
        (enter) => enter.append('g').attr('class', 'arrow'),
        (update) => update.interrupt(),
        (exit) => exit.interrupt().remove(),
      );
    arrowGroups.interrupt();
    arrowGroups.each(function (arrow) {
      const sourceIsExtra = arrow.fromArray === 'newArr';
      const targetIsExtra = arrow.toArray === 'newArr';
      const sourceLayout = getArrayLayout(width, height, sourceIsExtra ? step?.extraArray?.length ?? 1 : step?.arrayState.length ?? 1, sourceIsExtra ? 1 : 0, hasExtraArray ? 2 : 1);
      const targetLayout = getArrayLayout(width, height, targetIsExtra ? step?.extraArray?.length ?? 1 : step?.arrayState.length ?? 1, targetIsExtra ? 1 : 0, hasExtraArray ? 2 : 1);
      if (arrow.from === arrow.to && sourceIsExtra === targetIsExtra) {
        const center = nodeCenter(sourceLayout, arrow.from);
        const loopRadius = Math.max(16, sourceLayout.boxSize * 0.32);
        const start = { x: center.x + loopRadius * 0.7, y: center.y - loopRadius * 0.7 };
        const end = { x: center.x + loopRadius * 0.7, y: center.y + loopRadius * 0.7 };
        const control1 = { x: center.x + loopRadius * 2.8, y: center.y - loopRadius * 1.8 };
        const control2 = { x: center.x + loopRadius * 2.8, y: center.y + loopRadius * 1.8 };
        const d = `M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`;
        const cue = d3.select(this);
        cue.selectAll('path').data([arrow]).join('path').attr('d', d).attr('fill', 'none')
          .attr('stroke', COLORS.arrow).attr('stroke-width', 2.2).attr('stroke-dasharray', '4 3')
          .attr('marker-end', 'url(#arrowhead)');
        cue.selectAll<SVGTextElement, NonNullable<AlgorithmStep['arrows']>[number]>('text.arrow-label')
          .data([arrow]).join('text').attr('class', 'arrow-label').attr('x', control1.x + 2).attr('y', center.y)
          .attr('text-anchor', 'start').attr('fill', COLORS.arrow).attr('font-size', 10).attr('font-weight', 650)
          .attr('paint-order', 'stroke').attr('stroke', '#0f172a').attr('stroke-width', 4)
          .text((item) => item.label ?? '暂存');
        return;
      }
      const sourceCenter = nodeCenter(sourceLayout, arrow.from);
      const targetCenter = nodeCenter(targetLayout, arrow.to);
      const from = nodeEdge(sourceCenter, targetCenter, sourceLayout.boxSize);
      const to = nodeEdge(targetCenter, sourceCenter, targetLayout.boxSize);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normal = { x: -dy / distance, y: dx / distance };
      const laneSide = hasExtraArray ? (arrow.to >= arrow.from ? 1 : -1) : -1;
      const bend = Math.min(52, Math.max(24, distance * 0.18));
      const control = { x: (from.x + to.x) / 2 + normal.x * bend * laneSide, y: (from.y + to.y) / 2 + normal.y * bend * laneSide };
      const labelPoint = {
        x: 0.25 * from.x + 0.5 * control.x + 0.25 * to.x + normal.x * laneSide * 14,
        y: 0.25 * from.y + 0.5 * control.y + 0.25 * to.y + normal.y * laneSide * 14,
      };
      const group = d3.select(this);
      const path = `M${from.x},${from.y} Q${control.x},${control.y} ${to.x},${to.y}`;
      const halo = group.selectAll<SVGPathElement, NonNullable<AlgorithmStep['arrows']>[number]>('path.arrow-halo')
        .data([arrow]).join('path').attr('class', 'arrow-halo');
      halo.interrupt('route').attr('d', path).attr('fill', 'none').attr('stroke', '#0f172a')
        .attr('stroke-width', 7).attr('stroke-linecap', 'round');
      const arrowLine = group.selectAll<SVGPathElement, NonNullable<AlgorithmStep['arrows']>[number]>('path.arrow-line')
        .data([arrow]).join('path').attr('class', 'arrow-line');
      const isNewArrow = arrowLine.attr('data-ready') !== 'true';
      arrowLine.interrupt('draw').interrupt('route');
      halo.interrupt('route').transition('route').duration(duration).attr('d', path);
      arrowLine
        .attr('d', path).attr('fill', 'none').attr('stroke', COLORS.arrow).attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round').attr('marker-end', 'url(#arrowhead)')
        .attr('pathLength', 1).attr('stroke-dasharray', isNewArrow ? '1 1' : null)
        .attr('stroke-dashoffset', isNewArrow && !REDUCED_MOTION ? 1 : 0)
        .transition(isNewArrow ? 'draw' : 'route').duration(isNewArrow && !REDUCED_MOTION ? 320 : duration)
        .ease(d3.easeCubicOut).attr('stroke-dasharray', 'none').attr('stroke-dashoffset', 0).attr('d', path)
        .on('end', () => arrowLine.attr('data-ready', 'true'));
      group.selectAll<SVGTextElement, NonNullable<AlgorithmStep['arrows']>[number]>('text.arrow-label')
        .data([arrow]).join('text').attr('class', 'arrow-label').attr('x', labelPoint.x).attr('y', labelPoint.y)
        .attr('text-anchor', 'middle').attr('fill', COLORS.arrow).attr('font-size', 11).attr('font-weight', 650)
        .attr('paint-order', 'stroke').attr('stroke', '#0f172a').attr('stroke-width', 4).attr('stroke-linejoin', 'round')
        .text((d) => d.label?.replace(/^→ newArr\[(\d+)\]$/, '写入 newArr[$1]') ?? '移动元素');
    });

    const variables = step?.variables ?? [];
    const variableLayer = root.select<SVGGElement>('.layer-variables');
    const variablePanel = variableLayer.selectAll<SVGGElement, typeof variables>('.variable-panel')
      .data(variables.length ? [variables] : [])
      .join(
        (enter) => enter.append('g').attr('class', 'variable-panel'),
        (update) => update,
        (exit) => exit.interrupt().remove(),
      )
      .attr('transform', `translate(${width - 150}, 12)`);
    variablePanel.selectAll('rect').data([variables]).join('rect').attr('width', 138)
      .attr('height', variables.length * 22 + 12).attr('rx', 6).attr('fill', 'rgba(30, 41, 59, 0.9)')
      .attr('stroke', COLORS.secondary);
    variablePanel.selectAll<SVGTextElement, typeof variables[number]>('text')
      .data(variables).join('text').attr('x', 8).attr('y', (_, index) => 22 + index * 22)
      .attr('fill', COLORS.text).attr('font-size', 11)
      .text((variable) => `${friendlyVariableName(variable.name)}：${variable.value}`);
    variablePanel.select<SVGRectElement>('rect').attr('height', variables.length * 22 + 12);

    const carriedValue = solutionId === 'cycle-replace' && step?.variables
      ? step.operation === 'read'
        ? step.variables.find((variable) => variable.name === '刚拿出的数' || variable.name === 'temp')?.value
        : step.anchorIds?.includes('write-next')
          ? step.variables.find((variable) => variable.name === '刚拿出的数' || variable.name === 'temp')?.value
          : step.anchorIds?.includes('advance-cycle')
            ? step.variables.find((variable) => variable.name === '已保存的值' || variable.name === 'prev')?.value
            : undefined
      : undefined;
    const carryCard = root.select<SVGGElement>('.layer-guidance').selectAll<SVGGElement, string>('.carry-card')
      .data(carriedValue === undefined ? [] : [String(carriedValue)])
      .join(
        (enter) => {
          const card = enter.append('g').attr('class', 'carry-card');
          card.append('rect').attr('rx', 12);
          card.append('path').attr('class', 'carry-icon');
          card.append('text').attr('class', 'carry-title');
          card.append('text').attr('class', 'carry-value');
          return card;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    if (carriedValue !== undefined) {
      const carryX = 16;
      const carryY = 78;
      carryCard.attr('transform', `translate(${carryX}, ${carryY})`).attr('opacity', 1);
      carryCard.select('rect').attr('width', 132).attr('height', 54)
        .attr('fill', 'rgba(245, 158, 11, .09)').attr('stroke', 'rgba(245, 158, 11, .48)');
      carryCard.select('path.carry-icon').attr('d', 'M10,17 C10,9 25,9 25,17 M10,17 L10,29 C10,35 25,35 25,29 L25,17')
        .attr('fill', 'none').attr('stroke', COLORS.current).attr('stroke-width', 1.6);
      carryCard.select('text.carry-title').attr('x', 33).attr('y', 20).attr('fill', '#fcd38d')
        .attr('font-size', 10).attr('font-weight', 600).text('手里暂存');
      carryCard.select('text.carry-value').attr('x', 33).attr('y', 41).attr('fill', '#fff7ed')
        .attr('font-size', 15).attr('font-weight', 750).text(String(carriedValue));
    }

    const cycleGuide = solutionId === 'cycle-replace' && step?.arrows?.[0] && step.operation === 'read'
      ? { title: '先拿出，再放入', message: `箭头指向要腾出的位置。原来的数 ${step.variables?.find((variable) => variable.name === '刚拿出的数')?.value ?? ''} 先拿在手里，避免被覆盖。` }
      : solutionId === 'cycle-replace' && step?.arrows?.[0] && step.operation === 'move'
        ? { title: '继续沿路线搬', message: `${step.arrows[0].label}。每次只搬一个数；回到起点时，这一圈就完成了。` }
        : undefined;
    const mappingGuide = hasExtraArray && step?.operation === 'move' && step.arrows?.[0]
      ? { title: '沿箭头搬一个数', message: `橙色是取出的数；绿色是它要搬到的格子。搬完后，下一个数也照这个规则找位置。` }
      : undefined;
    const guidanceContent = step?.guide ?? cycleGuide ?? mappingGuide;
    const guidance = root.select<SVGGElement>('.layer-guidance');
    const guideContent = guidanceContent;
    const guideCard = guidance.selectAll<SVGGElement, NonNullable<AlgorithmStep['guide']>>('.guide-card')
      .data(guideContent ? [guideContent] : [])
      .join(
        (enter) => {
          const card = enter.append('g').attr('class', 'guide-card');
          card.append('rect').attr('rx', 9);
          card.append('circle').attr('r', 3);
          card.append('text').attr('class', 'guide-title');
          card.append('text').attr('class', 'guide-message');
          return card;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    if (guideContent) {
      const guideWidth = Math.min(width * 0.46, 286);
      const guideX = 12;
      const guideMaxChars = Math.max(24, Math.floor((guideWidth - 30) / 10));
      const guideLines = wrapText(guideContent.message, guideMaxChars, 4);
      const guideHeight = 46 + Math.max(0, guideLines.length - 1) * 13;
      guideCard.attr('transform', `translate(${guideX}, 44)`);
      guideCard.select('rect').attr('width', guideWidth).attr('height', guideHeight)
        .attr('fill', 'rgba(14, 35, 54, .97)').attr('stroke', 'rgba(96, 165, 250, .42)');
      guideCard.select('circle').attr('cx', 15).attr('cy', 17).attr('fill', '#60a5fa');
      guideCard.select('text.guide-title').attr('x', 27).attr('y', 20)
        .attr('fill', '#bfdbfe').attr('font-size', 11).attr('font-weight', 700)
        .text(guideContent.title);
      guideCard.select('text.guide-message').attr('fill', '#e2e8f0').attr('font-size', 10)
        .selectAll<SVGTSpanElement, string>('tspan').data(guideLines).join('tspan')
        .attr('x', 14).attr('y', (_, index) => 40 + index * 13)
        .text((line) => line);
      guideCard.select('rect').attr('height', guideHeight);
    }

    const teaching = root.select<SVGGElement>('.layer-teaching');
    const badge = teaching.selectAll<SVGGElement, string>('.operation-badge')
      .data(step ? [step.operation ?? 'step'] : [])
      .join(
        (enter) => {
          const group = enter.append('g').attr('class', 'operation-badge');
          group.append('rect').attr('rx', 9);
          group.append('circle').attr('r', 3);
          group.append('text');
          return group;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    const operationText = (operation: string) => OPERATION_LABELS[operation] ?? operation;
    badge.attr('transform', 'translate(12, 12)').attr('opacity', 1);
    badge.select('rect').attr('x', 0).attr('y', 0).attr('height', 22)
      .attr('width', (operation) => Math.max(74, operationText(operation).length * 13 + 34))
      .attr('fill', 'rgba(245, 158, 11, .12)').attr('stroke', 'rgba(245, 158, 11, .38)');
    badge.select('circle').attr('cx', 11).attr('cy', 11).attr('fill', COLORS.current);
    badge.select('text').attr('x', 21).attr('y', 15).attr('fill', '#fcd38d')
      .attr('font-size', 11).attr('font-weight', 700).text(operationText);
    const narration = step?.narration ?? step?.description ?? '';
    const captionWidth = Math.min(width * 0.86, Math.max(280, Math.min(narration.length, 56) * 8 + 46));
    const captionMaxChars = Math.max(24, Math.floor((captionWidth - 48) / 11));
    const narrationLines = wrapText(narration, captionMaxChars);
    const captionHeight = narrationLines.length > 1 ? 42 : 28;
    const captionY = height - Math.max(66, captionHeight + 22);
    const caption = teaching.selectAll<SVGGElement, string>('.narration-card').data(step ? [narration] : [])
      .join(
        (enter) => {
          const group = enter.append('g').attr('class', 'narration-card');
          group.append('rect').attr('rx', 9);
          group.append('circle').attr('r', 2.5);
          group.append('text');
          return group;
        },
        (update) => update,
        (exit) => exit.interrupt().remove(),
      );
    caption.attr('transform', `translate(${(width - captionWidth) / 2}, ${captionY})`).attr('opacity', 1);
    caption.select('rect').attr('width', captionWidth).attr('height', captionHeight)
      .attr('fill', 'rgba(30, 41, 59, .96)').attr('stroke', 'rgba(148, 163, 184, .28)');
    caption.select('circle').attr('cx', 14).attr('cy', 14).attr('fill', COLORS.current);
    caption.select('text').attr('fill', COLORS.text).attr('font-size', 11)
      .selectAll<SVGTSpanElement, string>('tspan').data(narrationLines).join('tspan')
      .attr('x', 26).attr('y', (_, index) => 17 + index * 15)
      .text((line) => line);
    const legendItems = [
      { label: '当前焦点', color: COLORS.current, key: 'current' },
      { label: '比较对象', color: COLORS.compare, key: 'compare' },
      { label: '已写入', color: COLORS.done, key: 'done' },
    ];
    const legend = teaching.selectAll<SVGGElement, typeof legendItems[number]>('.legend-item')
      .data(legendItems, (item) => item.key)
      .join((enter) => {
        const item = enter.append('g').attr('class', 'legend-item');
        item.append('circle').attr('r', 3);
        item.append('text');
        return item;
      })
      .attr('transform', (_, index) => `translate(${12 + index * 104}, ${height - 12})`);
    legend.select('circle').attr('fill', (item) => item.color);
    legend.select('text').attr('x', 8).attr('y', 3).attr('fill', COLORS.secondary)
      .attr('font-size', 9).text((item) => item.label);
    const metricItems = step ? [
      { key: 'elements', label: '元素', value: String(step.arrayState.length) },
      { key: 'focus', label: '焦点', value: String(step.highlightIndices.length) },
      { key: 'step', label: '步骤', value: String(step.id + 1) },
    ] : [];
    const metrics = teaching.selectAll<SVGGElement, typeof metricItems[number]>('.metric-item')
      .data(metricItems, (metric) => metric.key)
      .join((enter) => {
        const item = enter.append('g').attr('class', 'metric-item');
        item.append('text').attr('class', 'metric-label');
        item.append('text').attr('class', 'metric-value');
        return item;
      })
      .attr('transform', (_, index) => `translate(${width - 224 + index * 72}, ${height - 12})`);
    metrics.select('text.metric-label').attr('fill', COLORS.secondary).attr('font-size', 9)
      .attr('y', 3).text((metric) => metric.label);
    metrics.select('text.metric-value').attr('fill', COLORS.text).attr('font-size', 10).attr('font-weight', 650)
      .attr('x', 28).attr('y', 3).text((metric) => metric.value);
  }, [step, dimensions, solutionId]);

  const svgWidth = Math.max(dimensions.width, 1);
  const svgHeight = Math.max(dimensions.height, 1);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.svg} />
      <div className={styles.hint}>拖动平移 · 滚轮缩放</div>
    </div>
  );
};
