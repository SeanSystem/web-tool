# Dev Tools Web

A modern, responsive web-based developer tools application featuring JSON parsing, Markdown preview, and Timestamp conversion.

## 🚀 Features

### JSON Tool
- **Format/Beautify**: Prettify JSON with proper indentation
- **Minify**: Compress JSON to single line
- **Validate**: Check JSON syntax with error messages
- **Copy/Clear**: Quick actions for output management
- **Auto-save**: Persists last input to localStorage

### Markdown Preview
- **Live Preview**: Real-time rendering using react-markdown
- **GFM Support**: Tables, task lists, strikethrough
- **Syntax Highlighting**: Code blocks with highlight.js
- **File Upload**: Load .md files directly
- **Copy Options**: Copy source or rendered HTML

### Timestamp Converter
- **Bidirectional**: Convert timestamps ↔ dates
- **Auto-Detection**: Recognizes seconds (10 digits) vs milliseconds (13 digits)
- **Multiple Formats**: Local time & UTC display
- **Current Time**: One-click to use current timestamp
- **Copy All Formats**: Quick copy buttons for each format

### General Features
- 🌙 **Dark/Light Theme**: System preference detection + manual toggle
- 📱 **Responsive Design**: Works on desktop and mobile
- 💾 **Persistent State**: All inputs saved to localStorage
- ⌨️ **Keyboard Accessible**: Full tab navigation support
- 🎨 **Modern UI**: Clean, professional design with smooth animations

## 📦 Installation

```bash
# Clone or navigate to the project directory
cd web-tools

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🛠️ Development

```bash
# Run development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Import the project on [Vercel](https://vercel.com)
3. Vercel auto-detects Vite and configures the build
4. Deploy!

### Netlify

1. Push your code to a Git repository
2. Import the project on [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

### GitHub Pages

1. Install gh-pages: `npm install -D gh-pages`
2. Add to `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```
3. Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
4. Run: `npm run deploy`

### Static Hosting (Generic)

```bash
# Build the project
npm run build

# The `dist` folder contains all static files
# Upload contents of `dist` to any static host
```

## 📁 Project Structure

```
src/
├── app/
│   └── App.tsx              # Main application component
├── components/
│   ├── Header.tsx           # Site header with theme toggle
│   ├── Footer.tsx           # Site footer
│   └── TabsNav.tsx          # Tab navigation component
├── features/
│   ├── json/
│   │   ├── JsonTool.tsx     # JSON tool component
│   │   └── jsonUtils.ts     # JSON utility functions
│   ├── markdown/
│   │   ├── MarkdownTool.tsx # Markdown tool component
│   │   └── markdownUtils.ts # Markdown utility functions
│   └── timestamp/
│       ├── TimestampTool.tsx # Timestamp tool component
│       └── timeUtils.ts      # Time utility functions
├── hooks/
│   ├── useLocalStorage.ts   # localStorage persistence hook
│   └── useTheme.ts          # Theme management hook
├── styles/
│   └── index.css            # Global styles & Tailwind
├── main.tsx                 # React entry point
└── vite-env.d.ts            # Vite type declarations
```

## 🔧 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **Notifications**: Sonner
- **Fonts**: Inter (UI) + JetBrains Mono (Code)

## 📄 License

MIT License - feel free to use this project for any purpose.
