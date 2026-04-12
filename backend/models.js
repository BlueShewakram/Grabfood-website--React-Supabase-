const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true }
});

const menuItemSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  restaurantID: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  imageUrl: { type: String }
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  contact: { type: String, required: true },
  cuisineType: { type: String, required: true },
  imageUrl: { type: String },
  menuIDs: [{ type: String, ref: 'MenuItem' }]
});


const riderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  contact: { type: String, required: true },
  vehicleType: { type: String, required: true },
  currentLocation: { type: String },
  status: { type: String, default: 'available' }
});


const paymentSchema = new mongoose.Schema({
  orderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  amount: { type: Number, required: true, min: 0 }
});


const deliverySchema = new mongoose.Schema({
  orderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, enum: ['pending', 'on the way', 'delivered'], default: 'pending' },
  estimatedTime: { type: Date }
});


const orderItemSchema = new mongoose.Schema({
  orderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  menuItemID: { type: String, ref: 'MenuItem', required: true },
  name: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantID: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  riderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  orderDate: { type: Date, default: Date.now },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'preparing', 'on the way', 'delivered'], default: 'pending' }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  MenuItem: mongoose.model('MenuItem', menuItemSchema),
  Rider: mongoose.model('Rider', riderSchema),
  Order: mongoose.model('Order', orderSchema),
  OrderItem: mongoose.model('OrderItem', orderItemSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Delivery: mongoose.model('Delivery', deliverySchema)
};
