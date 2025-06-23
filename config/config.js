module.exports = {
  JWT_SECRET:
    process.env.JWT_SECRET || "super-secret-default-key-please-change", // Get JWT secret from environment variable
};
