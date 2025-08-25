import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdvancedInventory.css';

const AdvancedInventory = () => {
    const { isUserAdmin, loadingSettings } = useSettings();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('variants');
    const [variants, setVariants] = useState([]);
    const [locations, setLocations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
    const [variantForm, setVariantForm] = useState({
        product_id: '',
        variant_name: '',
        variant_sku: '',
        variant_price: ''
    });
    const [locationForm, setLocationForm] = useState({
        name: '',
        type: 'warehouse',
        city: '',
        country: ''
    });
    const [inventoryForm, setInventoryForm] = useState({
        variant_id: '',
        location_id: '',
        quantity: 1,
        status: 'available',
        condition: 'new',
        purchase_cost: '',
        supplier_batch: '',
        notes: ''
    });
    const [transferForm, setTransferForm] = useState({
        from_location_id: '',
        to_location_id: '',
        variant_id: '',
        quantity: 1,
        notes: ''
    });

    // SKU Generator states
    const [skuGenerator, setSkuGenerator] = useState({
        productType: '',
        color: '',
        size: ''
    });

    // SKU Options
    const skuOptions = {
        productTypes: {
            'TS': 'T-Shirt',
            'JN': 'Jeans',
            'DJ': 'Denim Jacket',
            'DR': 'Dress',
            'BL': 'Belt',
            'SH': 'Shoes',
            'AC': 'Accessories',
            'SW': 'Sweater'
        },
        colors: {
            'BLU': 'Blue',
            'BLK': 'Black',
            'WHT': 'White',
            'RED': 'Red',
            'GRN': 'Green',
            'YEL': 'Yellow',
            'GRY': 'Gray',
            'BRN': 'Brown',
            'PNK': 'Pink',
            'PRP': 'Purple'
        },
        sizes: {
            'XS': 'Extra Small',
            'S': 'Small',
            'M': 'Medium',
            'L': 'Large',
            'XL': 'Extra Large',
            'XXL': '2X Large',
            '28': '28',
            '30': '30',
            '32': '32',
            '34': '34',
            '36': '36',
            '38': '38',
            '40': '40',
            '42': '42'
        }
    };

    // Check authentication
    useEffect(() => {
        if (loadingSettings) return;
        
        if (!isUserAdmin) {
            navigate('/login');
            return;
        }
        
        // Always load essential data (locations, products) when component mounts
        const loadEssentialData = async () => {
            try {
                setLoadingLocations(true);
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                
                const [locationsRes, productsRes] = await Promise.all([
                    axios.get('/api/locations', config),
                    axios.get('/api/products', config)
                ]);
                
                setLocations(locationsRes.data);
                setProducts(productsRes.data);
                console.log('Essential data loaded:', { 
                    locations: locationsRes.data.length, 
                    products: productsRes.data.length 
                });
            } catch (err) {
                console.error('Error loading essential data:', err);
                setError('Failed to load essential data');
            } finally {
                setLoadingLocations(false);
            }
        };
        
        loadEssentialData();
    }, [isUserAdmin, loadingSettings, navigate]);

    // Load tab-specific data when activeTab changes
    useEffect(() => {
        if (!isUserAdmin || loadingSettings) return;
        
        const loadTabData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                
                switch (activeTab) {
                    case 'variants':
                        const variantsRes = await axios.get('/api/variants', config);
                        setVariants(variantsRes.data);
                        break;
                    case 'inventory':
                        const inventoryRes = await axios.get('/api/inventory/summary', config);
                        setInventory(inventoryRes.data);
                        break;
                    default:
                        break;
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error loading tab data');
            }
        };
        
        loadTabData();
    }, [activeTab, isUserAdmin, loadingSettings]);

    const generateSKU = () => {
        const { productType, color, size } = skuGenerator;
        if (productType && color && size) {
            const sku = `${productType}-${color}-${size}`;
            setVariantForm(prev => ({ ...prev, variant_sku: sku }));
        }
    };

    useEffect(() => {
        generateSKU();
    }, [skuGenerator]);

    const handleEditVariant = (variant) => {
        setEditingVariant(variant);
        setVariantForm({
            product_id: variant.product_id,
            variant_name: variant.variant_name,
            variant_sku: variant.variant_sku,
            variant_price: variant.variant_price
        });
        setShowVariantForm(true);
    };

    const handleVariantSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            
            if (editingVariant) {
                // Update existing variant
                await axios.put(`/api/variants/${editingVariant.variant_id}`, variantForm, config);
                setEditingVariant(null);
            } else {
                // Create new variant
                await axios.post('/api/variants', variantForm, config);
            }
            
            setShowVariantForm(false);
            setVariantForm({ product_id: '', variant_name: '', variant_sku: '', variant_price: '' });
            setSkuGenerator({ productType: '', color: '', size: '' });
            // Reload variants data
            if (activeTab === 'variants') {
                const loadVariants = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const variantsRes = await axios.get('/api/variants', config);
                        setVariants(variantsRes.data);
                    } catch (err) {
                        console.error('Error reloading variants:', err);
                    }
                };
                loadVariants();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving variant');
        }
    };

    const handleCancelEdit = () => {
        setEditingVariant(null);
        setVariantForm({
            product_id: '',
            variant_name: '',
            variant_sku: '',
            variant_price: ''
        });
    };

    const handleDeleteVariant = async (variant) => {
        if (window.confirm(`Are you sure you want to delete variant "${variant.variant_name}"?`)) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                await axios.delete(`/api/variants/${variant.variant_id}`, config);
                
                // Reload variants data
                if (activeTab === 'variants') {
                    const loadVariants = async () => {
                        try {
                            const token = localStorage.getItem('token');
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            const variantsRes = await axios.get('/api/variants', config);
                            setVariants(variantsRes.data);
                        } catch (err) {
                            console.error('Error reloading variants:', err);
                        }
                    };
                    loadVariants();
                }
                
                setSuccess('Variant deleted successfully');
            } catch (err) {
                setError(err.response?.data?.message || 'Error deleting variant');
            }
        }
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.post('/api/locations', locationForm, config);
            setShowLocationForm(false);
            setLocationForm({ name: '', type: 'warehouse', city: '', country: '' });
            // Reload locations data
            if (activeTab === 'locations') {
                const loadLocations = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const locationsRes = await axios.get('/api/locations', config);
                        setLocations(locationsRes.data);
                    } catch (err) {
                        console.error('Error reloading locations:', err);
                    }
                };
                loadLocations();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating location');
        }
    };

    const handleDeleteLocation = async (location) => {
        if (window.confirm(`Are you sure you want to delete location "${location.name}"?`)) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                await axios.delete(`/api/locations/${location.location_id}`, config);
                
                // Reload locations data
                if (activeTab === 'locations') {
                    const loadLocations = async () => {
                        try {
                            const token = localStorage.getItem('token');
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            const locationsRes = await axios.get('/api/locations', config);
                            setLocations(locationsRes.data);
                        } catch (err) {
                            console.error('Error reloading locations:', err);
                        }
                    };
                    loadLocations();
                }
                
                setSuccess('Location deleted successfully');
            } catch (err) {
                setError(err.response?.data?.message || 'Error deleting location');
            }
        }
    };

    const handleAddInventoryItems = () => {
        // Ensure locations are loaded before opening the form
        if (locations.length === 0) {
            // Reload locations data
            if (activeTab === 'inventory') {
                const loadLocations = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const locationsRes = await axios.get('/api/locations', config);
                        setLocations(locationsRes.data);
                    } catch (err) {
                        console.error('Error reloading locations for inventory:', err);
                    }
                };
                loadLocations();
            }
        }
        setShowInventoryForm(true);
        setInventoryForm({
            variant_id: '',
            location_id: '',
            quantity: 1,
            status: 'available',
            condition: 'new',
            purchase_cost: '',
            supplier_batch: '',
            notes: ''
        });
    };

    const handleTransferItems = (item) => {
        setSelectedInventoryItem(item);
        setTransferForm({
            from_location_id: item.location_id,
            to_location_id: '',
            variant_id: item.variant_id,
            quantity: 1,
            notes: ''
        });
        setShowTransferForm(true);
    };

    const handleInventorySubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            
            // Create multiple inventory items based on quantity
            const promises = [];
            for (let i = 0; i < inventoryForm.quantity; i++) {
                promises.push(axios.post('/api/inventory/items', {
                    variant_id: inventoryForm.variant_id,
                    location_id: inventoryForm.location_id,
                    status: inventoryForm.status,
                    condition: inventoryForm.condition,
                    purchase_cost: inventoryForm.purchase_cost || null,
                    supplier_batch: inventoryForm.supplier_batch || null,
                    notes: inventoryForm.notes || null
                }, config));
            }
            
            await Promise.all(promises);
            setShowInventoryForm(false);
            setInventoryForm({
                variant_id: '',
                location_id: '',
                quantity: 1,
                status: 'available',
                condition: 'new',
                purchase_cost: '',
                supplier_batch: '',
                notes: ''
            });
            // Reload inventory data
            if (activeTab === 'inventory') {
                const loadInventory = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const inventoryRes = await axios.get('/api/inventory/summary', config);
                        setInventory(inventoryRes.data);
                    } catch (err) {
                        console.error('Error reloading inventory:', err);
                    }
                };
                loadInventory();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding inventory items');
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            
            // Transfer items between locations
            await axios.post('/api/inventory/transfer', transferForm, config);
            setShowTransferForm(false);
            setTransferForm({
                from_location_id: '',
                to_location_id: '',
                variant_id: '',
                quantity: 1,
                notes: ''
            });
            setSelectedInventoryItem(null);
            // Reload inventory data
            if (activeTab === 'inventory') {
                const loadInventory = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const config = { headers: { Authorization: `Bearer ${token}` } };
                        const inventoryRes = await axios.get('/api/inventory/summary', config);
                        setInventory(inventoryRes.data);
                    } catch (err) {
                        console.error('Error reloading inventory:', err);
                    }
                };
                loadInventory();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error transferring items');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'active';
            case 'reserved': return 'pending';
            case 'sold': return 'inactive';
            default: return 'inactive';
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'new': return 'active';
            case 'used': return 'pending';
            case 'damaged': return 'expired';
            default: return 'inactive';
        }
    };

    // Show loading while checking authentication
    if (loadingSettings || !isUserAdmin) {
        return (
            <div className="admin-container">
                <div className="loading">Loading Advanced Inventory Management...</div>
            </div>
        );
    }

    const renderVariantsTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>Product Variants ({variants.length})</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowVariantForm(true)}
                >
                    Add New Variant
                </button>
            </div>
            
            {loading ? (
                <div className="loading">Loading variants...</div>
            ) : (
                <div className="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variant Name</th>
                                <th>SKU</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map(variant => (
                                <tr key={variant.variant_id}>
                                    <td>
                                        <strong>{variant.product_name}</strong>
                                        <br />
                                        <small>ID: {variant.product_id}</small>
                                    </td>
                                    <td>{variant.variant_name}</td>
                                    <td>
                                        <code className="sku-code">{variant.variant_sku}</code>
                                    </td>
                                    <td>${variant.variant_price}</td>
                                    <td>
                                        <span className={`status ${variant.is_active ? 'active' : 'inactive'}`}>
                                            {variant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-small btn-secondary" onClick={() => handleEditVariant(variant)}>Edit</button>
                                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteVariant(variant)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderLocationsTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>Locations ({locations.length})</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowLocationForm(true)}
                >
                    Add New Location
                </button>
            </div>
            
            {loadingLocations ? (
                <div className="loading">Loading locations...</div>
            ) : (
                <div className="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>City</th>
                                <th>Country</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map(location => (
                                <tr key={location.location_id}>
                                    <td>
                                        <strong>{location.name}</strong>
                                        <br />
                                        <small>ID: {location.location_id}</small>
                                    </td>
                                    <td>
                                        <span className={`badge ${location.type}`}>
                                            {location.type}
                                        </span>
                                    </td>
                                    <td>{location.city}</td>
                                    <td>{location.country}</td>
                                    <td>
                                        <span className={`status ${location.is_active ? 'active' : 'inactive'}`}>
                                            {location.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-small btn-secondary">Edit</button>
                                        <button className="btn btn-small btn-danger" onClick={() => handleDeleteLocation(location)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderInventoryTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>Inventory Summary ({inventory.length} combinations)</h2>
                <div>
                    <button className="btn btn-primary" onClick={handleAddInventoryItems}>Add Inventory Items</button>
                    <button className="btn btn-secondary">Export Data</button>
                </div>
            </div>
            
            {loading ? (
                <div className="loading">Loading inventory...</div>
            ) : (
                <div className="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variant</th>
                                <th>Location</th>
                                <th>Available</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={`${item.variant_id}-${item.location_id}`}>
                                    <td>
                                        <strong>{item.product_name}</strong>
                                        <br />
                                        <small>ID: {item.product_id}</small>
                                    </td>
                                    <td>
                                        {item.variant_name}
                                        <br />
                                        <code className="sku-code">{item.variant_sku}</code>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.location_type}`}>
                                            {item.location_name}
                                        </span>
                                        <br />
                                        <small>{item.location_type}</small>
                                    </td>
                                    <td>
                                        <span className={`stock ${item.available_count < 5 ? 'low' : 'ok'}`}>
                                            {item.available_count}
                                        </span>
                                    </td>
                                    <td>{item.total_items}</td>
                                    <td>
                                        <span className={`status ${item.available_count < 5 ? 'pending' : 'active'}`}>
                                            {item.available_count < 5 ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-small btn-secondary" onClick={() => handleTransferItems(item)}>Transfer</button>
                                        <button className="btn btn-small btn-primary" onClick={() => {
                                            setInventoryForm({
                                                variant_id: item.variant_id,
                                                location_id: item.location_id,
                                                quantity: 1,
                                                status: 'available',
                                                condition: 'new',
                                                purchase_cost: '',
                                                supplier_batch: '',
                                                notes: ''
                                            });
                                            setShowInventoryForm(true);
                                        }}>Add Items</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="advanced-inventory-page">
            <div className="page-header">
                <h1>Advanced Inventory Management</h1>
                <p>Manage product variants, locations, and inventory tracking with smart SKU generation</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError('')}>&times;</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                    <button onClick={() => setSuccess('')}>&times;</button>
                </div>
            )}

            <div className="tab-navigation">
                <button 
                    className={`tab ${activeTab === 'variants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('variants')}
                >
                    Product Variants
                </button>
                <button 
                    className={`tab ${activeTab === 'locations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('locations')}
                >
                    Locations
                </button>
                <button 
                    className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    Inventory Summary
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'variants' && renderVariantsTab()}
                {activeTab === 'locations' && renderLocationsTab()}
                {activeTab === 'inventory' && renderInventoryTab()}
            </div>

            {/* Enhanced Variant Form Modal with Smart SKU Generator */}
            {showVariantForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingVariant ? 'Edit Variant' : 'Add New Variant with Smart SKU Generator'}</h3>
                            <button onClick={() => setShowVariantForm(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleVariantSubmit}>
                            <div className="form-group">
                                <label>Product:</label>
                                <select
                                    value={variantForm.product_id}
                                    onChange={(e) => setVariantForm({...variantForm, product_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a product</option>
                                    {products.map(product => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.name} (ID: {product.product_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Variant Name:</label>
                                <input
                                    type="text"
                                    value={variantForm.variant_name}
                                    onChange={(e) => setVariantForm({...variantForm, variant_name: e.target.value})}
                                    placeholder="e.g., Blue Denim Jacket - Size M"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Smart SKU Generator:</label>
                                <div className="sku-generator">
                                    <div className="sku-row">
                                        <select
                                            value={skuGenerator.productType}
                                            onChange={(e) => setSkuGenerator({...skuGenerator, productType: e.target.value})}
                                            placeholder="Product Type"
                                        >
                                            <option value="">Product Type</option>
                                            {Object.entries(skuOptions.productTypes).map(([code, name]) => (
                                                <option key={code} value={code}>{code} - {name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={skuGenerator.color}
                                            onChange={(e) => setSkuGenerator({...skuGenerator, color: e.target.value})}
                                            placeholder="Color/Material"
                                        >
                                            <option value="">Color/Material</option>
                                            {Object.entries(skuOptions.colors).map(([code, name]) => (
                                                <option key={code} value={code}>{code} - {name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={skuGenerator.size}
                                            onChange={(e) => setSkuGenerator({...skuGenerator, size: e.target.value})}
                                            placeholder="Size"
                                        >
                                            <option value="">Size</option>
                                            {Object.entries(skuOptions.sizes).map(([code, name]) => (
                                                <option key={code} value={code}>{code} - {name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="sku-preview">
                                        <label>Generated SKU:</label>
                                        <input
                                            type="text"
                                            value={variantForm.variant_sku}
                                            onChange={(e) => setVariantForm({...variantForm, variant_sku: e.target.value})}
                                            placeholder="SKU will be generated automatically"
                                            readOnly
                                            className="sku-preview-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Price:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={variantForm.variant_price}
                                    onChange={(e) => setVariantForm({...variantForm, variant_price: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingVariant ? 'Update Variant' : 'Create Variant'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Location Form Modal */}
            {showLocationForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add New Location</h3>
                            <button onClick={() => setShowLocationForm(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleLocationSubmit}>
                            <div className="form-group">
                                <label>Name:</label>
                                <input
                                    type="text"
                                    value={locationForm.name}
                                    onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                                    placeholder="e.g., Main Warehouse"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type:</label>
                                <select
                                    value={locationForm.type}
                                    onChange={(e) => setLocationForm({...locationForm, type: e.target.value})}
                                >
                                    <option value="warehouse">Warehouse</option>
                                    <option value="store">Store</option>
                                    <option value="online">Online Fulfillment</option>
                                    <option value="supplier">Supplier</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City:</label>
                                <input
                                    type="text"
                                    value={locationForm.city}
                                    onChange={(e) => setLocationForm({...locationForm, city: e.target.value})}
                                    placeholder="e.g., Tel Aviv"
                                />
                            </div>
                            <div className="form-group">
                                <label>Country:</label>
                                <input
                                    type="text"
                                    value={locationForm.country}
                                    onChange={(e) => setLocationForm({...locationForm, country: e.target.value})}
                                    placeholder="e.g., Israel"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Create Location</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Items Form Modal */}
            {showInventoryForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingVariant ? 'Edit Inventory Items' : 'Add New Inventory Items'}</h3>
                            <button onClick={() => setShowInventoryForm(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleInventorySubmit}>
                            {/* Debug info */}
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <div><strong>Debug Info:</strong></div>
                                <div>Locations loaded: {locations.length}</div>
                                <div>Products loaded: {products.length}</div>
                                <div>Variants loaded: {variants.length}</div>
                                <div>Loading locations: {loadingLocations ? 'Yes' : 'No'}</div>
                                {locations.length > 0 && (
                                    <div>
                                        <div><strong>Available locations:</strong></div>
                                        {locations.map(loc => (
                                            <div key={loc.location_id} style={{ marginLeft: '10px' }}>
                                                • {loc.name} (ID: {loc.location_id}) - {loc.type}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label>Product:</label>
                                <select
                                    value={inventoryForm.variant_id}
                                    onChange={(e) => setInventoryForm({...inventoryForm, variant_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a variant</option>
                                    {variants.map(variant => (
                                        <option key={variant.variant_id} value={variant.variant_id}>
                                            {variant.product_name} - {variant.variant_name} (ID: {variant.variant_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Location:</label>
                                <select
                                    value={inventoryForm.location_id}
                                    onChange={(e) => setInventoryForm({...inventoryForm, location_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a location</option>
                                    {locations.map(location => (
                                        <option key={location.location_id} value={location.location_id}>
                                            {location.name} (ID: {location.location_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    value={inventoryForm.quantity}
                                    onChange={(e) => setInventoryForm({...inventoryForm, quantity: parseInt(e.target.value) || 1})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status:</label>
                                <select
                                    value={inventoryForm.status}
                                    onChange={(e) => setInventoryForm({...inventoryForm, status: e.target.value})}
                                >
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="sold">Sold</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Condition:</label>
                                <select
                                    value={inventoryForm.condition}
                                    onChange={(e) => setInventoryForm({...inventoryForm, condition: e.target.value})}
                                >
                                    <option value="new">New</option>
                                    <option value="used">Used</option>
                                    <option value="damaged">Damaged</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Purchase Cost:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={inventoryForm.purchase_cost}
                                    onChange={(e) => setInventoryForm({...inventoryForm, purchase_cost: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Supplier Batch:</label>
                                <input
                                    type="text"
                                    value={inventoryForm.supplier_batch}
                                    onChange={(e) => setInventoryForm({...inventoryForm, supplier_batch: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes:</label>
                                <textarea
                                    value={inventoryForm.notes}
                                    onChange={(e) => setInventoryForm({...inventoryForm, notes: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingVariant ? 'Update Inventory Items' : 'Create Inventory Items'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInventoryForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Transfer Form Modal */}
            {showTransferForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Transfer Inventory Items</h3>
                            <button onClick={() => setShowTransferForm(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleTransferSubmit}>
                            <div className="form-group">
                                <label>From Location:</label>
                                <select
                                    value={transferForm.from_location_id}
                                    onChange={(e) => setTransferForm({...transferForm, from_location_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a location</option>
                                    {locations.map(location => (
                                        <option key={location.location_id} value={location.location_id}>
                                            {location.name} (ID: {location.location_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>To Location:</label>
                                <select
                                    value={transferForm.to_location_id}
                                    onChange={(e) => setTransferForm({...transferForm, to_location_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a location</option>
                                    {locations.map(location => (
                                        <option key={location.location_id} value={location.location_id}>
                                            {location.name} (ID: {location.location_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Variant:</label>
                                <select
                                    value={transferForm.variant_id}
                                    onChange={(e) => setTransferForm({...transferForm, variant_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select a variant</option>
                                    {variants.map(variant => (
                                        <option key={variant.variant_id} value={variant.variant_id}>
                                            {variant.product_name} - {variant.variant_name} (ID: {variant.variant_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    value={transferForm.quantity}
                                    onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 1})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes:</label>
                                <textarea
                                    value={transferForm.notes}
                                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                                    rows="3"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Transfer Items</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedInventory;
