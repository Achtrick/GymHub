import { useMemo, useState, type PointerEvent } from "react";
import styles from "./TrendChart.module.scss";

export interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  unit?: string;
}

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 12;

function TrendChart({ points, unit = "kg" }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { coords, min, max } = useMemo(() => {
    if (points.length < 2) {
      return { coords: [] as { x: number; y: number }[], min: 0, max: 0 };
    }
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerWidth = WIDTH - PADDING * 2;
    const innerHeight = HEIGHT - PADDING * 2;
    const stepX = innerWidth / (points.length - 1);
    const coords = points.map((p, i) => ({
      x: PADDING + i * stepX,
      y: PADDING + innerHeight - ((p.value - min) / range) * innerHeight,
    }));
    return { coords, min, max };
  }, [points]);

  if (points.length === 0) {
    return <p className={styles.empty}>No data yet.</p>;
  }

  if (points.length === 1) {
    return (
      <p className={styles.empty}>
        {points[0].value}
        {unit} logged on {points[0].label} — more entries will show a trend.
      </p>
    );
  }

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const latest = points[points.length - 1];

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hoveredCoord = hoverIndex !== null ? coords[hoverIndex] : null;
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className={styles.chart}>
      <div className={styles.plotArea}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className={styles.svg}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <line
            x1={PADDING}
            y1={PADDING}
            x2={WIDTH - PADDING}
            y2={PADDING}
            className={styles.gridline}
          />
          <line
            x1={PADDING}
            y1={HEIGHT - PADDING}
            x2={WIDTH - PADDING}
            y2={HEIGHT - PADDING}
            className={styles.gridline}
          />

          <path d={linePath} className={styles.line} />

          {hoveredCoord && (
            <line
              x1={hoveredCoord.x}
              y1={PADDING}
              x2={hoveredCoord.x}
              y2={HEIGHT - PADDING}
              className={styles.crosshair}
            />
          )}

          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === coords.length - 1 || i === hoverIndex ? 4 : 2.5}
              className={styles.dot}
            />
          ))}
        </svg>

        {hoveredPoint && hoveredCoord && (
          <div
            className={styles.tooltip}
            style={{ left: `${(hoveredCoord.x / WIDTH) * 100}%` }}
          >
            <strong>
              {hoveredPoint.value}
              {unit}
            </strong>
            <span>{hoveredPoint.label}</span>
          </div>
        )}
      </div>

      <div className={styles.axisLabels}>
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>

      <div className={styles.summary}>
        <span>
          Min {min}
          {unit}
        </span>
        <span className={styles.latest}>
          Latest {latest.value}
          {unit}
        </span>
        <span>
          Max {max}
          {unit}
        </span>
      </div>

      <button
        type="button"
        className={styles.tableToggle}
        onClick={() => setShowTable((s) => !s)}
      >
        {showTable ? "Hide data" : "Show data"}
      </button>

      {showTable && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td>{p.label}</td>
                <td>
                  {p.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrendChart;
