export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || 'mysql://damira_user:DamiraUserSecure2026!@localhost:3306/damira_db',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'DamiraAccessSecretKey2026!RoyalPurple',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'DamiraRefreshSecretKey2026!RoyalPurple',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
});
