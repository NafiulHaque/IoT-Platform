import { useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { Line, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    PointElement, LineElement, BarElement,
    Filler, Tooltip, Legend
} from 'chart.js'
import { useAuth } from '../context/AuthContext'
import { THEMES, useTheme, useThemeClasses } from '../context/ThemeContext'
import { formatTime, timeAgo } from '../utils/time'
import {
    getHistory, getHeatmap,
    getDaily, getUptime, getSummary
} from '../api/energy'
import {
    fmtPower, fmtEnergy, fmtVoltage, fmtCurrent,
    fmtPF, fmtFreq, pfLabel, voltageStatus, heatColor
} from '../utils/energy'

ChartJS.register(
    CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, Filler, Tooltip, Legend
)

const DEVICE_ID = 'EMDev_01'   // replace with your device selector

let socket



export default function EnergyDashboard() {
    const tc = useThemeClasses()
    const { token } = useAuth()

    const [latest, setLatest] = useState(null)
    const [history, setHistory] = useState([])
    const [heatmap, setHeatmap] = useState(null)
    const [daily, setDaily] = useState([])
    const [uptime, setUptime] = useState([])
    const [daysRange, setDaysRange] = useState(7)
    const pfCanvasRef = useRef(null)

    // Load all data
    const loadAll = useCallback(async () => {
        const [sum, hist, hm, up] = await Promise.all([
            getSummary(DEVICE_ID),
            getHistory(DEVICE_ID, 30),
            getHeatmap(DEVICE_ID),
            getUptime(DEVICE_ID, 24),
        ])
        setLatest(sum.latest)
        const sorted = hist.sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
        setHistory(sorted)
        setHeatmap(hm)
        setUptime(up)
    }, [])

    const loadDaily = useCallback(async (days) => {
        const d = await getDaily(DEVICE_ID, days)
        setDaily(d)
    }, [])

    useEffect(() => { loadAll(); loadDaily(daysRange) }, [])
    useEffect(() => { loadDaily(daysRange) }, [daysRange])

    // Socket.IO live updates
    useEffect(() => {
        socket = io('http://localhost:5000', { auth: { token } })
        socket.on('sensor_update', ({ device_id, reading }) => {
            if (device_id !== DEVICE_ID) return
            setLatest(reading)
            setHistory(prev => {
                const next = [...prev, reading]
                return next.slice(-30)
            })
        })
        return () => socket.disconnect()
    }, [token])

    // PF gauge canvas
    useEffect(() => {
        if (!pfCanvasRef.current || !latest) return
        drawPFGauge(pfCanvasRef.current, latest.pf)
    }, [latest])

    // Chart colors
    // const isDark = true   // tie this to your theme if needed
    // const gridColor = '#21262d'
    // const tickColor = '#484f58'

      const { theme } = useTheme();

    const colors = {
        [THEMES.dark]: { grid: '#21262d', text: '#8b949e', tick: '#484f58' },
        [THEMES.enterprise]: { grid: '#30363d', text: '#8b949e' , tick: '#484f58'},
        [THEMES.graphite]: { grid: '#e4e4e7', text: '#9ca3af', tick: '#6b7280' },
    }[theme]

   

    const chartLabels = history.map(r => formatTime(r.receivedAt))

    // Dual axis dataset
    const dualData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Voltage (V)', yAxisID: 'yV',
                data: history.map(r => r.voltage),
                borderColor: '#d2a8ff', borderWidth: 1.5,
                pointRadius: 0, tension: 0.3, fill: false,
            },
            {
                label: 'Current (A)', yAxisID: 'yA',
                data: history.map(r => r.current),
                borderColor: '#58a6ff', borderWidth: 1.5,
                pointRadius: 0, tension: 0.3,
                borderDash: [4, 2], fill: false,
            },
        ],
    }

    const dualOptions = {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#21262d', borderColor: '#30363d', borderWidth: 1,
                titleColor: '#8b949e', bodyColor: '#e6edf3', padding: 8
            }
        },
        scales: {
            x: {
                ticks: { color: colors.tick, font: { size: 9 }, maxTicksLimit: 8 },
                grid: { color: colors.grid }
            },
            yV: {
                position: 'left', ticks: { color: '#d2a8ff', font: { size: 9 } },
                grid: { color: colors.grid }
            },
            yA: {
                position: 'right', ticks: { color: '#58a6ff', font: { size: 9 } },
                grid: { drawOnChartArea: false }
            },
        }
    }

    // Uptime chart
    const uptimeData = {
        labels: uptime.map(u => u.hour + ':00'),
        datasets: [
            {
                label: 'Online', data: uptime.map(u => u.online ? 1 : 0),
                backgroundColor: '#3fb950', borderRadius: 2, stack: 's'
            },
            {
                label: 'Offline', data: uptime.map(u => u.online ? 0 : 1),
                backgroundColor: '#f8514940', borderRadius: 2, stack: 's'
            },
        ]
    }

    const uptimeOptions = {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#21262d', borderColor: '#30363d', borderWidth: 1,
                titleColor: '#8b949e', bodyColor: '#e6edf3', padding: 8
            }
        },
        scales: {
            x: {
                stacked: true, ticks: { color: colors.tick, font: { size: 8 }, maxTicksLimit: 12 },
                grid: { color: colors.grid }
            },
            y: {
                stacked: true, max: 1, ticks: {
                    color: colors.tick, font: { size: 9 },
                    callback: v => v * 100 + '%'
                }, grid: { color: colors.grid }
            }
        }
    }

    // Daily consumption chart
    const avgKwh = daily.length
        ? +(daily.reduce((s, d) => s + d.totalKwh, 0) / daily.length).toFixed(2)
        : 0

    const consData = {
        labels: daily.map(d => d._id),
        datasets: [
            {
                label: 'kWh', data: daily.map(d => +d.totalKwh.toFixed(3)),
                backgroundColor: daily.map(d => d.totalKwh > avgKwh ? '#3fb950' : '#238636'),
                borderRadius: 3, borderSkipped: false
            },
            {
                label: 'Average', data: daily.map(() => avgKwh),
                type: 'line', borderColor: '#ffa657', borderWidth: 1.5,
                borderDash: [4, 3], pointRadius: 0, fill: false
            }
        ]
    }

    const consOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#21262d', borderColor: '#30363d', borderWidth: 1,
                titleColor: '#8b949e', bodyColor: '#e6edf3', padding: 8
            }
        },
        scales: {
            x: {
                ticks: {
                    color: colors.tick, font: { size: 10 }, autoSkip: false,
                    maxRotation: daysRange > 14 ? 45 : 0
                }, grid: { color: colors.grid }
            },
            y: {
                ticks: {
                    color: colors.tick, font: { size: 9 },
                    callback: v => v + ' kWh'
                }, grid: { color: colors.grid }
            }
        }
    }

    const pf = pfLabel(latest?.pf)
    const vstat = voltageStatus(latest?.voltage)

    return (
        <div className="p-6 ">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${tc.text}`}>
                    Energy Dashboard — {DEVICE_ID}
                </h2>
                <div className="flex items-center gap-4">
                    <span className={`text-sm ${tc.muted}`}>
                        Last update: {latest ? timeAgo(latest.receivedAt) : '—'}
                    </span>
                    <button
                        onClick={loadAll}
                        className={`text-sm px-3 py-1 rounded-lg border ${tc.border} ${tc.muted} hover:opacity-80 transition-opacity`}
                    >
                        Refresh
                    </button>
                </div>
            </div>


            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">

                {/* Primary: Power */}
                <PrimaryCard label="Active power" unit="kW" color="#ffa657"
                    value={latest?.power != null ? (latest.power / 1000).toFixed(2) : '—'}
                    sub={`${fmtPower(latest?.power)}`} sparkData={history.map(r => r.power)} />

                {/* Primary: Energy */}
                <PrimaryCard label="Energy consumed" unit="kWh" color="#3fb950"
                    value={latest?.energy != null ? Number(latest.energy).toFixed(3) : '—'}
                    sub="Today cumulative" sparkData={history.map(r => r.energy)} sparkColor="#3fb950" />

                {/* Primary: Voltage */}
                <PrimaryCard label="Voltage" unit="V" color="#d2a8ff"
                    value={latest?.voltage != null ? Number(latest.voltage).toFixed(1) : '—'}
                    sub={vstat.label} subColor={vstat.color}
                    sparkData={history.map(r => r.voltage)} sparkColor="#d2a8ff" />

                {/* Secondary: Current */}
                <SecondaryCard label="Current" value={fmtCurrent(latest?.current)}
                    gaugeVal={latest?.current} gaugeMax={1} gaugeColor="#58a6ff"
                    gaugeLabel={`${(latest?.current ?? 0).toFixed(2)} / 1A`} />

                {/* Secondary: Power Factor */}
                <div style={{
                    gridColumn: 'span 2', background: '#161b22',
                    border: '1px solid #30363d', borderRadius: 10, padding: 14
                }}>
                    <div style={{
                        fontSize: 10, color: '#8b949e', letterSpacing: '.06em',
                        textTransform: 'uppercase', marginBottom: 6
                    }}>Power factor</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <canvas ref={pfCanvasRef} width={120} height={68} />
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 500 }}>{fmtPF(latest?.pf)}</div>
                            <div style={{ fontSize: 12, color: pf.color, marginTop: 2 }}>{pf.label}</div>
                            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                                Unity = 1.00
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary: Frequency */}
                <SecondaryCard label="Frequency" value={fmtFreq(latest?.frequency)}
                    gaugeVal={(latest?.frequency ?? 45) - 45} gaugeMax={10} gaugeColor="#ffa657"
                    gaugeLabel={`${(latest?.frequency ?? 0).toFixed(2)} Hz`} />

                {/* Ambient */}
                <div style={{
                    gridColumn: 'span 2', background: '#161b22',
                    border: '1px solid #30363d', borderRadius: 10, padding: 14
                }}>
                    <div style={{
                        fontSize: 10, color: '#8b949e', letterSpacing: '.06em',
                        textTransform: 'uppercase', marginBottom: 8
                    }}>Ambient conditions</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <AmbCard label="Temperature" value={`${latest?.temp_c ?? '—'}°C`} color="#ffa657" />
                        <AmbCard label="Humidity" value={`${latest?.humidity ?? '—'}%`} color="#79c0ff" />
                    </div>
                </div>

            </div>

            {/* Dual axis chart + uptime */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <ChartCard label="Voltage & current — dual axis">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11, color: '#8b949e' }}>
                        <LegendItem color="#d2a8ff" label="Voltage (V) · left" />
                        <LegendItem color="#58a6ff" label="Current (A) · right" dash />
                    </div>
                    <div style={{ position: 'relative', height: 160 }}>
                        <Line data={dualData} options={dualOptions}
                            aria-label="Dual axis chart of voltage and current" />
                    </div>
                </ChartCard>

                <ChartCard label="24h device uptime">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11, color: '#8b949e' }}>
                        <LegendItem color="#3fb950" label="Online" />
                        <LegendItem color="#f85149" label="Offline" />
                    </div>
                    <div style={{ position: 'relative', height: 160 }}>
                        <Bar data={uptimeData} options={uptimeOptions}
                            aria-label="24 hour device uptime status chart" />
                    </div>
                </ChartCard>
            </div>

            {/* Heatmap */}
            <ChartCard label="Weekly energy heatmap — kWh per hour" style={{ marginBottom: 10 }}>
                <Heatmap data={heatmap} />
            </ChartCard>

            {/* Daily consumption */}
            <ChartCard label="Unit consumption per day">
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8
                }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8b949e' }}>
                        <LegendItem color="#3fb950" label="kWh consumed" />
                        <LegendItem color="#ffa657" label={`Avg ${avgKwh} kWh`} dash />
                    </div>
                    <select
                        value={daysRange}
                        onChange={e => setDaysRange(Number(e.target.value))}
                        style={{
                            background: '#21262d', border: '1px solid #30363d', color: '#8b949e',
                            fontSize: 11, padding: '2px 6px', borderRadius: 5
                        }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                    </select>
                </div>
                <div style={{ position: 'relative', height: daysRange > 14 ? 220 : 180 }}>
                    <Bar data={consData} options={consOptions}
                        aria-label="Daily energy consumption bar chart" />
                </div>
            </ChartCard>

        </div>
    )
}

// ── Sub-components ──────────────────────────────────────

function PrimaryCard({ label, unit, value, sub, subColor = '#8b949e', sparkData = [], sparkColor = '#ffa657' }) {
    const canvasRef = useRef(null);
   
     const { theme } = useTheme();

    const colors = {
        [THEMES.dark]: { grid: '#1e293b', text: '#fafafa' },
        [THEMES.enterprise]: { grid: '#ebf8ff', text: '#1a365d' },
        [THEMES.graphite]: { grid: '#e4e4e7', text: '#18181b' },
        
    }[theme]
  
    useEffect(() => {
        if (!canvasRef.current || !sparkData.length) return
        const cv = canvasRef.current
        const ctx = cv.getContext('2d')
        cv.width = cv.parentElement?.offsetWidth || 200
        const w = cv.width, h = cv.height
        ctx.clearRect(0, 0, w, h)
        const mn = Math.min(...sparkData), mx = Math.max(...sparkData), range = mx - mn || 1
        const pts = sparkData.map((v, i) => ({
            x: (i / (sparkData.length - 1)) * w,
            y: h - ((v - mn) / range) * h * 0.85
        }))
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
        ctx.strokeStyle = sparkColor; ctx.lineWidth = 1.5; ctx.stroke()
    }, [sparkData])

    return (
        <div style={{
            gridColumn: 'span 2', background: colors.grid, border: '1px solid #30363d',
            borderRadius: 10, padding: 14, position: 'relative', overflow: 'hidden'
        }}>

            <div style={{
                fontSize: 10, color: '#8b949e', letterSpacing: '.06em',
                textTransform: 'uppercase', marginBottom: 6
            }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1 }}>
                {value}<span style={{ fontSize: 13, color: '#8b949e', marginLeft: 3 }}>{unit}</span>
            </div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 5 }}>{sub}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, opacity: .35 }}>
                <canvas ref={canvasRef} height={48} />
            </div>
        </div>

        
    )
}

function SecondaryCard({ label, value, gaugeVal, gaugeMax, gaugeColor, gaugeLabel }) {
    const pct = Math.min(100, ((gaugeVal || 0) / gaugeMax) * 100)
    return (
        <div style={{
            gridColumn: 'span 2', background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: 14
        }}>
            <div style={{
                fontSize: 10, color: '#8b949e', letterSpacing: '.06em',
                textTransform: 'uppercase', marginBottom: 6
            }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{value}</div>
            <div style={{
                height: 5, background: '#21262d', borderRadius: 3,
                margin: '8px 0 4px', overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%', width: pct + '%', background: gaugeColor,
                    borderRadius: 3, transition: 'width .6s'
                }} />
            </div>
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: '#8b949e'
            }}>
                <span>0</span><span>{gaugeLabel}</span>
            </div>
        </div>
    )
}

function AmbCard({ label, value, color }) {
    return (
        <div style={{
            flex: 1, background: '#0d1117', borderRadius: 8, padding: 10,
            border: '1px solid #21262d'
        }}>
            <div style={{ fontSize: 10, color: '#8b949e' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, marginTop: 3, color }}>{value}</div>
        </div>
    )
}

function ChartCard({ label, children, style }) {
    return (
        <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: 14, ...style
        }}>
            <div style={{
                fontSize: 10, color: '#8b949e', letterSpacing: '.05em',
                textTransform: 'uppercase', marginBottom: 8
            }}>{label}</div>
            {children}
        </div>
    )
}

function LegendItem({ color, label, dash }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
                width: dash ? 14 : 8, height: dash ? 2 : 8,
                borderRadius: dash ? 0 : 2, background: color,
                borderTop: dash ? `2px dashed ${color}` : 'none',
                background: dash ? 'none' : color
            }} />
            {label}
        </span>
    )
}

function Heatmap({ data }) {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const HOURS = Array.from({ length: 24 }, (_, i) => i)

    if (!data) {
        return <div style={{ color: '#484f58', fontSize: 12, padding: '20px 0' }}>Loading heatmap...</div>
    }

    const { grid } = data
    const allVals = grid.flat()
    const mn = Math.min(...allVals), mx = Math.max(...allVals) || 1

    return (
        <div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '32px repeat(24,1fr)', gap: 2, marginBottom: 2
            }}>
                <div />
                {HOURS.map(h => (
                    <div key={h} style={{ fontSize: 8, color: '#484f58', textAlign: 'center' }}>
                        {h % 3 === 0 ? h : ''}
                    </div>
                ))}
            </div>
            {DAYS.map((day, di) => (
                <div key={day} style={{
                    display: 'grid',
                    gridTemplateColumns: '32px repeat(24,1fr)', gap: 2, marginBottom: 2
                }}>
                    <div style={{
                        fontSize: 9, color: '#8b949e', display: 'flex',
                        alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4
                    }}>
                        {day}
                    </div>
                    {HOURS.map(h => {
                        const val = grid[di]?.[h] ?? 0
                        const intensity = (val - mn) / (mx - mn)
                        return (
                            <div key={h} title={`${day} ${h}:00 — ${val.toFixed(2)} kWh`}
                                style={{
                                    height: 14, borderRadius: 2,
                                    background: heatColor(intensity)
                                }} />
                        )
                    })}
                </div>
            ))}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: '#8b949e', marginTop: 8
            }}>
                <span>Low</span>
                {['#0d1117', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => (
                    <span key={c} style={{
                        width: 14, height: 10, borderRadius: 2,
                        background: c, display: 'inline-block'
                    }} />
                ))}
                <span>High</span>
            </div>
        </div>
    )
}

// PF gauge canvas draw function (used in useEffect)
function drawPFGauge(canvas, pf) {
    if (!canvas || pf == null) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2, cy = h - 8, r = 50
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI)
    ctx.strokeStyle = '#21262d'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke()
    const endA = Math.PI + pf * Math.PI
    const fc = pf >= 0.95 ? '#3fb950' : pf >= 0.9 ? '#3fb950' : pf >= 0.8 ? '#ffa657' : '#f85149'
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, endA)
    ctx.strokeStyle = fc; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke()
        ;[0, 0.5, 1.0].forEach(m => {
            const a = Math.PI + m * Math.PI
            ctx.beginPath()
            ctx.moveTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14))
            ctx.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6))
            ctx.strokeStyle = '#484f58'; ctx.lineWidth = 1; ctx.stroke()
        })
    ctx.font = '9px sans-serif'; ctx.fillStyle = '#484f58'; ctx.textAlign = 'center'
        ;[{ v: 0, t: '0' }, { v: .5, t: '.5' }, { v: 1, t: '1' }].forEach(l => {
            const a = Math.PI + l.v * Math.PI
            ctx.fillText(l.t, cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22) + 3)
        })
}