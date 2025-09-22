import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not a Google OAuth user
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'shop_owner', 'delivery_boy'],
    default: 'customer'
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  // Location data
  location: {
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    formattedAddress: {
      type: String,
      default: ''
    },
    placeId: {
      type: String,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Additional fields for delivery boys
  vehicleType: {
    type: String,
    default: ''
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  // Password reset
  resetPasswordToken: {
    type: String,
    default: null,
    index: true
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // OTP based password reset
  resetOtpCode: {
    type: String,
    default: null,
    index: true
  },
  resetOtpExpires: {
    type: Date,
    default: null
  },
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // Location tracking preferences
  locationTracking: {
    enabled: {
      type: Boolean,
      default: false
    },
    updateInterval: {
      type: Number,
      default: 5 * 60 * 1000 // 5 minutes in milliseconds
    },
    highAccuracy: {
      type: Boolean,
      default: true
    },
    lastTrackingUpdate: {
      type: Date,
      default: null
    }
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Password hashing is handled in the auth routes, not here
// This prevents double hashing

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.googleId;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

export { User };
