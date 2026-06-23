const crypto = require('node:crypto');

const isProduction = process.env.NODE_ENV === 'production';
const configuredJwtSecret = process.env.JWT_SECRET;
const developmentJwtSecret = crypto.randomBytes(64).toString('hex');

if (isProduction && !configuredJwtSecret) {
  throw new Error('JWT_SECRET must be configured in production.');
}

const jwtSecret = configuredJwtSecret || developmentJwtSecret;

module.exports = {
  jwtSecret,
};
