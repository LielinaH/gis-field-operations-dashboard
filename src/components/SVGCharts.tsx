'use client';

import React from 'react';

interface FieldAsset {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'repaired' | 'urgent' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  neighborhood: string;
  technician: string;
  lastServiced: string;
  description: string;
  history: Array<{
    date: string;
    action: string;
    technician: string;
  }>;
}

interface ChartsProps {
  assets: FieldAsset[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function SVGCharts({ assets, selectedCategory, onSelectCategory }: ChartsProps) {
  // --- Donut Chart Logic (Status) ---
  const statusCounts = assets.reduce(
    (acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    },
    { active: 0, pending: 0, repaired: 0, urgent: 0, closed: 0 } as Record<string, number>
  );

  const total = assets.length;

  // Colors mapping matching globals.css
  const colors: Record<string, string> = {
    active: '#10b981',   // Emerald
    pending: '#f59e0b',  // Amber
    repaired: '#06b6d4', // Cyan
    urgent: '#ef4444',   // Red
    closed: '#6b7280',   // Gray
  };

  // Calculate SVG Pie/Donut Slices
  let accumulatedPercent = 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91

  const slices = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => {
      const percentage = count / total;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - (accumulatedPercent * circumference);
      accumulatedPercent += percentage;

      return {
        status,
        count,
        percentage,
        strokeLength,
        strokeOffset,
        color: colors[status],
      };
    });

  // --- Bar Chart Logic (Category) ---
  const categoryCounts = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = ['Water', 'Electrical', 'Telecom', 'Gas'];
  const maxCategoryCount = Math.max(...categories.map(cat => categoryCounts[cat] || 0), 1);

  const isSliced = selectedCategory !== 'All';

  return (
    <div className="charts-container">
      {/* Donut Chart */}
      <div className="chart-box">
        <div className="chart-title">Status Breakdown</div>
        
        {total === 0 ? (
          <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No status data available
          </div>
        ) : (
          <>
            <svg className="svg-pie-chart" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="14"
              />
              {slices.map((slice, index) => (
                <circle
                  key={slice.status}
                  className="pie-slice"
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeDasharray={`${slice.strokeLength} ${circumference}`}
                  strokeDashoffset={slice.strokeOffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '50% 50%',
                    transition: 'stroke-width 0.2s ease',
                  }}
                />
              ))}
              {/* Inner label */}
              <g transform="rotate(90 50 50)">
                <text x="50" y="47" textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontWeight="600">TOTAL</text>
                <text x="50" y="60" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">{total}</text>
              </g>
            </svg>

            <div className="chart-legend">
              {Object.entries(statusCounts).map(([status, count]) => {
                if (count === 0) return null;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div className="legend-item" key={status}>
                    <div className="legend-color-label">
                      <span className="legend-dot" style={{ backgroundColor: colors[status] }}></span>
                      <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    </div>
                    <div className="legend-val">
                      {count} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bar Chart */}
      <div className="chart-box">
        <div className="chart-title">Assets By Category</div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="svg-bar-chart">
            {categories.map(cat => {
              const count = categoryCounts[cat] || 0;
              const pctHeight = (count / maxCategoryCount) * 100;
              const isActive = selectedCategory === cat;
              const opacity = isSliced ? (isActive ? 1 : 0.4) : 1;
              const getCatColor = (category: string) => {
                switch (category) {
                  case 'Water': return '#3b82f6';
                  case 'Electrical': return '#f59e0b';
                  case 'Telecom': return '#10b981';
                  case 'Gas': return '#ec4899';
                  default: return 'var(--accent)';
                }
              };
              return (
                <div 
                  className="bar-column" 
                  key={cat} 
                  title={`${cat}: ${count} assets${isActive ? ' (Active Slicer)' : ''}`}
                  onClick={() => onSelectCategory(isActive ? 'All' : cat)}
                  style={{ opacity, transition: 'opacity 0.2s ease' }}
                >
                  <span className="bar-value" style={{ fontWeight: isActive ? '700' : '500' }}>{count}</span>
                  <div 
                    className="bar-fill" 
                    style={{ 
                      height: `${pctHeight * 0.75}%`,
                      backgroundColor: getCatColor(cat),
                      border: isActive ? '1px solid #ffffff' : 'none',
                      boxShadow: isActive ? '0 0 10px rgba(255, 255, 255, 0.4)' : 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="bar-labels-row">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <span 
                  className="bar-label" 
                  key={cat} 
                  onClick={() => onSelectCategory(isActive ? 'All' : cat)}
                  style={{ 
                    cursor: 'pointer',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {cat}
                </span>
              );
            })}
          </div>
        </div>
        <div className="chart-legend" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Sector Distribution</span>
            <span>Count</span>
          </div>
        </div>
      </div>
    </div>
  );
}
