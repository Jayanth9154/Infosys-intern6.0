import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { API_BASE_URL } from './config';

function VehicleSearch({ onVehicleSelect }) {
  const { currentUser } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter vehicles based on search term
      const results = response.data.filter(vehicle => 
        vehicle.make?.toLowerCase().includes(term.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(term.toLowerCase()) ||
        vehicle.licensePlate?.toLowerCase().includes(term.toLowerCase()) ||
        vehicle.id?.toLowerCase().includes(term.toLowerCase())
      );

      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    handleSearch(term);
  };

  const handleVehicleClick = (vehicle) => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'on-trip': return '#3b82f6';
      case 'maintenance': return '#f59e0b';
      case 'charging': return '#8b5cf6';
      case 'out-of-service': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="vehicle-search-container">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search vehicles by make, model, plate, or ID..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setShowResults(true)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {showResults && (
        <div className="search-results-dropdown">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="no-results">No vehicles found</div>
          ) : (
            <ul className="search-results-list">
              {searchResults.map(vehicle => (
                <li 
                  key={vehicle.id} 
                  className="search-result-item"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div className="vehicle-info">
                    <div className="vehicle-make-model">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="vehicle-details">
                      <span className="license-plate">{vehicle.licensePlate}</span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(vehicle.status) }}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  <div className="vehicle-id">
                    {vehicle.id}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <style>{`
        .vehicle-search-container {
          position: relative;
          width: 100%;
          max-width: 400px;
        }
        
        .search-input-container {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 40px 10px 16px;
          border-radius: 6px;
          border: 1px solid #334155;
          background-color: #0f172a;
          color: #e2e8f0;
          font-size: 14px;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: #1e293b;
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          margin-top: 4px;
          border: 1px solid #334155;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .search-loading, .no-results {
          padding: 16px;
          text-align: center;
          color: #94a3b8;
        }
        
        .search-results-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .search-result-item {
          padding: 12px 16px;
          border-bottom: 1px solid #334155;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .search-result-item:hover {
          background-color: #334155;
        }
        
        .search-result-item:last-child {
          border-bottom: none;
        }
        
        .vehicle-info {
          flex: 1;
        }
        
        .vehicle-make-model {
          font-weight: 500;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        
        .vehicle-details {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .license-plate {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          color: white;
          text-transform: capitalize;
        }
        
        .vehicle-id {
          font-family: monospace;
          font-size: 12px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default VehicleSearch;
