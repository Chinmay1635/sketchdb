const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/secrets');

const databaseConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    diagramId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      default: 3306,
    },
    database: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    encryptedPassword: {
      type: String,
      required: true,
      select: false,
    },
    ssl: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

databaseConnectionSchema.pre('save', function (next) {
  try {
    if (this.isModified('password') && this.password) {
      this.encryptedPassword = encrypt(this.password);
      this.password = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
});

databaseConnectionSchema.methods.getDecryptedPassword = function () {
  if (!this.encryptedPassword) {
    throw new Error('Encrypted password is missing');
  }
  return decrypt(this.encryptedPassword);
};

module.exports = mongoose.model('DatabaseConnection', databaseConnectionSchema);
