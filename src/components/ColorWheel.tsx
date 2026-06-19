import { useEffect, useRef } from 'react';

const SWATCH_SIZE = 32;

const AMBIENT_COLORS = [
  { hex: '#000000', label: 'Preto' },
  { hex: '#FFF5E1', label: 'Branco quente' },
  { hex: '#FFFFFF', label: 'Branco' },
  { hex: '#FFDAB9', label: 'Pêssego' },
  { hex: '#FF8C42', label: 'Laranja' },
  { hex: '#E63946', label: 'Vermelho' },
  { hex: '#FF6B9D', label: 'Rosa' },
  { hex: '#FFB6C1', label: 'Rosa claro' },
  { hex: '#C3A6FF', label: 'Lavanda' },
  { hex: '#7B2FBE', label: 'Roxo' },
  { hex: '#87CEEB', label: 'Azul claro' },
  { hex: '#1E90FF', label: 'Azul' },
  { hex: '#98FFD1', label: 'Menta' },
  { hex: '#FFD700', label: 'Dourado' },
];

interface ColorWheelProps {
  selectedColor: string;
  onSelect: (hex: string) => void;
}

export { AMBIENT_COLORS };

export const ColorWheel: React.FC<ColorWheelProps> = ({ selectedColor, onSelect }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Center the saved color on mount without blocking scroll to the edges
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const selected = scroller.querySelector<HTMLElement>('[data-selected="true"]');
    selected?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar flex gap-3 overflow-x-auto py-3"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        paddingLeft: `calc(50% - ${SWATCH_SIZE / 2}px)`,
        paddingRight: `calc(50% - ${SWATCH_SIZE / 2}px)`,
      }}
    >
      {AMBIENT_COLORS.map(({ hex, label }) => {
        const isSelected = selectedColor === hex;
        const isBlack = hex === '#000000';

        return (
          <button
            key={hex}
            aria-label={label}
            aria-selected={isSelected}
            data-selected={isSelected ? 'true' : undefined}
            onClick={() => onSelect(hex)}
            className="flex-shrink-0"
            style={{
              scrollSnapAlign: 'center',
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              borderRadius: '50%',
              backgroundColor: hex,
              border: isBlack ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
              boxShadow: isSelected ? '0 0 0 2.5px white' : 'none',
              transition: 'box-shadow 0.2s ease',
              cursor: 'pointer',
            }}
          />
        );
      })}
    </div>
  );
};
