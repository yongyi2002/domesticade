# DomestiCade

**From Domestic Chaos to Algorithmic Order: Human-Machine Partnership in AR Level Generation**

DomestiCade is an augmented reality platformer that transforms everyday domestic space into a playable game level. A user first captures a photo of their environment, then the system uses AI scene analysis to reinterpret visible objects and surfaces as obstacles, paths, hazards, and goals. The resulting layout is reconstructed into a stylized AR course that can be placed into physical space and explored as a game.

This project was created for **CMU Art and Machine Learning, Spring 2026**.

## Concept

DomestiCade explores the contrast between domestic disorder and algorithmic structure. Homes are filled with objects, edges, surfaces, and clutter that are usually understood through daily use rather than through formal design logic. This project asks whether machine learning can reinterpret those familiar spatial conditions as the raw material for game design.

Rather than treating AI as a total generator, DomestiCade frames human-machine collaboration as a process of translation:

- The **user** selects and photographs the scene.
- The **model** analyzes visible objects and proposes game-semantic roles.
- The **system** reconstructs those outputs into a playable AR platformer.

The result is a hybrid authorship in which domestic reality becomes a game world through human framing, machine interpretation, and procedural reconstruction.

## Features

- Photo-based domestic scene analysis
- OpenAI-powered obstacle interpretation
- WebXR-based AR placement and interaction
- Three.js rendering
- Cannon.js physics simulation
- Procedural path / hazard / coin / goal generation
- Local GLB assets for obstacle visualization

## Current Architecture

This project uses a lightweight static-site-plus-serverless architecture.

### Frontend

- `index.html`
  Main application entry point.
  Contains UI, AR session setup, gameplay logic, procedural generation, rendering, physics integration, and asset loading.

### Backend

- `netlify/functions/analyze.js`
  Sends a user-provided scene image to OpenAI and returns structured JSON describing obstacle candidates.

- `netlify/functions/analyze-scene.js`
  Alias entry that forwards to `analyze.js`.

- `netlify/functions/meshyproxy.js`
  Proxy for Meshy text-to-3D APIs.
  Included in the repository, but **not currently used in the final runtime gameplay pipeline**.

### Assets

- `models/`
  Local `.glb` and `.fbx` assets used for obstacles, coins, and character animation resources.

## Runtime Pipeline

1. The user captures a photo of a domestic scene.
2. The browser compresses the image.
3. The frontend sends the image to `/.netlify/functions/analyze`.
4. OpenAI analyzes visible objects and surfaces.
5. The server returns structured obstacle JSON.
6. The frontend sanitizes the result and rebuilds it into a playable course.
7. WebXR places the generated level into AR space.
8. Local GLB models are loaded and replace placeholder obstacle geometry.
9. The user navigates the resulting AR platformer.

## Important Note on Meshy

Although the repository includes a Meshy proxy endpoint, the current playable version of DomestiCade does **not** generate 3D assets dynamically at runtime.

Instead:

- obstacle models are loaded from the local `models/` folder
- Meshy appears to have been used earlier to prepare some assets
- runtime gameplay currently relies on pre-generated local files for stability and speed

## Tech Stack

- HTML / CSS / JavaScript
- [Three.js](https://threejs.org/)
- [Cannon.js](https://schteppe.github.io/cannon.js/)
- [WebXR](https://immersive-web.github.io/webxr/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [OpenAI API](https://platform.openai.com/docs/)
- Meshy API (included in backend, not active in current runtime path)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd domesticade
```

### 2. Configure environment variables

For Netlify deployment or local Netlify function testing, set:

- `OPENAI_API_KEY`
- `MESHY_API_KEY` (optional for current runtime, required only if using the Meshy proxy)

### 3. Run locally

Because the project relies on Netlify Functions, the easiest local workflow is through the Netlify dev environment.

If you have Netlify CLI installed:

```bash
netlify dev
```

If you are only previewing the static frontend, a basic static server can serve `index.html`, but AI-powered analysis will not work unless the function endpoints are also available.

## Deployment

The repository is configured for Netlify via `netlify.toml`.

- Static frontend publish directory: `.`
- Functions directory: `netlify/functions`

## Repository Structure

```text
platform_final/
├── index.html
├── netlify.toml
├── models/
│   ├── *.glb
│   └── *.fbx
└── netlify/
    └── functions/
        ├── analyze.js
        ├── analyze-scene.js
        └── meshyproxy.js
```

## Authors

- Xinyi Li
- Yongyi Xiong
- Yunxiang Ma

CMU Art and Machine Learning  
Spring 2026



