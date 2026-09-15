const JEONGDOKSIL_API = "https://dbeefazxvnwtutfqvgkc.supabase.co/functions/v1/jeongdoksil-api";
const TEACHER_TOKEN_KEY = "jeongdoksil_teacher_token";
const STUDENT_TOKEN_KEY = "jeongdoksil_student_token";
let SHARED_STATE_VERSION = null;

function isStudentPage() {
  return /student\.html$/i.test(window.location.pathname);
}

function requestJsonSync(action, payload = {}, token = "") {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", JEONGDOKSIL_API, false);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(JSON.stringify({ action, ...payload }));
    const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
    return { ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body };
  } catch (error) {
    console.warn("Supabase request failed:", error);
    return { ok: false, status: 0, body: { error: "서버에 연결할 수 없습니다." } };
  }
}

function teacherLoginSync(password) {
  const result = requestJsonSync("teacher_login", { password });
  if (result.ok && result.body?.token) {
    localStorage.setItem(TEACHER_TOKEN_KEY, result.body.token);
    return true;
  }
  return false;
}

function studentLoginSync(id, password) {
  const result = requestJsonSync("student_login", { id, password });
  if (result.ok && result.body?.token) {
    localStorage.setItem(STUDENT_TOKEN_KEY, result.body.token);
    SHARED_STATE_VERSION = result.body.version || null;
    return result.body;
  }
  return null;
}

function logoutSharedSession(role) {
  const key = role === "teacher" ? TEACHER_TOKEN_KEY : STUDENT_TOKEN_KEY;
  const token = localStorage.getItem(key) || "";
  if (token) requestJsonSync("logout", {}, token);
  localStorage.removeItem(key);
}

function readSharedStateSync(storageKey) {
  const tokenKey = isStudentPage() ? STUDENT_TOKEN_KEY : TEACHER_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey) || "";
  if (!token) return null;

  const result = requestJsonSync("get_state", {}, token);
  if (result.ok && result.body && typeof result.body.state === "object") {
    SHARED_STATE_VERSION = result.body.version || null;
    localStorage.setItem(storageKey, JSON.stringify(result.body.state));
    return result.body.state;
  }

  if (result.status === 401) {
    localStorage.removeItem(tokenKey);
    if (!isStudentPage()) window.location.replace("./teacher-login.html");
  }
  return null;
}

function writeSharedStateSync(storageKey, nextState) {
  const tokenKey = isStudentPage() ? STUDENT_TOKEN_KEY : TEACHER_TOKEN_KEY;
  const token = localStorage.getItem(tokenKey) || "";
  if (!token) return false;

  const result = requestJsonSync("save_state", { state: nextState, version: SHARED_STATE_VERSION }, token);
  if (result.ok) {
    SHARED_STATE_VERSION = result.body?.version || SHARED_STATE_VERSION;
    const storedState = result.body?.state && typeof result.body.state === "object" ? result.body.state : nextState;
    localStorage.setItem(storageKey, JSON.stringify(storedState));
    return true;
  }

  if (result.status === 409 && result.body?.state) {
    SHARED_STATE_VERSION = result.body.version || null;
    localStorage.setItem(storageKey, JSON.stringify(result.body.state));
    alert("다른 기기에서 먼저 수정한 내용이 있어 최신 데이터를 다시 불러왔습니다. 다시 시도해 주세요.");
    window.location.reload();
    return false;
  }
  if (result.status === 401) {
    localStorage.removeItem(tokenKey);
    if (!isStudentPage()) window.location.replace("./teacher-login.html");
  }
  alert(result.body?.error || "저장에 실패했습니다.");
  return false;
}

function readServerInfoSync() {
  return { mode: "supabase", provider: "Supabase", api: JEONGDOKSIL_API };
}
