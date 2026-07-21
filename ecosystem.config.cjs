module.exports = {
  apps: [
    {
      name: "zytek-solutions",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/zytek/error.log",
      out_file: "/var/log/zytek/out.log",
    },
  ],
};
