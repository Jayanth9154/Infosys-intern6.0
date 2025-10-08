import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function RouteOptimization() {
  const { currentUser } = useContext(AuthContext);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState('time');
  const [trafficData, setTrafficData] = useState({});
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);

  // Mock traffic data for demonstration
  const generateTrafficData = () => {
    const locations = [
      { name: 'Downtown', lat: 28.6139, lng: 77.2090, congestion: Math.random() * 100 },
      { name: 'Airport', lat: 28.5562, lng: 77.1000, congestion: Math.random() * 100 },
      { name: 'Tech Park', lat: 28.4595, lng: 77.0266, congestion: Math.random() * 100 },
      { name: 'Mall', lat: 28.5355, lng: 77.3910, congestion: Math.random() * 100 },
      { name: 'Hospital', lat: 28.6692, lng: 77.4538, congestion: Math.random() * 100 },
      { name: 'University', lat: 28.6448, lng: 77.2167, congestion: Math.random() * 100 }
    ];
    
    return locations.reduce((acc, location) => {
      acc[location.name] = {
        ...location,
        congestion: Math.floor(location.congestion),
        avgSpeed: Math.floor(60 - (location.congestion * 0.4)), // Speed inversely related to congestion
        incidents: Math.floor(Math.random() * 3) // 0-2 incidents
      };
      return acc;
    }, {});
  };

  // Dijkstra's algorithm implementation
  const dijkstraAlgorithm = (graph, start, end) => {
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    // Initialize distances
    Object.keys(graph).forEach(node => {
      distances[node] = node === start ? 0 : Infinity;
      previous[node] = null;
      unvisited.add(node);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = null;
      let minDistance = Infinity;
      
      unvisited.forEach(node => {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      });

      if (current === null || current === end) break;

      unvisited.delete(current);

      // Update distances to neighbors
      if (graph[current]) {
        Object.keys(graph[current]).forEach(neighbor => {
          if (unvisited.has(neighbor)) {
            const weight = graph[current][neighbor];
            const newDistance = distances[current] + weight;
            
            if (newDistance < distances[neighbor]) {
              distances[neighbor] = newDistance;
              previous[neighbor] = current;
            }
          }
        });
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    return {
      path: path[0] === start ? path : [],
      distance: distances[end],
      totalTime: distances[end]
    };
  };

  // ML-based ETA predictor (simplified simulation)
  const predictETA = (route, trafficConditions, weatherFactor = 1, timeOfDay = 'normal') => {
    const baseTime = route.distance * 2; // Base: 2 minutes per km
    
    // Traffic impact
    const avgCongestion = route.path.reduce((sum, location) => {
      return sum + (trafficConditions[location]?.congestion || 0);
    }, 0) / route.path.length;
    
    const trafficMultiplier = 1 + (avgCongestion / 100);
    
    // Time of day impact
    const timeMultipliers = {
      'rush_hour': 1.5,
      'normal': 1.0,
      'late_night': 0.8
    };
    
    const timeMultiplier = timeMultipliers[timeOfDay] || 1.0;
    
    // Weather impact
    const weatherMultiplier = weatherFactor;
    
    // ML confidence simulation
    const confidence = Math.max(0.6, 1 - (avgCongestion / 200));
    
    const predictedTime = baseTime * trafficMultiplier * timeMultiplier * weatherMultiplier;
    
    return {
      estimatedTime: Math.round(predictedTime),
      confidence: Math.round(confidence * 100),
      factors: {
        traffic: Math.round((trafficMultiplier - 1) * 100),
        timeOfDay: Math.round((timeMultiplier - 1) * 100),
        weather: Math.round((weatherMultiplier - 1) * 100)
      }
    };
  };

  // Generate route graph based on traffic data
  const generateRouteGraph = (trafficData) => {
    const graph = {};
    const locations = Object.keys(trafficData);
    
    locations.forEach(from => {
      graph[from] = {};
      locations.forEach(to => {
        if (from !== to) {
          const fromData = trafficData[from];
          const toData = trafficData[to];
          
          // Calculate distance (simplified)
          const distance = Math.sqrt(
            Math.pow(fromData.lat - toData.lat, 2) + 
            Math.pow(fromData.lng - toData.lng, 2)
          ) * 111; // Rough km conversion
          
          // Weight based on optimization mode
          let weight = distance;
          if (optimizationMode === 'time') {
            weight = distance / Math.max(1, fromData.avgSpeed / 60); // Time in hours
          } else if (optimizationMode === 'fuel') {
            weight = distance * (1 + fromData.congestion / 200); // Fuel consumption increases with congestion
          } else if (optimizationMode === 'cost') {
            weight = distance * 0.5 + (fromData.congestion * 0.1); // Distance cost + congestion cost
          }
          
          graph[from][to] = weight;
        }
      });
    });
    
    return graph;
  };

  // Optimize routes
  const optimizeRoutes = () => {
    setLoading(true);
    
    const traffic = generateTrafficData();
    setTrafficData(traffic);
    
    const graph = generateRouteGraph(traffic);
    const locations = Object.keys(traffic);
    const optimizedRoutes = [];
    
    // Generate multiple route options
    for (let i = 0; i < 3; i++) {
      const start = locations[Math.floor(Math.random() * locations.length)];
      let end = locations[Math.floor(Math.random() * locations.length)];
      while (end === start) {
        end = locations[Math.floor(Math.random() * locations.length)];
      }
      
      const dijkstraResult = dijkstraAlgorithm(graph, start, end);
      
      if (dijkstraResult.path.length > 0) {
        const eta = predictETA(dijkstraResult, traffic, 1.0, 'normal');
        
        optimizedRoutes.push({
          id: i + 1,
          name: `Route ${i + 1}: ${start} → ${end}`,
          start,
          end,
          path: dijkstraResult.path,
          distance: Math.round(dijkstraResult.distance * 10) / 10,
          estimatedTime: eta.estimatedTime,
          confidence: eta.confidence,
          factors: eta.factors,
          optimizationScore: Math.round((100 - dijkstraResult.distance) * (eta.confidence / 100)),
          fuelEfficiency: Math.round(100 - (dijkstraResult.distance * 2)),
          costEstimate: Math.round(dijkstraResult.distance * 2.5 + 10)
        });
      }
    }
    
    // Generate heatmap data
    const heatmap = locations.map(location => ({
      ...traffic[location],
      intensity: traffic[location].congestion / 100
    }));
    
    setRoutes(optimizedRoutes);
    setHeatmapData(heatmap);
    setLoading(false);
  };

  // Analyze selected route
  const analyzeRoute = (route) => {
    const analysis = {
      totalStops: route.path.length,
      averageCongestion: route.path.reduce((sum, location) => {
        return sum + (trafficData[location]?.congestion || 0);
      }, 0) / route.path.length,
      riskFactors: [],
      recommendations: []
    };
    
    // Identify risk factors
    route.path.forEach(location => {
      const locationData = trafficData[location];
      if (locationData.congestion > 70) {
        analysis.riskFactors.push(`High congestion at ${location} (${locationData.congestion}%)`);
      }
      if (locationData.incidents > 0) {
        analysis.riskFactors.push(`${locationData.incidents} incident(s) reported at ${location}`);
      }
    });
    
    // Generate recommendations
    if (analysis.averageCongestion > 60) {
      analysis.recommendations.push('Consider alternative departure time to avoid peak traffic');
    }
    if (route.confidence < 80) {
      analysis.recommendations.push('Route prediction has lower confidence - monitor real-time updates');
    }
    if (route.fuelEfficiency < 70) {
      analysis.recommendations.push('Consider electric vehicle for better efficiency on this route');
    }
    
    setRouteAnalysis(analysis);
  };

  useEffect(() => {
    optimizeRoutes();
  }, [optimizationMode]);

  return (
    <div className="panel">
      <div className="route-header">
        <h2>AI Route & Load Optimization Engine</h2>
        <div className="optimization-controls">
          <label>Optimize for:</label>
          <select
            className="select"
            value={optimizationMode}
            onChange={(e) => setOptimizationMode(e.target.value)}
          >
            <option value="time">Shortest Time</option>
            <option value="distance">Shortest Distance</option>
            <option value="fuel">Fuel Efficiency</option>
            <option value="cost">Lowest Cost</option>
          </select>
          <button className="button primary" onClick={optimizeRoutes} disabled={loading}>
            {loading ? 'Optimizing...' : 'Optimize Routes'}
          </button>
        </div>
      </div>

      {/* Traffic Heatmap */}
      <div className="heatmap-section">
        <h3>Traffic Heatmap</h3>
        <div className="heatmap-container">
          <div className="heatmap-grid">
            {heatmapData.map(location => (
              <div
                key={location.name}
                className="heatmap-cell"
                style={{
                  backgroundColor: `rgba(239, 68, 68, ${location.intensity})`,
                  gridColumn: Math.floor(location.lng * 10) % 6 + 1,
                  gridRow: Math.floor(location.lat * 10) % 4 + 1
                }}
              >
                <div className="location-name">{location.name}</div>
                <div className="congestion-level">{Math.round(location.congestion)}%</div>
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Low Traffic</span>
            <div className="legend-gradient"></div>
            <span>High Traffic</span>
          </div>
        </div>
      </div>

      {/* Route Options */}
      <div className="routes-section">
        <h3>Optimized Route Options</h3>
        {loading ? (
          <div className="loading">Calculating optimal routes...</div>
        ) : (
          <div className="routes-grid">
            {routes.map(route => (
              <div
                key={route.id}
                className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRoute(route);
                  analyzeRoute(route);
                }}
              >
                <div className="route-header">
                  <h4>{route.name}</h4>
                  <div className="optimization-score">
                    Score: {route.optimizationScore}/100
                  </div>
                </div>
                
                <div className="route-metrics">
                  <div className="metric">
                    <span className="metric-icon">📏</span>
                    <span className="metric-value">{route.distance} km</span>
                    <span className="metric-label">Distance</span>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">⏱️</span>
                    <span className="metric-value">{route.estimatedTime} min</span>
                    <span className="metric-label">ETA</span>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">🎯</span>
                    <span className="metric-value">{route.confidence}%</span>
                    <span className="metric-label">Confidence</span>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">💰</span>
                    <span className="metric-value">${route.costEstimate}</span>
                    <span className="metric-label">Cost</span>
                  </div>
                </div>

                <div className="route-path">
                  <strong>Path:</strong> {route.path.join(' → ')}
                </div>

                <div className="route-factors">
                  <div className="factor">
                    <span>Traffic Impact: {route.factors.traffic > 0 ? '+' : ''}{route.factors.traffic}%</span>
                  </div>
                  <div className="factor">
                    <span>Time Factor: {route.factors.timeOfDay > 0 ? '+' : ''}{route.factors.timeOfDay}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Analysis */}
      {selectedRoute && routeAnalysis && (
        <div className="route-analysis">
          <h3>Route Analysis: {selectedRoute.name}</h3>
          
          <div className="analysis-grid">
            <div className="analysis-section">
              <h4>Route Statistics</h4>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Total Stops:</span>
                  <span className="stat-value">{routeAnalysis.totalStops}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Congestion:</span>
                  <span className="stat-value">{Math.round(routeAnalysis.averageCongestion)}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fuel Efficiency:</span>
                  <span className="stat-value">{selectedRoute.fuelEfficiency}%</span>
                </div>
              </div>
            </div>

            <div className="analysis-section">
              <h4>Risk Factors</h4>
              {routeAnalysis.riskFactors.length > 0 ? (
                <div className="risk-list">
                  {routeAnalysis.riskFactors.map((risk, index) => (
                    <div key={index} className="risk-item">
                      <span className="risk-icon">⚠️</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-risks">No significant risk factors identified</p>
              )}
            </div>

            <div className="analysis-section">
              <h4>AI Recommendations</h4>
              {routeAnalysis.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {routeAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-item">
                      <span className="rec-icon">💡</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-recommendations">Route is optimally configured</p>
              )}
            </div>
          </div>

          <div className="route-actions">
            <button className="button primary">Apply This Route</button>
            <button className="button outline">Save as Template</button>
            <button className="button outline">Share Route</button>
          </div>
        </div>
      )}

      <style>{`
        .route-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .optimization-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .optimization-controls label {
          color: #e2e8f0;
          font-weight: 500;
        }

        .heatmap-section {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .heatmap-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 8px;
          height: 200px;
        }

        .heatmap-cell {
          border-radius: 4px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        }

        .location-name {
          font-size: 10px;
          margin-bottom: 2px;
        }

        .congestion-level {
          font-size: 14px;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .legend-gradient {
          width: 100px;
          height: 12px;
          background: linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 1));
          border-radius: 6px;
        }

        .routes-section {
          margin-bottom: 24px;
        }

        .routes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 16px;
        }

        .route-card {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .route-card:hover {
          background-color: #334155;
        }

        .route-card.selected {
          border-color: #3b82f6;
          background-color: #1e40af;
        }

        .route-card .route-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .route-card h4 {
          margin: 0;
          color: #f8fafc;
        }

        .optimization-score {
          background-color: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .route-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .metric-icon {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 2px;
        }

        .metric-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .route-path {
          margin-bottom: 12px;
          font-size: 14px;
          color: #e2e8f0;
        }

        .route-factors {
          display: flex;
          gap: 16px;
        }

        .factor {
          font-size: 12px;
          color: #94a3b8;
        }

        .route-analysis {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .analysis-section h4 {
          margin: 0 0 16px 0;
          color: #f8fafc;
        }

        .stats-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          color: #94a3b8;
        }

        .stat-value {
          font-weight: bold;
          color: #3b82f6;
        }

        .risk-list, .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .risk-item, .recommendation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background-color: #0f172a;
          border-radius: 4px;
        }

        .risk-icon, .rec-icon {
          font-size: 16px;
        }

        .no-risks, .no-recommendations {
          color: #94a3b8;
          font-style: italic;
        }

        .route-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .loading {
          text-align: center;
          padding: 32px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default RouteOptimization;