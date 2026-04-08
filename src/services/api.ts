import axios from "axios";

const API_BASE_URL = "/api";


export type Role = "student" | "teacher";

export type QuestionType = "identification" | "enumeration" | "mcq" | "tf";

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
  is_active?: boolean;
  is_enrolled?: boolean;
  author?: number;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Quiz {
  id: number;
  title: string;
  course: number;
  description?: string;
  duration_minutes: number;
  is_active?: boolean;
  due_date?: string | null;
  has_attempted?: boolean;
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
  correct_text?: string;
  choices: QuizChoicePayload[];
}

export interface QuizCreatePayload {
  title: string;
  description?: string;
  duration_minutes: number;
  course: number;
  due_date?: string | null;
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



const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${access}`;
  }
  return config;
});


export async function loginRequest(
  payload: LoginPayload
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/token/", {
    username: payload.username,
    password: payload.password,
  });
  return data;
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthTokens> {
  const requestData = {
    username: payload.username,
    email: payload.email,
    password1: payload.password,
    password2: payload.password,
    role: payload.role,
  };

  const { data } = await api.post<AuthTokens>("/register/", requestData);
  return data;
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


export async function fetchMyCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses/my/");
  return data;
}

export async function fetchTeacherCourses(): Promise<Course[]> {
  return fetchMyCourses();
}

export async function createCourse(
  payload: Pick<Course, "title" | "description">
): Promise<Course> {
  const { data } = await api.post<Course>("/courses/", payload);
  return data;
}

export async function updateCourse(
  id: number,
  payload: Partial<Pick<Course, "title" | "description" | "is_active">>
): Promise<Course> {
  const { data } = await api.patch<Course>(`/courses/${id}/`, payload);
  return data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}/`);
}

export async function enrollCourse(id: number): Promise<Course> {
  const { data } = await api.post<Course>(`/courses/${id}/enroll/`);
  return data;
}

export async function unenrollCourse(id: number): Promise<Course> {
  const { data } = await api.delete<Course>(`/courses/${id}/enroll/`);
  return data;
}

export async function fetchQuizzesForCourse(
  courseId: number
): Promise<Quiz[]> {
  const { data } = await api.get<Quiz[]>(`/quizzes/?course=${courseId}`);
  return data;
}

export async function createQuiz(
  payload: QuizCreatePayload
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


export async function fetchQuizDetail(id: number): Promise<QuizDetail> {
  const { data } = await api.get<QuizDetail>(`/quizzes/${id}/`);
  return data;
}

export async function createQuestion(
  quizId: number,
  payload: QuizQuestionPayload
): Promise<unknown> {
  const { data } = await api.post(`/quizzes/${quizId}/questions/`, payload);
  return data;
}

export async function fetchQuizQuestions(quizId: number): Promise<Question[]> {
  const { data } = await api.get<Question[]>(`/quizzes/${quizId}/questions/`);
  return data;
}

export async function deleteQuestion(questionId: number): Promise<void> {
  await api.delete(`/questions/${questionId}/`);
}

export async function updateQuestion(
  questionId: number,
  payload: Partial<QuizQuestionPayload>
): Promise<Question> {
  const { data } = await api.patch<{ message: string; data: Question }>(
    `/questions/${questionId}/`,
    payload
  );
  return data.data;
}

export async function submitQuizAnswers(
  quizId: number,
  answers: Record<number, number | string>
): Promise<{ score: number; total: number }> {
  const { data } = await api.post<{ score: number; total: number }>(
    `/quizzes/${quizId}/submit/`,
    { answers }
  );
  return data;
}

export interface QuizTimerResponse {
  started_at: string | null;
  remaining_seconds: number;
}

export async function fetchQuizTimer(quizId: number): Promise<QuizTimerResponse> {
  const { data } = await api.get<QuizTimerResponse>(`/quizzes/${quizId}/timer/`);
  return data;
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

export async function fetchMyEvents(): Promise<CalendarEvent[]> {
  const { data } = await api.get<CalendarEvent[]>("/events/");
  return data;
}

export async function fetchPendingQuizzes(): Promise<Quiz[]> {
  const { data } = await api.get<Quiz[]>("/quizzes/pending/");
  return data;
}

export async function fetchAttemptedQuizzes(): Promise<Quiz[]> {
  const { data } = await api.get<Quiz[]>("/quizzes/attempted/");
  return data;
}

export async function fetchQuizViewDetail(
  quizId: number
): Promise<QuizViewResponse> {
  const { data } = await api.get<QuizViewResponse>(`/quizzes/${quizId}/view/`);
  return data;
}

export interface EnrolledStudent {
  id: number;
  user: number;
  username: string;
  full_name: string;
  student_id: string;
}

export async function fetchCourseStudents(courseId: number): Promise<EnrolledStudent[]> {
  const { data } = await api.get<EnrolledStudent[]>(`/courses/${courseId}/students/`);
  return data;
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
  const { data } = await api.get<QuizAttempt[]>(`/quizzes/${quizId}/attempts/`);
  return data;
}

export async function fetchQuizAttemptDetail(
  quizId: number,
  attemptId: number
): Promise<QuizAttempt> {
  const { data } = await api.get<QuizAttempt>(
    `/quizzes/${quizId}/attempts/${attemptId}/`
  );
  return data;
}

export async function updateQuizAttempt(
  quizId: number,
  attemptId: number,
  payload: Partial<Pick<QuizAttempt, "answers" | "score_override">>
): Promise<QuizAttempt> {
  const { data } = await api.patch<QuizAttempt>(
    `/quizzes/${quizId}/attempts/${attemptId}/`,
    payload
  );
  return data;
}

/** For teacher: their courses. For student: use fetchEnrolledCourses for "my courses" or fetchCourses() for all. */
export async function fetchEnrolledCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses/enrolled/");
  return data;
}

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses/");
  return data;
}

export async function fetchCourseDetail(id: number): Promise<Course> {
  const { data } = await api.get<Course>(`/courses/${id}/detail/`);
  return data;
}

