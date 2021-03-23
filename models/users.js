var mongoose = require('mongoose');

var userSchema = mongoose.Schema(
  {
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    token: String,
    password: { type: String, required: true },
    hairType: String,
    hairLength: String,
    images: Array,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'shops' }],
    status: String,
    shopId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'shops' }],
    isActive: Boolean,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comments' }],
    appointments: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'appointments' },
    ],
    gender: String,
    loyaltyPoints: Number,
  },
  { timestamps: true }
);

var UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
