from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import re
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "app" / "__init__.py"
GENERATE_RENDER = ROOT / "tools" / "generate-render.mjs"
RENDER_OUTPUT = ROOT / "app" / "static" / "render.js"
EXCLUDED_PARTS = {
    ".git",
    ".npm-cache",
    ".venv",
    "__pycache__",
    "docs",
    "node_modules",
}

EXCLUDED_NAMES = {
    ".env",
    "config.env",
    "SHA256SUMS",
}
def release_version() -> str:
    match = re.search(
        r'^__version__\s*=\s*"([0-9]+\.[0-9]+\.[0-9]+(?:\.[0-9]+)?)"$',
        VERSION_FILE.read_text(encoding="utf-8"),
        flags=re.MULTILINE,
    )
    if not match:
        raise RuntimeError(f"Unable to read release version from {VERSION_FILE}")
    return match.group(1)


def included(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return False
    if path.name in EXCLUDED_NAMES or path.suffix in {".pyc", ".pyo"}:
        return False
    return not path.name.endswith((".db", ".db-wal", ".db-shm", ".tar.gz"))


def normalized_info(path: Path, arcname: str) -> tarfile.TarInfo:
    info = tarfile.TarInfo(arcname)
    stat = path.stat()
    info.mtime = 0
    info.uid = 0
    info.gid = 0
    info.uname = "root"
    info.gname = "root"
    if path.is_dir():
        info.type = tarfile.DIRTYPE
        info.mode = 0o755
        info.size = 0
    else:
        info.type = tarfile.REGTYPE
        relative = path.relative_to(ROOT).as_posix()
        info.mode = 0o755 if relative.endswith(".sh") or relative == "deploy/foxopsctl" else 0o644
        info.size = stat.st_size
    return info


def verify_render_is_fresh() -> None:
    # render.js 是 index.html 的提交产物。CI 会重新生成并用 git diff 阻断，
    # 但本地 build-release 直接打包工作区，忘记重新生成就会把旧模板带上生产。
    # 这里重新编译到临时文件做二进制比对，让发布包不可能携带过期渲染函数。
    if not (ROOT / "tools" / "node_modules" / "@vue" / "compiler-dom").is_dir():
        raise RuntimeError("tools/node_modules is missing; run `npm ci --prefix tools` first")
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("node is not on PATH; cannot verify render.js freshness")
    with tempfile.TemporaryDirectory() as workspace:
        candidate = Path(workspace) / "render.js"
        subprocess.run(
            [node, str(GENERATE_RENDER), str(candidate)],
            cwd=ROOT,
            check=True,
            capture_output=True,
        )
        generated = candidate.read_bytes()
    if generated != RENDER_OUTPUT.read_bytes():
        raise RuntimeError(
            "app/static/render.js is stale; run `npm run render --prefix tools` before building a release"
        )


def normalized_file_content(path: Path) -> bytes:
    data = path.read_bytes()
    relative = path.relative_to(ROOT).as_posix()
    
    if path.suffix == ".sh" or relative == "deploy/foxopsctl" or path.name == "config.env.example":
        return data.replace(b"\r\n", b"\n")
    if relative.startswith("deploy/") and (
        path.suffix in {".conf", ".service", ".timer", ".sudoers"}
        or relative.endswith(".nginx.conf")
    ):
        return data.replace(b"\r\n", b"\n")
    return data


def build(output: Path) -> str:
    # Asset completeness is enforced by validate_release_assets() in
    # deploy/install.sh; a second list here would just be a second place to
    # forget whenever a static file is added.
    verify_render_is_fresh()
    output.parent.mkdir(parents=True, exist_ok=True)
    paths = [ROOT, *(path for path in ROOT.rglob("*") if included(path))]
    with output.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w", format=tarfile.PAX_FORMAT) as archive:
                for path in sorted(paths, key=lambda item: item.as_posix()):
                    relative = path.relative_to(ROOT)
                    arcname = "foxops" if not relative.parts else f"foxops/{relative.as_posix()}"
                    info = normalized_info(path, arcname)
                    if path.is_file():
                        content = normalized_file_content(path)
                        info.size = len(content)
                        archive.addfile(info, io.BytesIO(content))
                    else:
                        archive.addfile(info)

    digest = hashlib.sha256(output.read_bytes()).hexdigest().upper()
    return digest


def main() -> None:
    version = release_version()
    parser = argparse.ArgumentParser(description="Build a deterministic FoxOps source release")
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT.parent / "releases" / f"FoxOps-{version}-integrated.tar.gz",
    )
    args = parser.parse_args()
    output = args.output.resolve()
    digest = build(output)
    print(f"release={output}")
    print(f"sha256={digest}")


if __name__ == "__main__":
    main()
