import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Menu,
  Package,
  Clock,
  MapPin,
  Star,
  CreditCard,
  Bell,
  User,
  Search,
  Filter,
  Car,
  Truck,
  Zap,
  MessageCircle,
  Phone,
  Navigation,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Route,
  Send,
  Bot,
  Headphones as HeadphonesIcon,
  Mail
} from 'lucide-react';
import { vehicleAPI, customerAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

interface CustomerDashboardProps {
  onLogout: () => void;
}


const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('booking');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'ai', message: 'Hello! I\'m your AI assistant. How can I help you today?' },
    { id: 2, sender: 'user', message: 'I need help tracking my booking BK-001' },
    { id: 3, sender: 'ai', message: 'I found your booking BK-001! Your package is currently in transit and will arrive in approximately 18 minutes. Would you like me to show you the live tracking?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: '',
    deliveryLocation: '',
    pickupDate: '',
    pickupTime: '',
    packageWeight: 'Under 100kg',
    selectedVehicleId: '',
  });
  const [showVehicles, setShowVehicles] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableVehicles();
    fetchMyBookings();
  }, []);

  const fetchAvailableVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAvailableVehicles();
      setAvailableVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await customerAPI.getBookings();
      setMyBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const handleFindVehicles = () => {
    if (!bookingForm.pickupLocation || !bookingForm.deliveryLocation) {
      toast.error('Please enter pickup and delivery locations');
      return;
    }
    setShowVehicles(true);
    toast.success('Available vehicles loaded!');
  };

  const handleBookVehicle = async (vehicle: any) => {
    if (!bookingForm.pickupLocation || !bookingForm.deliveryLocation) {
      toast.error('Please enter pickup and delivery locations');
      return;
    }

    if (!bookingForm.pickupDate || !bookingForm.pickupTime) {
      toast.error('Please select pickup date and time');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        vehicleId: vehicle.id,
        pickupLocation: bookingForm.pickupLocation,
        deliveryLocation: bookingForm.deliveryLocation,
        scheduledPickupTime: `${bookingForm.pickupDate}T${bookingForm.pickupTime}`,
        cargoWeight: bookingForm.packageWeight,
        price: parseFloat(vehicle.capacity) * 100,
        notes: `Booking for ${vehicle.type} - ${vehicle.model}`,
      };

      await customerAPI.createBooking(bookingData);
      toast.success('Booking created successfully!');
      await fetchMyBookings();
      setBookingForm({
        pickupLocation: '',
        deliveryLocation: '',
        pickupDate: '',
        pickupTime: '',
        packageWeight: 'Under 100kg',
        selectedVehicleId: '',
      });
      setShowVehicles(false);
      setActiveTab('bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBooking = () => {
    setActiveTab('booking');
    setBookingForm({
      pickupLocation: '',
      deliveryLocation: '',
      pickupDate: '',
      pickupTime: '',
      packageWeight: 'Under 100kg',
      selectedVehicleId: '',
    });
    setShowVehicles(false);
  };

  const tabs = [
    { id: 'booking', label: 'Book Vehicle', icon: Car },
    { id: 'tracking', label: 'Live Tracking', icon: MapPin },
    { id: 'bookings', label: 'My Bookings', icon: Package },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'support', label: 'AI Support', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const vehicleTypes = [
    { 
      id: 'van', 
      name: 'Delivery Van', 
      capacity: '1.5 tons', 
      price: '₹15/km', 
      eta: '15 min',
      available: 12,
      image: '🚐',
      features: ['GPS Tracking', 'Climate Control', 'Secure Loading'],
      aiOptimized: true,
      savings: '12%'
    },
    { 
      id: 'truck', 
      name: 'Cargo Truck', 
      capacity: '5 tons', 
      price: '₹25/km', 
      eta: '20 min',
      available: 8,
      image: '🚛',
      features: ['Heavy Duty', 'GPS Tracking', 'Loading Assistance'],
      aiOptimized: true,
      savings: '18%'
    },
    { 
      id: 'pickup', 
      name: 'Pickup Truck', 
      capacity: '1 ton', 
      price: '₹12/km', 
      eta: '10 min',
      available: 15,
      image: '🛻',
      features: ['Quick Delivery', 'City Access', 'Flexible Loading'],
      aiOptimized: false,
      savings: '0%'
    },
    { 
      id: 'electric', 
      name: 'Electric Van', 
      capacity: '1.2 tons', 
      price: '₹18/km', 
      eta: '18 min',
      available: 5,
      image: '⚡',
      features: ['Eco-Friendly', 'Silent Operation', 'Cost Effective'],
      aiOptimized: true,
      savings: '25%'
    }
  ];

  const bookings = [
    {
      id: 'BK-001',
      status: 'In Transit',
      pickup: 'Delhi Warehouse',
      delivery: 'Connaught Place',
      driver: 'Rajesh Kumar',
      driverPhone: '+91 98765 43210',
      vehicle: 'FL-001',
      estimatedTime: '18 min',
      progress: 75,
      cost: '₹1,250',
      aiOptimized: true,
      currentLocation: 'India Gate Circle',
      speed: '45 km/h'
    },
    {
      id: 'BK-002',
      status: 'Scheduled',
      pickup: 'Gurgaon Hub',
      delivery: 'Cyber City',
      driver: 'Priya Sharma',
      driverPhone: '+91 98765 43211',
      vehicle: 'FL-002',
      estimatedTime: '2 hours',
      progress: 0,
      cost: '₹2,100',
      aiOptimized: true,
      currentLocation: 'Waiting at Hub',
      speed: '0 km/h'
    }
  ];

  const aiSuggestions = [
    {
      type: 'route',
      title: 'Optimal Route Found',
      description: 'AI suggests avoiding NH-8 due to heavy traffic. Alternative route saves 15 minutes.',
      savings: '₹180',
      icon: Route,
      confidence: '94%'
    },
    {
      type: 'time',
      title: 'Best Departure Time',
      description: 'Schedule pickup at 2:30 PM to avoid peak traffic and reduce delivery time by 20%.',
      savings: '25 min',
      icon: Clock,
      confidence: '87%'
    },
    {
      type: 'cost',
      title: 'Cost Optimization',
      description: 'Electric van available for 12% less cost with same delivery time.',
      savings: '₹240',
      icon: DollarSign,
      confidence: '91%'
    }
  ];

  const trafficAlerts = [
    {
      type: 'success',
      title: 'Optimal Route Active',
      message: 'AI has selected the fastest route, saving 12 minutes compared to standard route.',
      icon: CheckCircle,
      color: 'green'
    },
    {
      type: 'warning',
      title: 'Traffic Alert',
      message: 'Moderate traffic detected ahead. Driver has been notified of alternative route.',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      type: 'info',
      title: 'Predictive ETA',
      message: 'Based on current traffic patterns, delivery will arrive 3 minutes earlier than scheduled.',
      icon: Navigation,
      color: 'blue'
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = { id: Date.now(), sender: 'user', message: newMessage };
      setChatMessages([...chatMessages, userMessage]);
      setNewMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = { 
          id: Date.now() + 1, 
          sender: 'ai', 
          message: 'I understand your request. Let me help you with that right away!' 
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'booking':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Smart Vehicle Booking</h2>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">AI-Powered Optimization</span>
              </div>
            </div>

            {/* Smart Booking Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter pickup address"
                      value={bookingForm.pickupLocation}
                      onChange={(e) => setBookingForm({...bookingForm, pickupLocation: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter delivery address"
                      value={bookingForm.deliveryLocation}
                      onChange={(e) => setBookingForm({...bookingForm, deliveryLocation: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
                  <input
                    type="date"
                    value={bookingForm.pickupDate}
                    onChange={(e) => setBookingForm({...bookingForm, pickupDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                  <input
                    type="time"
                    value={bookingForm.pickupTime}
                    onChange={(e) => setBookingForm({...bookingForm, pickupTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Package Weight</label>
                  <select
                    value={bookingForm.packageWeight}
                    onChange={(e) => setBookingForm({...bookingForm, packageWeight: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Under 100kg</option>
                    <option>100kg - 500kg</option>
                    <option>500kg - 1 ton</option>
                    <option>1 ton - 5 tons</option>
                    <option>Over 5 tons</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleFindVehicles}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-teal-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
                <span>{loading ? 'Loading...' : 'Find AI-Optimized Vehicles'}</span>
              </button>
            </div>

            {/* AI Optimization Suggestions */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">AI Optimization Suggestions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div key={index} className="bg-white/70 rounded-xl p-4 hover:bg-white/90 transition-colors">
                      <div className="flex items-center mb-2">
                        <Icon className="w-5 h-5 text-purple-600 mr-2" />
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-green-600">Save: {suggestion.savings}</div>
                        <div className="text-xs text-gray-500">{suggestion.confidence} confidence</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available Vehicles with AI Recommendations */}
            {showVehicles && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableVehicles.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No vehicles available at the moment</p>
                </div>
              ) : (
                availableVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-2xl p-6 shadow-sm border border-purple-200 ring-2 ring-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{vehicle.type === 'TRUCK' ? '\ud83d\ude9b' : vehicle.type === 'VAN' ? '\ud83d\ude90' : '\ud83d\ude97'}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vehicle.registrationNumber}</h3>
                        <p className="text-sm text-gray-600">{vehicle.capacity} tons capacity</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">\u20b9{(vehicle.capacity * 100).toFixed(0)}</div>
                      <div className="text-sm text-gray-500">{vehicle.model}</div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">AI Recommended</span>
                    </div>
                    <p className="text-xs text-purple-700">Optimal vehicle for your route</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-medium text-green-600">{vehicle.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        GPS Tracking
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        Fuel: {vehicle.fuelLevel.toFixed(0)}%
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {vehicle.type}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookVehicle(vehicle)}
                    disabled={loading}
                    className="w-full py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-purple-600 to-teal-600 text-white hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Booking...' : 'Book AI-Optimized'}
                  </button>
                </div>
              ))
              )}
            </div>
            )}

            {/* Predictive Cost Estimation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Cost & Time Estimation</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">₹1,450</div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">32 min</div>
                  <div className="text-sm text-gray-600">Delivery Time</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Route className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-600">18.5 km</div>
                  <div className="text-sm text-gray-600">Distance</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-yellow-600">₹320</div>
                  <div className="text-sm text-gray-600">AI Savings</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tracking':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Real-Time Vehicle Tracking</h2>
            
            {/* Live Tracking Interface */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Live Tracking - BK-001</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Live</span>
                    </div>
                    <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                      Full Screen
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Interactive Map Placeholder */}
              <div className="h-80 bg-gradient-to-br from-blue-100 via-green-100 to-teal-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
                    <p className="text-gray-700 font-medium">Interactive Real-Time Map</p>
                    <p className="text-sm text-gray-500">Vehicle FL-001 • Current Location: India Gate Circle</p>
                  </div>
                </div>
                
                {/* Simulated route line */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-0.5 bg-blue-500 opacity-60 transform rotate-45"></div>
                <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Car className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Real-time Stats */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Navigation className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-blue-600">8.2 km</div>
                    <div className="text-sm text-gray-600">Distance Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-green-600">18 min</div>
                    <div className="text-sm text-gray-600">ETA</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-purple-600">45 km/h</div>
                    <div className="text-sm text-gray-600">Current Speed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <Route className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-yellow-600">Optimal</div>
                    <div className="text-sm text-gray-600">AI Route</div>
                  </div>
                </div>

                {/* Driver Contact */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Rajesh Kumar</div>
                        <div className="text-sm text-gray-600">Driver • Vehicle FL-001</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Status Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Live Status Updates</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">Package Picked Up</div>
                        <div className="text-sm text-gray-600">Delhi Warehouse - 2:30 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="font-medium text-gray-900">In Transit - AI Optimized Route</div>
                        <div className="text-sm text-gray-600">Currently at India Gate Circle - 3:45 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-500">Out for Delivery</div>
                        <div className="text-sm text-gray-500">Expected - 4:15 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-500">Delivered</div>
                        <div className="text-sm text-gray-500">Expected - 4:30 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Traffic & Route Intelligence */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Traffic & Route Intelligence</h3>
              <div className="space-y-4">
                {trafficAlerts.map((alert, index) => {
                  const Icon = alert.icon;
                  const colorClasses = {
                    green: 'bg-green-50 text-green-900 border-green-200',
                    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
                    blue: 'bg-blue-50 text-blue-900 border-blue-200'
                  };
                  const iconColors = {
                    green: 'text-green-600',
                    yellow: 'text-yellow-600',
                    blue: 'text-blue-600'
                  };
                  
                  return (
                    <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border ${colorClasses[alert.color]}`}>
                      <Icon className={`w-5 h-5 mt-0.5 ${iconColors[alert.color]}`} />
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm opacity-80">{alert.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
              <button
                onClick={handleNewBooking}
                className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-teal-700 transition-colors"
              >
                New Booking
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">Create your first booking to get started</p>
                <button
                  onClick={handleNewBooking}
                  className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-teal-700 transition-colors"
                >
                  Create Booking
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Package className="w-6 h-6 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.id}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{booking.price}</div>
                        <div className="text-sm text-gray-500">Vehicle: {booking.vehicleId}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Pickup Location</div>
                        <div className="font-medium text-gray-900">{booking.pickupLocation}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Delivery Location</div>
                        <div className="font-medium text-gray-900">{booking.deliveryLocation}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Scheduled Pickup</div>
                        <div className="font-medium text-gray-900">
                          {new Date(booking.scheduledPickupTime).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Cargo Weight</div>
                        <div className="font-medium text-gray-900">{booking.cargoWeight}</div>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Notes</div>
                        <div className="text-sm text-gray-900">{booking.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Customer Support</h2>
            
            {/* AI Chatbot Interface */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">NeuroFleet AI Assistant</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">Online • Response time: &lt;2s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex items-start space-x-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`rounded-lg p-3 max-w-xs ${message.sender === 'ai' ? 'bg-gray-100 text-gray-800' : 'bg-gradient-to-r from-purple-500 to-teal-500 text-white'}`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-purple-600 to-teal-600 text-white p-2 rounded-lg hover:from-purple-700 hover:to-teal-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">24/7 Phone Support</h3>
                <p className="text-sm text-gray-600 mb-4">Speak with our support team anytime</p>
                <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                  Call Now
                </button>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <HeadphonesIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-4">Get instant help from our team</p>
                <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                  Start Chat
                </button>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
                <p className="text-sm text-gray-600 mb-4">Share your experience with us</p>
                <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
                  Give Feedback
                </button>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">How do I track my booking in real-time?</h4>
                  <p className="text-sm text-gray-600">You can track your booking using the Live Tracking tab or by clicking "Track Live" on your booking card.</p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">What is AI optimization and how does it save money?</h4>
                  <p className="text-sm text-gray-600">Our AI analyzes traffic patterns, weather, and route conditions to find the most efficient path, reducing time and fuel costs.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I contact my driver directly?</h4>
                  <p className="text-sm text-gray-600">Yes, you can call or message your driver directly through the booking details or tracking interface.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Booking History & Analytics</h2>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-purple-600">47</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
                <div className="text-xs text-green-600 mt-1">+12% this month</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-green-600">₹1,24,500</div>
                <div className="text-sm text-gray-600">Total Spent</div>
                <div className="text-xs text-green-600 mt-1">Avg ₹2,650/booking</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-blue-600">4.8</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
                <div className="text-xs text-blue-600 mt-1">98% satisfaction</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-yellow-600">₹18,200</div>
                <div className="text-sm text-gray-600">AI Savings</div>
                <div className="text-xs text-yellow-600 mt-1">15% cost reduction</div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">AI Savings</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { id: 'BK-047', date: '2024-01-15', route: 'Delhi → Gurgaon', cost: '₹2,150', savings: '₹320', rating: 5, status: 'Delivered' },
                      { id: 'BK-046', date: '2024-01-14', route: 'Noida → Delhi', cost: '₹1,850', savings: '₹280', rating: 4, status: 'Delivered' },
                      { id: 'BK-045', date: '2024-01-13', route: 'Gurgaon → Faridabad', cost: '₹3,200', savings: '₹450', rating: 5, status: 'Delivered' },
                      { id: 'BK-044', date: '2024-01-12', route: 'Delhi → Noida', cost: '₹1,650', savings: '₹240', rating: 4, status: 'Delivered' }
                    ].map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{booking.id}</td>
                        <td className="px-6 py-4 text-gray-600">{booking.date}</td>
                        <td className="px-6 py-4 text-gray-600">{booking.route}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{booking.cost}</td>
                        <td className="px-6 py-4 font-medium text-green-600">{booking.savings}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < booking.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john.doe@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      defaultValue="Tech Solutions Ltd."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences & Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">SMS Updates</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">AI Optimization Alerts</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Tamil</option>
                      <option>Telugu</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-teal-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-purple-600">NeuroFleetX</h1>
                <p className="text-xs text-gray-500">Customer Portal</p>
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

export default CustomerDashboard;