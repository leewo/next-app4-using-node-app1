"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "../components/authcontext";
import api from '../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const router = useRouter();
  const { login, checkAuthStatus, refreshToken } = useAuth();

  // 페이지 로드 시 URL을 정리하는 useEffect를 추가
  useEffect(() => {
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError([]);

    try {
      const response = await api("http://localhost:3001/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email": email,
          "password": password
        }),
      }, refreshToken);

      const data = await response.json();

      if (!response.ok) {
        let errorMessages = [];
        if (data.errors && Array.isArray(data.errors)) {
          errorMessages = data.errors.map((error: any) => {
            if (typeof error === 'string') return error;
            if (typeof error === 'object') return Object.values(error)[0];
            return 'Unknown error';
          });
        } else if (data.message) {
          errorMessages = [data.message];
        } else {
          errorMessages = ['An unexpected error occurred'];
        }
        throw new Error(errorMessages.join(", "));
      }
      else {
        console.log("Login successful:", data);
        await login(data.user); // login 함수가 Promise를 반환하도록 수정
        await checkAuthStatus(); // 추가: 인증 상태 즉시 확인
        router.push('/');
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setError(error.message.split(", "));
      } else {
        setError(["An unexpected error occurred"]);
      }
      // 에러 처리 시 URL 리다이렉트 - 로그인 실패 시 쿼리 파라미터 없이 로그인 페이지로 리다이렉트
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {error.length > 0 && (
            <div className="mt-2 text-center text-sm text-red-600">
              {error.map((errMsg, index) => (
                <p key={index}>{errMsg}</p>
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-gray-500">
            Not a member?{' '}
            <a href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Start a 14 day free trial
            </a>
          </p>
        </div>
      </div>
    </>
  );
}