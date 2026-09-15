FROM python:3.13.5-slim
WORKDIR /app
COPY bundle.b64.* fix04a fix04b fix15a fix15b fix16a fix16b /tmp/bundle/
RUN python -c "from pathlib import Path; import base64,zipfile,io,shutil,hashlib; d=Path('/tmp/bundle'); names=['bundle.b64.00','bundle.b64.01','bundle.b64.02','bundle.b64.03','fix04a','fix04b','bundle.b64.05','bundle.b64.06','bundle.b64.07','bundle.b64.08','bundle.b64.09','bundle.b64.10','bundle.b64.11','bundle.b64.12','bundle.b64.13','bundle.b64.14','fix15a','fix15b','fix16a','fix16b','bundle.b64.17']; raw=base64.b64decode(''.join((d/n).read_text() for n in names)); assert hashlib.sha256(raw).hexdigest()=='1252e376cf75a4ece8620010ab21671d3d37e77790eada671097b1d7e96ebca1', 'bundle checksum mismatch'; z=zipfile.ZipFile(io.BytesIO(raw)); z.extractall('/tmp/src'); src=Path('/tmp/src/worksheet-studio-original-web'); [shutil.copytree(x,Path('/app')/x.name,dirs_exist_ok=True) if x.is_dir() else shutil.copy2(x,Path('/app')/x.name) for x in src.iterdir()]"
RUN chmod +x start.sh && pip install --no-cache-dir -r requirements.txt
ENV PORT=8011
EXPOSE 8011
CMD ["sh","-c","./start.sh"]
