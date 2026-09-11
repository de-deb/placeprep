import dotenv from "dotenv";
dotenv.config();
import { createApp } from "./app";
import { assertEnvForStart, env } from "./config/env";

assertEnvForStart();

const app = createApp();
app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[placeprep] backend listening on :${env.port}`);
});
