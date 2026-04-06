import { useState, useEffect, useRef } from 'preact/hooks';
import Portfolio from './Portfolio';
import Terminal from './Terminal';

export default function PortfolioApp() {
  const [showTerminal, setShowTerminal] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape key closes the overlay
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showTerminal) setShowTerminal(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTerminal]);

  // Prevent body scroll when terminal is open; focus overlay to capture keys
  useEffect(() => {
    document.body.style.overflow = showTerminal ? 'hidden' : '';
    if (showTerminal) overlayRef.current?.focus();
    return () => { document.body.style.overflow = ''; };
  }, [showTerminal]);

  return (
    <>
      <Portfolio onOpenTerminal={() => setShowTerminal(true)} />

      {/* Terminal overlay — always mounted to preserve session state */}
      <div
        ref={overlayRef}
        class={`terminal-overlay${showTerminal ? ' is-open' : ''}`}
        aria-hidden={!showTerminal}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setShowTerminal(false)}
          class="absolute top-4 right-4 z-10 text-terminal-dim hover:text-terminal-amber transition-colors font-mono text-sm cursor-pointer"
          aria-label="Close terminal"
        >
          [×] close
        </button>
        <Terminal />
      </div>
    </>
  );
}
