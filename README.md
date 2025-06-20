# CarIntel - Nederlandse Voertuig Informatie App

Een moderne, responsive Nederlandse web-app die gebruik maakt van de open data API's van de RDW om voertuiginformatie te tonen en bewerken. Beschikbaar op www.carintel.nl

## 🚀 Features

### Verplichte Functionaliteiten

- **✅ Trekgewicht Check**: Controleer of een voertuig een bepaald aanhangergewicht mag trekken
- **🔍 Kenteken Zoeken**: Zoek voertuigen met wildcards (*) en geavanceerde filters
- **📋 Voertuig Details**: Uitgebreide voertuiginformatie in eigen huisstijl
- **📄 PDF Export**: Download voertuiggegevens als nette PDF

### Extra Tools

- **🌍 Milieuzone Checker**: Controleer of diesel voertuigen milieuzones mogen inrijden
- **💰 BPM/MRB Calculator**: Bereken motorrijtuigenbelasting per provincie
- **⚠️ APK Alert**: Waarschuwingen voor binnenkort verlopende APK
- **📊 CSV Export**: Download zoekresultaten als CSV bestand

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS met dark mode support
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Deployment**: Vercel

## 📱 Mobile-First Design

De app is volledig responsive en geoptimaliseerd voor mobiele apparaten met:
- Touch-vriendelijke interface
- Optimale performance op alle schermformaten
- Progressive Web App features
- Offline caching van zoekresultaten

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm of yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd rdw-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   └── NotificationProvider.tsx
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── TrekgewichtPage.tsx
│   ├── ZoekPage.tsx
│   ├── VoertuigDetailPage.tsx
│   └── ToolsPage.tsx
├── hooks/              # Custom React hooks
│   └── useRdw.ts      # RDW API hooks
├── store/              # Zustand store
│   └── useAppStore.ts
├── types/              # TypeScript type definitions
│   └── rdw.ts
├── utils/              # Utility functions
│   ├── licensePlate.ts # Kenteken validation & formatting
│   └── dataProcessing.ts # Data transformation
└── __tests__/          # Test files
```

## 🔌 API Integration

De app maakt gebruik van de officiële RDW Open Data API's:

- **Voertuigen**: `https://opendata.rdw.nl/resource/m9d7-ebf2.json`
- **Recalls**: `https://opendata.rdw.nl/resource/t3ee-brg3.json`

### Features:
- Automatische retry logic
- Request caching (15 min voor voertuigdata)
- Rate limiting protection
- Error handling met gebruiksvriendelijke meldingen

## 🎨 UI/UX Features

### Design System
- Consistent color palette met primary/success/danger variants
- Custom Tailwind components voor buttons, inputs, cards
- Smooth transitions en hover effects
- Accessible focus states

### Dark Mode
- Systeem-gebaseerde detectie
- Manual toggle in navigation
- Persistent user preference
- Optimized contrast ratios

### Accessibility
- ARIA labels en live regions
- Keyboard navigation support
- Screen reader optimizations
- High contrast mode support

## 🧪 Testing

De app bevat uitgebreide tests voor:

### Unit Tests
- Kenteken validatie en formatting
- Data processing utilities
- Wildcard pattern matching

### Integration Tests
- API data fetching
- Form submissions
- Navigation flows

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test licensePlate.test.ts
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables (if needed)
3. Deploy automatically on push to main

### Manual Build

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

### Environment Variables

```env
# Optional: Analytics tracking
VITE_ANALYTICS_ID=your-analytics-id

# Optional: Error monitoring
VITE_SENTRY_DSN=your-sentry-dsn
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: < 500KB gzipped
- **API Response Time**: < 500ms average
- **First Contentful Paint**: < 1.5s

### Optimizations
- Code splitting per route
- Image optimization
- Service worker caching
- Lazy loading of non-critical components

## 🔒 Security

- Input validation en sanitization
- XSS protection
- CORS handling via proxy
- No sensitive data storage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [RDW Open Data](https://opendata.rdw.nl) voor de officiële voertuigdata
- [Tailwind CSS](https://tailwindcss.com) voor het design system
- [Lucide](https://lucide.dev) voor de iconenset

## 📞 Support

Voor vragen of problemen:
- Open een [GitHub Issue](../../issues)
- Check de [FAQ](docs/FAQ.md)
- Bekijk de [API documentatie](docs/API.md)

---

**Gebouwd met ❤️ voor de Nederlandse automotive community** 