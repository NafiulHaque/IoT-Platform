import React from 'react';
import GaugeComponent from 'react-gauge-component';
import { THEMES, useTheme, useThemeClasses } from '../context/ThemeContext';

const CircularGauge = ({ value, label, unit, color = "#00e5ff", max = 100 }) => {
 const {theme}=useTheme();
 const tc=useThemeClasses();

  const colors = {
     [THEMES.dark]:       { temp: '#818cf8', hum: '#34d399', grid: '#334155', text: '#94a3b8', gaugeBorderMin: '#16a34a', gaugeBorderMid: '#eab308', gaugeBorderMax: '#dc2626' },
     [THEMES.enterprise]: { temp: '#3182ce', hum: '#38a169', grid: '#bee3f8', text: '#718096', gaugeBorderMin: '#2c5282', gaugeBorderMid: '#63b3ed', gaugeBorderMax: '#ebf8ff' },
     [THEMES.graphite]:   { temp: '#374151', hum: '#059669', grid: '#e4e4e7', text: '#9ca3af', gaugeBorderMin: '#f2f2f2', gaugeBorderMid: '#9ca3af', gaugeBorderMax: '#4b5563' },
   }[theme]

  return (
    <div className={`flex flex-col items-center p-6 rounded-2xl  shadow-xl w-64 ${tc.card}`}>
      <div className="w-full relative">
        <GaugeComponent
          value={value}
          type="radial"
          maxValue={max}
          arc={{
            width: 0.4,
            padding: 0.005,
            cornerRadius: 10,
            subArcs: [
              {
                limit: value,
                color: colors.temp,
                showTick: false
              },
              {
                color: colors.grid, // Dark background track
                showTick: false
              }
              
            ]
          }}
          pointer={{
            type: "needle",
            color: colors.hum,
            length: 0.8,
            width: 10,
            elastic: true,
          }}
          labels={{
            valueLabel: { hide: true },
            tickLabels: { hideMinMax: true }
          }}
        />
        
        {/* Custom Centered Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold tracking-tighter ${colors.text}`}>{value}</span>
            <span className="text-sm text-gray-500 ml-1 font-medium">{unit}</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.25em]">
          {label}
        </p>
      </div>
    </div>
  );
};

export default CircularGauge;
