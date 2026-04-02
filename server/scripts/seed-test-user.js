const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const {
  MONGODB_URI,
  TEST_USER_USERNAME = 'testuser',
  TEST_USER_EMAIL = 'testuser@walchandsangli.ac.in',
  TEST_USER_PRN = 'TEST123456',
  TEST_USER_PASSWORD = 'TestPassword123!',
} = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Please configure it in server/.env.');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    const existing = await User.findOne({
      $or: [{ email: TEST_USER_EMAIL }, { username: TEST_USER_USERNAME }, { prn: TEST_USER_PRN }],
    });

    if (existing) {
      existing.username = TEST_USER_USERNAME;
      existing.email = TEST_USER_EMAIL;
      existing.prn = TEST_USER_PRN;
      existing.password = TEST_USER_PASSWORD;
      existing.isVerified = true;
      await existing.save();
      console.log('Updated existing test user:', TEST_USER_EMAIL);
    } else {
      await User.create({
        username: TEST_USER_USERNAME,
        email: TEST_USER_EMAIL,
        prn: TEST_USER_PRN,
        password: TEST_USER_PASSWORD,
        isVerified: true,
      });
      console.log('Created test user:', TEST_USER_EMAIL);
    }
  } catch (error) {
    console.error('Failed to seed test user:', error?.message || error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
