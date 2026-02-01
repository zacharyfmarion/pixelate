import { useState, useId, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  headerRight,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex items-center gap-1 text-sm text-[#e8e4d9] uppercase tracking-wider hover:text-[#a89cc8] transition-colors cursor-pointer"
        >
          <span
            className="inline-block transition-transform duration-150"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            ▸
          </span>
          {title}
        </button>
        {headerRight}
      </div>
      {isOpen && (
        <div id={contentId} role="region" aria-label={title} className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

