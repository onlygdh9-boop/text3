import base64
import hashlib
import io
import os
import shutil
import sys
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parent
PARTS = [
    "bundle.b64.00","bundle.b64.01","bundle.b64.02","bundle.b64.03",
    "fix04a","fix04b","bundle.b64.05","bundle.b64.06","bundle.b64.07","bundle.b64.08",
    "bundle.b64.09","bundle.b64.10","bundle.b64.11","bundle.b64.12","bundle.b64.13","bundle.b64.14",
    "fix15a","fix15b","fix16a","fix16b","bundle.b64.17",
]
EXPECTED_SHA256 = "1252e376cf75a4ece8620010ab21671d3d37e77790eada671097b1d7e96ebca1"

encoded = "".join((BASE / name).read_text(encoding="utf-8").strip() for name in PARTS)
raw = base64.b64decode(encoded)
actual = hashlib.sha256(raw).hexdigest()
if actual != EXPECTED_SHA256:
    raise RuntimeError(f"Worksheet Studio bundle checksum mismatch: {actual}")

runtime_root = Path("/tmp/worksheet_studio_runtime")
if runtime_root.exists():
    shutil.rmtree(runtime_root)
runtime_root.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(io.BytesIO(raw)) as zf:
    zf.extractall(runtime_root)

src = runtime_root / "worksheet-studio-original-web"
if not (src / "app.pyc").exists():
    raise RuntimeError("Worksheet Studio app.pyc was not restored")

os.chdir(src)
port = os.environ.get("PORT", "8011")
os.execv(sys.executable, [
    sys.executable,
    "app.pyc",
    "--host", "0.0.0.0",
    "--port", port,
])
