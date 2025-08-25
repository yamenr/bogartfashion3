const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const EmailService = require('../../utils/emailService.js');

const router = express.Router();
const db = dbSingleton.getConnection();
const emailService = new EmailService();

// Handle contact form submission
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    try {
        // Store contact message in database
        const [result] = await db.query(
            'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        // Send notification email to admin (if email service is configured)
        try {
            await emailService.sendContactNotification(name, email, message);
        } catch (emailError) {
            console.log('Contact notification email not sent (email service not configured)');
        }

        res.json({ 
            message: 'Thank you for your message! We will get back to you soon.',
            contactId: result.insertId 
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
});

// Get map data securely (API key hidden from frontend)
router.get('/map-data', async (req, res) => {
    try {
        // Get API key from environment variable
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!googleMapsApiKey) {
            return res.status(500).json({ 
                message: 'Map service not configured',
                error: 'Google Maps API key not found'
            });
        }

        // Bogart Fashion location data
        const mapData = {
            location: {
                name: 'Bogart Fashion',
                address: 'Susita Street 7, Shefa Israel Shopping Center, Tel Aviv, HaSharon',
                coordinates: {
                    lat: 32.0853,
                    lng: 34.7818
                },
                zoom: 15
            },
            businessHours: {
                weekdays: 'Sunday - Thursday: 9:00 AM - 6:00 PM',
                weekend: 'Friday - Saturday: 10:00 AM - 4:00 PM'
            },
            contact: {
                phone: '+972 50 374 7641',
                email: 'support@bogartfashion.com'
            },
            // Return a secure map URL that the frontend can use
            mapUrl: `https://maps.google.com/?q=32.0853,34.7818`,
            // For static map - using a more reliable format
            staticMapUrl: `https://maps.googleapis.com/maps/api/staticmap?center=32.0853,34.7818&zoom=15&size=800x600&scale=2&maptype=roadmap&markers=color:gold%7Clabel:B%7C32.0853,34.7818&key=${googleMapsApiKey}`,
            // Alternative: Use Google Maps embed (no API key needed)
            embedUrl: `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=32.0853,34.7818&zoom=15`
        };

        res.json(mapData);
        
    } catch (error) {
        console.error('Error fetching map data:', error);
        res.status(500).json({ 
            message: 'Failed to fetch map data',
            error: 'Map service error'
        });
    }
});

// Get all contact messages (admin only)
router.get('/', async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

module.exports = router; 