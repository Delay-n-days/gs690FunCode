import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class', // 通过 class 切换暗色主题
  theme: {
    extend: {
      colors: {
        // 自定义终端颜色体系 —— 直接映射原始 CSS 变量
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
        card: 'var(--bg-card)',
        'row-alt': 'var(--bg-row-alt)',
        'row-hover': 'var(--bg-row-hover)',
        selected: 'var(--bg-selected)',
        border: 'var(--border)',
        'border-bright': 'var(--border-bright)',
        amber: { DEFAULT: 'var(--amber)', dim: 'var(--amber-dim)', glow: 'var(--amber-glow)' },
        green: { DEFAULT: 'var(--green)', dim: 'var(--green-dim)' },
        red: { DEFAULT: 'var(--red)', dim: 'var(--red-dim)' },
        cyan: { DEFAULT: 'var(--cyan)', dim: 'var(--cyan-dim)' },
        'text-pri': 'var(--text-pri)',
        'text-sec': 'var(--text-sec)',
        'text-dim': 'var(--text-dim)',
      },
      fontFamily: {
        mono: ['var(--mono)', 'monospace'],
        sans: ['var(--sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
