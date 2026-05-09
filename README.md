# 💰 SpendWise — MERN Expense Tracker

A full-stack personal finance tracker built with MongoDB, Express, React, and Node.js. Features beautiful Chart.js dashboards, category filtering, monthly reports, and full CRUD for income/expenses.

---

## 🚀 Features

- **Authentication** — JWT-based register/login with secure bcrypt passwords
- **Dashboard** — Live stats cards + Bar, Doughnut, and Line charts (Chart.js)
- **Transactions** — Add, edit, delete income/expenses with advanced filtering & pagination
- **Reports** — Monthly/annual breakdowns, daily trends, category pie, balance history
- **Category System** — 15 default categories auto-created per user (income + expense)
- **Responsive** — Mobile-friendly sidebar layout

---

## 🛠 Tech Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 18, React Router v6, Chart.js 4, react-chartjs-2 |
| Backend  | Node.js, Express.js               |
| Database | MongoDB + Mongoose                |
| Auth     | JWT + bcryptjs                    |
| Styling  | Custom CSS with CSS Variables     |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v16+
- MongoDB (local or MongoDB Atlas)

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install all (server + client)
npm run install-all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_secure_secret_here
NODE_ENV=development
```

For MongoDB Atlas, replace MONGO_URI with your connection string.

### 3. Run Development Servers

```bash
# From root — starts both server (port 5000) and client (port 3000)
npm run dev
```

Or separately:
```bash
npm run server   # Express API on :5000
npm run client   # React app on :3000
```

### 4. Production Build

```bash
npm run build    # Builds React app to client/build/
npm start        # Runs Express server
```

---

## 📁 Project Structure

```
expense-tracker/
├── server/
│   ├── index.js              # Entry point
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   └── reports.js
│   └── middleware/
│       └── auth.js
└── client/
    └── src/
        ├── App.js
        ├── context/
        │   └── AuthContext.js
        ├── utils/
        │   └── api.js
        └── components/
            ├── Auth/        (Login, Register)
            ├── Layout/      (Sidebar nav)
            ├── Dashboard/   (Stats + Charts)
            ├── Transactions/ (CRUD + filters)
            └── Reports/     (Analytics)
```

---

## 🔌 API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/auth/register                | Register new user        |
| POST   | /api/auth/login                   | Login & get JWT          |
| GET    | /api/auth/me                      | Get current user         |
| GET    | /api/transactions                 | List with filters/paging |
| POST   | /api/transactions                 | Create transaction       |
| PUT    | /api/transactions/:id             | Update transaction       |
| DELETE | /api/transactions/:id             | Delete transaction       |
| GET    | /api/transactions/summary/stats   | Monthly stats            |
| GET    | /api/categories                   | List categories          |
| POST   | /api/categories                   | Create category          |
| GET    | /api/reports/monthly              | Annual monthly breakdown |
| GET    | /api/reports/category-breakdown   | Category pie data        |
| GET    | /api/reports/daily-trend          | Daily income/expense     |
| GET    | /api/reports/balance-history      | 6-month balance history  |
| GET    | /api/reports/top-expenses         | Top 5 expenses           |

---

## 📊 Charts Used (Chart.js)

- **Bar Chart** — Monthly income vs expenses comparison
- **Doughnut/Pie Chart** — Category spending breakdown
- **Line Chart** — Balance trend over months & daily cash flow

---

## 🔐 Security

- Passwords hashed with bcryptjs (12 rounds)
- All routes protected with JWT middleware
- User data fully isolated per account
- Input validation with express-validator

---

## 📝 Default Categories

On registration, 15 categories are auto-created:

**Income:** Salary, Freelance, Investment, Other Income  
**Expense:** Food & Dining, Transport, Shopping, Entertainment, Healthcare, Education, Utilities, Rent, Travel, Subscriptions, Other Expense
