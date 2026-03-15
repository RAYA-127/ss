const nodemailer = require('nodemailer');

// Create transporter for sending emails
// For production, use environment variables for credentials
const createTransporter = () => {
  // For Gmail, you'll need to use App Password
  // For testing, you can use ethereal.email
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'rentease.notifications@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password-here'
    }
  });
};

// Admin email to receive notifications
const ADMIN_EMAIL = 'rakeshramcharan3@gmail.com';

const sendProductClickNotification = async (product, user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'rentease.notifications@gmail.com',
      to: ADMIN_EMAIL,
      subject: `🔔 New Product Interest: ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Product Interest!</h2>
          <p>A user has shown interest in a product.</p>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">Product Details</h3>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Price:</strong> ₹${product.rentalPrice?.monthly}/month</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">User Details</h3>
            ${user ? `
              <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
            ` : `
              <p><strong>User:</strong> Guest User (not logged in)</p>
            `}
          </div>
          
          <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
            This is an automated notification from RentEase Platform.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Product click notification sent to admin');
    return true;
  } catch (error) {
    console.error('Error sending product click notification:', error.message);
    return false;
  }
};

const sendPurchaseNotification = async (order, product, user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'rentease.notifications@gmail.com',
      to: ADMIN_EMAIL,
      subject: `🛒 New Purchase/Order: ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">New Order Received!</h2>
          <p>A user has made a purchase/order.</p>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Quantity:</strong> ${order.items?.[0]?.quantity || 1}</p>
            <p><strong>Tenure:</strong> ${order.items?.[0]?.tenureMonths || 3} months</p>
            <p><strong>Total Amount:</strong> ₹${order.total}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">Customer Details</h3>
            ${user ? `
              <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
              <p><strong>Address:</strong> ${user.address?.street || ''}, ${user.address?.city || ''}, ${user.address?.state || ''} - ${user.address?.pincode || ''}</p>
            ` : `
              <p><strong>User:</strong> Not available</p>
            `}
          </div>
          
          <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
            This is an automated notification from RentEase Platform.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Purchase notification sent to admin');
    return true;
  } catch (error) {
    console.error('Error sending purchase notification:', error.message);
    return false;
  }
};

const sendCartNotification = async (product, user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'rentease.notifications@gmail.com',
      to: ADMIN_EMAIL,
      subject: `🛒 Product Added to Cart: ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Product Added to Cart!</h2>
          <p>A user has added a product to their cart.</p>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">Product Details</h3>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Price:</strong> ₹${product.rentalPrice?.monthly}/month</p>
          </div>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">User Details</h3>
            ${user ? `
              <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
            ` : `
              <p><strong>User:</strong> Guest User (not logged in)</p>
            `}
          </div>
          
          <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
            This is an automated notification from RentEase Platform.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Cart notification sent to admin');
    return true;
  } catch (error) {
    console.error('Error sending cart notification:', error.message);
    return false;
  }
};

module.exports = {
  sendProductClickNotification,
  sendPurchaseNotification,
  sendCartNotification
};
