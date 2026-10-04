import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export const coloredButtonPresets = [
  "amber",
  "emerald",
  "blue",
  "indigo",
  "purple",
  "rose",
  "orange",
  "cyan",
  "teal",
  "pink",
  "neutral",
  "dark",
] as const

export type ColoredButtonPreset = (typeof coloredButtonPresets)[number]

const coloredButtonVariants = cva(
  "group/colored-button inline-flex shrink-0 items-center justify-center font-medium font-sans whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer focus-visible:outline-solid focus-visible:outline-1 focus-visible:outline-offset-1 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      color: {
        amber:
          "text-amber-950 bg-linear-to-b from-amber-100/90 to-amber-300/90 hover:from-amber-200/70 hover:to-amber-300 shadow-[0_0_0_0.5px_oklch(0.92_0.14_92.28)] focus-visible:outline-amber-300 dark:from-amber-500/20 dark:to-amber-600/35 dark:hover:from-amber-500/30 dark:hover:to-amber-600/50 dark:text-amber-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.18_75),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-amber-300",
        emerald:
          "text-emerald-950 bg-linear-to-b from-emerald-100/90 to-emerald-300/90 hover:from-emerald-200/70 hover:to-emerald-300 shadow-[0_0_0_0.5px_oklch(0.91_0.13_162)] focus-visible:outline-emerald-400 dark:from-emerald-500/20 dark:to-emerald-600/35 dark:hover:from-emerald-500/30 dark:hover:to-emerald-600/50 dark:text-emerald-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.17_162),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-emerald-400",
        blue:
          "text-blue-950 bg-linear-to-b from-blue-100/90 to-blue-300/90 hover:from-blue-200/70 hover:to-blue-300 shadow-[0_0_0_0.5px_oklch(0.90_0.10_245)] focus-visible:outline-blue-400 dark:from-blue-500/20 dark:to-blue-600/35 dark:hover:from-blue-500/30 dark:hover:to-blue-600/50 dark:text-blue-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.18_245),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-blue-400",
        indigo:
          "text-indigo-950 bg-linear-to-b from-indigo-100/90 to-indigo-300/90 hover:from-indigo-200/70 hover:to-indigo-300 shadow-[0_0_0_0.5px_oklch(0.90_0.11_275)] focus-visible:outline-indigo-400 dark:from-indigo-500/20 dark:to-indigo-600/35 dark:hover:from-indigo-500/30 dark:hover:to-indigo-600/50 dark:text-indigo-200 dark:shadow-[0_0_0_0.5px_oklch(0.63_0.18_275),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-indigo-400",
        purple:
          "text-purple-950 bg-linear-to-b from-purple-100/90 to-purple-300/90 hover:from-purple-200/70 hover:to-purple-300 shadow-[0_0_0_0.5px_oklch(0.90_0.12_305)] focus-visible:outline-purple-400 dark:from-purple-500/20 dark:to-purple-600/35 dark:hover:from-purple-500/30 dark:hover:to-purple-600/50 dark:text-purple-200 dark:shadow-[0_0_0_0.5px_oklch(0.64_0.19_305),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-purple-400",
        rose:
          "text-rose-950 bg-linear-to-b from-rose-100/90 to-rose-300/90 hover:from-rose-200/70 hover:to-rose-300 shadow-[0_0_0_0.5px_oklch(0.90_0.13_18)] focus-visible:outline-rose-400 dark:from-rose-500/20 dark:to-rose-600/35 dark:hover:from-rose-500/30 dark:hover:to-rose-600/50 dark:text-rose-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.19_18),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-rose-400",
        orange:
          "text-orange-950 bg-linear-to-b from-orange-100/90 to-orange-300/90 hover:from-orange-200/70 hover:to-orange-300 shadow-[0_0_0_0.5px_oklch(0.91_0.14_55)] focus-visible:outline-orange-400 dark:from-orange-500/20 dark:to-orange-600/35 dark:hover:from-orange-500/30 dark:hover:to-orange-600/50 dark:text-orange-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.19_55),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-orange-400",
        cyan:
          "text-cyan-950 bg-linear-to-b from-cyan-100/90 to-cyan-300/90 hover:from-cyan-200/70 hover:to-cyan-300 shadow-[0_0_0_0.5px_oklch(0.91_0.10_205)] focus-visible:outline-cyan-400 dark:from-cyan-500/20 dark:to-cyan-600/35 dark:hover:from-cyan-500/30 dark:hover:to-cyan-600/50 dark:text-cyan-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.15_205),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-cyan-400",
        teal:
          "text-teal-950 bg-linear-to-b from-teal-100/90 to-teal-300/90 hover:from-teal-200/70 hover:to-teal-300 shadow-[0_0_0_0.5px_oklch(0.91_0.11_175)] focus-visible:outline-teal-400 dark:from-teal-500/20 dark:to-teal-600/35 dark:hover:from-teal-500/30 dark:hover:to-teal-600/50 dark:text-teal-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.16_175),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-teal-400",
        pink:
          "text-pink-950 bg-linear-to-b from-pink-100/90 to-pink-300/90 hover:from-pink-200/70 hover:to-pink-300 shadow-[0_0_0_0.5px_oklch(0.90_0.12_350)] focus-visible:outline-pink-400 dark:from-pink-500/20 dark:to-pink-600/35 dark:hover:from-pink-500/30 dark:hover:to-pink-600/50 dark:text-pink-200 dark:shadow-[0_0_0_0.5px_oklch(0.65_0.18_350),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-pink-400",
        neutral:
          "text-neutral-900 bg-linear-to-b from-neutral-100/90 to-neutral-300/90 hover:from-neutral-200/70 hover:to-neutral-300 shadow-[0_0_0_0.5px_oklch(0.85_0_0)] focus-visible:outline-neutral-400 dark:from-neutral-700/30 dark:to-neutral-800/40 dark:hover:from-neutral-700/40 dark:hover:to-neutral-800/50 dark:text-neutral-200 dark:shadow-[0_0_0_0.5px_oklch(0.45_0_0),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-neutral-400",
        dark:
          "text-neutral-200 bg-linear-to-b from-neutral-500/60 to-neutral-900/80 hover:from-neutral-500/70 hover:to-neutral-900/90 shadow-[0_0_0_0.5px_oklch(0.45_0_0)] focus-visible:outline-neutral-400 dark:from-neutral-700/60 dark:to-neutral-800/80 dark:hover:from-neutral-700/40 dark:hover:to-neutral-800/50 dark:text-neutral-200 dark:shadow-[0_0_0_0.5px_oklch(0.45_0_0),inset_0_0_2px_0_rgba(255,255,255,0.1)] dark:focus-visible:outline-neutral-400"
      },
      size: {
        default:
          "h-8 gap-1.5 pl-2.5 pr-3 py-1.5 text-xs sm:text-sm rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 rounded-lg px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        xl: "h-10 gap-2 rounded-xl px-3.5 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8 p-0 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      color: "amber",
      size: "default",
    },
  }
)

export type ColoredButtonColor = NonNullable<
  VariantProps<typeof coloredButtonVariants>["color"]
>
export type ColoredButtonSize = NonNullable<
  VariantProps<typeof coloredButtonVariants>["size"]
>

export interface ColoredButtonProps
  extends Omit<React.ComponentProps<"button">, "color">,
    Omit<VariantProps<typeof coloredButtonVariants>, "color"> {
  asChild?: boolean
  color?: ColoredButtonColor
  variant?: ColoredButtonColor
}

const ColoredButton = React.forwardRef<HTMLButtonElement, ColoredButtonProps>(
  (
    {
      className,
      color,
      variant,
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const resolvedColor = color ?? variant ?? "amber"
    const Comp = asChild ? Slot.Root : "button"

    return (
      <Comp
        ref={ref}
        data-slot="colored-button"
        data-color={resolvedColor}
        data-size={size}
        className={cn(
          coloredButtonVariants({
            color: resolvedColor,
            size,
            className,
          })
        )}
        {...props}
      />
    )
  }
)

ColoredButton.displayName = "ColoredButton"

export {
  ColoredButton,
  ColoredButton as Button,
  coloredButtonVariants,
  coloredButtonVariants as buttonVariants,
}
export default ColoredButton
