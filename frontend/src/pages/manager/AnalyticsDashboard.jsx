import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  RadialLinearScale
} from 'chart.js';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';
import { FaDownload, FaChartLine, FaUsers, FaBoxes, FaExclamationTriangle, FaClock, FaCalendarAlt } from 'react-icons/fa';
import './AnalyticsDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  RadialLinearScale
);

export default function AnalyticsDashboard() {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  
  // State for analytics data
  const [salesData, setSalesData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [customerData, setCustomerData] = useState({ customers: [], metrics: {} });
  const [inventoryData, setInventoryData] = useState({ inventory: [], metrics: {} });
  const [handlingData, setHandlingData] = useState({ handling_times: [], metrics: {} });
  
  // State for filters and UI
  const [timeRange, setTimeRange] = useState('day'); // Changed to 'day' to show last 30 days by default
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loadingSettings) {
      if (!isUserAdmin) {
        navigate('/');
      } else {
        fetchAnalyticsData();
      }
    }
  }, [isUserAdmin, loadingSettings, navigate, timeRange, startDate, endDate]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = new URLSearchParams({
        timeRange,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const [
        salesRes,
        supplierRes,
        categoryRes,
        customerRes,
        inventoryRes,
        handlingRes
      ] = await Promise.all([
        axios.get(`/api/admin/analytics/sales?${params}`, { headers }),
        axios.get('/api/admin/analytics/suppliers', { headers }),
        axios.get('/api/admin/analytics/categories', { headers }),
        axios.get('/api/admin/analytics/customers', { headers }),
        axios.get('/api/admin/analytics/inventory', { headers }),
        axios.get('/api/admin/analytics/order-handling', { headers })
      ]);

      // Debug: Log the data being received
      console.log('Sales Data:', salesRes.data);
      console.log('Supplier Data:', supplierRes.data);
      console.log('Category Data:', categoryRes.data);
      console.log('Customer Data:', customerRes.data);
      console.log('Inventory Data:', inventoryRes.data);
      console.log('Handling Data:', handlingRes.data);
      
      setSalesData(salesRes.data);
      setSupplierData(supplierRes.data);
      setCategoryData(categoryRes.data);
      setCustomerData(customerRes.data);
      setInventoryData(inventoryRes.data);
      setHandlingData(handlingRes.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        console.error('Authentication failed - user may not be admin');
        setError('Authentication failed. Please make sure you are logged in as an admin.');
      } else if (err.response?.status === 403) {
        console.error('Access forbidden - user may not have admin privileges');
        setError('Access denied. Admin privileges required.');
      } else {
        console.error('API error:', err.response?.status, err.response?.data);
        setError('Failed to load analytics data. Please try again.');
      }
      
      // Set default empty data to prevent crashes
      setSalesData([]);
      setSupplierData([]);
      setCategoryData([]);
      setCustomerData({ customers: [], metrics: {} });
      setInventoryData({ inventory: [], metrics: {} });
      setHandlingData({ handling_times: [], metrics: {} });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/analytics/export?type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Error exporting data. Please try again.');
    }
  };

  if (loadingSettings) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <p>Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  // Chart data preparation
  const salesChartData = {
    labels: salesData && salesData.length > 0 ? salesData.map(d => d.period) : ['No Data'],
    datasets: [
      {
        label: 'Total Sales',
        data: salesData && salesData.length > 0 ? salesData.map(d => d.total_sales) : [0],
        borderColor: '#C2883A',
        backgroundColor: 'rgba(194, 136, 58, 0.1)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Order Count',
        data: salesData && salesData.length > 0 ? salesData.map(d => d.order_count) : [0],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1'
      }
    ]
  };

  const supplierChartData = {
    labels: supplierData && supplierData.length > 0 ? supplierData.map(s => s.supplier_name) : ['No Data'],
    datasets: [{
      label: 'Total Revenue',
      data: supplierData && supplierData.length > 0 ? supplierData.map(s => s.total_revenue) : [0],
      backgroundColor: [
        '#C2883A', '#28a745', '#007bff', '#ffc107', '#dc3545',
        '#6c757d', '#17a2b8', '#fd7e14', '#e83e8c', '#6f42c1'
      ]
    }]
  };

  const categoryChartData = {
    labels: categoryData && categoryData.length > 0 ? categoryData.map(c => c.category_name) : ['No Data'],
    datasets: [{
      label: 'Total Revenue',
      data: categoryData && categoryData.length > 0 ? categoryData.map(c => c.total_revenue) : [0],
      backgroundColor: [
        '#C2883A', '#28a745', '#007bff', '#ffc107', '#dc3545',
        '#6c757d', '#17a2b8', '#fd7e14', '#e83e8c', '#6f42c1'
      ]
    }]
  };

  const orderStatusData = {
    labels: handlingData.handling_times && handlingData.handling_times.length > 0 ? handlingData.handling_times.map(h => h.status) : ['No Data'],
    datasets: [{
      label: 'Orders',
      data: handlingData.handling_times && handlingData.handling_times.length > 0 ? handlingData.handling_times.map(h => h.order_count) : [0],
      backgroundColor: ['#C2883A', '#28a745', '#007bff', '#ffc107', '#dc3545']
    }]
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1><FaChartLine /> Advanced Analytics Dashboard</h1>
        <p>Comprehensive insights into your business performance</p>
      </div>

      {/* Time Range Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button 
          className="refresh-btn"
          onClick={fetchAnalyticsData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        
        {loading && (
          <div className="loading-overlay">
            <p>Fetching analytics data...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '15px',
            margin: '20px 0',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                float: 'right',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Insights
        </button>
        <button 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Supplier Analysis
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon"><FaChartLine /></div>
              <div className="kpi-content">
                <h3>Total Revenue</h3>
                <p className="kpi-value">
                  {formatPrice(salesData.reduce((sum, d) => sum + (d.total_sales || 0), 0), currency)}
                </p>
                <p className="kpi-label">Period: {timeRange}</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon"><FaUsers /></div>
              <div className="kpi-content">
                <h3>Repeat Customers</h3>
                <p className="kpi-value">{customerData.metrics?.repeat_customers || 0}</p>
                <p className="kpi-label">{customerData.metrics?.repeat_customer_rate || 0}% Rate</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon"><FaClock /></div>
              <div className="kpi-content">
                <h3>Avg Handling Time</h3>
                <p className="kpi-value">{handlingData.metrics?.avg_handling_time_days?.toFixed(1) || 0} days</p>
                <p className="kpi-label">Order Processing</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon"><FaExclamationTriangle /></div>
              <div className="kpi-content">
                <h3>Low Stock Alerts</h3>
                <p className="kpi-value">{inventoryData.metrics?.low_stock_products || 0}</p>
                <p className="kpi-label">{inventoryData.metrics?.low_stock_percentage || 0}% of Products</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Sales Performance Over Time</h3>
              <Line 
                data={salesChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (value) => formatPrice(value, currency) }
                    },
                    y1: { 
                      beginAtZero: true, 
                      position: 'right', 
                      grid: { drawOnChartArea: false } 
                    }
                  }
                }}
              />
            </div>

            <div className="chart-container">
              <h3>Order Status Distribution</h3>
              <Doughnut 
                data={orderStatusData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sales Analytics Tab */}
      {activeTab === 'sales' && (
        <div className="sales-section">
          <div className="section-header">
            <h2>Sales Analytics</h2>
            <button onClick={() => exportData('sales')} className="export-btn">
              <FaDownload /> Export Sales Data
            </button>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Sales Trend Analysis</h3>
              <Line 
                data={salesChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (value) => formatPrice(value, currency) }
                    }
                  }
                }}
              />
            </div>

            <div className="chart-container">
              <h3>Category Performance</h3>
              <Bar 
                data={categoryChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (value) => formatPrice(value, currency) }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="data-table">
            <h3>Sales Data Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total Sales</th>
                  <th>Order Count</th>
                  <th>Avg Order Value</th>
                  <th>Unique Customers</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.period}</td>
                    <td>{formatPrice(row.total_sales, currency)}</td>
                    <td>{row.order_count}</td>
                    <td>{formatPrice(row.avg_order_value, currency)}</td>
                    <td>{row.unique_customers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Insights Tab */}
      {activeTab === 'customers' && (
        <div className="customers-section">
          <div className="section-header">
            <h2>Customer Analytics</h2>
            <button onClick={() => exportData('customers')} className="export-btn">
              <FaDownload /> Export Customer Data
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Customer Metrics</h3>
              <div className="metric-item">
                <span>Total Customers:</span>
                <span>{customerData.metrics?.total_customers || 0}</span>
              </div>
              <div className="metric-item">
                <span>Repeat Customers:</span>
                <span>{customerData.metrics?.repeat_customers || 0}</span>
              </div>
              <div className="metric-item">
                <span>Repeat Rate:</span>
                <span>{customerData.metrics?.repeat_customer_rate || 0}%</span>
              </div>
              <div className="metric-item">
                <span>Avg Lifetime Value:</span>
                <span>{formatPrice(customerData.metrics?.avg_customer_lifetime_value || 0, currency)}</span>
              </div>
            </div>
          </div>

          <div className="data-table">
            <h3>Top Customers by Spending</h3>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Avg Order Value</th>
                  <th>Customer Since</th>
                </tr>
              </thead>
              <tbody>
                {customerData.customers?.slice(0, 10).map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.username}</td>
                    <td>{customer.email}</td>
                    <td>{customer.order_count}</td>
                    <td>{formatPrice(customer.total_spent, currency)}</td>
                    <td>{formatPrice(customer.avg_order_value, currency)}</td>
                    <td>{new Date(customer.first_order).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Analytics Tab */}
      {activeTab === 'inventory' && (
        <div className="inventory-section">
          <div className="section-header">
            <h2>Inventory Analytics</h2>
            <button onClick={() => exportData('products')} className="export-btn">
              <FaDownload /> Export Product Data
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Stock Status Overview</h3>
              <div className="metric-item">
                <span>Total Products:</span>
                <span>{inventoryData.metrics?.total_products || 0}</span>
              </div>
              <div className="metric-item">
                <span>Low Stock Products:</span>
                <span className="warning">{inventoryData.metrics?.low_stock_products || 0}</span>
              </div>
              <div className="metric-item">
                <span>Critical Stock:</span>
                <span className="critical">{inventoryData.metrics?.critical_stock || 0}</span>
              </div>
              <div className="metric-item">
                <span>Low Stock %:</span>
                <span>{inventoryData.metrics?.low_stock_percentage || 0}%</span>
              </div>
            </div>
          </div>

          <div className="data-table">
            <h3>Low Stock Products</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                  <th>Price</th>
                  <th>Units Sold (30d)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.inventory
                  ?.filter(p => p.stock_status === 'Critical' || p.stock_status === 'Low')
                  .map((product, index) => (
                    <tr key={index} className={product.stock_status === 'Critical' ? 'critical-row' : 'warning-row'}>
                      <td>{product.product_name}</td>
                      <td>{product.category_name}</td>
                      <td>{product.supplier_name}</td>
                      <td className={product.stock_status === 'Critical' ? 'critical' : 'warning'}>
                        {product.current_stock}
                      </td>
                      <td>{product.stock_status}</td>
                      <td>{formatPrice(product.price, currency)}</td>
                      <td>{product.units_sold_last_30_days}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Analysis Tab */}
      {activeTab === 'suppliers' && (
        <div className="suppliers-section">
          <div className="section-header">
            <h2>Supplier Performance Analysis</h2>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Supplier Revenue Comparison</h3>
              <Bar 
                data={supplierChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (value) => formatPrice(value, currency) }
                    }
                  }
                }}
              />
            </div>

            <div className="chart-container">
              <h3>Category Revenue Distribution</h3>
              <Pie 
                data={categoryChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>

          <div className="data-table">
            <h3>Supplier Performance Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Total Products</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                  <th>Avg Product Price</th>
                  <th>Total Orders</th>
                </tr>
              </thead>
              <tbody>
                {supplierData.map((supplier, index) => (
                  <tr key={index}>
                    <td>{supplier.supplier_name}</td>
                    <td>{supplier.total_products}</td>
                    <td>{supplier.total_units_sold}</td>
                    <td>{formatPrice(supplier.total_revenue, currency)}</td>
                    <td>{formatPrice(supplier.avg_product_price, currency)}</td>
                    <td>{supplier.total_orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
