import React, { useState, useRef, useLayoutEffect, cloneElement } from "react";

/**
 * An adaptive-width navigation bar with a "limelight" glow that slides to the
 * active item. Rose Derma palette (accent #e8607d). The active item can be
 * controlled by the parent (e.g. scroll position) via `activeIndex`.
 */
export function LimelightNav({
  items = [],
  defaultActiveIndex = 0,
  activeIndex: controlledIndex,
  onTabChange,
  className = "",
  iconContainerClassName = "",
}) {
  const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);
  const activeIndex = controlledIndex ?? internalIndex;
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef([]);
  const limelightRef = useRef(null);

  useLayoutEffect(() => {
    if (items.length === 0) return;

    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[activeIndex];

    if (limelight && activeItem) {
      const newLeft =
        activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) return null;

  const handleItemClick = (index, itemOnClick) => {
    setInternalIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      className={`relative inline-flex items-center h-16 rounded-2xl bg-[#fffdfb] text-[#2e1f24] border border-[#f3dde3] shadow-[0_16px_40px_rgba(150,70,100,0.12)] px-2 ${className}`}
    >
      {items.map(({ id, icon, label, onClick }, index) => (
        <a
          key={id}
          ref={(el) => {
            navItemRefs.current[index] = el;
          }}
          className={`group relative z-20 flex h-full cursor-pointer items-center justify-center ${
            iconContainerClassName || "px-4 sm:px-5"
          }`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
        >
          {cloneElement(icon, {
            className: `w-6 h-6 transition-all duration-200 ease-out group-hover:scale-125 ${
              activeIndex === index ? "opacity-100" : "opacity-60 group-hover:opacity-100"
            } ${icon.props.className || ""}`,
          })}
          {label && (
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3 sm:bottom-auto sm:top-full sm:mt-3 z-30 whitespace-nowrap rounded-lg bg-[#2e1f24] px-2.5 py-1 text-xs font-medium text-[#fffdfb] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg">
              {label}
            </span>
          )}
        </a>
      ))}

      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 w-11 h-[5px] rounded-full bg-[#e8607d] shadow-[0_50px_15px_#e8607d] ${
          isReady ? "transition-[left] duration-400 ease-in-out" : ""
        }`}
        style={{ left: "-999px" }}
      >
        <div className="absolute left-[-30%] top-[5px] w-[160%] h-14 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-[#e8607d]/30 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
}
