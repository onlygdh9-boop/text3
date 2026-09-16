import p0 from './payload0.js';
import p1 from './payload1.js';
import p2 from './payload2.js';

async function boot() {
  const encoded = p0 + p1 + p2;
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  if (!window.DecompressionStream) {
    throw new Error('최신 Chrome 또는 Edge를 사용해 주세요.');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const jsonText = await new Response(stream).text();
  const payload = JSON.parse(jsonText);

  document.body.innerHTML = payload.body;

  const style = document.createElement('style');
  style.textContent = payload.css;
  document.head.appendChild(style);

  for (const source of [payload.xlsx, payload.app]) {
    const script = document.createElement('script');
    script.textContent = source;
    document.body.appendChild(script);
  }

  document.dispatchEvent(new Event('DOMContentLoaded'));
}

boot().catch((error) => {
  console.error(error);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:64px auto;padding:24px"><h1>프로그램을 열지 못했습니다.</h1><p>최신 Chrome 또는 Edge에서 다시 시도해 주세요.</p></main>';
  }
});