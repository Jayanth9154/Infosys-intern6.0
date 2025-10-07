import React, { useState, useEffect } from 'react';
import { LogOut, Menu, Truck, MapPin, Clock, CheckCircle, AlertTriangle, Navigation, Fuel, User, Phone, Star, TrendingUp, DollarSign, Wrench, Battery, Thermometer, Gauge, MessageCircle, Bell, Route, Zap, Activity, Shield, Calendar, Target } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { vehicleAPI, customerAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverDashboardProps {
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('current');
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignedBookings();
  }, []);

  const fetchAssignedBookings = async () => {
    try {
      const response = await customerAPI.getBookings();
      setAssignedBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const tabs = [
    { id: 'current', label: 'Current Trip', icon: Navigation },
    { id: 'routes', label: 'AI Routes', icon: Route },
    { id: 'vehicle', label: 'Vehicle Health', icon: Activity },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'support', label: 'Support', icon: MessageCircle }
  ];

  const currentTrip = {
    id: 'TR-001',
    bookingId: 'BK-001',
    pickup: 'Delhi Central Warehouse',
    delivery: 'Connaught Place Hub',
    customer: 'Tech Solutions Ltd.',
    customerPhone: '+91 98765 43210',
    distance: '18.5 km',
    estimatedTime: '25 min',
    progress: 75,
    status: 'In Transit',
    aiOptimized: true,
    timeSaved: '12 min',
    fuelSaved: '2.3L'
  };

  const upcomingTrips = [
    {
      id: 'TR-002',
      time: '4:30 PM',
      pickup: 'Gurgaon Distribution Center',
      delivery: 'DLF Mall',
      customer: 'Retail Corp',
      distance: '12.3 km',
      estimatedEarnings: '₹850',
      aiOptimized: true
    },
    {
      id: 'TR-003',
      time: '6:00 PM',
      pickup: 'Noida Depot',
      delivery: 'Greater Noida',
      customer: 'Manufacturing Ltd.',
      distance: '25.8 km',
      estimatedEarnings: '₹1,200',
      aiOptimized: false
    }
  ];

  const vehicleHealth = {
    overall: 'Good',
    battery: 85,
    fuel: 78,
    engine: 'Normal',
    temperature: 92,
    pressure: 'Normal',
    mileage: '15.2 km/l',
    lastService: '2024-01-10',
    nextService: '2024-02-10'
  };

  const iotAlerts = [
    {
      type: 'warning',
      title: 'Tire Pressure Low',
      message: 'Front left tire pressure is 5 PSI below optimal. Consider checking at next stop.',
      priority: 'Medium',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      type: 'info',
      title: 'Fuel Efficiency',
      message: 'Current trip fuel efficiency is 8% better than average due to AI route optimization.',
      priority: 'Low',
      icon: Fuel,
      color: 'blue'
    },
    {
      type: 'success',
      title: 'Engine Performance',
      message: 'Engine running optimally. All systems normal.',
      priority: 'Low',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const trafficAlerts = [
    {
      type: 'warning',
      title: 'Heavy Traffic Ahead',
      message: 'Congestion detected on NH-8. Alternative route suggested.',
      eta: '5 min',
      action: 'Reroute Available'
    },
    {
      type: 'info',
      title: 'Weather Update',
      message: 'Light rain expected in 20 minutes. Drive safely.',
      eta: '20 min',
      action: 'Acknowledged'
    }
  ];

  const tripHistory = [
    { id: 'TR-098', date: '2024-01-15', route: 'Delhi → Mumbai', distance: '1,420 km', rating: 5, earnings: '₹8,500', aiOptimized: true },
    { id: 'TR-097', date: '2024-01-14', route: 'Gurgaon → Bangalore', distance: '2,150 km', rating: 4, earnings: '₹12,300', aiOptimized: true },
    { id: 'TR-096', date: '2024-01-13', route: 'Noida → Chennai', distance: '2,180 km', rating: 5, earnings: '₹13,200', aiOptimized: false },
    { id: 'TR-095', date: '2024-01-12', route: 'Delhi → Kolkata', distance: '1,470 km', rating: 4, earnings: '₹9,800', aiOptimized: true }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'current':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Current Trip</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </div>

            {/* Current Trip Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-3 rounded-xl">
                    <Truck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentTrip.id}</h3>
                    <p className="text-sm text-gray-600">Booking: {currentTrip.bookingId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentTrip.status}
                  </span>
                  {currentTrip.aiOptimized && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      AI Route
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Pickup Location</div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">{currentTrip.pickup}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Delivery Location</div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-900">{currentTrip.delivery}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{currentTrip.distance}</div>
                  <div className="text-sm text-gray-600">Distance</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{currentTrip.estimatedTime}</div>
                  <div className="text-sm text-gray-600">ETA</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{currentTrip.progress}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{currentTrip.timeSaved}</div>
                  <div className="text-sm text-gray-600">Time Saved</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Trip Progress</span>
                  <span className="text-sm font-medium text-gray-900">{currentTrip.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${currentTrip.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Customer</div>
                  <div className="font-medium text-gray-900">{currentTrip.customer}</div>
                </div>
                <div className="flex space-x-3">
                  <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Call Customer</span>
                  </button>
                  <button className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-teal-700 transition-colors">
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Navigation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Navigation</h3>

              <div className="h-64 rounded-xl mb-4 overflow-hidden">
                <MapContainer
                  center={[28.6139, 77.2090]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  <Marker position={[28.6139, 77.2090]}>
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold text-gray-900 mb-1">Pickup: Delhi Central Warehouse</div>
                        <div className="text-sm text-gray-600">Current location</div>
                      </div>
                    </Popup>
                  </Marker>

                  <Marker position={[28.6304, 77.2177]}>
                    <Popup>
                      <div className="p-2">
                        <div className="font-semibold text-gray-900 mb-1">Delivery: Connaught Place Hub</div>
                        <div className="text-sm text-gray-600">Destination</div>
                      </div>
                    </Popup>
                  </Marker>

                  <Polyline
                    positions={[
                      [28.6139, 77.2090],
                      [28.6200, 77.2150],
                      [28.6304, 77.2177]
                    ]}
                    pathOptions={{
                      color: '#8b5cf6',
                      weight: 4,
                      opacity: 0.8
                    }}
                  />
                </MapContainer>
              </div>

              {/* Traffic Alerts */}
              <div className="space-y-3">
                {trafficAlerts.map((alert, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-5 h-5 ${alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <div>
                        <div className={`font-medium ${alert.type === 'warning' ? 'text-yellow-900' : 'text-blue-900'}`}>
                          {alert.title}
                        </div>
                        <div className={`text-sm ${alert.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}`}>
                          {alert.message}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
                        ETA: {alert.eta}
                      </div>
                      <button className={`text-xs px-2 py-1 rounded ${alert.type === 'warning' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
                        {alert.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Bookings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Customer Bookings</h3>

              {assignedBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No bookings assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="font-semibold text-gray-900">{booking.id}</div>
                            <div className="text-sm text-gray-600">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Vehicle</div>
                          <div className="font-medium text-gray-900">{booking.vehicleId}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Pickup</div>
                          <div className="font-medium text-gray-900">{booking.pickupLocation}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Delivery</div>
                          <div className="font-medium text-gray-900">{booking.deliveryLocation}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Scheduled Pickup</div>
                          <div className="text-sm text-gray-900">
                            {new Date(booking.scheduledPickupTime).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Cargo Weight</div>
                          <div className="text-sm text-gray-900">{booking.cargoWeight}</div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'routes':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI-Optimized Routes</h2>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Smart Route Planning</span>
              </div>
            </div>

            {/* Route Optimization Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Route className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-600">23</div>
                <div className="text-sm text-gray-600">Routes Today</div>
                <div className="text-xs text-green-600 mt-1">+15% efficiency</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-600">2.5 hrs</div>
                <div className="text-sm text-gray-600">Time Saved</div>
                <div className="text-xs text-blue-600 mt-1">AI optimization</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Fuel className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-600">18.5L</div>
                <div className="text-sm text-gray-600">Fuel Saved</div>
                <div className="text-xs text-green-600 mt-1">₹1,850 saved</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-yellow-600">94%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-xs text-yellow-600 mt-1">AI accuracy</div>
              </div>
            </div>

            {/* Current Route Analysis */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Current Route Analysis</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Route className="w-5 h-5 text-purple-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Optimal Path</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">AI selected route avoids 3 traffic congestion points</p>
                  <div className="text-sm font-medium text-green-600">12 min faster</div>
                </div>
                
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Fuel className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Fuel Efficiency</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Route optimized for minimal fuel consumption</p>
                  <div className="text-sm font-medium text-green-600">2.3L saved</div>
                </div>
                
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Safety Score</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Route selected for optimal safety conditions</p>
                  <div className="text-sm font-medium text-blue-600">98% safe</div>
                </div>
              </div>
            </div>

            {/* Upcoming Routes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Optimized Routes</h3>
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-semibold text-gray-900">{trip.time} - {trip.id}</div>
                          <div className="text-sm text-gray-600">{trip.customer}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {trip.aiOptimized && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            AI Route
                          </span>
                        )}
                        <span className="text-sm font-medium text-green-600">{trip.estimatedEarnings}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Route</div>
                        <div className="font-medium text-gray-900">{trip.pickup} → {trip.delivery}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Distance</div>
                        <div className="font-medium text-gray-900">{trip.distance}</div>
                      </div>
                    </div>
                    
                    {trip.aiOptimized && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-800">
                          <strong>AI Optimization:</strong> Route saves 8 minutes and ₹120 in fuel costs
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Vehicle Health & IoT Diagnostics</h2>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Real-time Monitoring</span>
              </div>
            </div>

            {/* Vehicle Status Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle FL-001 Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicleHealth.overall === 'Good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {vehicleHealth.overall}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Battery className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-green-600">{vehicleHealth.battery}%</div>
                  <div className="text-sm text-gray-600">Battery Level</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vehicleHealth.battery}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Fuel className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-blue-600">{vehicleHealth.fuel}%</div>
                  <div className="text-sm text-gray-600">Fuel Level</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vehicleHealth.fuel}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <Thermometer className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-yellow-600">{vehicleHealth.temperature}°C</div>
                  <div className="text-sm text-gray-600">Engine Temp</div>
                  <div className="text-xs text-green-600 mt-1">Normal Range</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Gauge className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-purple-600">{vehicleHealth.mileage}</div>
                  <div className="text-sm text-gray-600">Fuel Efficiency</div>
                  <div className="text-xs text-green-600 mt-1">Above Average</div>
                </div>
              </div>
            </div>

            {/* IoT Diagnostic Alerts */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">IoT Diagnostic Alerts</h3>
              <div className="space-y-4">
                {iotAlerts.map((alert, index) => {
                  const Icon = alert.icon;
                  const colorClasses = {
                    yellow: 'bg-yellow-50 border-yellow-200',
                    blue: 'bg-blue-50 border-blue-200',
                    green: 'bg-green-50 border-green-200'
                  };
                  const iconColors = {
                    yellow: 'text-yellow-600',
                    blue: 'text-blue-600',
                    green: 'text-green-600'
                  };
                  const textColors = {
                    yellow: 'text-yellow-900',
                    blue: 'text-blue-900',
                    green: 'text-green-900'
                  };
                  
                  return (
                    <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border ${colorClasses[alert.color]}`}>
                      <Icon className={`w-5 h-5 mt-0.5 ${iconColors[alert.color]}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${textColors[alert.color]}`}>{alert.title}</div>
                        <div className={`text-sm opacity-80 ${textColors[alert.color]}`}>{alert.message}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${alert.color === 'yellow' ? 'bg-yellow-200 text-yellow-800' : alert.color === 'blue' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                            {alert.priority} Priority
                          </span>
                          {alert.type === 'warning' && (
                            <button className="text-xs text-yellow-700 hover:text-yellow-800 font-medium">
                              Schedule Service
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Wrench className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Last Service</div>
                      <div className="text-sm text-gray-600">{vehicleHealth.lastService}</div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-800">
                      <strong>Completed:</strong> Oil change, brake inspection, tire rotation
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Next Service</div>
                      <div className="text-sm text-gray-600">{vehicleHealth.nextService}</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Scheduled:</strong> Full inspection, filter replacement
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">2,847 km</div>
                  <div className="text-sm text-gray-600">Distance This Month</div>
                  <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">47 hrs</div>
                  <div className="text-sm text-gray-600">Drive Time</div>
                  <div className="text-xs text-blue-600 mt-1">Avg 60.6 km/h</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">98.5%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                  <div className="text-xs text-green-600 mt-1">Excellent</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
            
            <div className="space-y-4">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-3 rounded-xl">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{trip.time}</div>
                        <div className="text-sm text-gray-600">{trip.id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{trip.distance}</div>
                      <div className="text-sm text-gray-600">Distance</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Pickup</div>
                      <div className="font-medium text-gray-900">{trip.pickup}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Delivery</div>
                      <div className="font-medium text-gray-900">{trip.delivery}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Customer</div>
                      <div className="font-medium text-gray-900">{trip.customer}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Est. Earnings</div>
                        <div className="font-medium text-green-600">{trip.estimatedEarnings}</div>
                      </div>
                      {trip.aiOptimized && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          AI Route
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Important Notes</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Vehicle FL-001 scheduled for maintenance after 6 PM trip</li>
                <li>• Heavy traffic expected on Delhi-Gurgaon route between 5-7 PM</li>
                <li>• Customer at DLF Mall prefers delivery at loading dock B</li>
                <li>• Weather alert: Light rain expected after 7 PM</li>
              </ul>
            </div>
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Earnings & Performance</h2>
              <div className="text-sm text-gray-600">
                Total This Month: <span className="font-semibold text-green-600">₹1,25,400</span>
              </div>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-600">₹4,250</div>
                <div className="text-sm text-gray-600">Today's Earnings</div>
                <div className="text-xs text-green-600 mt-1">+8% vs yesterday</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-gray-600">Trips Completed</div>
                <div className="text-xs text-blue-600 mt-1">This month</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-yellow-600">4.8</div>
                <div className="text-sm text-gray-600">Average Rating</div>
                <div className="text-xs text-yellow-600 mt-1">98% satisfaction</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-600">98.5%</div>
                <div className="text-sm text-gray-600">On-Time Rate</div>
                <div className="text-xs text-purple-600 mt-1">Excellent</div>
              </div>
            </div>

            {/* Trip History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Trip History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">AI Route</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tripHistory.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{trip.id}</td>
                        <td className="px-6 py-4 text-gray-600">{trip.date}</td>
                        <td className="px-6 py-4 text-gray-600">{trip.route}</td>
                        <td className="px-6 py-4 text-gray-600">{trip.distance}</td>
                        <td className="px-6 py-4 font-medium text-green-600">{trip.earnings}</td>
                        <td className="px-6 py-4">
                          {trip.aiOptimized ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center w-fit">
                              <Zap className="w-3 h-3 mr-1" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < trip.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Zap className="w-5 h-5 text-purple-600 mr-2" />
                    <h4 className="font-medium text-gray-900">AI Route Benefits</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Using AI routes increased your earnings by 18% this month</p>
                  <div className="text-sm font-medium text-green-600">+₹22,500 extra</div>
                </div>
                
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Customer Satisfaction</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Your rating improved by 0.3 points this month</p>
                  <div className="text-sm font-medium text-yellow-600">Top 5% drivers</div>
                </div>
                
                <div className="bg-white/70 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Efficiency</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">98.5% on-time delivery rate this month</p>
                  <div className="text-sm font-medium text-blue-600">Excellent performance</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support & Communication</h2>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-sm text-gray-600 mb-4">24/7 emergency assistance</p>
                <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                  Emergency Call
                </button>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Fleet Manager</h3>
                <p className="text-sm text-gray-600 mb-4">Direct communication</p>
                <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                  Send Message
                </button>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <Wrench className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Technical Support</h3>
                <p className="text-sm text-gray-600 mb-4">Vehicle & app issues</p>
                <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
                  Report Issue
                </button>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">Fleet Manager</div>
                      <div className="text-xs text-gray-500">2 hours ago</div>
                    </div>
                    <div className="text-sm text-gray-700">Great job on maintaining your 98% on-time rate this month! Keep up the excellent work.</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">Maintenance Team</div>
                      <div className="text-xs text-gray-500">1 day ago</div>
                    </div>
                    <div className="text-sm text-gray-700">Vehicle FL-001 maintenance scheduled for Feb 10th. Please bring it to the depot by 9 AM.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">How do AI routes help me earn more?</h4>
                  <p className="text-sm text-gray-600">AI routes optimize for shortest time and distance, allowing you to complete more trips per day while saving fuel costs.</p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">What should I do if my vehicle shows a warning?</h4>
                  <p className="text-sm text-gray-600">Check the Vehicle Health tab for details. For urgent issues, contact emergency support immediately.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How are my earnings calculated?</h4>
                  <p className="text-sm text-gray-600">Earnings are based on distance, time, and performance bonuses. AI-optimized routes often include efficiency bonuses.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-purple-600">NeuroFleetX</h1>
                <p className="text-xs text-gray-500">Driver Portal</p>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Menu className="h-6 w-6" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;