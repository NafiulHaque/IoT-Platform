import { useRef, useEffect } from 'react'
import { useThemeClasses } from '../../context/ThemeContext'
import { pfStatus } from '../../utils/energy'

export default function PFGauge({ value }) {
  const tc        = useThemeClasses()
  const canvasRef = useRef(null)
  const pf        = value ?? 0
  const status    = pfStatus(pf)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const w = cv.width, h = cv.height
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2, cy = h - 6, r = 44

    // Track
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI)
    const trackColor = getComputedStyle(document.documentElement)
                         .getPropertyValue('--color-grid').trim()
    ctx.strokeStyle = trackColor; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke()

    // Fill
    const fillColor = getComputedStyle(document.documentElement)
                        .getPropertyValue('--color-pf').trim()
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + pf * Math.PI)
    ctx.strokeStyle = fillColor; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke()

    // Tick marks
    ;[0, 0.5, 1.0].forEach(m => {
      const a = Math.PI + m * Math.PI
      const tickColor = getComputedStyle(document.documentElement)
                          .getPropertyValue('--color-tick').trim()
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * (r - 13), cy + Math.sin(a) * (r - 13))
      ctx.lineTo(cx + Math.cos(a) * (r - 5),  cy + Math.sin(a) * (r - 5))
      ctx.strokeStyle = tickColor; ctx.lineWidth = 1; ctx.stroke()
    })

    // Labels
    const tickColor = getComputedStyle(document.documentElement)
                        .getPropertyValue('--color-tick').trim()
    ctx.font = '9px system-ui,sans-serif'
    ctx.fillStyle = tickColor; ctx.textAlign = 'center'
    ;[{v:0,t:'0'},{v:.5,t:'.5'},{v:1,t:'1.0'}].forEach(l => {
      const a = Math.PI + l.v * Math.PI
      ctx.fillText(l.t, cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22) + 3)
    })
  }, [value])

  return (
    <div className={`col-span-2 ${tc.card} ${tc.cardHover} p-2 md:p-4 h-30`}>
     <div className="flex items-center justify-between">
       <p className={tc.label}>PF</p>
       <p className="text-xs mt-0.5" style={{ color: status.cssVar }}>
          {status.label}
        </p>
      </div>
      <div className="flex flex-col items-center mt-1">
        <canvas ref={canvasRef} width={110} height={55} />
        <p className="text-xl font-medium -mt-1" style={{ color: status.cssVar }}>
          {pf.toFixed(2)}
        </p>
       
      </div>
    </div>
  )
}