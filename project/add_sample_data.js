// Script to add sample user profile and trip data to Firestore
// Run this with: node add_sample_data.js

const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = require('./backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addSampleData() {
  try {
    console.log('Adding sample data to Firestore...');

    // Sample User ID - Replace with your actual user ID from Firebase Auth
    const sampleUserId = 'REPLACE_WITH_YOUR_USER_ID';
    
    // Add user profile data
    const userProfile = {
      name: 'John Smith',
      phone: '+1 (555) 123-4567',
      address: '456 Fleet Avenue, San Francisco, CA 94102',
      dateOfBirth: '1990-05-15',
      licenseNumber: 'D1234567',
      emergencyContact: 'Jane Smith',
      emergencyPhone: '+1 (555) 987-6543',
      preferredVehicleType: 'electric',
      experienceYears: '8',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(sampleUserId).set(userProfile, { merge: true });
    console.log('✓ User profile added');

    // Add sample vehicles
    const vehicles = [
      {
        name: 'Tesla Model 3',
        status: 'AVAILABLE',
        licensePlate: 'CAL-1234',
        currentBattery: 82.00,
        lastKnownLocation: 'HQ Depot - Bay Area',
        currentDriver: sampleUserId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Rivian R1T',
        status: 'ON_TRIP',
        licensePlate: 'CAL-5678',
        currentBattery: 47.00,
        lastKnownLocation: 'Mission District',
        currentDriver: sampleUserId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Ford E-Transit',
        status: 'CHARGING',
        licensePlate: 'CAL-9012',
        currentBattery: 28.00,
        lastKnownLocation: 'Charging Station #7',
        currentDriver: sampleUserId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const vehicle of vehicles) {
      await db.collection('vehicles').add(vehicle);
    }
    console.log('✓ Vehicles added');

    // Add sample trips
    const trips = [
      {
        vehicleId: 'dev-vehicle-2',
        driverId: sampleUserId,
        startTime: new Date('2025-01-13T08:05:00Z'),
        endTime: new Date('2025-01-13T08:48:00Z'),
        status: 'COMPLETED',
        distanceKm: 18.40,
        startLocation: 'HQ Depot',
        endLocation: 'Mission District'
      },
      {
        vehicleId: 'dev-vehicle-1',
        driverId: sampleUserId,
        startTime: new Date('2025-01-13T09:15:00Z'),
        endTime: null,
        status: 'IN_PROGRESS',
        distanceKm: 6.10,
        startLocation: 'Downtown',
        endLocation: null
      },
      {
        vehicleId: 'dev-vehicle-1',
        driverId: sampleUserId,
        startTime: new Date('2025-01-12T14:30:00Z'),
        endTime: new Date('2025-01-12T15:45:00Z'),
        status: 'COMPLETED',
        distanceKm: 32.70,
        startLocation: 'Airport',
        endLocation: 'City Center'
      },
      {
        vehicleId: 'dev-vehicle-3',
        driverId: sampleUserId,
        startTime: new Date('2025-01-12T10:00:00Z'),
        endTime: new Date('2025-01-12T12:20:00Z'),
        status: 'COMPLETED',
        distanceKm: 45.30,
        startLocation: 'Warehouse',
        endLocation: 'Distribution Center'
      },
      {
        vehicleId: 'dev-vehicle-2',
        driverId: sampleUserId,
        startTime: new Date('2025-01-11T16:45:00Z'),
        endTime: new Date('2025-01-11T17:30:00Z'),
        status: 'COMPLETED',
        distanceKm: 15.80,
        startLocation: 'Office',
        endLocation: 'Client Site'
      }
    ];

    for (const trip of trips) {
      await db.collection('trips').add(trip);
    }
    console.log('✓ Trips added');

    console.log('\n✅ Sample data successfully added to Firestore!');
    console.log('\nNote: Make sure to create a composite index for trips:');
    console.log('  Collection: trips');
    console.log('  Fields: driverId (Ascending), startTime (Descending)');
    console.log('\nYou can create this index in the Firebase Console or it will be prompted when you first query.');

  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    process.exit();
  }
}

// Run the script
addSampleData();