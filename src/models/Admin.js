const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin',
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

adminSchema.statics.hashPassword = async function(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

adminSchema.methods.comparePassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

adminSchema.virtual('isPasswordSet').get(function() {
  return !!this.passwordHash;
});

module.exports = mongoose.model('Admin', adminSchema);