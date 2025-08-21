// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless functions

import express from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes for production
(async () => {
  await registerRoutes(app);
})();

export default app;