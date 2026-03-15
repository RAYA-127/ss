# RentEase - Furniture & Appliance Rental Platform

A full-stack web application for furniture and appliance rentals with monthly rental plans, delivery scheduling, and maintenance support.

## Features

### User Features

- User registration & login
- Browse products by category (Furniture, Appliances, Electronics)
- View product details with rental pricing and tenure options
- Add to cart & checkout
- Choose delivery date and location
- Manage active rentals
- Request maintenance support
- View rental history

### Admin Features

- Dashboard with analytics
- Manage product inventory
- Manage orders and rentals
- Handle maintenance requests
- Track deliveries

## Tech Stack

### Backend

- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication

### Frontend

- React.js
- Tailwind CSS
- React Router
- Axios

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Backend Setup

```bash
# Navigate to project directory
cd rentease

# Install backend dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Start MongoDB (if local)
mongod

# Start backend server
npm run server
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Start development server
npm start
```

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rentease
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products

- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get categories
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart

- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove cart item

### Rentals

- `GET /api/rentals` - Get user rentals
- `GET /api/rentals/active` - Get active rentals
- `GET /api/rentals/history` - Get rental history
- `POST /api/rentals/create` - Create rental from cart
- `POST /api/rentals/:id/extend` - Extend rental
- `POST /api/rentals/:id/schedule-pickup` - Schedule pickup

### Orders

- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders/:id/cancel` - Cancel order

### Maintenance

- `GET /api/maintenance` - Get user maintenance requests
- `POST /api/maintenance` - Create maintenance request
- `POST /api/maintenance/:id/feedback` - Submit feedback

### Admin

- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/rentals` - Get all rentals
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/rentals/:id/status` - Update rental status

## Project Structure

```
rentease/
├── server/
│   ├── index.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Rental.js
│   │   ├── Order.js
│   │   ├── Maintenance.js
│   │   └── Delivery.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── rentals.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   ├── delivery.js
│   │   └── maintenance.js
│   └── middleware/
│       └── auth.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.js
│   │   │   │   └── Footer.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Products.js
│   │   │   ├── ProductDetail.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Cart.js
│   │   │   ├── Checkout.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Rentals.js
│   │   │   ├── RentalDetail.js
│   │   │   ├── Maintenance.js
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js
│   │   │       ├── AdminProducts.js
│   │   │       ├── AdminOrders.js
│   │   │       └── AdminRentals.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── .env
├── package.json
└── README.md
```

## Usage

1. Register a new account or login
2. Browse products by category
3. Select rental tenure (3, 6, 12 months)
4. Add to cart and proceed to checkout
5. Provide delivery address and schedule
6. Complete payment
7. Track your rentals in the dashboard

## Admin Access

To access admin features:

1. Create a user account
2. Manually update the user's role to 'admin' in the database

## Deployment

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ..
npm start
```

### Recommended Platforms

- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify
- Database: MongoDB Atlas

## License

MIT License
