import { useThemeClasses } from '../../context/ThemeContext'
import { timeAgo } from '../../utils/time'

export default function DeviceSelector({ devices, selected, onSelect }) {
  const tc = useThemeClasses()

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {devices.map(d => (
        <button
          key={d.device_id}
          onClick={() => onSelect(d.device_id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
                      border transition-all duration-150
            ${selected === d.device_id
              ? `${tc.btn} border-transparent`
              : `${tc.border} ${tc.muted} bg-transparent hover:opacity-80`
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full inline-block
            ${d.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{d.name || d.device_id}</span>
          <span className="opacity-50">{d.location}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs
            ${d.status === 'online' ? tc.badge : tc.badgeOff}`}>
            {d.status === 'online' ? timeAgo(d.lastSeen) : 'offline'}
          </span>
        </button>
      ))}
    </div>
  )
}