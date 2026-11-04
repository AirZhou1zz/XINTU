"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticButtonProps = ComponentPropsWithoutRef<"button"> & {
  magnetic?: boolean;
};

export function MagneticButton({
  children,
  className,
  disabled = false,
  magnetic = true,
  type = "button",
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useGSAP((_context, contextSafe) => {
    const element = buttonRef.current;
    if (!element || disabled || !magnetic || !contextSafe) return;

    const safe = contextSafe;

    const media = gsap.matchMedia();
    media.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const moveX = gsap.quickTo(element, "x", { duration: 0.35, ease: "power3.out" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.35, ease: "power3.out" });

      const onPointerMove = safe((event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        moveX((event.clientX - bounds.left - bounds.width / 2) * 0.12);
        moveY((event.clientY - bounds.top - bounds.height / 2) * 0.12);
      });

      const onPointerLeave = safe(() => {
        gsap.to(element, { x: 0, y: 0, duration: 0.45, ease: "power3.out" });
      });

      element.addEventListener("pointermove", onPointerMove);
      element.addEventListener("pointerleave", onPointerLeave);

      return () => {
        element.removeEventListener("pointermove", onPointerMove);
        element.removeEventListener("pointerleave", onPointerLeave);
      };
    });

    return () => media.revert();
  }, { scope: buttonRef, dependencies: [disabled, magnetic] });

  return (
    <button
      ref={buttonRef}
      type={type}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}