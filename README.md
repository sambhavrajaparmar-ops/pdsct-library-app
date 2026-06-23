# PDSCT Library Management System

**Pandit Dev Prabhakar Shashtri College of Technology**

A comprehensive library management application built with React Native, Node.js, and MySQL.

## 📱 Features

- 📚 **Books Management** - Add, view, search books
- 👤 **Student/Member Management** - Register and manage members
- 📤 **Book Issue** - Issue books to students
- 📥 **Book Return** - Track returned books
- 🔍 **Search Functionality** - Find books and members quickly
- 💾 **Data Persistence** - MySQL database
- 📊 **Dashboard** - Statistics and analytics
- 💰 **Fine Management** - Track overdue fines

## 🛠️ Tech Stack

### Frontend
- React Native
- React Navigation
- AsyncStorage (local caching)

### Backend
- Node.js
- Express.js
- MySQL2/promise
- JWT Authentication

### Database
- MySQL 8.0+

## 📦 Project Structure

```
pdsct-library-app/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── components/      # Reusable components
│   │   ├── navigation/      # Navigation config
│   │   ├── services/        # API calls
│   │   └── App.js
│   ├── package.json
│   └── app.json
├── backend/                  # Node.js server
│   ├── config/              # Database config
│   ├── routes/              # API routes
│   ├── controllers/         # Route controllers
│   ├── models/              # Database models
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/                # MySQL schema
│   └── schema.sql
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MySQL 8.0+
- React Native CLI
- Android Studio / Xcode (for mobile)

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your MySQL credentials

# Run migrations
mysql -u root -p < ../database/schema.sql

# Start server
npm start
```

### Frontend Setup

```bash
cd frontend
npm install

# Update API base URL in src/services/api.js

# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

## 📚 API Documentation

### Books Endpoints
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search/:query` - Search books

### Students Endpoints
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Register new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Issue/Return Endpoints
- `POST /api/issues` - Issue a book
- `POST /api/returns` - Return a book
- `GET /api/issues/student/:studentId` - Get student's issues
- `GET /api/active-issues` - Get all active issues

## 🔐 Authentication

Uses JWT tokens for API authentication.

```javascript
// Request header
Authorization: Bearer <token>
```

## 📊 Database Schema

See `database/schema.sql` for complete database structure.

## 🤝 Contributing

Fork the repository and create feature branches.

## 📄 License

MIT License - See LICENSE file

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Created for Pandit Dev Prabhakar Shashtri College of Technology**
