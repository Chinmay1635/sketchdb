# SketchDB Server

Backend server for SketchDB - A database diagram tool for Walchand College of Engineering, Sangli.

## Features

- User authentication (signup, login, logout)
- Email verification with OTP (only @walchandsangli.ac.in emails allowed)
- Password reset functionality
- Save and load diagrams with ReactFlow positions
- Store SQL structures

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret for JWT tokens
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Email configuration for OTP

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/verify-otp` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/auth/me` | Get current user (protected) |

### Diagrams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/diagrams` | Get all user's diagrams |
| GET | `/api/diagrams/:id` | Get a specific diagram |
| POST | `/api/diagrams` | Create a new diagram |
| PUT | `/api/diagrams/:id` | Update a diagram |
| DELETE | `/api/diagrams/:id` | Delete a diagram |
| POST | `/api/diagrams/:id/duplicate` | Duplicate a diagram |

## Email Configuration (Gmail)

To use Gmail for sending OTPs:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account → Security → App Passwords
   - Select "Mail" and "Windows Computer"
   - Use the generated password as `EMAIL_PASS`

## Diagram Data Structure

Each diagram stores:
- `name`: Diagram name
- `description`: Optional description
- `nodes`: ReactFlow nodes (tables with positions)
- `edges`: ReactFlow edges (relationships)
- `sqlContent`: Generated SQL content
- `viewport`: Canvas viewport state (x, y, zoom)
