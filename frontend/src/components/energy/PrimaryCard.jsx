import { useRef, useEffect } from 'react'
import { useThemeClasses } from '../../context/ThemeContext'

export default function PrimaryCard({ label, value, unit, sub, subStyle, sparkData = [], sparkCssVar }) {
    const tc = useThemeClasses()
    const canvasRef = useRef(null)

    //console.log('Rendering PrimaryCard:', { label, value, unit, sub, sparkData, tc })

    useEffect(() => {
        const cv = canvasRef.current
        if (!cv || sparkData.length < 2) return
        cv.width = cv.parentElement?.offsetWidth || 220
        const ctx = cv.getContext('2d')
        const w = cv.width, h = cv.height
        ctx.clearRect(0, 0, w, h)
        const mn = Math.min(...sparkData), mx = Math.max(...sparkData), range = mx - mn || 1
        const pts = sparkData.map((v, i) => [
            (i / (sparkData.length - 1)) * w,
            h - ((v - mn) / range) * h * 0.8,
        ])

        const color = getComputedStyle(document.documentElement)
            .getPropertyValue(sparkCssVar).trim()
        ctx.beginPath(); ctx.moveTo(...pts[0])
        pts.slice(1).forEach(p => ctx.lineTo(...p))
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
        // console.log( 'Color:', sparkCssVar);
    }, [sparkData, sparkCssVar])

    return (
        <div className={`col-span-2 ${tc.card} ${tc.cardHover} p-4 relative overflow-hidden h-30`}>
            <p className={tc.label}>{label}</p>
            <p className="text-2xl font-medium mt-1"
                style={{ color: `var(${sparkCssVar})` }}>
                {value ?? '—'}
                {unit && (
                    <span className={`text-sm font-normal ml-1 ${tc.muted}`}>
                        {unit}
                    </span>
                )}
            </p>
            <p className={`text-xs mt-1.5 ${tc.muted}`} style={subStyle}>{sub}</p>
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 pointer-events-none">
                <canvas ref={canvasRef} height={40} className="w-full" />
            </div>
        </div>
    )
}