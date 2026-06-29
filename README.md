# MQ Simulator

See the queue breathe. An in-browser, animated message queue simulator that makes abstract MQ concepts feel obvious through motion.

Built for learners, educators, and curious devs who want to *see* FIFO, competing consumers, fanout, routing, ack/nack, backpressure, and DLQ behavior instead of reading about it.

## Features

- **4 patterns**: simple queue, work queue (competing consumers), pub/sub (fanout), topic routing (AMQP wildcard matching)
- **7 presets**: happy path, competing consumers, broadcast, selective routing, backpressure, poison messages, slow consumer
- **Live simulation**: animated message tokens, fixed-timestep engine, real-time metrics with sparklines
- **Failure injection**: kill/pause consumers, inject nacks, flood queues, watch DLQ fill up
- **Shareable URLs**: full topology + params encoded in the URL, no backend required
- **Swiss International design**: pure black/white/red, no rounded corners, no shadows, Inter typography

## Getting started

```bash
npm install
npm run dev
```

Open the dev server URL, pick a preset, press play.

## Tech stack

React + Vite + TypeScript, Tailwind CSS v4, Zustand, Framer Motion, lucide-react.

## Documentation

- [docs/PRD.md](docs/PRD.md) — product requirements, patterns, constraints, data model
- [docs/AGENTS.md](docs/AGENTS.md) — Swiss International design system spec

## License

MIT