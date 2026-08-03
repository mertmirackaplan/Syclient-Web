# Syclient Hugging Face release plan

This plan turns the Model Lab roadmap into small, verifiable public artifacts. Items remain planned until a checkpoint, model card, evaluation, and reproducible inference path are published together.

## 0. Repair the current public release

Update the SPM-70M-Vertigo model card using the corrected draft in this directory.

Required before announcing the refresh:

- correct the `model-index` name and repository path;
- replace the outdated usage example with the real repository ID;
- add training provenance and compute details;
- publish at least one held-out loss/perplexity result;
- add limitations, intended use, and failure examples;
- pin the exact Transformers version used for validation.

## 1. Agent tool-use fine-tune

Goal: test whether a small supervised fine-tune improves tool selection and argument construction for a bounded Mosaic Agent workflow.

Public artifacts:

- training-data schema and synthetic-data generation note;
- adapter or checkpoint, subject to the base model's license;
- exact-match evaluation for tool name and arguments;
- invalid-call rate and recovery rate;
- baseline comparison and failure examples;
- model card with non-goals and safety boundaries.

Release gate: improvement must reproduce across three seeds or the result should be published as a negative experiment.

## 2. Verification and repair experiment

Goal: test whether a small model or adapter can classify failed acceptance checks and select a bounded repair action.

Public artifacts:

- anonymized evaluation schema for execution logs and artifact checks;
- checkpoint or adapter;
- accuracy by failure category;
- false-accept rate, false-repair rate, and retry-budget analysis;
- examples where the model should abstain or escalate.

Release gate: false acceptance must be reported separately from aggregate accuracy because it is the higher-risk error.

## 3. Hybrid / MoE routing ablation

Goal: evaluate whether a small router can select among specialist modules for planning, tool use, verification, and response generation.

Public artifacts:

- minimal architecture diagram and configuration;
- dense baseline at a comparable active-parameter or compute budget;
- routing distribution, load balance, and expert-collapse measurements;
- latency, memory, and quality trade-offs;
- checkpoint only if the ablation provides a useful result.

Release gate: the experiment must show a measurable trade-off or publish a clear negative result. It should not be presented as Mosaic Two.

## Publishing standard

Every Syclient model release should include:

1. Status: public experiment, in development, or archived.
2. Objective and explicit non-goals.
3. Data provenance and license notes.
4. Architecture and training configuration.
5. Reproducible inference instructions.
6. Evaluation methodology, baseline, and raw result table.
7. Limitations, failure examples, and safety notes.
8. Connection to a concrete Mosaic Agent workflow.
9. Versioned changelog and contact path.

