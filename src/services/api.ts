const API_BASE_URL = "/api";


export type Role = "student" | "teacher" | "admin";

export type QuestionType = "identification" | "enumeration" | "mcq" | "tf";

export interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
  full_name?: string;
  bio?: string;
  sex?: string;
  avatar_url?: string;
  email_verified?: boolean;
  student_id?: string | null;
  instructor_id?: string | null;
  courses?: string[];
  enrolled_courses?: string[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  is_active?: boolean;
  is_enrolled?: boolean;
  author?: number;
  author_name?: string;
  passkey?: string | null;
  created_at?: string;
  updated_at?: string;
}

type ListResponse<T> = T[] | { results?: T[] };

export interface Quiz {
  id: number;
  title: string;
  course: number;
  description?: string;
  duration_minutes: number;
  is_active?: boolean;
  due_date?: string | null;
  has_attempted?: boolean;
  show_scores_after_quiz?: boolean;
  question_count?: number;
}

export interface QuestionChoice {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  question_type: QuestionType;
  answer_format?: string;
  correct_text?: string;
  choices: QuestionChoice[];
}

export interface QuizDetail extends Quiz {
  questions: Question[];
  has_attempted?: boolean;
}

export interface QuizAttemptScore {
  id: number;
  score: number;
  total: number;
  effective_score?: number;
  created_at?: string;
}

export interface QuizViewResponse {
  quiz: Quiz;
  attempt: QuizAttemptScore | null;
}

export interface QuizChoicePayload {
  text: string;
  is_correct?: boolean;
}

export interface QuizQuestionPayload {
  text: string;
  question_type: QuestionType;
  answer_format?: string;
  correct_text?: string;
  choices: QuizChoicePayload[];
}

export interface QuizCreatePayload {
  title: string;
  description?: string;
  duration_minutes: number;
  course: number;
  due_date?: string | null;
  show_scores_after_quiz?: boolean;
  questions?: QuizQuestionPayload[];
}


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


async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const token = accessToken ?? localStorage.getItem(ACCESS_KEY);
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !("Content-Type" in headers)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data === "string") {
        errorMessage = data;
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (Object.keys(data || {}).length) {
        errorMessage = JSON.stringify(data);
      }
    } catch {
      const text = await response.text();
      if (text) {
        const snippet = text.replace(/\s+/g, " ").trim();
        errorMessage = snippet.length > 200 ? snippet.slice(0, 200) + "..." : snippet;
      }
    }
    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


export async function loginRequest(
  payload: LoginPayload
): Promise<AuthTokens> {
  return request<AuthTokens>("/token/", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
    }),
  });
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthTokens> {
  const requestData = {
    username: payload.username,
    email: payload.email,
    password1: payload.password,
    password2: payload.password,
  };

  return request<AuthTokens>("/register/", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function fetchCurrentUser(accessToken?: string): Promise<User> {
  return request<User>("/users/me/", {}, accessToken);
}

export async function updateCurrentUser(payload: FormData | Partial<Pick<User, "username" | "email" | "full_name" | "bio" | "sex">>): Promise<User> {
  const isFormData = payload instanceof FormData;
  return request<User>("/users/me/", {
    method: "PATCH",
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? {} : { "Content-Type": "application/json" },
  });
}

export async function verifyEmailRequest(email: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/email/verify/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmEmailVerification(
  uid: string,
  token: string
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/email/verify/confirm/", {
    method: "POST",
    body: JSON.stringify({ uid, token }),
  });
}

export async function fetchMyCourses(): Promise<Course[]> {
  const data = await request<ListResponse<Course>>("/courses/my/");
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function fetchTeacherCourses(): Promise<Course[]> {
  return fetchMyCourses();
}

export async function createCourse(
  payload: Pick<Course, "title" | "description" | "passkey">
): Promise<Course> {
  return request<Course>("/courses/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourse(
  id: number,
  payload: Partial<Pick<Course, "title" | "description" | "passkey" | "is_active">>
): Promise<Course> {
  return request<Course>(`/courses/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCourse(id: number): Promise<void> {
  await request<void>(`/courses/${id}/`, { method: "DELETE" });
}

export async function enrollCourse(
  id: number,
  passkey?: string
): Promise<Course> {
  return request<Course>(`/courses/${id}/enroll/`, {
    method: "POST",
    body: JSON.stringify({ passkey }),
  });
}

export async function unenrollCourse(id: number): Promise<Course> {
  return request<Course>(`/courses/${id}/enroll/`, { method: "DELETE" });
}

export async function fetchQuizzesForCourse(
  courseId: number
): Promise<Quiz[]> {
  const data = await request<ListResponse<Quiz>>(`/quizzes/?course=${courseId}`);
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function createQuiz(
  payload: QuizCreatePayload
): Promise<Quiz> {
  return request<Quiz>("/quizzes/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuiz(
  id: number,
  payload: Partial<Omit<Quiz, "id" | "course">>
): Promise<Quiz> {
  return request<Quiz>(`/quizzes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuiz(id: number): Promise<void> {
  await request<void>(`/quizzes/${id}/`, { method: "DELETE" });
}


export async function fetchQuizDetail(id: number): Promise<QuizDetail> {
  return request<QuizDetail>(`/quizzes/${id}/`);
}

export async function createQuestion(
  quizId: number,
  payload: QuizQuestionPayload
): Promise<unknown> {
  return request<unknown>(`/quizzes/${quizId}/questions/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchQuizQuestions(quizId: number): Promise<Question[]> {
  return request<Question[]>(`/quizzes/${quizId}/questions/`);
}

export async function deleteQuestion(questionId: number): Promise<void> {
  await request<void>(`/questions/${questionId}/`, { method: "DELETE" });
}

export async function updateQuestion(
  questionId: number,
  payload: Partial<QuizQuestionPayload>
): Promise<Question> {
  const data = await request<{ message: string; data: Question }>(
    `/questions/${questionId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return data.data;
}

export async function submitQuizAnswers(
  quizId: number,
  answers: Record<number, number | string>
): Promise<{ score: number; total: number }> {
  return request<{ score: number; total: number }>(
    `/quizzes/${quizId}/submit/`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    }
  );
}

export interface QuizTimerResponse {
  started_at: string | null;
  remaining_seconds: number;
}

export async function fetchQuizTimer(quizId: number): Promise<QuizTimerResponse> {
  return request<QuizTimerResponse>(`/quizzes/${quizId}/timer/`);
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start: string;
  end: string | null;
  event_type: string;
  related_course: number | null;
  related_quiz: number | null;
}

export async function fetchCalendarQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>("/quizzes/calendar/");
}

export async function fetchPendingQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>("/quizzes/pending/");
}

export async function fetchAttemptedQuizzes(): Promise<Quiz[]> {
  return request<Quiz[]>("/quizzes/attempted/");
}

export async function fetchQuizViewDetail(
  quizId: number
): Promise<QuizViewResponse> {
  return request<QuizViewResponse>(`/quizzes/${quizId}/view/`);
}

export interface EnrolledStudent {
  id: number;
  user: number;
  username: string;
  full_name: string;
  student_id: string;
}

export async function fetchCourseStudents(courseId: number): Promise<EnrolledStudent[]> {
  return request<EnrolledStudent[]>(`/courses/${courseId}/students/`);
}

export interface QuizAttempt {
  id: number;
  student: number;
  student_name: string;
  username: string;
  score: number;
  score_override?: number | null;
  effective_score?: number;
  total: number;
  answers?: Record<string, number | string>;
  created_at: string;
  edited_at?: string | null;
  edited_by?: number | null;
}

export async function fetchQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
  return request<QuizAttempt[]>(`/quizzes/${quizId}/attempts/`);
}

export async function fetchQuizAttemptDetail(
  quizId: number,
  attemptId: number
): Promise<QuizAttempt> {
  return request<QuizAttempt>(`/quizzes/${quizId}/attempts/${attemptId}/`);
}

export async function updateQuizAttempt(
  quizId: number,
  attemptId: number,
  payload: Partial<Pick<QuizAttempt, "answers" | "score_override">>
): Promise<QuizAttempt> {
  return request<QuizAttempt>(
    `/quizzes/${quizId}/attempts/${attemptId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

/** For teacher: their courses. For student: use fetchEnrolledCourses for "my courses" or fetchCourses() for all. */
export async function fetchEnrolledCourses(): Promise<Course[]> {
  const data = await request<ListResponse<Course>>("/courses/enrolled/");
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function fetchCourses(): Promise<Course[]> {
  const data = await request<ListResponse<Course>>("/courses/");
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function fetchCourseDetail(id: number): Promise<Course> {
  return request<Course>(`/courses/${id}/detail/`);
}

export interface AdminManagedUser {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  role: Role;
  full_name: string;
  sex?: string;
  email_verified?: boolean;
}

export async function fetchAdminUsers(params?: {
  search?: string;
  role?: "student" | "teacher" | "all";
}): Promise<AdminManagedUser[]> {
  const query = new URLSearchParams();
  if (params?.search) {
    query.set("search", params.search);
  }
  if (params?.role) {
    query.set("role", params.role);
  }
  const qs = query.toString();
  return request<AdminManagedUser[]>(`/admin/users/${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminUserDetail(userId: number): Promise<AdminManagedUser> {
  return request<AdminManagedUser>(`/admin/users/${userId}/`);
}

export async function updateAdminUser(
  userId: number,
  payload: Partial<Pick<AdminManagedUser, "username" | "full_name" | "is_active" | "role">> & {
    password?: string;
  }
): Promise<AdminManagedUser> {
  return request<AdminManagedUser>(`/admin/users/${userId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await request<void>(`/admin/users/${userId}/`, { method: "DELETE" });
}

export interface PasswordResetRequestPayload {
  email: string;
  frontend_url?: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
}

export async function requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/password/reset/", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      frontend_url: payload.frontend_url || window.location.origin,
    }),
  });
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/password/reset/confirm/", {
    method: "POST",
    body: JSON.stringify({
      uid: payload.uid,
      token: payload.token,
      new_password: payload.new_password,
    }),
  });
}

