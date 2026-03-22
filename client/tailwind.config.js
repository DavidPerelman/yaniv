export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-in-out',
      },
      colors: {
        // Legacy aliases (used in non-redesigned pages)
        table: '#1a6b35',
        card: '#faf7f0',
        // Design system
        felt: '#1a6b35',
        feltDark: '#0f3d1a',
        feltLight: '#2d8a4e',
        cardBorder: '#d4c5a0',
        redSuit: '#d32f2f',
        blackSuit: '#1a1a2e',
        gold: '#f5c842',
        chipBlue: '#1565c0',
        chipRed: '#c62828',
        chipGreen: '#2e7d32',
      }
    }
  },
  plugins: []
}
