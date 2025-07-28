# Systrix Middleware Dashboard (Next.js)

Modern Next.js dashboard for monitoring and managing HostBill Order Middleware.

## 🚀 Features

- **Real-time monitoring** with auto-refresh every 30 seconds
- **Responsive design** matching Systrix Partners Portal
- **Component-based architecture** with React
- **API testing interface** for middleware endpoints
- **Technical dashboard** with system metrics
- **Product mapping visualization**
- **Quick actions** for common tasks

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library
- **Lucide React** - Icon library

## 📦 Installation

1. **Install dependencies:**
```bash
cd systrix-middleware-nextjs
npm install
```

2. **Set environment variables:**
Create `.env.local` file:
```env
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=adcdebb0e3b6f583052d
HOSTBILL_API_KEY=b8f7a3e9c2d1f4e6a8b9c3d2e1f5a7b4
MIDDLEWARE_URL=http://localhost:3005
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open dashboard:**
Navigate to http://localhost:3005

## 📁 Project Structure

```
systrix-middleware-nextjs/
├── components/           # React components
│   ├── Layout.js        # Main layout with sidebar
│   ├── MetricsCards.js  # Status metrics cards
│   ├── ProductMappingTable.js
│   ├── QuickActions.js
│   └── SystemInfo.js
├── pages/               # Next.js pages
│   ├── api/            # API routes
│   │   └── status.js   # Status endpoint
│   ├── index.js        # Dashboard page
│   ├── test.js         # API testing page
│   ├── tech-dashboard.js
│   └── _app.js         # App wrapper
├── styles/
│   └── globals.css     # Global styles
└── public/             # Static assets
```

## 🎨 Design System

### Colors (Tailwind CSS)
- **Primary:** Blue (blue-50 to blue-900)
- **Success:** Green (green-50 to green-900)  
- **Warning:** Yellow (yellow-50 to yellow-900)
- **Purple:** Purple (purple-50 to purple-900)

### Components
- **Cards:** White background, gray borders, subtle shadows
- **Buttons:** Primary (blue), Secondary (gray)
- **Status badges:** Colored backgrounds matching status
- **Tables:** Striped rows, hover effects

## 🔗 Navigation

- **Dashboard** (`/`) - Main monitoring interface
- **API Tests** (`/test`) - Test middleware endpoints
- **Tech Dashboard** (`/tech-dashboard`) - Advanced metrics
- **External Links:**
  - Test Portal (localhost:3000/test-portal)
  - Partners Portal (localhost:3006)

## 📊 Features

### Dashboard
- Server status monitoring
- Product mapping overview
- Configuration details
- API health checks
- Auto-refresh every 30 seconds

### API Tests
- Test middleware endpoints
- View response data
- Monitor response times
- Error handling

### Tech Dashboard
- System metrics (CPU, Memory, Disk, Network)
- Real-time logs
- API endpoint documentation
- Performance monitoring

## 🔧 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components
1. Create component in `components/` directory
2. Import and use in pages
3. Follow existing naming conventions
4. Use Tailwind CSS for styling

### Adding New Pages
1. Create file in `pages/` directory
2. Export default React component
3. Add to navigation in `Layout.js`
4. Include proper Head meta tags

## 🌐 API Integration

The dashboard connects to middleware APIs:
- `/api/status` - Get system status
- `/api/products` - Get product mappings
- `/api/orders` - Process orders
- `/api/health` - Health checks

## 📱 Responsive Design

- **Mobile:** Single column layout
- **Tablet:** Two column grid
- **Desktop:** Multi-column grid
- **Sidebar:** Collapsible on mobile

## 🔄 Auto-refresh

Dashboard automatically refreshes every 30 seconds:
- Fetches latest status data
- Updates metrics cards
- Maintains user session
- Shows last update time

## 🎯 Production Deployment

1. **Build application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm run start
```

3. **Environment variables:**
Set production values in deployment environment

## 📝 License

Private - Systrix Partners Portal Integration
