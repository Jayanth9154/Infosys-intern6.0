# NeuroFleetX Backend API

Spring Boot backend for the NeuroFleetX AI Fleet Management Platform.

## Features

- **Authentication & Authorization**: JWT-based security with user registration and login
- **Fleet Management**: Complete CRUD operations for vehicles and fleet tracking
- **Route Optimization**: AI-powered route planning and optimization algorithms
- **Real-time Tracking**: Vehicle location and status updates
- **Analytics Dashboard**: Fleet performance metrics and insights
- **RESTful API**: Clean, well-documented API endpoints

## Technology Stack

- **Spring Boot 3.2.0**: Main framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Database operations
- **H2 Database**: In-memory database for development
- **JWT**: Token-based authentication
- **Maven**: Dependency management

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/active` - Get active vehicles
- `GET /api/vehicles/{id}` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/{id}` - Update vehicle
- `PUT /api/vehicles/{vehicleId}/location` - Update vehicle location
- `DELETE /api/vehicles/{id}` - Delete vehicle

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/active` - Get active routes
- `GET /api/routes/{id}` - Get route by ID
- `POST /api/routes` - Create new route
- `PUT /api/routes/{id}` - Update route
- `POST /api/routes/{routeId}/optimize` - Optimize route with AI
- `DELETE /api/routes/{id}` - Delete route

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/insights` - Get AI insights

## Running the Application

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

3. The API will be available at `http://localhost:8080`

4. H2 Console available at `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:neurofleetx`
   - Username: `sa`
   - Password: `password`

## Database Schema

The application uses the following main entities:

- **User**: User accounts with authentication
- **Vehicle**: Fleet vehicles with real-time tracking
- **Route**: Optimized routes with AI analytics

## Security

- JWT tokens for stateless authentication
- Password encryption using BCrypt
- CORS enabled for frontend integration
- Role-based access control ready for implementation