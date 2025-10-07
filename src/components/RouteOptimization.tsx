import React from 'react';
import { Brain, Route, Clock, Fuel, TrendingDown, Navigation, Zap, MapPin } from 'lucide-react';

const RouteOptimization: React.FC = () => {
  const optimizedRoutes = [
    {
      id: 'RT-001',
      origin: 'Delhi Central Warehouse',
      destination: 'Connaught Place Hub',
      aiSavings: '23%',
      timeSaved: '15 min',
      fuelSaved: '3.2L',
      distance: '18.5 km',
      status: 'Active'
    },
    {
      id: 'RT-002',
      origin: 'Gurgaon Distribution Center',
      destination: 'DLF Mall',
      aiSavings: '18%',
      timeSaved: '12 min',
      fuelSaved: '2.8L',
      distance: '25.2 km',
      status: 'Optimizing'
    },
    {
      id: 'RT-003',
      origin: 'Noida Terminal',
      destination: 'Greater Noida Industrial Zone',
      aiSavings: '31%',
      timeSaved: '22 min',
      fuelSaved: '4.1L',
      distance: '32.8 km',
      status: 'Completed'
    },
  ];

  const aiMetrics = [
    { label: 'Routes Optimized Today', value: '47', icon: Route },
    { label: 'Total Time Saved', value: '3.2 hrs', icon: Clock },
    { label: 'Fuel Efficiency Gain', value: '24%', icon: Fuel },
    { label: 'AI Accuracy Rate', value: '96.8%', icon: Brain },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* AI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {aiMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-3 rounded-xl">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* AI Route Optimizer */}
      <div className="bg-gradient-to-r from-purple-900 to-teal-900 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center mb-6">
          <div className="bg-white/20 p-3 rounded-xl">
            <Brain className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">AI Route Intelligence</h2>
            <p className="text-white/80">Advanced neural networks optimizing your fleet routes in real-time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 text-yellow-400 mr-3" />
              <h3 className="text-lg font-semibold">Real-time Analysis</h3>
            </div>
            <p className="text-white/80">Processing traffic, weather, and delivery constraints simultaneously</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Navigation className="w-6 h-6 text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold">Dynamic Routing</h3>
            </div>
            <p className="text-white/80">Routes adapt automatically to changing conditions and priorities</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <TrendingDown className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-lg font-semibold">Cost Reduction</h3>
            </div>
            <p className="text-white/80">Average 25% reduction in fuel costs and delivery times</p>
          </div>
        </div>
      </div>

      {/* Optimized Routes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AI-Optimized Routes</h3>
            <button className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-teal-700 transition-colors">
              Generate New Routes
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journey</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Savings</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Saved</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Saved</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {optimizedRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-2 rounded-lg mr-3">
                        <Route className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{route.id}</div>
                        <div className="text-sm text-gray-500">{route.distance}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {route.origin}
                    </div>
                    <div className="text-sm text-gray-500">
                      → {route.destination}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {route.aiSavings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{route.timeSaved}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{route.fuelSaved}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      route.status === 'Active' ? 'bg-green-100 text-green-800' :
                      route.status === 'Optimizing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {route.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Visualization */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Route Comparison</h3>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Traditional Route vs AI-Optimized</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-red-400 mr-2"></div>
                  <span className="text-sm text-gray-600">Traditional</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-gradient-to-r from-purple-500 to-teal-500 mr-2"></div>
                  <span className="text-sm text-gray-600">AI-Optimized</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">35.2 km</div>
                <div className="text-sm text-gray-600 mb-2">Traditional Distance</div>
                <div className="h-2 bg-red-200 rounded"></div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">25.8 km</div>
                <div className="text-sm text-gray-600 mb-2">AI-Optimized Distance</div>
                <div className="h-2 bg-gradient-to-r from-purple-400 to-teal-400 rounded"></div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">26%</div>
                <div className="text-sm text-gray-600">Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;