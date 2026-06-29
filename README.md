# MQ Simulator

See the queue breathe.

An in-browser, animated message queue simulator that makes abstract MQ concepts feel obvious through motion. Every message is a visible token. Every queue mechanic is a visible behavior.

## Why

You can read about FIFO, competing consumers, fanout, and dead letter queues. Or you can watch them happen. This simulator is for people who learn better by seeing than by reading ASCII diagrams.

It models the *semantics* of message queues, not the wire protocol. Numbers are illustrative, not benchmarks. It is not a load tester or a real broker.

## What you can do

- **Watch 4 patterns**: simple queue, work queue (competing consumers), pub/sub (fanout), topic routing with AMQP wildcard matching
- **Load 7 presets**: each demonstrates a concept like backpressure, poison messages, or slow consumers
- **Break things on purpose**: kill consumers, pause them, inject nack failures, flood the queue
- **See the consequences**: backpressure stalls producers, nacks trigger requeue storms, poison messages fill the DLQ, dead consumers drop throughput
- **Read contextual explanations**: each preset has a description, glossary terms are hoverable, an impact analysis panel appears when the system is under stress
- **Share by URL**: the entire topology and parameters are encoded in the URL. Paste it, get the same sim. No backend, no accounts.

## Documentation

- [docs/PRD.md](docs/PRD.md) — product requirements, patterns, constraints, data model
- [docs/AGENTS.md](docs/AGENTS.md) — Swiss International design system spec

## Tech

React, Vite, TypeScript, Tailwind CSS v4, Zustand, Framer Motion, lucide-react.