import "./env";

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { Home } from "./screens/home";
import { NewSession } from "./screens/new-session";
import { Session } from "./screens/session";
import { ReviewScreen } from "./screens/review";
import { projectIndexer } from "./lib/indexer";
import packageJson from "../package.json";

projectIndexer.init().catch(console.error);

const args = process.argv.slice(2);
const isReviewMode = args[0] === "review";

if (args.includes("--version") || args.includes("-v")) {
  console.log(packageJson.version);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`NoorCode CLI v${packageJson.version}

An interactive AI coding assistant that runs directly in your terminal.

Usage:
  noorcode             Start the interactive terminal interface
  noorcode review      Run an AI code review on staged git changes
  noorcode [options]

Options:
  -v, --version      Show version number
  -h, --help         Show this help message
`);
  process.exit(0);
}

const router = createMemoryRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: isReviewMode ? <ReviewScreen /> : <Home /> },
      { path: "sessions/new", element: <NewSession /> },
      { path: "sessions/:id", element: <Session /> },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />
}

const renderer = await createCliRenderer({
  targetFps: 60,
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
