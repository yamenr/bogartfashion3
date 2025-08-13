const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Function to ensure required columns exist
async function ensureProfileColumns() {
  try {
    // Check if columns exist
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, ['bogartfashion2']);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add phone column if it doesn't exist
    if (!existingColumns.includes('phone')) {
      console.log('Adding phone column to users table...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email
      `);
    }
    
    // Add city column if it doesn't exist
    if (!existingColumns.includes('city')) {
      console.log('Adding city column to users table...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER phone
      `);
    }
    
    // Add profile_image column if it doesn't exist
    if (!existingColumns.includes('profile_image')) {
      console.log('Adding profile_image column to users table...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER city
      `);
    }
    
    console.log('Profile columns check completed');
  } catch (error) {
    console.error('Error ensuring profile columns:', error);
  }
}

// Get user profile by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    // Basic security check: a user can only request their own profile
    if (req.user.user_id.toString() !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
    }

    try {
        // Ensure required columns exist before querying
        await ensureProfileColumns();
        
        const sql = `SELECT user_id, username, email, phone, city, profile_image, role, created_at FROM users WHERE user_id = ?`;
        const [rows] = await db.query(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Map the database fields to frontend expected format
        const userData = {
            user_id: rows[0].user_id,
            name: rows[0].username, // Map username to name for frontend
            email: rows[0].email,
            phone: rows[0].phone || '',
            city: rows[0].city || '',
            profile_image: rows[0].profile_image || null,
            role: rows[0].role,
            created_at: rows[0].created_at
        };
        
        console.log('Sending user data to frontend:', userData);
        
        res.json(userData);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, phone, city, profile_image } = req.body;
    
    // Basic security check: a user can only update their own profile
    if (req.user.user_id.toString() !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }
    
    // Validate required fields
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Username is required' });
    }
    
    try {
        // Ensure required columns exist before updating
        await ensureProfileColumns();
        
        const sql = `UPDATE users SET username = ?, phone = ?, city = ?, profile_image = ? WHERE user_id = ?`;
        const [result] = await db.query(sql, [name, phone || '', city || '', profile_image || null, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Return updated user data
        const updatedUser = {
            user_id: parseInt(id),
            name: name,
            email: req.user.email, // Keep existing email
            phone: phone || '',
            city: city || '',
            profile_image: profile_image || null,
            role: req.user.role
        };
        
        res.json({ 
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
});

module.exports = router; 