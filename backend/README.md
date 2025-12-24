# Hayırhah Backend API

Backend API for Hayırhah - İbadet ve Dua Uygulaması

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- PostgreSQL 14+ (for production)

### Installation

1. Clone the repository and navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run tests (coming soon)

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (with Prisma ORM - coming soon)
- **Authentication:** JWT + Google OAuth
- **Security:** Helmet, CORS
- **Logging:** Morgan
- **Code Quality:** ESLint, Prettier

## 📁 Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Data models (Prisma - coming soon)
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── index.ts        # Application entry point
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming Soon)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/profile` - Get user profile

### Prayer Tracking (Coming Soon)
- `GET /api/prayer-tracking/{date}` - Get daily prayers
- `PUT /api/prayer-tracking/{date}` - Update daily prayers

### Groups (Coming Soon)
- `GET /api/groups` - List user groups
- `POST /api/groups` - Create new group
- `GET /api/groups/{id}` - Get group details

## 🐳 Docker

Build and run with Docker:

```bash
# Build image
docker build -t hayirhah-backend .

# Run container
docker run -p 3000:3000 --env-file .env hayirhah-backend
```

## 🔒 Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## 📈 Development Roadmap

- [x] **Phase 1.1:** Backend framework setup ✅
- [ ] **Phase 1.2:** Database setup with PostgreSQL + Prisma
- [ ] **Phase 1.3:** Authentication system (JWT + Google OAuth)
- [ ] **Phase 2:** Core API development
- [ ] **Phase 3:** Real-time features & notifications
- [ ] **Phase 4:** Performance optimization
- [ ] **Phase 5:** Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details 