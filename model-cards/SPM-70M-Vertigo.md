---
language:
  - en
license: apache-2.0
pipeline_tag: text-generation
tags:
  - spm
  - foundation-model
  - causal-lm
  - from-scratch
model-index:
  - name: SPM-70M-Vertigo
    results: []
---

# SPM-70M-Vertigo

SPM-70M-Vertigo is Syclient's first public model experiment: an approximately 71M-parameter English causal language model trained from scratch. It is a small research artifact intended to validate an end-to-end training, packaging, and inference workflow.

This release should not be interpreted as a frontier-model claim or as evidence of production readiness.

## Model details

| Field | Value |
| --- | --- |
| Architecture | Decoder-only Transformer (Llama-style) |
| Parameters | 70,529,920 |
| Hidden size | 512 |
| Layers | 12 |
| Attention heads | 8 |
| KV heads | 4 |
| Vocabulary | 32,000 |
| Maximum sequence length | 2,048 |
| Positional encoding | RoPE |
| Normalization | RMSNorm |
| Activation | SwiGLU |
| Precision | BF16 |

## Training

- Dataset: FineWeb sample-10BT
- Tokenizer: SentencePiece BPE, vocabulary size 32,000
- Effective batch size: 128
- Training objective: causal language modeling

The current release does not include enough information to reproduce the complete training run. A future card revision should add the exact dataset revision, filtering steps, token count, optimizer and schedule, hardware, training time, energy estimate, and random seeds.

## Intended use

SPM-70M-Vertigo is intended for:

- inspecting a small from-scratch language-model checkpoint;
- validating local inference and packaging workflows;
- establishing a baseline for later small-scale Syclient experiments;
- research and educational use under the Apache 2.0 license.

It is not intended for production deployment, high-stakes decisions, factual question answering, or autonomous tool use.

## Limitations

At this scale and release stage, the model may produce incoherent, repetitive, biased, unsafe, or factually incorrect text. It has not been instruction-tuned, aligned for assistant behavior, or validated for agent workflows. No benchmark or safety evaluation results are published with the current checkpoint.

## Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "Syclient/SPM-70M-Vertigo"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id)

inputs = tokenizer("The meaning of life is", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

## Evaluation status

No evaluation results are published yet. The next release milestone should add:

- language-modeling loss and perplexity on a held-out, documented split;
- a small set of public zero-shot language benchmarks appropriate to this scale;
- qualitative failure examples;
- inference speed and memory measurements on named hardware;
- comparison with a clearly identified baseline.

## License

Apache 2.0.

## Contact

Questions and reproducibility reports: hello@syclient.com

