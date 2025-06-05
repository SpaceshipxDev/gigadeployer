## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

### Python/conda setup

STP screenshots are generated with the `pythonocc` library. On Apple
silicon a working conda environment is recommended:

```bash
conda create -n occ-env python=3.10 -y
conda activate occ-env
pip install pythonocc-core PyQt5
```

Ensure the `python` executable from this environment is available in your
`PATH` when running the Next.js API so the `scripts/stp_screenshot.py`
helper works correctly.
