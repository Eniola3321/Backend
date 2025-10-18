import http from "http";
import "reflect-metadata";
import config from "./api/config/config";
import app from "./app";
import dotenv from "dotenv";
dotenv.config();
class Server {
  private server: http.Server;
  private port: number;
  constructor() {
    this.port = config.port ?? 3500;
    this.server = http.createServer(app);
  }
  private attachSignalHandlers() {
    const shutdown = async () => {
      console.log("shutting down gracefully...");
      this.server.close(() => {
        console.log("server closed");
        process.exit(0);
      });
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }
  private attachErrorHandlerOnStartup() {
    this.server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        console.warn(
          `Port ${this.port} is in use or access denied, trying port ${
            this.port + 1
          }...`
        );
        this.port += 1;
        this.listen();
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });
  }
  private listen() {
    this.server.listen(this.port, () => {
      console.log(`${config.NODE_ENV} server running on port ${this.port}`);
    });
  }
  public async start(): Promise<void> {
    try {
      this.attachSignalHandlers();
      this.attachErrorHandlerOnStartup();
      this.listen();
    } catch (error) {
      console.error("Error during server startup:", error);
      process.exit(1);
    }
  }
}

(async () => {
  const server = new Server();
  await server.start();
})();
