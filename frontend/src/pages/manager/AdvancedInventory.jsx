import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdvancedInventory.css';

const AdvancedInventory = () => {
    const [activeTab, setActiveTab] = useState('variants');
    const [variants, setVariants] = useState([]);
    const [locations, setLocations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [showLocationForm, setShowLocationForm] = useState(false);
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

    useEffect(() => {
        loadData();
        loadProducts();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            switch (activeTab) {
                case 'variants':
                    const variantsRes = await axios.get('/api/variants');
                    setVariants(variantsRes.data);
                    break;
                case 'locations':
                    const locationsRes = await axios.get('/api/locations');
                    setLocations(locationsRes.data);
                    break;
                case 'inventory':
                    const inventoryRes = await axios.get('/api/inventory/summary');
                    setInventory(inventoryRes.data);
                    break;
                default:
                    break;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const productsRes = await axios.get('/api/products');
            setProducts(productsRes.data);
        } catch (err) {
            console.error('Error loading products:', err);
        }
    };

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

    const handleVariantSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/variants', variantForm);
            setShowVariantForm(false);
            setVariantForm({ product_id: '', variant_name: '', variant_sku: '', variant_price: '' });
            setSkuGenerator({ productType: '', color: '', size: '' });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating variant');
        }
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/locations', locationForm);
            setShowLocationForm(false);
            setLocationForm({ name: '', type: 'warehouse', city: '', country: '' });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating location');
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
                                        <button className="btn btn-small btn-secondary">Edit</button>
                                        <button className="btn btn-small btn-danger">Delete</button>
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
            
            {loading ? (
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
                                        <button className="btn btn-small btn-danger">Delete</button>
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
                    <button className="btn btn-primary">Add Inventory Items</button>
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
                                        <button className="btn btn-small btn-secondary">Transfer</button>
                                        <button className="btn btn-small btn-primary">Add Items</button>
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
                            <h3>Add New Variant with Smart SKU Generator</h3>
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
                                <button type="submit" className="btn btn-primary">Create Variant</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowVariantForm(false)}>
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
        </div>
    );
};

export default AdvancedInventory;
