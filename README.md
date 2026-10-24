# Job Portal API

A RESTful Job Portal API built using **Node.js, Express.js, MongoDB, and Mongoose**. The API allows employers to post and manage jobs, while candidates can search for jobs, submit applications, and track their application status.

The project uses JWT authentication, role-based access control, and ownership checks to protect API operations.

## Features

### Authentication
- Register as a candidate or employer.
- Log in using email and password.
- Authenticate requests using JSON Web Tokens (JWT).
- Retrieve the logged-in user's profile.
- Hash passwords using bcrypt.

### Job Management
- Employers can create, update, close, and delete their own jobs.
- Anyone can retrieve available jobs.
- Search jobs by title or company.
- Filter jobs by location, type, skills, and salary.
- Sort and paginate job results.
- View individual job details.
- View application statistics for an employer's job.

### Application Management
- Candidates can apply for open jobs.
- Candidates can view their applications with job details.
- Employers can view applications for their own jobs.
- Employers can filter applications by status and update application status.
- Candidates can withdraw applications while the status is `applied`.
- Duplicate applications are prevented.

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Token (JWT)
- **Password Security:** bcrypt
- **API Testing:** Postman

## Project Structure

```text
job-portal-api/
├── config/
│   └── db.js
├── controllers/
│   ├── applicationController.js
│   ├── authController.js
│   └── jobController.js
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models/
│   ├── Application.js
│   ├── Job.js
│   └── User.js
├── routes/
│   ├── applicationRoutes.js
│   ├── authRoutes.js
│   └── jobRoutes.js
├── postman/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB installed locally or a MongoDB Atlas database
- Git
- Postman

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/subodh0212/Job-Portal-API-.git
cd Job-Portal-API-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference.

Example configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/job_portal
JWT_SECRET=replace_with_your_secret
JWT_EXPIRES_IN=1d
```

Use your own MongoDB connection string if you use MongoDB Atlas. Replace the JWT secret with a strong, private value.

**Security:** Never commit `.env` or database credentials to GitHub.

### 4. Start the server

Run the development command if it is configured in `package.json`:

```bash
npm run dev
```

Alternatively, start the server with:

```bash
node server.js
```

The API runs at:

```text
http://localhost:5000
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port used by the server |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration, for example `1d` |

## API Endpoints

All paths below are relative to `http://localhost:5000`. Protected endpoints require a valid JWT unless otherwise stated.

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Log in and receive a token |
| GET | `/api/auth/me` | Authenticated | Retrieve the current profile |

### Jobs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/jobs` | Employer | Create a job |
| GET | `/api/jobs` | Public | List, search, filter, sort, and paginate jobs |
| GET | `/api/jobs/:id` | Public | Retrieve a job |
| PUT | `/api/jobs/:id` | Job owner | Update a job |
| PATCH | `/api/jobs/:id/close` | Job owner | Close a job |
| DELETE | `/api/jobs/:id` | Job owner | Delete a job and its applications |
| GET | `/api/jobs/:id/stats` | Job owner | View application statistics |

### Applications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/applications/jobs/:jobId` | Candidate | Apply for a job |
| GET | `/api/applications/my` | Candidate | Retrieve the candidate's applications |
| GET | `/api/applications/job/:jobId` | Job owner | View applications for a job |
| PATCH | `/api/applications/:id/status` | Job owner | Update an application's status |
| DELETE | `/api/applications/:id` | Applicant | Withdraw an application |

**Note:** These application paths should match the routes configured in the project. Verify them against `routes/applicationRoutes.js` before publishing this README.

## Job Search, Filters, and Pagination

The jobs listing endpoint supports query parameters such as:

| Parameter | Purpose | Example |
|---|---|---|
| `search` | Search by job title or company | `?search=Java` |
| `location` | Filter by location | `?location=Pune` |
| `type` | Filter by job type | `?type=full-time` |
| `skill` | Filter by skill | `?skill=Java` |
| `minSalary` | Minimum salary | `?minSalary=20000` |
| `maxSalary` | Maximum salary, if supported | `?maxSalary=50000` |
| `sort` | Sort results | `?sort=-createdAt` |
| `page` | Page number | `?page=1` |
| `limit` | Number of results per page | `?limit=10` |

Example:

```text
GET /api/jobs?location=Pune&type=full-time&page=1&limit=10
```

The response includes pagination information such as `total`, `page`, `pages`, `count`, and `data`.

## Database Models and Relationships

The application uses three MongoDB collections.

### 1. User

Stores candidate and employer information, including name, unique email, hashed password, role, and company name for employers. Mongoose timestamps track creation and update times.

### 2. Job

Stores the job title, description, company, location, job type, monthly salary, skills, status, and `postedBy` reference to the employer's User document.

### 3. Application

Stores references to the job and candidate, cover letter, application status, and timestamps. A compound unique index on `job` and `candidate` prevents duplicate applications to the same job.

### Relationships

- One employer can post many jobs.
- One job can have many applications.
- One candidate can submit applications for many jobs.
- Each application references one job and one candidate.

## Application Status Transitions

An application begins with the status `applied`.

Allowed transitions:

- `applied` → `shortlisted`
- `applied` → `rejected`
- `shortlisted` → `hired`
- `shortlisted` → `rejected`

Applications in the `hired` or `rejected` state are terminal and cannot transition to another status.

Candidates can withdraw an application only while its status is `applied`.

## Business Rules and Security

- Only employers can create and manage jobs.
- Employers can manage only their own jobs and applications.
- Only candidates can apply for jobs.
- Applications cannot be submitted for closed jobs.
- A candidate cannot apply to the same job twice.
- Candidates can withdraw only their own eligible applications.
- Deleting a job also deletes its associated applications.
- Passwords are stored as hashes and must never be returned in API responses.
- Protected endpoints require valid authentication.

## Testing with Postman

Use the **Job Portal API** Postman collection to test the endpoints.

Configure an environment with the following variables:

- `baseUrl` — `http://localhost:5000`
- `employerToken` — employer JWT
- `candidateToken` — candidate JWT
- `jobId` — ID of a job
- `applicationId` — ID of an application

Test both successful requests and failure cases, including invalid input, unauthorized roles, ownership restrictions, duplicate applications, closed jobs, invalid status transitions, and missing resources.

The exported Postman collection and published API documentation should be included when available.

## Error Responses

The API returns JSON responses containing a success indicator and a message.

Example:

```json
{
  "success": false,
  "message": "Cannot apply to a closed job"
}
```

Common HTTP status codes:

- `200 OK` — Successful retrieval, update, deletion, or withdrawal.
- `201 Created` — Resource created successfully.
- `400 Bad Request` — Invalid input or identifier.
- `401 Unauthorized` — Missing or invalid authentication.
- `403 Forbidden` — Insufficient permissions or ownership.
- `404 Not Found` — Requested resource does not exist.
- `409 Conflict` — Duplicate application or closed-job application.
- `500 Internal Server Error` — Unexpected server error.

## Future Improvements

- Automated API tests.
- Improved request validation and error reporting.
- Deployment to a cloud hosting platform.
- Frontend integration for candidates and employers.

## Author

**Subodh Marathe**

GitHub: https://github.com/subodh0212
