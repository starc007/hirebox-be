import { config } from "@config/env";
import { S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId as string,
    secretAccessKey: config.r2.secretAccessKey as string,
  },
});

// r2Client.config
//   .credentials()
//   .then(() => {
//     customLogger.info("R2 Client Connected");
//   })
//   .catch((err) => {
//     customLogger.error("Error Connecting to R2", err);
//   });

export { r2Client };
