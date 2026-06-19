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
  return (
    <div
      className="no-scrollbar flex justify-center gap-3 overflow-x-auto px-8 py-3"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {AMBIENT_COLORS.map(({ hex, label }) => {
        const isSelected = selectedColor === hex;
        const isBlack = hex === '#000000';

        return (
          <button
            key={hex}
            aria-label={label}
            onClick={() => onSelect(hex)}
            className="flex-shrink-0"
            style={{
              scrollSnapAlign: 'center',
              width: 32,
              height: 32,
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
