# TaskHive

TaskHive is a web-based task management and team collaboration platform designed to streamline workflow and enhance productivity. It allows users to manage personal to-do lists, collaborate in teams, assign tasks, and communicate via a built-in chatroom.

## Features

- **User Authentication**: Secure login and registration system using JWT/Cookies.
- **Dashboard**:
  - **Guest View**: Limited access for non-authenticated users.
  - **User Home**: Personalized dashboard for logged-in users.
- **Task Management**:
  - Create, update, and manage personal To-Do lists.
  - Assign tasks to team members.
- **Team Collaboration**:
  - Create and manage teams.
  - Add members to teams.
  - **Chatroom**: Real-time communication channel for team members.
- **Role-Based Access**: Admin-specific capabilities for assigning work and managing team composition.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Templating Engine**: EJS (Embedded JavaScript templates)
- **Authentication**: Cookie-parser, JWT (implied via auth middleware)
- **Environment Management**: Dotenv

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prashantdubeypng/TaskHive.git
   cd TaskHive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory.
2. Add the following environment variables:

   ```env
   PORT=8000
   MONGO=mongodb://localhost:27017/taskhive   # Replace with your MongoDB connection string
   # Add any secret keys required for authentication here (e.g., JWT_SECRET)
   ```

### Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   *Or if using nodemon for development:*
   ```bash
   npm run dev
   ```

2. Open your browser and visit:
   `http://localhost:8000`

## Project Structure

```
TaskHive/
├── middleware/      # Authentication and other middleware
├── models/          # Mongoose database models (Team, User, Task, etc.)
├── routers/         # Express route definitions (user, logic, todo, team, tasks)
├── services/        # Business logic and helper services (auth)
├── views/           # EJS templates for the frontend
├── public/          # Static assets (CSS, JS, Images)
├── server.js        # Main entry point of the application
└── package.json     # Project dependencies and scripts
```

## License

This project is open-source and available under the [MIT License](LICENSE).
