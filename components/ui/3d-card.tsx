"use client";

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  MouseEvent,
} from "react";

// ─── Context ─────────────────────────────────────────────────────────────────

type MousePosition = { x: number; y: number };

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => {}]);

// ─── CardContainer ────────────────────────────────────────────────────────────

export function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  function handleMouseEnter() {
    setIsMouseEntered(true);
  }

  function handleMouseLeave() {
    setIsMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      {/* perspective wrapper */}
      <div
        className={containerClassName}
        style={{ perspective: "1200px" }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={className}
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.18s ease-out",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

// ─── CardBody ─────────────────────────────────────────────────────────────────

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── CardItem ─────────────────────────────────────────────────────────────────

type CardItemProps<T extends React.ElementType = "div"> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function CardItem<T extends React.ElementType = "div">({
  as,
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: CardItemProps<T>) {
  const ref = useRef<HTMLElement>(null);
  const [isMouseEntered] = useContext(MouseEnterContext);

  React.useEffect(() => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform =
        "translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ]);

  const Component = (as ?? "div") as React.ElementType;

  return (
    <Component
      ref={ref}
      className={className}
      style={{ transition: "transform 0.22s ease-out" }}
      {...rest}
    >
      {children}
    </Component>
  );
}

// ─── Hook de conveniencia ─────────────────────────────────────────────────────

export function useMouseEnter() {
  return useContext(MouseEnterContext);
}
