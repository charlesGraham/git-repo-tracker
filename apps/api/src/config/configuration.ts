export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'github_tracker',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  syncInterval: parseInt(process.env.SYNC_INTERVAL_MINUTES || '60', 10), // minutes
});
