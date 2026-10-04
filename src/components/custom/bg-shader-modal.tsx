"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { useTheme } from "next-themes"

export type CalmColorName =
    | "teal"
    | "rose"
    | "orange"
    | "cyan"
    | "pink"
    | "amber"
    | "purple"
    | "emerald"
    | "violet"
    | "sky"
    | "indigo"

export interface ColorScheme {
    base: [number, number, number]
    secondary: [number, number, number]
    deep: [number, number, number]
}

export interface ColorPalette {
    name: CalmColorName
    label: string
    light: ColorScheme
    dark: ColorScheme
}

/**
 * Curated calm color palettes tailored around Tailwind ~200 shades.
 * Light mode uses soft, serene pastel 200-hues fading into white.
 * Dark mode uses luminous, soothing glows of the same hue fading into dark slate/black.
 */
export const CALM_PALETTES: ColorPalette[] = [
    {
        name: "teal",
        label: "Teal (Tailwind 200)",
        light: {
            base: [153 / 255, 246 / 255, 228 / 255],      // teal-200 #99f6e4
            secondary: [165 / 255, 243 / 255, 252 / 255], // cyan-200 #a5f3fc
            deep: [94 / 255, 234 / 255, 212 / 255],           // teal-300 #5eead4
        },
        dark: {
            base: [0.18, 0.60, 0.55],
            secondary: [0.15, 0.54, 0.64],
            deep: [0.02, 0.16, 0.15],
        },
    },
    {
        name: "rose",
        label: "Rose (Tailwind 200)",
        light: {
            base: [254 / 255, 205 / 255, 211 / 255],      // rose-200 #fecdd3
            secondary: [251 / 255, 207 / 255, 232 / 255], // pink-200 #fbcfe8
            deep: [253 / 255, 164 / 255, 175 / 255],      // rose-300 #fda4af
        },
        dark: {
            base: [0.66, 0.28, 0.36],
            secondary: [0.62, 0.26, 0.48],
            deep: [0.18, 0.03, 0.08],
        },
    },
    {
        name: "orange",
        label: "Orange (Tailwind 200)",
        light: {
            base: [254 / 255, 215 / 255, 170 / 255],      // orange-200 #fed7aa
            secondary: [253 / 255, 230 / 255, 138 / 255], // amber-200 #fde68a
            deep: [253 / 255, 186 / 255, 116 / 255],      // orange-300 #fdba74
        },
        dark: {
            base: [0.66, 0.38, 0.18],
            secondary: [0.65, 0.48, 0.16],
            deep: [0.18, 0.06, 0.02],
        },
    },
    {
        name: "cyan",
        label: "Cyan (Tailwind 200)",
        light: {
            base: [165 / 255, 243 / 255, 252 / 255],      // cyan-200 #a5f3fc
            secondary: [186 / 255, 230 / 255, 253 / 255], // sky-200 #bae6fd
            deep: [103 / 255, 232 / 255, 249 / 255],      // cyan-300 #67e8f9
        },
        dark: {
            base: [0.16, 0.58, 0.70],
            secondary: [0.20, 0.52, 0.74],
            deep: [0.02, 0.14, 0.20],
        },
    },
    {
        name: "pink",
        label: "Pink (Tailwind 200)",
        light: {
            base: [251 / 255, 207 / 255, 232 / 255],      // pink-200 #fbcfe8
            secondary: [233 / 255, 213 / 255, 255 / 255], // purple-200 #e9d5ff
            deep: [244 / 255, 114 / 255, 182 / 255],      // pink-300 #f472b6
        },
        dark: {
            base: [0.64, 0.26, 0.50],
            secondary: [0.50, 0.28, 0.66],
            deep: [0.16, 0.03, 0.11],
        },
    },
    {
        name: "amber",
        label: "Amber (Tailwind 200)",
        light: {
            base: [253 / 255, 230 / 255, 138 / 255],      // amber-200 #fde68a
            secondary: [254 / 255, 215 / 255, 170 / 255], // orange-200 #fed7aa
            deep: [252 / 255, 211 / 255, 77 / 255],       // amber-300 #fcd34d
        },
        dark: {
            base: [0.65, 0.50, 0.16],
            secondary: [0.64, 0.38, 0.18],
            deep: [0.18, 0.08, 0.02],
        },
    },
    {
        name: "purple",
        label: "Purple (Tailwind 200)",
        light: {
            base: [233 / 255, 213 / 255, 255 / 255],      // purple-200 #e9d5ff
            secondary: [221 / 255, 214 / 255, 254 / 255], // violet-200 #ddd6fe
            deep: [216 / 255, 180 / 255, 254 / 255],      // purple-300 #d8b4fe
        },
        dark: {
            base: [0.50, 0.32, 0.70],
            secondary: [0.44, 0.34, 0.72],
            deep: [0.12, 0.03, 0.20],
        },
    },
    {
        name: "emerald",
        label: "Emerald (Tailwind 200)",
        light: {
            base: [167 / 255, 243 / 255, 208 / 255],      // emerald-200 #a7f3d0
            secondary: [153 / 255, 246 / 255, 228 / 255], // teal-200 #99f6e4
            deep: [110 / 255, 231 / 255, 183 / 255],      // emerald-300 #6ee7b7
        },
        dark: {
            base: [0.20, 0.60, 0.42],
            secondary: [0.18, 0.58, 0.54],
            deep: [0.02, 0.15, 0.08],
        },
    },
    {
        name: "violet",
        label: "Violet (Tailwind 200)",
        light: {
            base: [221 / 255, 214 / 255, 254 / 255],      // violet-200 #ddd6fe
            secondary: [199 / 255, 210 / 255, 254 / 255], // indigo-200 #c7d2fe
            deep: [196 / 255, 181 / 255, 253 / 255],      // violet-300 #c4b5fd
        },
        dark: {
            base: [0.45, 0.34, 0.74],
            secondary: [0.36, 0.40, 0.74],
            deep: [0.09, 0.03, 0.19],
        },
    },
    {
        name: "sky",
        label: "Sky (Tailwind 200)",
        light: {
            base: [186 / 255, 230 / 255, 253 / 255],      // sky-200 #bae6fd
            secondary: [165 / 255, 243 / 255, 252 / 255], // cyan-200 #a5f3fc
            deep: [125 / 255, 211 / 255, 252 / 255],      // sky-300 #7dd3fc
        },
        dark: {
            base: [0.22, 0.52, 0.76],
            secondary: [0.16, 0.58, 0.70],
            deep: [0.03, 0.12, 0.22],
        },
    },
    {
        name: "indigo",
        label: "Indigo (Tailwind 200)",
        light: {
            base: [199 / 255, 210 / 255, 254 / 255],      // indigo-200 #c7d2fe
            secondary: [221 / 255, 214 / 255, 254 / 255], // violet-200 #ddd6fe
            deep: [165 / 255, 180 / 255, 252 / 255],      // indigo-300 #a5b4fc
        },
        dark: {
            base: [0.36, 0.40, 0.74],
            secondary: [0.45, 0.34, 0.74],
            deep: [0.06, 0.06, 0.20],
        },
    },
]

let lastRandomIndex = -1

function pickRandomPaletteIndex(): number {
    const len = CALM_PALETTES.length
    if (len <= 1) return 0
    let next = Math.floor(Math.random() * len)
    if (next === lastRandomIndex) {
        next = (next + 1 + Math.floor(Math.random() * (len - 1))) % len
    }
    lastRandomIndex = next
    return next
}

const FRAGMENT_SOURCE = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    
    // Background: pure white/light in light mode, pure black/slate in dark mode
    vec3 bg = mix(vec3(0.99, 0.99, 1.0), vec3(0.08, 0.08, 0.11), uDarkMode);

    // Organic wave layers with soothing frequencies
    float wave1 = sin(uv.x * 2.8 + iTime * 0.45) * 0.055;
    float wave2 = sin(uv.x * 5.8 - iTime * 0.70) * 0.040;
    float wave3 = cos(uv.x * 8.6 + iTime * 0.32) * 0.022;
    float combinedWave = wave1 + wave2 + wave3;

    // Gentle cross-horizontal blend between primary calm color and secondary calm accent
    float crossBlend = smoothstep(0.12, 0.88, uv.x + wave1 * 1.8);
    vec3 midColor = mix(uBaseColor, uSecondaryColor, crossBlend);

    // Bottom-to-mid vertical gradient providing grounding depth
    float bottomFade = smoothstep(-0.25, 0.45, uv.y);
    vec3 waveGradient = mix(uDeepColor, midColor, bottomFade);

    // Wide horizon blur fading smoothly into the background
    float horizonBlur = smoothstep(0.24 + combinedWave, 0.74 + combinedWave, uv.y);
    vec3 finalColor = mix(waveGradient, bg, horizonBlur);

    // Zero-centered dither noise to eliminate banding while keeping colors clean
    float dither = (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;
    finalColor += dither;

    fragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`

const VERTEX_SHADER = `attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }`

function buildFragmentShader(source: string) {
    return `precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform float uDarkMode;
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform vec3 uDeepColor;

${source}

void main() {
  vec4 shaderColor = vec4(0.0);
  mainImage(shaderColor, gl_FragCoord.xy);
  gl_FragColor = vec4(clamp(shaderColor.rgb, 0.0, 1.0), 1.0);
}`
}

export interface WaveBackgroundPreviewProps {
    className?: string
    /** Specific calm color name to display, or "random" to pick randomly on mount */
    color?: CalmColorName | "random"
    /** If true, smoothly drifts between calm colors over time. Defaults to true. */
    cycleColors?: boolean
    /** Milliseconds between color transitions if cycling. Defaults to 12000 (12s). */
    cycleInterval?: number
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function lerpVec3(
    current: [number, number, number],
    target: [number, number, number],
    t: number
): [number, number, number] {
    return [
        lerp(current[0], target[0], t),
        lerp(current[1], target[1], t),
        lerp(current[2], target[2], t),
    ]
}

export function WaveBackgroundPreview({
    className = "",
    color = "random",
    cycleColors = true,
    cycleInterval = 12000,
}: WaveBackgroundPreviewProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const isDarkRef = React.useRef(isDark)

    React.useEffect(() => {
        isDarkRef.current = isDark
    }, [isDark])

    const initialPaletteIndex = React.useMemo(() => {
        if (color !== "random") {
            const idx = CALM_PALETTES.findIndex((p) => p.name === color)
            if (idx !== -1) return idx
        }
        return pickRandomPaletteIndex()
    }, [color])

    const targetPaletteIndexRef = React.useRef(initialPaletteIndex)

    React.useEffect(() => {
        if (color !== "random") {
            const idx = CALM_PALETTES.findIndex((p) => p.name === color)
            if (idx !== -1) {
                targetPaletteIndexRef.current = idx
            }
        }
    }, [color])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", { alpha: false, antialias: true })
        if (!gl) return

        const fragmentShader = buildFragmentShader(FRAGMENT_SOURCE)
        const program = gl.createProgram()
        const vs = gl.createShader(gl.VERTEX_SHADER)
        const fs = gl.createShader(gl.FRAGMENT_SHADER)
        if (!program || !vs || !fs) return

        gl.shaderSource(vs, VERTEX_SHADER)
        gl.compileShader(vs)
        gl.shaderSource(fs, fragmentShader)
        gl.compileShader(fs)
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

        const position = gl.getAttribLocation(program, "position")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

        const iResolution = gl.getUniformLocation(program, "iResolution")
        const iTime = gl.getUniformLocation(program, "iTime")
        const iMouse = gl.getUniformLocation(program, "iMouse")
        const uDarkMode = gl.getUniformLocation(program, "uDarkMode")
        const uBaseColor = gl.getUniformLocation(program, "uBaseColor")
        const uSecondaryColor = gl.getUniformLocation(program, "uSecondaryColor")
        const uDeepColor = gl.getUniformLocation(program, "uDeepColor")

        const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, initialized: false }

        const updateMouse = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const x = (event.clientX - rect.left) * (canvas.width / Math.max(rect.width, 1))
            const y = canvas.height - (event.clientY - rect.top) * (canvas.height / Math.max(rect.height, 1))

            if (!mouse.initialized) {
                mouse.prevX = x
                mouse.prevY = y
                mouse.initialized = true
            }

            mouse.x = x
            mouse.y = y
        }

        const onPointerMove = (event: PointerEvent) => {
            updateMouse(event)
        }

        canvas.addEventListener("pointermove", onPointerMove)

        let frameId = 0
        const start = performance.now()
        let lastTime = start
        let lastCycleTime = start

        const initialScheme = isDarkRef.current
            ? CALM_PALETTES[targetPaletteIndexRef.current].dark
            : CALM_PALETTES[targetPaletteIndexRef.current].light

        let currentBase: [number, number, number] = [...initialScheme.base]
        let currentSecondary: [number, number, number] = [...initialScheme.secondary]
        let currentDeep: [number, number, number] = [...initialScheme.deep]
        let currentDarkMode = isDarkRef.current ? 1.0 : 0.0

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const ratio = window.devicePixelRatio || 1
            const width = Math.max(1, Math.floor(rect.width * ratio))
            const height = Math.max(1, Math.floor(rect.height * ratio))
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                gl.viewport(0, 0, canvas.width, canvas.height)
            }
        }
        resize()
        window.addEventListener("resize", resize)

        const render = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.1)
            lastTime = now

            if (cycleColors && color === "random" && now - lastCycleTime > cycleInterval) {
                lastCycleTime = now
                targetPaletteIndexRef.current = pickRandomPaletteIndex()
            }

            const targetDarkMode = isDarkRef.current ? 1.0 : 0.0
            currentDarkMode += (targetDarkMode - currentDarkMode) * Math.min(1.0, dt * 6.0)

            const activePalette = CALM_PALETTES[targetPaletteIndexRef.current] || CALM_PALETTES[0]
            const targetScheme = isDarkRef.current ? activePalette.dark : activePalette.light

            const colorLerpFactor = Math.min(1.0, dt * 1.5)
            currentBase = lerpVec3(currentBase, targetScheme.base, colorLerpFactor)
            currentSecondary = lerpVec3(currentSecondary, targetScheme.secondary, colorLerpFactor)
            currentDeep = lerpVec3(currentDeep, targetScheme.deep, colorLerpFactor)

            gl.uniform2f(iResolution, canvas.width, canvas.height)
            gl.uniform1f(iTime, (now - start) / 1000)
            gl.uniform1f(uDarkMode, currentDarkMode)

            if (uBaseColor) {
                gl.uniform3f(uBaseColor, currentBase[0], currentBase[1], currentBase[2])
            }
            if (uSecondaryColor) {
                gl.uniform3f(uSecondaryColor, currentSecondary[0], currentSecondary[1], currentSecondary[2])
            }
            if (uDeepColor) {
                gl.uniform3f(uDeepColor, currentDeep[0], currentDeep[1], currentDeep[2])
            }
            if (iMouse) {
                gl.uniform4f(iMouse, mouse.x, mouse.y, mouse.prevX, mouse.prevY)
            }

            mouse.prevX = mouse.x
            mouse.prevY = mouse.y
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            frameId = requestAnimationFrame(render)
        }

        frameId = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("resize", resize)
            canvas.removeEventListener("pointermove", onPointerMove)
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
        }
    }, [color, cycleColors, cycleInterval])

    return <canvas ref={canvasRef} className={cn("h-full w-full", className)} />
}

export default WaveBackgroundPreview
