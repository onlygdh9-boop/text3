FROM python:3.13.5-slim
WORKDIR /app
COPY bundle.b64.* /tmp/bundle/
RUN python -c "from pathlib import Path; import base64,zipfile,io,shutil; p=sorted(Path('/tmp/bundle').glob('bundle.b64.*')); data=base64.b64decode(''.join(x.read_text() for x in p)); z=zipfile.ZipFile(io.BytesIO(data)); z.extractall('/tmp/src'); src=Path('/tmp/src/worksheet-studio-original-web'); [shutil.copytree(x,Path('/app')/x.name,dirs_exist_ok=True) if x.is_dir() else shutil.copy2(x,Path('/app')/x.name) for x in src.iterdir()]"
RUN chmod +x start.sh && pip install --no-cache-dir -r requirements.txt
ENV PORT=8011
EXPOSE 8011
CMD ["sh","-c","./start.sh"]
