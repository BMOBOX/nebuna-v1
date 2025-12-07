// app/signin/SigninClient.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import Header from "@/components/Header";
import { signIn, useSession } from "next-auth/react";
import { toast } from "react-toastify";

// Handles ?error= queries and shows toast + cleans URL
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");

    if (!error) return;

    if (error === "duplicate_email") {
      toast.error("An account with this email already exists. Please sign in.");
    } else if (
      error === "OAuthSignin" ||
      error === "OAuthCallback" ||
      error === "OAuthAccountNotLinked" ||
      error === "Callback"
    ) {
      toast.error("Failed to sign in with Google. Please try again.");
    } else {
      toast.error("Sign in failed. Please try again.");
    }

    // Clean the URL without page reload
    router.replace("/signin", { scroll: false });
  }, [searchParams, router]);

  return null;
}

// Your main sign-in form
function SigninContent() {
  const { status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in → redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Don't render form if loading or authenticated
  if (status === "loading") return null;
  if (status === "authenticated") return null;

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Password too short")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);

      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        const message =
          res.error === "CredentialsSignin"
            ? "Wrong email or password!"
            : "Sign in failed. Please try again.";
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      toast.success("Signed in successfully!");
      router.push("/dashboard");
    },
  });

  return (
    <>
      <Header showLogo={false} />

      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-md rounded-xl bg-[#141414] p-8 shadow-lg">
          <h2 className="mb-2 text-center text-2xl font-bold text-white">
            Sign in
          </h2>
          <p className="mb-6 text-center text-gray-500">Welcome back!</p>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={`w-full rounded-md border bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-500">{formik.errors.email}</p>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={`w-full rounded-md border bg-transparent px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-600"
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-sm text-red-500">{formik.errors.password}</p>
            )}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-md py-3 font-medium transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-zinc-800/70 text-gray-400"
                  : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-white"
              }`}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <hr className="grow border-gray-600" />
            <span className="mx-3 text-sm text-gray-400">or</span>
            <hr className="grow border-gray-600" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-600 bg-transparent py-3 text-white transition hover:bg-gray-800"
          >
            <FcGoogle size={22} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

// Main exported component
export default function SigninClient() {
  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      <SigninContent />
    </>
  );
}
