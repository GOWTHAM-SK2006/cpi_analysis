# Cullinan Performance Index (CPI) Platform

The **Cullinan Performance Index (CPI) Platform** is a unified, high-performance sports analytics web application designed for cricket academies. Built from scratch with a premium **Black + Orange** sports-tech design language, it allows coaches to log practice and match sessions, score players across key performance indicators, and view detailed player analytics (PPI, MPI, and CPI).

## 🚀 Key Features

- **Dashboard**: High-level academy performance stats (Total Teams, Total Players, Average CPI) and quick actions.
- **Team Management**: Full CRUD for teams (create, read, update, delete) and real-time search.
- **Player Roster**: Full CRUD for players, including details like batting style, bowling style, role, and age.
- **Practice Tracking**: Log practice sessions and score players on **PPI (Practice Performance Index)** using a 1-10 slider system across 5 pillars.
- **Match Tracking**: Log match sessions (vs opponents) and score players on **MPI (Match Performance Index)** using a 1-10 slider system across 5 pillars.
- **Player Detail**: Deep-dive analytics dashboard showing a player's individual CPI, PPI history, MPI history, and trends.
- **Reports**: Generate academy-wide reports at both player and team levels.

---

## 🛠 Technology Stack

### Backend
- **Java 21 / 17** (Compiles on Java 17+ and runs on Java 17/21 in production)
- **Spring Boot 3.3.0**
- **Spring Security**
- **JWT (Json Web Tokens)** for stateless authentication
- **Spring Data JPA** & **Hibernate**
- **PostgreSQL** (production) / Local H2 (optional)

### Frontend (Served from static resources)
- **HTML5**
- **Vanilla JavaScript (ES6 Modules)**
- **Vanilla CSS3** with a tailored Black + Orange theme and responsive layout utilities

---

## 📂 Project Structure

```text
cpi/
├── pom.xml
├── Dockerfile
├── railway.json
├── README.md
├── src/
│   └── main/
│       ├── java/com/cpi/
│       │   ├── CpiApplication.java
│       │   ├── controller/      # REST API Controllers
│       │   ├── service/         # Business Logic Services
│       │   ├── repository/      # JPA Data Repositories
│       │   ├── entity/          # JPA Entities
│       │   ├── dto/             # Request/Response Data Transfer Objects
│       │   └── security/        # JWT & Security configurations
│       └── resources/
│           ├── application.properties
│           └── static/          # Frontend Web Assets
│               ├── css/style.css
│               ├── js/          # Frontend ES6 Modules
│               ├── index.html
│               ├── login.html
│               ├── signup.html
│               ├── dashboard.html
│               ├── teams.html
│               ├── players.html
│               ├── player-detail.html
│               ├── practice-sessions.html
│               ├── practice-score.html
│               ├── match-sessions.html
│               ├── match-score.html
│               └── reports.html
```

---

## 🛢 Database Schema & Tables

### 1. `coaches`
- `id` (BIGSERIAL, Primary Key)
- `name` (VARCHAR, Not Null)
- `academy_name` (VARCHAR, Not Null)
- `email` (VARCHAR, Unique, Not Null)
- `password` (VARCHAR, Hashed, Not Null)
- `role` (VARCHAR, Not Null)

### 2. `teams`
- `id` (BIGSERIAL, Primary Key)
- `name` (VARCHAR, Not Null)
- `description` (TEXT)
- `coach_id` (BIGINT, Foreign Key referencing `coaches.id`)

### 3. `players`
- `id` (BIGSERIAL, Primary Key)
- `name` (VARCHAR, Not Null)
- `age` (INTEGER, Not Null)
- `role` (VARCHAR, Not Null)
- `batting_style` (VARCHAR, Not Null)
- `bowling_style` (VARCHAR, Not Null)
- `team_id` (BIGINT, Foreign Key referencing `teams.id`)

### 4. `practice_sessions`
- `id` (BIGSERIAL, Primary Key)
- `team_id` (BIGINT, Foreign Key referencing `teams.id`)
- `date` (DATE, Not Null)
- `notes` (TEXT)

### 5. `ppi_scores`
- `id` (BIGSERIAL, Primary Key)
- `practice_session_id` (BIGINT, Foreign Key referencing `practice_sessions.id`)
- `player_id` (BIGINT, Foreign Key referencing `players.id`)
- `training_intensity` (INTEGER, Not Null)
- `skill_execution` (INTEGER, Not Null)
- `focus` (INTEGER, Not Null)
- `coachability` (INTEGER, Not Null)
- `adaptability` (INTEGER, Not Null)
- `ppi` (DECIMAL, Calculated)

### 6. `match_sessions`
- `id` (BIGSERIAL, Primary Key)
- `team_id` (BIGINT, Foreign Key referencing `teams.id`)
- `opponent` (VARCHAR, Not Null)
- `date` (DATE, Not Null)
- `notes` (TEXT)

### 7. `mpi_scores`
- `id` (BIGSERIAL, Primary Key)
- `match_session_id` (BIGINT, Foreign Key referencing `match_sessions.id`)
- `player_id` (BIGINT, Foreign Key referencing `players.id`)
- `technical_execution` (INTEGER, Not Null)
- `decision_making` (INTEGER, Not Null)
- `match_awareness` (INTEGER, Not Null)
- `mental_resilience` (INTEGER, Not Null)
- `competitive_impact` (INTEGER, Not Null)
- `mpi` (DECIMAL, Calculated)

---

## 🔌 API Documentation

### 🔐 Authentication APIs
- **POST** `/api/auth/signup`
  - Body: `{ "name": "...", "academyName": "...", "email": "...", "password": "..." }`
  - Response: JWT token, Coach name, Email, Academy name.
- **POST** `/api/auth/login`
  - Body: `{ "email": "...", "password": "..." }`
  - Response: JWT token, Coach name, Email, Academy name.

### 🛡 Team APIs
- **GET** `/api/teams` — Retrieve all teams for the logged-in coach.
- **GET** `/api/teams/{id}` — Retrieve a specific team.
- **POST** `/api/teams` — Create a team. Body: `{ "name": "...", "description": "..." }`
- **PUT** `/api/teams/{id}` — Update a team. Body: `{ "name": "...", "description": "..." }`
- **DELETE** `/api/teams/{id}` — Delete a team.

### 👤 Player APIs
- **GET** `/api/players` — Retrieve all players or filter by team using `?teamId={id}`.
- **GET** `/api/players/{id}` — Retrieve a player's profile.
- **POST** `/api/players` — Add a player. Body: `{ "name": "...", "age": 17, "role": "...", "battingStyle": "...", "bowlingStyle": "...", "teamId": 1 }`
- **PUT** `/api/players/{id}` — Update a player's profile.
- **DELETE** `/api/players/{id}` — Remove a player.

### 🎯 Practice & PPI APIs
- **GET** `/api/practice-sessions` — Retrieve all practice sessions.
- **POST** `/api/practice-sessions` — Log a practice session. Body: `{ "teamId": 1, "date": "YYYY-MM-DD", "notes": "..." }`
- **DELETE** `/api/practice-sessions/{id}` — Delete a practice session.
- **GET** `/api/ppi/session/{sessionId}` — Get scored PPIs for a session.
- **POST** `/api/ppi/session/{sessionId}` — Save/Update a player's PPI score. Body: `{ "playerId": 1, "trainingIntensity": 8, "skillExecution": 7, "focus": 9, "coachability": 8, "adaptability": 7 }`

### 🏏 Match & MPI APIs
- **GET** `/api/match-sessions` — Retrieve all match sessions.
- **POST** `/api/match-sessions` — Log a match session. Body: `{ "teamId": 1, "opponent": "...", "date": "YYYY-MM-DD", "notes": "..." }`
- **DELETE** `/api/match-sessions/{id}` — Delete a match session.
- **GET** `/api/mpi/session/{sessionId}` — Get scored MPIs for a session.
- **POST** `/api/mpi/session/{sessionId}` — Save/Update a player's MPI score. Body: `{ "playerId": 1, "technicalExecution": 8, "decisionMaking": 7, "matchAwareness": 8, "mentalResilience": 9, "competitiveImpact": 8 }`

### 📊 Reports APIs
- **GET** `/api/reports/player/{playerId}` — Returns full report object for a single player (CPI, avg PPI, avg MPI, history).
- **GET** `/api/reports/team/{teamId}` — Returns an array of reports for all players in a team.

---

## ⚙️ Environment Variables

The following environment variables configure the application:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` or `SERVER_PORT` | Port the web service runs on | `8080` |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/cpi` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | Secret key used to sign JWTs | (Auto-fallback secure default) |

---

## 🏃 Local Run Instructions

### Prerequisites
- JDK 17 or JDK 21 installed.
- Maven 3.x.
- PostgreSQL running locally or remotely.

1. **Clone & Navigate**:
   ```bash
   cd CPI_ANALYSIS
   ```

2. **Configure Database**:
   Ensure PostgreSQL is running and database `cpi` exists, or configure your connection credentials in `src/main/resources/application.properties`.

3. **Build**:
   ```bash
   mvn clean compile
   ```

4. **Run**:
   ```bash
   mvn spring-boot:run
   ```
   Open `http://localhost:8080` in your web browser.

---

## ☁️ Railway Deployment Instructions

The project is structured to deploy on Railway seamlessly in a single service:

1. **Connect Repository**: Link your GitHub repository containing this project code to Railway.
2. **Add PostgreSQL Database**: Create a PostgreSQL database inside your Railway project.
3. **Automatic Binding**: Railway will automatically inject the `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` variables to connect the Spring Boot container to the database.
4. **Environment Variables**: Add `JWT_SECRET` (e.g. a random hex string) in the Railway service variables.
5. **Build**: Railway detects `railway.json` and builds the dockerized application via the `Dockerfile`.
