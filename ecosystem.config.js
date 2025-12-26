module.exports = {
  apps: [
    {
      name: "hirebox-be",
      script: "./dist/index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,
      watch: false,
      ignore_watch: ["node_modules", "logs", "dist"],
    },
  ],
};
