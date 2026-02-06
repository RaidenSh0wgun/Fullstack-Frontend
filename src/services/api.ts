import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

// ---- Types ----

export type Role = "student" | "teacher";

export interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  role: Role;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  role: Role;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
}

export interface Quiz {
  id: number;
  title: string;
  course: number;
  description?: string;
  duration_minutes: number;
}

export interface Question {
  id: number;
  text: string;
  choices: { id: number; text: string }[];
}

export interface QuizDetail extends Quiz {
  questions: Question[];
}

// ---- Storage helpers ----

const ACCESS_KEY = "quiz_app_access";
const REFRESH_KEY = "quiz_app_refresh";

export function storeAuth(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function loadStoredAuth(): AuthTokens | null {
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---- Axios instance ----

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${access}`,
    };
  }
  return config;
});

// ---- Auth endpoints (adjust URLs to match your backend) ----

export async function loginRequest(
  payload: LoginPayload
): Promise<AuthTokens> {
  // Default SimpleJWT login endpoint
  const { data } = await api.post<AuthTokens>("/token/", {
    username: payload.username,
    password: payload.password,
    // Send role if your backend expects it; otherwise it will be ignored.
    role: payload.role,
  });
  return data;
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthTokens> {
  // Adjust to your actual registration endpoint/response shape.
  const { data } = await api.post<AuthTokens | AuthTokens & { user: User }>(
    "/register/",
    payload
  );

  // If your endpoint returns { access, refresh, user }, you can adapt here.
  return {
    access: (data as AuthTokens).access,
    refresh: (data as AuthTokens).refresh,
  };
}

export async function fetchCurrentUser(accessToken?: string): Promise<User> {
  const { data } = await api.get<User>("/users/me/", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
  return data;
}

// ---- Teacher endpoints ----

export async function fetchTeacherCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses/");
  return data;
}

export async function createCourse(
  payload: Pick<Course, "title" | "description">
): Promise<Course> {
  const { data } = await api.post<Course>("/courses/", payload);
  return data;
}

export async function updateCourse(
  id: number,
  payload: Partial<Pick<Course, "title" | "description">>
): Promise<Course> {
  const { data } = await api.patch<Course>(`/courses/${id}/`, payload);
  return data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}/`);
}

export async function fetchQuizzesForCourse(
  courseId: number
): Promise<Quiz[]> {
  const { data } = await api.get<Quiz[]>(`/quizzes/?course=${courseId}`);
  return data;
}

export async function createQuiz(
  payload: Omit<Quiz, "id">
): Promise<Quiz> {
  const { data } = await api.post<Quiz>("/quizzes/", payload);
  return data;
}

export async function updateQuiz(
  id: number,
  payload: Partial<Omit<Quiz, "id" | "course">>
): Promise<Quiz> {
  const { data } = await api.patch<Quiz>(`/quizzes/${id}/`, payload);
  return data;
}

export async function deleteQuiz(id: number): Promise<void> {
  await api.delete(`/quizzes/${id}/`);
}

// ---- Student quiz taking ----

export async function fetchQuizDetail(id: number): Promise<QuizDetail> {
  const { data } = await api.get<QuizDetail>(`/quizzes/${id}/`);
  return data;
}

export async function submitQuizAnswers(
  quizId: number,
  answers: Record<number, number>
): Promise<{ score: number }> {
  const { data } = await api.post<{ score: number }>(
    `/quizzes/${quizId}/submit/`,
    { answers }
  );
  return data;
}

