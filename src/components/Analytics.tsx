import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, Fuel, Car, Users, MapPin, PieChart } from 'lucide-react';

const Analytics: React.FC = () => {
  const kpis = [
    { label: 'Monthly Revenue', value: '₹2,37,85,000', change: '+12.5%', trend: 'up', icon: DollarSign },
    { label: 'Fleet Utilization', value: '87.3%', change: '+5.2%', trend: 'up', icon: Car },
    { label: 'Fuel Costs', value: '₹37,85,000', change: '-8.1%', trend: 'down', icon: Fuel },
    { label: 'Driver Efficiency', value: '94.6%', change: '+3.7%', trend: 'up', icon: Users },
  ];

  const chartData = [
    { month: 'Jan', revenue: 20500000, costs: 15000000 },
    { month: 'Feb', revenue: 21600000, costs: 14600000 },
    { month: 'Mar', revenue: 22300000, costs: 15200000 },
    { month: 'Apr', revenue: 23000000, costs: 14900000 },
    { month: 'May', revenue: 23785000, costs: 13800000 },
  ];

  const fleetMetrics = [
    { vehicle: 'Delivery Vans', count: 45, utilization: 89, avgDistance: '85 km', efficiency: 92 },
    { vehicle: 'Cargo Trucks', count: 28, utilization: 85, avgDistance: '120 km', efficiency: 88 },
    { vehicle: 'Pickup Trucks', count: 15, utilization: 91, avgDistance: '65 km', efficiency: 95 },
    { vehicle: 'Electric Vans', count: 8, utilization: 76, avgDistance: '75 km', efficiency: 98 },
  ];

  const fleetComposition = [
    { vehicle: 'Delivery Vans', count: 45, color: '#8b5cf6', percentage: 46.9 },
    { vehicle: 'Cargo Trucks', count: 28, color: '#06b6d4', percentage: 29.2 },
    { vehicle: 'Pickup Trucks', count: 15, color: '#10b981', percentage: 15.6 },
    { vehicle: 'Electric Vans', count: 8, color: '#f59e0b', percentage: 8.3 },
  ];

  const totalVehicles = fleetComposition.reduce((sum, item) => sum + item.count, 0);

  // Calculate cumulative percentages for pie chart segments
  let cumulativePercentage = 0;
  const pieSegments = fleetComposition.map(item => {
    const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
    cumulativePercentage += item.percentage;
    const endAngle = cumulativePercentage * 3.6;
    return {
      ...item,
      startAngle,
      endAngle,
      path: createPieSlice(50, 50, 40, startAngle, endAngle)
    };
  });

  function createPieSlice(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-3 rounded-xl">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    kpi.trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
              <div className="text-sm text-gray-600">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Revenue vs Costs</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {chartData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 w-12">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${(data.revenue / 300000) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${(data.costs / 300000) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">₹{(data.revenue / 100000).toFixed(0)}L</div>
                    <div className="text-xs text-red-600">₹{(data.costs / 100000).toFixed(0)}L</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Costs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Composition Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Fleet Composition</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg width="200" height="200" viewBox="0 0 100 100" className="transform -rotate-90">
                  {pieSegments.map((segment, index) => (
                    <path
                      key={index}
                      d={segment.path}
                      fill={segment.color}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalVehicles}</div>
                    <div className="text-sm text-gray-600">Total Vehicles</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {fleetComposition.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.vehicle}</div>
                    <div className="text-xs text-gray-600">{item.count} units ({item.percentage}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        {/* Fleet Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Fleet Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {fleetMetrics.map((metric, index) => (
                <div key={index} className="border-l-4 border-gradient-to-b from-purple-500 to-teal-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{metric.vehicle}</h4>
                    <span className="text-sm text-gray-500">{metric.count} units</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Utilization</div>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full"
                            style={{ width: `${metric.utilization}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{metric.utilization}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Avg Distance</div>
                      <div className="font-medium">{metric.avgDistance}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 mb-1">Efficiency</div>
                      <div className="font-medium text-green-600">{metric.efficiency}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-teal-500 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
            <p className="text-gray-600">Data-driven recommendations for fleet optimization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-orange-500 mr-2" />
              <h4 className="font-medium text-gray-900">Peak Hours Analysis</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Highest demand between 2-4 PM in Delhi NCR. Consider deploying 15% more vehicles during these hours.
            </p>
            <div className="text-xs text-gray-500">Potential revenue increase: +₹10,50,000/month</div>
          </div>

          <div className="bg-white/70 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <Fuel className="w-5 h-5 text-green-500 mr-2" />
              <h4 className="font-medium text-gray-900">Fuel Optimization</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Switch 8 more vehicles to electric. Estimated annual savings of ₹15,40,000 in fuel costs.
            </p>
            <div className="text-xs text-gray-500">ROI payback period: 2.3 years</div>
          </div>

          <div className="bg-white/70 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-900">Route Density</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Gurgaon district shows 40% higher demand. Consider opening a satellite depot there.
            </p>
            <div className="text-xs text-gray-500">Estimated delivery time reduction: 25%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;