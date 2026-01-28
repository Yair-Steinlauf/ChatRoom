# Chatroom Application

A secure, full-stack web-based chat application built with Node.js, Express, and MySQL. This application allows users to register, authenticate, and exchange messages in a shared chatroom with real-time updates via polling.

## 🚀 Features

* **User Authentication**:
    * Multi-step registration process with session validation.
    * Secure login/logout functionality.
    * Password hashing using `bcrypt`.
    * Session management using `express-session`.
* **Messaging**:
    * View chat history.
    * Post new messages.
    * **Edit** and **Delete** your own messages.
    * **Search** functionality to filter messages by content.
    * Auto-refresh (Polling) every 10 seconds to fetch new content.
* **Security**:
    * Input sanitization and validation.
    * Rate limiting to prevent brute-force attacks.
    * Secure HTTP headers using `Helmet`.
    * CSRF protection via cookie settings.
* **Database**:
    * MySQL/MariaDB containerized via Docker.
    * Sequelize ORM for database interactions.

## 🛠️ Technology Stack

* **Backend**: Node.js, Express.js
* **Database**: MySQL / MariaDB, Sequelize ORM
* **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript (SPA architecture for Auth)
* **Containerization**: Docker, Docker Compose
* **Tools**: PHPMyAdmin (for database management)

## Dl Prerequisites

Before running the project, ensure you have the following installed:

* **Node.js** (v14 or higher)
* **npm** (Node Package Manager)
* **Docker Desktop** (Required for the database)

