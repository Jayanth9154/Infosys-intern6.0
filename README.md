NeuroFleetX Project Overview

NeuroFleetX is an AI-powered fleet management platform designed for electric vehicle (EV) operations. It combines real-time telemetry, predictive analytics, and user-friendly dashboards to optimize fleet performance, monitor battery health, and manage bookings. The system supports role-based access (admin/users) and integrates with Firebase for authentication and data storage.

Project Architecture

Backend: Spring Boot (Java 17) with REST APIs, WebSocket for real-time updates, Firebase Authentication, and Firestore database.

Frontend: React (v19) with Google Maps integration, Firebase Auth, and WebSocket for live data.

Key Technologies:Backend: Spring Boot 3.3.3, Firebase Admin SDK, WebSocket, Jackson for JSON.

Frontend: React 19, Axios for HTTP, WebSocket client, Google Maps API.

Database: Firestore (NoSQL) for vehicles, bookings, users, and history.

Real-time: Simulated telemetry updates every 5 seconds via WebSocket.

Deployment: Firebase Hosting (frontend), Spring Boot server (backend on port 3001).

Security: Firebase JWT tokens, role-based access (e.g., admin for vehicle CRUD), CORS enabled for localhost.

File-by-File Breakdown

Root Level Files:

.firebaserc: Firebase project configuration (project ID: neurofleetx-project).

.gitignore: Excludes node_modules, build/, target/, serviceAccountKey.json, etc.

firebase.json: Firebase hosting config (public dir: frontend/build, rewrites to index.html).

firestore.indexes.json: Defines Firestore composite indexes (e.g., for bookings by customerId and status).

firestore.rules: Security rules allowing authenticated reads/writes for vehicles, bookings, users collections.

test_api.ps1: PowerShell script to test backend APIs (e.g., GET /api/auth/health, POST /api/auth/login).

Project Screenshots/: PNG images showing app UI (dashboard, map, forms, etc.).

Backend (Spring Boot - Java):

pom.xml: Maven config with Spring Boot starters (web, security, websocket), Firebase Admin SDK 9.3.0, Jackson, validation.

src/main/resources/application.properties: Server port 3001, CORS origins (localhost:3000/3002/3003), Firebase credentials path (serviceAccountKey.json).

src/main/java/com/neurofleet/NeuroFleetApplication.java: Main Spring Boot app class with @EnableScheduling for telemetry simulation.

config/:CorsConfig.java: CORS filter allowing credentials, specific origins/methods/headers.

FirebaseConfig.java: Initializes Firebase with service account key (skips if file missing for dev).

FirestoreConfig.java: Provides Firestore bean (depends on Firebase init; returns null for dev if failed).

WebSocketConfig.java: Enables WebSocket, registers handler at "/ws" with allowed origins "*".

controller/:AuthController.java: Handles /api/auth/register, /login (Firebase), /me, /health.

BookingController.java: CRUD for /api/bookings (Firestore), with history subcollection; supports customer bookings and status updates.

ProfileController.java: GET/PUT /api/profile/me for user profiles in Firestore.

VehicleController.java: Full CRUD for /api/vehicles (admin only for create/update/delete), telemetry endpoints, history subcollection, driver assignment, status updates.

service/TelemetryService.java: Simulates EV telemetry (battery, range, location, status); updates every 5s, broadcasts via WebSocket; manages vehicle map.

websocket/RawWebSocketHandler.java: Manages WebSocket sessions, broadcasts telemetry JSON payloads to clients.

security/:FirebaseAuthenticationFilter.java: Verifies Bearer JWT, extracts UID/role, sets Spring Security context.

SecurityConfig.java: Stateless security, permits /api/auth/** and /ws/, requires auth for others; enables method security (@PreAuthorize).

dto/: Empty (no custom DTOs; controllers use Map<String, Object> for flexibility).

Frontend (React):

package.json: Dependencies include React 19, Firebase 12.1.0, Google Maps wrapper, Axios 1.11.0, WebSocket 8.18.3.

public/: Standard CRA assets (index.html with NeuroFleetX title, manifest.json for PWA, favicon, logos).

src/:index.js: Renders App into #root.

index.css: Global styles (reset, fonts).

App.js: Main app with tabbed navigation (dashboard, inventory, map, vehicles, battery, booking, maintenance, routes, admin, profile); renders components based on activeTab; includes embedded CSS for dark theme.

AuthContext.js: React context for Firebase auth (signIn, signOut, role from token claims).

AuthComponent.js: Login/register form using AuthContext.

firebase.js: Firebase config (API key, auth domain, project ID, etc.).

LogoutButton.js: Button to sign out via AuthContext.

VehicleList.js: Displays vehicle list from /api/vehicles, with edit/delete for admin.

VehicleForm.js: Admin form to add vehicles (make, model, license plate).

UpdateForm.js: Edit vehicle details.

VehicleMap.js: Google Maps component showing vehicle markers with real-time positions from WebSocket.

BatteryMonitoring.js: Charts battery levels/ranges from telemetry.

VehicleInventory.js: Advanced inventory view (likely extends VehicleList).

CustomerBooking.js: Booking form/interface for customers.

PredictiveMaintenance.js: UI for maintenance predictions (simulated).

RouteOptimization.js: Route planning interface (placeholder).

AdminPanel.js: Admin dashboard with stats/users.

Profile.js: User profile view/edit.

Notifications.js: Toast notifications for actions/errors.

Key Features & Functionality

Authentication: Firebase-based login/register with custom tokens; role-based UI (admin sees extra tabs/forms).

Vehicle Management: CRUD with history logging; real-time status (available/on-trip/charging); driver assignment.

Telemetry: Simulated EV data (battery %, range km, location lat/lng, health %); WebSocket broadcasts updates every 5s.

Bookings: Customer booking system with status tracking (pending/confirmed/completed); history.

Dashboards: Live map with Google Maps, stats cards, sidebar vehicle list.

AI Aspects: "Predictive Maintenance" and "Route Optimization" (currently UI placeholders; could integrate ML models).

Real-time: WebSocket for instant telemetry updates on map/battery views.

Development Mode: Backend falls back to mock data if Firestore/Firebase unavailable.

This structure enables scalable EV fleet management with real-time monitoring. For PPT slides, focus on architecture diagram, feature screenshots, and code snippets from key files like VehicleController or TelemetryService. If you need code for specific slides, let me know!
