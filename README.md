# BogartFashion - Online Fashion Store

## Overview

BogartFashion is a modern, elegant online fashion store built with React.js frontend and Node.js backend. The application has been transformed from a tech store to a comprehensive fashion e-commerce platform.

## Features

### 🛍️ Fashion-Specific Features
- **Product Management**: Support for fashion-specific fields including size, color, material, brand, season, and gender
- **Category Management**: Fashion categories (Men, Women, Kids, Accessories, Shoes, Bags, Jewelry, Watches, Sportswear, Formal Wear)
- **Inventory Management**: Track sizes and colors separately with comprehensive stock management
- **Brand Management**: Support for multiple fashion brands and suppliers

### 🎨 Design & Branding
- **Modern UI**: Elegant design with fashion-appropriate color scheme (pink/purple gradient)
- **Responsive Design**: Mobile-first approach with beautiful desktop layouts
- **Typography**: Professional fonts (Playfair Display for headings, Lato for body text)
- **Brand Identity**: BogartFashion branding with fashion-focused messaging

### 🛒 E-commerce Features
- **Shopping Cart**: Full cart functionality with quantity management
- **User Authentication**: Secure login/signup system
- **Order Management**: Complete order processing and tracking
- **Payment Integration**: PayPal and credit card payment options
- **Promotions**: Discount codes and promotional campaigns

### 👨‍💼 Admin Features
- **Product Management**: Add, edit, delete products with fashion-specific fields
- **Category Management**: Manage fashion categories
- **Order Management**: Process and track customer orders
- **Customer Management**: View and manage customer accounts
- **Analytics Dashboard**: Sales and inventory analytics

## Database Schema

### New Fashion-Specific Fields
The products table now includes:
- `size` (S, M, L, XL, etc.)
- `color` (Red, Blue, Black, etc.)
- `material` (Cotton, Silk, Polyester, etc.)
- `brand` (Bogart, Nike, etc.)
- `season` (Spring, Summer, Fall, Winter, All Season)
- `gender` (Men, Women, Unisex, Kids)

### Categories
- Men's Fashion
- Women's Fashion
- Kids
- Accessories
- Shoes
- Bags & Handbags
- Jewelry
- Watches
- Sportswear
- Formal Wear

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example env.config
   ```
   Edit `env.config` with your database credentials and other settings.

4. Import the database:
   ```bash
   mysql -u your_username -p your_database < ../bogartfashion.sql
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

### For Customers
1. Browse products by category
2. View detailed product information including size, color, material, and brand
3. Add items to cart with quantity selection
4. Complete checkout with payment
5. Track order status

### For Administrators
1. Access admin dashboard at `/manager/dashboard`
2. Manage products with fashion-specific fields
3. Process orders and manage inventory
4. Create promotional campaigns
5. Monitor sales analytics

## Technology Stack

### Frontend
- React.js 19.1.0
- React Router DOM 7.6.0
- Axios for API calls
- CSS3 with modern styling

### Backend
- Node.js with Express
- MySQL database
- JWT authentication
- Multer for file uploads
- Nodemailer for email notifications

## File Structure

```
bogartfashion/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   └── middleware/      # Authentication middleware
│   ├── uploads/            # Product images
│   └── server.js           # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── bogartfashion.sql       # Database schema
└── README.md              # This file
```

## Customization

### Branding
- Update logo in `frontend/src/components/Logo.jsx`
- Modify colors in CSS files to match your brand
- Update store name in database settings

### Categories
- Add new categories in the database
- Update category images in `frontend/src/assets/images/`

### Product Fields
- Add new fashion-specific fields in the database schema
- Update the ProductModal component to include new fields
- Modify the ProductDetails page to display new information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 